/* Club Copy — Record Club intake (Free / Club / Premium). */
// Record club intake : Free / Club / Premium
(function () {
  var levelBtns = document.querySelectorAll('.join-level');
  var joinBtn = document.getElementById('clubJoinBtn');
  var joinEmail = document.getElementById('joinEmail');
  var joinName = document.getElementById('joinName');
  var joinNote = document.getElementById('joinNote');
  var joinStatus = document.getElementById('joinStatus');
  var premiumBox = document.getElementById('premiumAmountBox');
  var premiumAmount = document.getElementById('premiumAmount');
  var premiumPreview = document.getElementById('premiumCreditPreview');
  var premiumPresets = document.querySelectorAll('.premium-preset');
  if (!joinBtn || !levelBtns.length) return;

  var state = { level: 'free', premiumDollars: 10 };
  var collectors = document.getElementById('joinCollectors');


  /** 2.5× at $10 → 5.0× at $100+ */
  function premiumMult(dollars) {
    var d = Math.max(10, Number(dollars) || 10);
    var t = Math.min(1, Math.max(0, (d - 10) / 90));
    return 2.5 + 2.5 * t;
  }

  function premiumCredit(dollars) {
    var d = Math.max(10, Number(dollars) || 10);
    return Math.round(d * premiumMult(d) * 100) / 100;
  }

  function money(n) {
    return '$' + Number(n).toFixed(2);
  }

  function syncPremiumPreview() {
    if (!premiumPreview || !premiumAmount) return;
    var d = Math.max(10, Number(premiumAmount.value) || 10);
    state.premiumDollars = d;
    var credit = premiumCredit(d);
    premiumPreview.innerHTML =
      "That's <strong>" + money(credit) + "</strong> toward cassettes.";
  }

  var cardNo = document.getElementById('joinCardNo');
  var cardTier = document.getElementById('joinCardTier');
  var cardName = document.getElementById('joinCardName');
  function syncCard() {
    if (cardTier) cardTier.textContent = state.level;
    if (cardName) cardName.textContent = joinName ? joinName.value.trim() : '';
    if (!cardNo) return;
    var em = joinEmail && joinEmail.value.trim();
    var ok = em && window.ClubMember && ClubMember.isValidEmail(em);
    cardNo.textContent = 'No. ' + (ok ? ClubMember.memberNumberFromEmail(em) : '————');
  }
  if (joinEmail) joinEmail.addEventListener('input', syncCard);
  if (joinName) joinName.addEventListener('input', syncCard);

  function syncJoin() {
    syncCard();
    if (premiumBox) premiumBox.hidden = state.level !== 'premium';
    if (collectors && state.level === 'premium') collectors.open = true;

    if (state.level === 'free') {
      joinBtn.textContent = 'Join free';
      joinNote.textContent = "We'll email you. You can upgrade later.";
    } else if (state.level === 'premium') {
      syncPremiumPreview();
      var d = state.premiumDollars;
      joinBtn.textContent = 'Join for $' + d + ' a year';
      joinNote.textContent = '50% off all music. Credit toward cassettes. Nothing ships until you order.';
    } else {
      joinBtn.textContent = 'Join for $5 a year';
      joinNote.textContent = '30% off all music. Renews once a year.';
    }
  }

  levelBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      state.level = btn.getAttribute('data-level');
      levelBtns.forEach(function (b) {
        b.setAttribute('aria-checked', b === btn ? 'true' : 'false');
      });
      syncJoin();
    });
  });

  premiumPresets.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var amt = Number(btn.getAttribute('data-amount')) || 10;
      if (premiumAmount) premiumAmount.value = String(amt);
      premiumPresets.forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      syncJoin();
    });
  });

  if (premiumAmount) {
    premiumAmount.addEventListener('input', function () {
      premiumPresets.forEach(function (b) {
        var match = Number(b.getAttribute('data-amount')) === Number(premiumAmount.value);
        b.setAttribute('aria-pressed', match ? 'true' : 'false');
      });
      syncJoin();
    });
  }

  syncJoin();

  var joinSection = document.getElementById('join');
  var managing = false;

  function fillFormFromProfile(profile) {
    if (!profile) return;
    if (joinEmail && !joinEmail.value) joinEmail.value = profile.email || '';
    if (joinName && !joinName.value && profile.displayName) joinName.value = profile.displayName;
  }

  // Signed-up members (free, club or premium) don't need the sign-up desk.
  function showMemberHome(profile) {
    if (!joinSection || !profile) return;
    managing = false;
    fillFormFromProfile(profile);
    joinSection.hidden = true;
  }

  function showJoinIntake() {
    managing = true;
    if (joinSection) joinSection.hidden = false;
    syncJoin();
  }

  function syncMemberView() {
    var profile = window.ClubMember && ClubMember.readProfile();
    if (profile && !managing) showMemberHome(profile);
    else if (!profile) showJoinIntake();
  }

  window.addEventListener('club:member', function () {
    if (!managing) syncMemberView();
  });
  syncMemberView();

  function showStatus(msg, isError) {
    joinStatus.hidden = false;
    joinStatus.textContent = msg;
    joinStatus.classList.toggle('is-error', !!isError);
  }

  joinBtn.addEventListener('click', async function () {
    var email = joinEmail && joinEmail.value.trim();
    if (!email || email.indexOf('@') < 1) {
      showStatus('Enter a valid email.', true);
      joinEmail && joinEmail.focus();
      return;
    }

    if (state.level === 'premium') {
      var dollars = Math.max(10, Number(premiumAmount && premiumAmount.value) || 10);
      if (dollars < 10) {
        showStatus('Premium starts at $10 CAD per year.', true);
        return;
      }
      state.premiumDollars = dollars;
    }

    joinBtn.disabled = true;
    joinStatus.hidden = true;

    var payload = {
      email: email,
      displayName: (joinName && joinName.value.trim()) || '',
      level: state.level,
      memberNumber: window.ClubMember
        ? ClubMember.memberNumberFromEmail(email)
        : undefined
    };

    // Free is saved now. Club and Premium stay unpaid until Stripe
    // confirms the Checkout Session — writing them here would grant
    // the music discount before the card is charged.
    if (state.level === 'free') {
      try {
        if (window.ClubMember) ClubMember.writeProfile(payload);
        else {
          localStorage.setItem('club_credit_email', email);
          localStorage.setItem('club_member_profile', JSON.stringify(payload));
        }
      } catch (e) {}

      var memberSaved = false;
      try {
        var mres = await fetch('/api/club-member', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        var mdata = await mres.json().catch(function () { return null; });
        if (mres.ok && mdata && window.ClubMember) {
          ClubMember.writeProfile(mdata);
        }
        memberSaved = mres.ok;
      } catch (e) {}

      if (!memberSaved) {
        showStatus("Couldn't save your card right now. Try again.", true);
        joinBtn.disabled = false;
        syncJoin();
        return;
      }
      try {
        var fd = new FormData();
        fd.append('email', email);
        fd.append('level', 'free');
        fd.append('message', 'Free record club — release alerts');
        var r = await fetch('https://formspree.io/f/xdkwjzzr', {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: fd
        });
        if (!r.ok) throw new Error('signup');
        managing = false;
        joinBtn.disabled = false;
        syncMemberView();
      } catch (e) {
        showStatus("Couldn't finish Free signup. Try again.", true);
        joinBtn.disabled = false;
        syncJoin();
      }
      return;
    }

    try {
      localStorage.setItem('club_credit_email', email);
      sessionStorage.setItem('club_checkout_email', email);
      sessionStorage.setItem('club_checkout_name', payload.displayName || '');
    } catch (e) {}

    joinBtn.textContent = 'Redirecting…';
    try {
      var body = {
        origin: window.location.origin,
        level: state.level,
        email: payload.email,
        displayName: payload.displayName
      };
      if (state.level === 'premium') {
        body.amountCents = Math.round(state.premiumDollars * 100);
      }
      var res = await fetch('/api/create-membership-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data.url) {
        showStatus(data.error || 'Checkout unavailable right now.', true);
        joinBtn.disabled = false;
        syncJoin();
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      showStatus('Could not reach checkout. Try again.', true);
      joinBtn.disabled = false;
      syncJoin();
    }
  });
})();
