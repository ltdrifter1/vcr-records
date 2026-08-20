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

  function memberDigitalPrice(retail) {
    var v = Number(retail);
    if (!isFinite(v)) return null;
    // Already at member price
    if (v === 6 || v === 2 || v === 1.5) return v;
    if (v >= 8) return 6;
    if (Math.abs(v - 3) < 0.001) return 2;
    if (Math.abs(v - 1.99) < 0.001) return 1.5;
    return null;
  }

  function displayPrice(retail) {
    if (hasMemberPricing()) {
      var m = memberDigitalPrice(retail);
      if (m != null) return m;
    }
    return Number(retail);
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
      el.textContent = paid ? 'Your price' : el.dataset.baseText;
      el.classList.toggle('is-yours', paid);
    });
    document.querySelectorAll('.ra-club-cue').forEach(function (el) {
      if (!el.dataset.baseHtml) el.dataset.baseHtml = el.innerHTML;
      if (paid) {
        el.innerHTML = isPremium(profile)
          ? 'Member ' + profile.memberNumber + ' — digital at your price; Club Credit applies to cassettes.'
          : 'Member ' + profile.memberNumber + ' — this digital copy is at your club price.';
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
