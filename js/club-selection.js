/* Club Copy — this cycle's Club Selection (Columbia House ritual, opt-in) */
(function () {
  function $(id) { return document.getElementById(id); }

  function money(n) {
    var v = Number(n);
    if (!isFinite(v)) return '';
    return v % 1 ? v.toFixed(2) : String(v);
  }

  function fillLetter(el, text) {
    if (!el) return;
    el.textContent = '';
    String(text || '').split(/\n\n+/).forEach(function (para, i) {
      if (i) el.appendChild(document.createElement('br'));
      var p = document.createElement('span');
      p.className = 'club-sel-para';
      p.textContent = para.replace(/\n/g, ' ');
      el.appendChild(p);
      el.appendChild(document.createElement('br'));
    });
  }

  function setStatus(msg, isError) {
    var el = $('clubSelStatus');
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg || '';
    el.classList.toggle('is-error', !!isError);
  }

  function hydrate(data) {
    var root = $('selection');
    if (!root || !data) return;

    var cycle = $('clubSelCycle');
    var title = $('clubSelTitle');
    var meta = $('clubSelMeta');
    var cover = $('clubSelCover');
    var coverLink = $('clubSelCoverLink');
    var from = $('clubSelFrom');
    var letter = $('clubSelLetter');
    var listen = $('clubSelListen');
    var keep = $('clubSelKeep');
    var claim = $('clubSelClaim');
    var pass = $('clubSelPass');
    var gate = $('clubSelGate');

    if (cycle) cycle.textContent = data.cycleLabel || data.eyebrow || 'This cycle';
    if (title) title.textContent = data.title || '';
    if (meta) {
      meta.textContent = [data.catalogue, data.artist, data.genre].filter(Boolean).join(' · ');
    }
    if (cover) {
      cover.src = data.coverThumb || data.cover || '';
      cover.alt = (data.title || 'Selection') + ' artwork';
    }
    if (coverLink) coverLink.href = data.href || '#';
    if (from) from.textContent = data.from || 'The listening room';
    fillLetter(letter, data.letter);

    if (listen) {
      listen.href = data.href || '#';
      if (data.playRelease) {
        listen.setAttribute('data-play-release', data.playRelease);
        listen.setAttribute('data-play-stage', '');
      }
    }

    function refreshActions() {
      var profile = window.ClubMember && ClubMember.readProfile();
      var paid = window.ClubMember && ClubMember.hasMemberPricing(profile);
      var premium = window.ClubMember && ClubMember.isPremium(profile);
      var passed = window.ClubMember && ClubMember.passedCycle(data.cycleId);
      var digMember = window.ClubMember
        ? ClubMember.memberDigitalPrice(data.digitalPrice)
        : null;

      if (gate) {
        if (!profile) {
          gate.hidden = false;
          gate.innerHTML = 'Not on the list yet? <a href="#join">Accept your invitation</a> — then this selection is addressed to you.';
        } else if (!paid) {
          gate.hidden = false;
          gate.innerHTML = 'You\'re on Free, Member ' + profile.memberNumber + '. <a href="#join">Accept Club</a> for member copies of this selection.';
        } else {
          gate.hidden = true;
          gate.textContent = '';
        }
      }

      if (keep) {
        keep.disabled = false;
        if (!paid) {
          keep.textContent = 'Keep digital — join to unlock';
        } else if (digMember != null) {
          keep.textContent = 'Keep digital — $' + money(digMember);
        } else {
          keep.textContent = 'Keep digital — $' + money(data.digitalPrice);
        }
      }

      if (claim) {
        if (!data.cassetteSku) {
          claim.hidden = true;
        } else {
          claim.hidden = false;
          claim.disabled = false;
          claim.textContent = premium
            ? 'Claim cassette — $' + money(data.cassettePrice)
            : 'Claim cassette — Premium';
        }
      }

      if (pass) {
        pass.textContent = passed ? 'Passed this cycle' : 'Pass for now';
        pass.disabled = !!passed;
      }

      if (passed) root.classList.add('is-passed');
      else root.classList.remove('is-passed');
    }

    if (keep) {
      keep.addEventListener('click', function () {
        var profile = window.ClubMember && ClubMember.readProfile();
        if (!window.ClubMember || !ClubMember.hasMemberPricing(profile)) {
          setStatus('Accept Club or Premium first — then this copy is yours at member price.', true);
          var join = document.getElementById('join');
          if (join) join.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        if (!window.VCRCart) {
          setStatus('Cart unavailable. Try again in a moment.', true);
          return;
        }
        var price = ClubMember.displayPrice(data.digitalPrice);
        VCRCart.add({
          sku: data.digitalSku,
          name: data.digitalName || (data.title + ' — Digital'),
          price: price,
          image: data.cover,
          qty: 1,
          id: data.digitalSku
        });
        setStatus('Selection kept — Member ' + profile.memberNumber + '. Digital is in your cart at $' + money(price) + '.');
      });
    }

    if (claim) {
      claim.addEventListener('click', function () {
        var profile = window.ClubMember && ClubMember.readProfile();
        if (!window.ClubMember || !ClubMember.isPremium(profile)) {
          setStatus('Cassette claims are for Premium members — pay what you want, then spend Club Credit.', true);
          var join = document.getElementById('join');
          if (join) join.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }
        if (!data.cassetteSku || !window.VCRCart) {
          setStatus('Cassette unavailable right now.', true);
          return;
        }
        VCRCart.add({
          sku: data.cassetteSku,
          name: data.cassetteName || (data.title + ' — Cassette'),
          price: data.cassettePrice,
          image: data.cover,
          qty: 1,
          id: data.cassetteSku
        });
        setStatus('Cassette claimed — apply Club Credit at checkout with ' + profile.email + '.');
        try { localStorage.setItem('club_credit_email', profile.email); } catch (e) {}
      });
    }

    if (pass) {
      pass.addEventListener('click', function () {
        if (!window.ClubMember) return;
        var profile = ClubMember.readProfile();
        if (!profile) {
          setStatus('Accept an invitation first — then you can pass a cycle.', true);
          return;
        }
        ClubMember.passCycle(data.cycleId);
        refreshActions();
        setStatus('Passed. Next cycle\'s letter will find Member ' + profile.memberNumber + '.');
      });
    }

    refreshActions();
    window.addEventListener('club:member', refreshActions);
  }

  function boot() {
    if (!$('selection')) return;
    fetch('/data/club-selection.json', { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) throw new Error('missing');
        hydrate(data);
      })
      .catch(function () {
        setStatus('Selection letter is being pressed. Check back soon.', true);
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
