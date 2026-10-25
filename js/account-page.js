(function () {
  var nav = document.getElementById('nav');
  var ticking = false;
  function syncNav() {
    nav.classList.toggle('scrolled', window.scrollY > 24);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(syncNav);
  }, { passive: true });
  syncNav();
})();

(function () {
  var lookupSection = document.getElementById('acctLookup');
  var lookupEmail = document.getElementById('acctLookupEmail');
  var lookupBtn = document.getElementById('acctLookupBtn');
  var lookupStatus = document.getElementById('acctLookupStatus');

  var signedIn = document.getElementById('acctSignedIn');
  var acctLead = document.getElementById('acctLead');
  var acctLevel = document.getElementById('acctLevel');
  var acctName = document.getElementById('acctName');
  var acctNumber = document.getElementById('acctNumber');
  var acctLayer = document.getElementById('acctLayer');
  var acctSince = document.getElementById('acctSince');
  var acctChangePlan = document.getElementById('acctChangePlan');
  var acctSignOut = document.getElementById('acctSignOut');

  var balanceEl = document.getElementById('acctBalance');
  var entriesEl = document.getElementById('acctEntries');
  var entriesEmpty = document.getElementById('acctEntriesEmpty');

  var displayNameInput = document.getElementById('acctDisplayName');
  var saveBtn = document.getElementById('acctSaveName');
  var saveStatus = document.getElementById('acctSaveStatus');

  function showStatus(el, msg, isError) {
    if (!el) return;
    el.hidden = false;
    el.textContent = msg;
    el.classList.toggle('is-error', !!isError);
  }

  function money(cents) {
    return '$' + (Number(cents || 0) / 100).toFixed(2);
  }

  function levelLabel(level) {
    if (level === 'premium') return 'PREMIUM';
    if (level === 'club') return 'CLUB';
    return 'FREE';
  }

  function layerLabel(level) {
    if (level === 'premium') return 'DIGITAL + PHYSICAL';
    if (level === 'club') return 'DIGITAL';
    return 'CATALOG';
  }

  function renderCard(profile) {
    acctLead.textContent = profile.level === 'free'
      ? "You're on the list. Upgrade any time for member pricing."
      : "You're a member. Thanks for backing the label.";
    acctLevel.textContent = levelLabel(profile.level);
    acctName.textContent = String(profile.displayName || profile.email || 'Member').toUpperCase();
    acctNumber.textContent = profile.memberNumber || '0000';
    acctLayer.textContent = layerLabel(profile.level);
    acctSince.textContent = profile.memberSince
      ? ' · since ' + new Date(profile.memberSince).getFullYear()
      : '';
    acctChangePlan.textContent = profile.level === 'free' ? 'Upgrade' : 'Change plan';
    if (displayNameInput && !displayNameInput.value) {
      displayNameInput.value = profile.displayName || '';
    }
  }

  function renderCredit(account) {
    balanceEl.textContent = money(account.balanceCents);
    var entries = account.entries || [];
    entriesEl.innerHTML = '';
    entriesEmpty.hidden = entries.length > 0;
    entries.forEach(function (e) {
      var li = document.createElement('li');
      li.className = 'acct-entry';
      var left = document.createElement('div');
      var reason = document.createElement('div');
      reason.className = 'acct-entry-reason';
      reason.textContent = e.reason || (e.type === 'grant' ? 'Club Credit grant' : 'Applied at checkout');
      var date = document.createElement('div');
      date.className = 'acct-entry-date';
      date.textContent = e.createdAt ? new Date(e.createdAt).toLocaleDateString() : '';
      left.appendChild(reason);
      left.appendChild(date);
      var amount = document.createElement('div');
      amount.className = 'acct-entry-amount ' + (e.type === 'spend' ? 'is-spend' : 'is-grant');
      amount.textContent = (e.type === 'spend' ? '-' : '+') + money(e.amountCents);
      li.appendChild(left);
      li.appendChild(amount);
      entriesEl.appendChild(li);
    });
  }

  async function fetchCredit(email) {
    try {
      var res = await fetch('/api/club-credit?email=' + encodeURIComponent(email));
      if (!res.ok) return;
      var data = await res.json();
      renderCredit(data);
    } catch (e) {
      /* Club Credit is a bonus panel — a failed lookup shouldn't block the account page. */
    }
  }

  async function refreshFromServer(email) {
    try {
      var res = await fetch('/api/club-member?email=' + encodeURIComponent(email));
      if (!res.ok) return null;
      var data = await res.json();
      if (data && data.email && window.ClubMember) {
        return ClubMember.writeProfile({
          email: data.email,
          displayName: data.displayName || '',
          level: data.level || 'free',
          memberNumber: data.memberNumber
        });
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function showSignedIn(profile) {
    lookupSection.hidden = true;
    signedIn.hidden = false;
    renderCard(profile);
    fetchCredit(profile.email);
  }

  function showLookup() {
    signedIn.hidden = true;
    lookupSection.hidden = false;
  }

  async function init() {
    var profile = window.ClubMember ? ClubMember.readProfile() : null;
    if (!profile) {
      try {
        var raw = JSON.parse(localStorage.getItem('club_member_profile') || 'null');
        if (raw && raw.email) profile = raw;
      } catch (e) {}
    }

    if (!profile) {
      showLookup();
      return;
    }

    showSignedIn(profile);
    var updated = await refreshFromServer(profile.email);
    if (updated) renderCard(updated);
  }

  if (lookupBtn) {
    lookupBtn.addEventListener('click', async function () {
      var email = (lookupEmail.value || '').trim();
      if (!email || email.indexOf('@') < 1) {
        showStatus(lookupStatus, 'Enter a valid email.', true);
        lookupEmail.focus();
        return;
      }
      lookupBtn.disabled = true;
      lookupStatus.hidden = true;
      var profile = await refreshFromServer(email);
      lookupBtn.disabled = false;
      if (!profile) {
        showStatus(lookupStatus, "Couldn't find a card for that email. Try again or join below.", true);
        return;
      }
      showSignedIn(profile);
    });
  }

  if (acctSignOut) {
    acctSignOut.addEventListener('click', function () {
      if (window.ClubMember) ClubMember.clearProfile();
      showLookup();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', async function () {
      var profile = window.ClubMember ? ClubMember.readProfile() : null;
      if (!profile) return;
      saveBtn.disabled = true;
      saveStatus.hidden = true;
      try {
        var res = await fetch('/api/club-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: profile.email,
            displayName: (displayNameInput.value || '').trim(),
            level: profile.level
          })
        });
        var data = await res.json().catch(function () { return {}; });
        if (!res.ok) throw new Error(data.error || 'Save failed');
        if (window.ClubMember) ClubMember.writeProfile(data);
        renderCard(data);
        showStatus(saveStatus, 'Saved.', false);
      } catch (e) {
        showStatus(saveStatus, "Couldn't save right now. Try again.", true);
      } finally {
        saveBtn.disabled = false;
      }
    });
  }

  init();
})();
