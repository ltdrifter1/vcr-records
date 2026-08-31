/* Club Copy — member identity (local profile + sitewide chrome) */
(function (global) {
  var PROFILE_KEY = 'club_member_profile';
  var EMAIL_KEY = 'club_credit_email';

  function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase().replace(/\s+/g, '');
  }

  function isValidEmail(email) {
    var e = normalizeEmail(email);
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
  }

  function memberNumberFromEmail(email) {
    var s = normalizeEmail(email) || 'guest';
    var hash = 0;
    for (var i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
    return String((hash % 9000) + 1000).padStart(4, '0');
  }

  function readProfile() {
    try {
      var raw = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
      if (!raw || typeof raw !== 'object') return null;
      var email = normalizeEmail(raw.email);
      if (!isValidEmail(email)) return null;
      var level = ['free', 'club', 'premium'].indexOf(raw.level) >= 0 ? raw.level : 'free';
      return {
        email: email,
        displayName: String(raw.displayName || '').trim().slice(0, 40),
        level: level,
        memberNumber: raw.memberNumber || memberNumberFromEmail(email)
      };
    } catch (e) {
      return null;
    }
  }

  function writeProfile(profile) {
    if (!profile || !isValidEmail(profile.email)) return null;
    var next = {
      email: normalizeEmail(profile.email),
      displayName: String(profile.displayName || '').trim().slice(0, 40),
      level: ['free', 'club', 'premium'].indexOf(profile.level) >= 0 ? profile.level : 'free',
      memberNumber: profile.memberNumber || memberNumberFromEmail(profile.email)
    };
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      localStorage.setItem(EMAIL_KEY, next.email);
    } catch (e) {}
    global.dispatchEvent(new CustomEvent('club:member', { detail: { profile: next } }));
    return next;
  }

  function clearProfile() {
    try {
      localStorage.removeItem(PROFILE_KEY);
    } catch (e) {}
    global.dispatchEvent(new CustomEvent('club:member', { detail: { profile: null } }));
  }

  function hasMemberPricing(profile) {
    var p = profile || readProfile();
    return !!(p && (p.level === 'club' || p.level === 'premium'));
  }

  function isPremium(profile) {
    var p = profile || readProfile();
    return !!(p && p.level === 'premium');
  }

  function isMusicSku(sku) {
    var s = String(sku || '').toLowerCase();
    if (!s) return false;
    if (s.indexOf('dg-') === 0) return true;
    if (s.indexOf('cassette') !== -1) return true;
    if (s.indexOf('vinyl') !== -1 || s.indexOf('vn-') === 0) return true;
    return false;
  }

  function musicDiscountRate(profile) {
    var p = profile || readProfile();
    if (!p) return 0;
    if (p.level === 'premium') return 0.5;
    if (p.level === 'club') return 0.3;
    return 0;
  }

  /** Dollars, rounded to cents. Optional profile overrides the signed-in member. */
  function musicUnitPrice(retail, sku, profile) {
    var v = Number(retail);
    if (!isFinite(v)) return v;
    if (sku && !isMusicSku(sku)) return v;
    var rate = 0;
    if (profile && typeof profile === 'object') {
      if (profile.level === 'premium') rate = 0.5;
      else if (profile.level === 'club') rate = 0.3;
    } else {
      rate = musicDiscountRate(profile);
    }
    if (!rate) return v;
    return Math.round(v * (1 - rate) * 100) / 100;
  }

  function memberDigitalPrice(retail) {
    return musicUnitPrice(retail, 'dg-release');
  }

  function displayPrice(retail, sku) {
    return musicUnitPrice(retail, sku || 'dg-release');
  }

  function levelLabel(level) {
    if (level === 'premium') return 'Premium';
    if (level === 'club') return 'Club';
    if (level === 'free') return 'Free';
    return 'Guest';
  }

  function injectNavChip(profile) {
    var end = document.querySelector('.nav-end');
    if (!end) return;

    var existing = document.getElementById('navMember');
    var navJoinLinks = document.querySelectorAll(
      '.nav-links a[href="#join"], .nav-links a[href="/#join"], ' +
      '.nav-drawer a[href="#join"], .nav-drawer a[href="/#join"]'
    );

    if (!profile) {
      if (existing) existing.remove();
      document.body.classList.remove('is-member', 'is-club-member', 'is-premium-member');
      navJoinLinks.forEach(function (a) {
        if (a.dataset.memberHrefBound) a.setAttribute('href', a.dataset.memberHrefBound);
        if (a.dataset.memberLabelBound) a.textContent = a.dataset.memberLabelBound;
      });
      return;
    }

    document.body.classList.add('is-member');
    document.body.classList.toggle('is-club-member', hasMemberPricing(profile));
    document.body.classList.toggle('is-premium-member', isPremium(profile));

    var joinHref = (location.pathname === '/' || location.pathname === '/index.html')
      ? '#join'
      : '/#join';

    navJoinLinks.forEach(function (a) {
      if (!a.dataset.memberHrefBound) a.dataset.memberHrefBound = a.getAttribute('href');
      if (!a.dataset.memberLabelBound) a.dataset.memberLabelBound = a.textContent;
      a.setAttribute('href', joinHref);
      a.textContent = 'Club';
    });

    if (!existing) {
      existing = document.createElement('a');
      existing.id = 'navMember';
      existing.className = 'nav-member';
      end.insertBefore(existing, end.firstChild);
    }
    existing.href = joinHref;
    existing.setAttribute(
      'aria-label',
      'Member ' + profile.memberNumber + ', ' + levelLabel(profile.level)
    );
    existing.innerHTML =
      '<span class="nav-member-level">' + levelLabel(profile.level) + '</span>' +
      '<span class="nav-member-no">Member ' + profile.memberNumber + '</span>';
  }

  function decorateReleasePricing(profile) {
    var paid = hasMemberPricing(profile);
    document.querySelectorAll('.price-member').forEach(function (el) {
      if (!el.dataset.baseText) el.dataset.baseText = el.textContent;
      el.textContent = paid
        ? (isPremium(profile) ? 'Your price · 50% off' : 'Your price · 30% off')
        : el.dataset.baseText;
      el.classList.toggle('is-yours', paid);
    });
    document.querySelectorAll('.ra-club-cue').forEach(function (el) {
      if (!el.dataset.baseHtml) el.dataset.baseHtml = el.innerHTML;
      if (paid) {
        el.innerHTML = isPremium(profile)
          ? 'Member ' + profile.memberNumber + ' — 50% off all music. Club Credit still applies to cassettes.'
          : 'Member ' + profile.memberNumber + ' — 30% off all music on this email.';
      } else {
        el.innerHTML = el.dataset.baseHtml;
      }
    });
  }

  function sync() {
    var profile = readProfile();
    injectNavChip(profile);
    decorateReleasePricing(profile);
  }

  global.ClubMember = {
    PROFILE_KEY: PROFILE_KEY,
    EMAIL_KEY: EMAIL_KEY,
    normalizeEmail: normalizeEmail,
    isValidEmail: isValidEmail,
    memberNumberFromEmail: memberNumberFromEmail,
    readProfile: readProfile,
    writeProfile: writeProfile,
    clearProfile: clearProfile,
    hasMemberPricing: hasMemberPricing,
    isPremium: isPremium,
    isMusicSku: isMusicSku,
    musicDiscountRate: musicDiscountRate,
    musicUnitPrice: musicUnitPrice,
    memberDigitalPrice: memberDigitalPrice,
    displayPrice: displayPrice,
    levelLabel: levelLabel,
    sync: sync
  };

  document.addEventListener('DOMContentLoaded', sync);
  global.addEventListener('club:member', sync);
  global.addEventListener('storage', function (e) {
    if (e.key === PROFILE_KEY || e.key === EMAIL_KEY) sync();
  });
})(window);
