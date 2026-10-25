(function () {
  var nav = document.getElementById('nav');
  if (nav) {
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
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isDigital(item) {
    var sku = String(item.sku || '');
    return sku.indexOf('dg-') === 0 || sku.indexOf('club-') === 0;
  }

  var creditState = {
    email: '',
    balanceCents: 0,
    checked: false
  };

  function creditEligibleSubtotal(items) {
    return items.reduce(function (n, i) {
      if (String(i.sku || '').indexOf('club-') === 0) return n;
      return n + (Number(i.price) || 0) * (i.qty || 0);
    }, 0);
  }

  function applicableCreditCents(items) {
    if (!creditState.checked) return 0;
    var apply = document.getElementById('creditApply');
    if (!apply || !apply.checked) return 0;
    var eligible = Math.round(creditEligibleSubtotal(items) * 100);
    return Math.min(creditState.balanceCents, eligible);
  }

  function moneyFromCents(cents) {
    return VCRCart.money((Number(cents) || 0) / 100);
  }

  var creditEmail = document.getElementById('creditEmail');
  var creditCheckBtn = document.getElementById('creditCheckBtn');
  var creditStatus = document.getElementById('creditStatus');
  var creditApply = document.getElementById('creditApply');
  var creditApplyLabel = document.getElementById('creditApplyLabel');
  var creditApplyText = document.getElementById('creditApplyText');

  try {
    var profile = window.ClubMember && ClubMember.readProfile && ClubMember.readProfile();
    var savedEmail = (profile && profile.email) || localStorage.getItem('club_credit_email');
    if (savedEmail && creditEmail) creditEmail.value = savedEmail;
  } catch (e) {}

  async function checkCredit() {
    if (!creditEmail || !creditStatus) return;
    var email = String(creditEmail.value || '').trim().toLowerCase();
    creditStatus.classList.remove('is-error');
    if (!email || email.indexOf('@') < 1) {
      creditStatus.textContent = 'Enter the email you used to join.';
      creditStatus.classList.add('is-error');
      return;
    }
    creditCheckBtn.disabled = true;
    creditCheckBtn.textContent = '…';
    creditStatus.textContent = 'Checking…';
    try {
      var res = await fetch('/api/club-credit?email=' + encodeURIComponent(email));
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        creditStatus.textContent = data.error || 'Could not check credit.';
        creditStatus.classList.add('is-error');
        creditState.checked = false;
        creditApplyLabel.hidden = true;
        render();
        return;
      }
      creditState.email = data.email || email;
      creditState.balanceCents = Math.max(0, Number(data.balanceCents) || 0);
      creditState.checked = true;
      try { localStorage.setItem('club_credit_email', creditState.email); } catch (e) {}
      if (creditState.balanceCents > 0) {
        creditStatus.textContent = 'Balance: ' + moneyFromCents(creditState.balanceCents) + ' CAD';
        creditApplyLabel.hidden = false;
        creditApply.checked = true;
        creditApplyText.textContent = 'Apply up to ' + moneyFromCents(creditState.balanceCents) + ' Club Credit';
      } else {
        creditStatus.textContent = 'No Club Credit on this email yet. Join for $10 to get $25.';
        creditApplyLabel.hidden = true;
      }
      render();
    } catch (e) {
      creditStatus.textContent = 'Could not reach Club Credit. Try again.';
      creditStatus.classList.add('is-error');
    } finally {
      creditCheckBtn.disabled = false;
      creditCheckBtn.textContent = 'Check';
    }
  }

  if (creditCheckBtn) creditCheckBtn.addEventListener('click', checkCredit);
  if (creditEmail) {
    creditEmail.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        checkCredit();
      }
    });
  }
  if (creditApply) creditApply.addEventListener('change', render);

  function variantLabel(item) {
    var bits = [];
    if (item.colour) bits.push(item.colour);
    if (item.size) bits.push('Size ' + item.size);
    return bits.join(' · ');
  }

  var lastRemoved = null;
  var undoTimer = null;
  var undoBar = document.getElementById('undoBar');
  var undoMsg = document.getElementById('undoMsg');

  function showUndo(item) {
    lastRemoved = item;
    if (!undoBar) return;
    undoMsg.textContent = item.name + ' removed';
    undoBar.hidden = false;
    clearTimeout(undoTimer);
    undoTimer = setTimeout(function () {
      undoBar.hidden = true;
      lastRemoved = null;
    }, 5000);
  }

  var undoBtn = document.getElementById('undoBtn');
  if (undoBtn) {
    undoBtn.addEventListener('click', function () {
      if (!lastRemoved) return;
      VCRCart.add(lastRemoved);
      lastRemoved = null;
      undoBar.hidden = true;
      clearTimeout(undoTimer);
      render();
    });
  }

  function render() {
    var items = VCRCart.load();
    var lines = document.getElementById('cartLines');
    var empty = document.getElementById('cartEmpty');
    var checkoutBtn = document.getElementById('checkoutBtn');
    var err = document.getElementById('checkoutError');

    VCRCart.updateBadges();
    var subtotal = VCRCart.subtotal(items);
    var creditCents = applicableCreditCents(items);
    var creditDollars = creditCents / 100;
    var total = Math.max(0, subtotal - creditDollars);
    document.getElementById('sumSubtotal').textContent = VCRCart.money(subtotal);
    var creditRow = document.getElementById('sumCreditRow');
    var creditEl = document.getElementById('sumCredit');
    if (creditRow && creditEl) {
      if (creditCents > 0) {
        creditRow.hidden = false;
        creditEl.textContent = '−' + moneyFromCents(creditCents);
      } else {
        creditRow.hidden = true;
      }
    }
    document.getElementById('sumTotal').textContent = VCRCart.money(total);
    var allDigital = items.length > 0 && items.every(function (i) { return isDigital(i); });
    var shipEl = document.getElementById('sumShipping');
    var noteEl = document.getElementById('checkoutNote');
    if (shipEl) shipEl.textContent = allDigital ? 'Free — digital order' : 'CA $8 / US $14';
    if (noteEl && !wasCanceled) {
      noteEl.textContent = allDigital
        ? 'Digital order — download links / membership are emailed after checkout. No shipping required.'
        : 'Ships from British Columbia in 2–4 business days. Tracked. Canada $8 CAD · United States $14 CAD — choose at payment. We ship to CA & US.';
    }
    checkoutBtn.disabled = items.length === 0;
    if (err) { err.hidden = true; err.textContent = ''; }
    if (!items.length) {
      lines.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    lines.innerHTML = items.map(function (item) {
      return (
        '<article class="cart-line" data-id="' + esc(item.id) + '">' +
          '<div class="cart-thumb"><img src="' + esc(item.image) + '" alt=""/></div>' +
          '<div>' +
            '<div class="cart-name">' + esc(item.name) + '</div>' +
            (variantLabel(item) ? '<div class="cart-meta">' + esc(variantLabel(item)) + '</div>' : '') +
            '<div class="cart-price">' +
              (Number(item.retail) > Number(item.price) + 0.001
                ? '<s>' + VCRCart.money(item.retail) + '</s> ' + VCRCart.money(item.price) + ' · each'
                : VCRCart.money(item.price) + ' · each') +
            '</div>' +
            '<p class="ship-hint">' + (isDigital(item) ? (String(item.sku || '').indexOf('club-') === 0 ? 'Membership' : 'Digital — link emailed after checkout') : 'Ships in 2–4 business days') + '</p>' +
          '</div>' +
          '<div class="cart-line-side">' +
            '<div class="cart-line-total">' + VCRCart.money(item.price * item.qty) + '</div>' +
            '<div class="qty" aria-label="Quantity">' +
              '<button type="button" data-act="dec" aria-label="Decrease">−</button>' +
              '<span aria-live="polite">' + item.qty + '</span>' +
              '<button type="button" data-act="inc" aria-label="Increase">+</button>' +
            '</div>' +
            '<button type="button" class="cart-remove" data-act="remove">Remove</button>' +
          '</div>' +
        '</article>'
      );
    }).join('');
  }

  document.getElementById('cartLines').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) return;
    var line = btn.closest('.cart-line');
    var id = line.dataset.id;
    var item = VCRCart.load().find(function (i) { return i.id === id; });
    if (!item) return;
    if (btn.dataset.act === 'inc') VCRCart.setQty(id, item.qty + 1);
    if (btn.dataset.act === 'dec') VCRCart.setQty(id, item.qty - 1);
    if (btn.dataset.act === 'remove') {
      showUndo(Object.assign({}, item));
      VCRCart.remove(id);
    }
    render();
  });

  document.getElementById('checkoutBtn').addEventListener('click', async function () {
    var items = VCRCart.load();
    if (!items.length) return;
    var btn = document.getElementById('checkoutBtn');
    var err = document.getElementById('checkoutError');
    btn.disabled = true;
    btn.textContent = 'Redirecting…';
    err.hidden = true;
    try {
      var res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: window.location.origin,
          email: (creditEmail && creditEmail.value) ||
            creditState.email ||
            (window.ClubMember && ClubMember.readProfile() && ClubMember.readProfile().email) ||
            undefined,
          applyCredit: !!(creditApply && creditApply.checked && creditState.checked && creditState.balanceCents > 0),
          items: items.map(function (i) {
            return {
              sku: i.sku,
              name: i.name,
              colour: i.colour,
              size: i.size,
              qty: i.qty,
              image: i.image ? new URL(i.image, window.location.origin).href : null
            };
          })
        })
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok || !data.url) {
        var msg = data.error || 'Checkout unavailable right now.';
        if (data.code === 'STRIPE_NOT_CONFIGURED') {
          msg = 'Checkout is temporarily unavailable. Try again soon.';
        }
        if (data.code === 'OUT_OF_STOCK') {
          msg = data.error || 'An item in your cart is sold out.';
        }
        err.textContent = msg;
        err.hidden = false;
        btn.disabled = false;
        btn.textContent = 'Check out';
        return;
      }
      window.location.href = data.url;
    } catch (e) {
      err.textContent = 'Could not reach checkout. Try again in a moment.';
      err.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Check out';
    }
  });

  var wasCanceled = new URLSearchParams(location.search).get('canceled') === '1';
  if (wasCanceled) {
    var note = document.getElementById('checkoutNote');
    if (note) note.textContent = 'Checkout canceled — your cart is still here.';
  }
  window.addEventListener('vcr:cart', render);
  window.addEventListener('club:member', function () {
    if (window.VCRCart && VCRCart.reprice) VCRCart.reprice();
  });
  if (window.VCRCart && VCRCart.reprice) VCRCart.reprice();
  render();
})();
