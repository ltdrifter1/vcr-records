(function () {
  var grid = document.getElementById('storeGrid');
  var empty = document.getElementById('storeEmpty');
  var chips = Array.prototype.slice.call(document.querySelectorAll('.store-chip[data-filter]'));
  var sortSelect = document.getElementById('storeSort');
  var activeFilter = 'all';

  function products() {
    return Array.prototype.slice.call(grid.querySelectorAll('.product'));
  }

  function typeRank(el) {
    var type = el.dataset.type || '';
    if (type === 'clothing') return 1;
    if (type === 'goods') return 2;
    if (type === 'bundles') return 3;
    return 4;
  }

  function applyFilterSort() {
    var items = products();
    var sort = sortSelect.value;
    items.sort(function (a, b) {
      var an = (a.dataset.name || '').toLowerCase();
      var bn = (b.dataset.name || '').toLowerCase();
      if (sort === 'az') return an.localeCompare(bn);
      if (sort === 'za') return bn.localeCompare(an);
      if (sort === 'price-asc' || sort === 'price-desc') {
        var ap = Number(a.dataset.price || 0);
        var bp = Number(b.dataset.price || 0);
        if (ap !== bp) return sort === 'price-asc' ? ap - bp : bp - ap;
        return an.localeCompare(bn);
      }

      var af = a.classList.contains('product--featured') ? 0 : 1;
      var bf = b.classList.contains('product--featured') ? 0 : 1;
      if (af !== bf) return af - bf;

      var ar = typeRank(a);
      var br = typeRank(b);
      if (ar !== br) return sort === 'oldest' ? br - ar : ar - br;

      var as = Number(a.dataset.sort || 0);
      var bs = Number(b.dataset.sort || 0);
      if (as !== bs) return sort === 'oldest' ? as - bs : bs - as;
      return an.localeCompare(bn);
    });
    items.forEach(function (el) { grid.appendChild(el); });

    var shown = 0;
    items.forEach(function (el) {
      var match = activeFilter === 'all' || el.dataset.type === activeFilter;
      el.classList.toggle('is-shown', match);
      if (match) {
        shown += 1;
        el.classList.remove('in');
        requestAnimationFrame(function () { el.classList.add('in'); });
      }
    });
    empty.hidden = shown > 0;
    empty.classList.toggle('is-visible', shown === 0);
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      activeFilter = chip.dataset.filter;
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      applyFilterSort();
    });
  });
  sortSelect.addEventListener('change', applyFilterSort);
  applyFilterSort();

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    });
  }, { threshold: .08, rootMargin: '0px 0px -20px 0px' });
  products().forEach(function (el) { obs.observe(el); });
})();

(function productDrawer() {
  var drawer = document.getElementById('productDrawer');
  if (!drawer) return;
  var opener = null;
  var activeCard = null;
  var colourBlock = document.getElementById('drawerColourBlock');
  var sizeBlock = document.getElementById('drawerSizeBlock');
  var colourHost = document.getElementById('drawerColours');
  var sizeHost = document.getElementById('drawerSizes');
  var sizeError = document.getElementById('drawerSizeError');
  var addBtn = document.getElementById('drawerAdd');
  var opts = document.getElementById('drawerOpts');

  function makeOpt(label, selected) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'merch-opt' + (selected ? ' selected' : '');
    btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    btn.textContent = label;
    return btn;
  }

  function wireGroup(host, onPick) {
    host.querySelectorAll('.merch-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        host.querySelectorAll('.merch-opt').forEach(function (b) {
          b.classList.remove('selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
        if (onPick) onPick(btn);
        if (host === sizeHost) {
          sizeHost.removeAttribute('aria-invalid');
          sizeError.hidden = true;
        }
      });
    });
  }

  function openFrom(card, trigger) {
    opener = trigger || null;
    activeCard = card;
    var img = card.querySelector('.product-visual img');
    document.getElementById('drawerImage').src = img ? img.src : '';
    document.getElementById('drawerImage').alt = card.dataset.name || '';
    document.getElementById('drawerTitle').textContent = card.dataset.name || '';

    var colours = (card.dataset.colours || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var sizes = (card.dataset.sizes || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);

    colourHost.innerHTML = '';
    sizeHost.innerHTML = '';
    sizeError.hidden = true;
    sizeHost.removeAttribute('aria-invalid');

    if (colours.length) {
      colourBlock.hidden = false;
      colours.forEach(function (c, i) { colourHost.appendChild(makeOpt(c, i === 0)); });
      wireGroup(colourHost, function (btn) {
        var map = {
          Black: card.dataset.imgBlack,
          White: card.dataset.imgWhite
        };
        var next = map[btn.textContent.trim()];
        if (next) {
          document.getElementById('drawerImage').src = next;
          if (img) img.src = next;
        }
      });
    } else {
      colourBlock.hidden = true;
    }

    if (sizes.length) {
      sizeBlock.hidden = false;
      sizes.forEach(function (s) { sizeHost.appendChild(makeOpt(s, false)); });
      wireGroup(sizeHost);
    } else {
      sizeBlock.hidden = true;
    }

    var sold = card.dataset.stockQty != null && Number(card.dataset.stockQty) <= 0;
    addBtn.disabled = sold;
    addBtn.textContent = sold ? 'Sold out' : 'Add to cart';
    opts.hidden = false;

    if (typeof drawer.showModal === 'function') drawer.showModal();
  }

  document.querySelectorAll('[data-open-product]').forEach(function (el) {
    el.addEventListener('click', function () {
      var card = el.closest('.merch-card');
      if (card) openFrom(card, el);
    });
  });

  var closeBtn = drawer.querySelector('.product-drawer__close');
  if (closeBtn) closeBtn.addEventListener('click', function () { drawer.close(); });
  drawer.addEventListener('click', function (e) { if (e.target === drawer) drawer.close(); });
  drawer.addEventListener('close', function () { if (opener) try { opener.focus(); } catch (err) {} });

  var toast = document.getElementById('toast');
  var toastMsg = document.getElementById('toastMsg');
  var toastTimer;
  function showToast(name) {
    toastMsg.textContent = name + ' added to cart';
    toast.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('on'); }, 3200);
  }

  addBtn.addEventListener('click', function () {
    if (!activeCard || addBtn.disabled) return;
    var colourBtn = colourHost.querySelector('.merch-opt[aria-pressed="true"]');
    var sizeBtn = sizeHost.querySelector('.merch-opt[aria-pressed="true"]');
    if (!sizeBlock.hidden && !sizeBtn) {
      sizeHost.setAttribute('aria-invalid', 'true');
      sizeError.hidden = false;
      var first = sizeHost.querySelector('.merch-opt');
      if (first) first.focus();
      return;
    }
    var img = document.getElementById('drawerImage');
    var item = {
      sku: activeCard.dataset.sku,
      name: activeCard.dataset.name,
      price: Number(activeCard.dataset.price),
      colour: colourBtn ? colourBtn.textContent.trim() : null,
      size: sizeBtn ? sizeBtn.textContent.trim() : null,
      image: img ? img.getAttribute('src') : '',
      qty: 1
    };
    item.id = VCRCart.lineId(item);
    VCRCart.add(item);
    addBtn.classList.add('is-added');
    addBtn.textContent = 'Added';
    showToast(item.name);
    setTimeout(function () {
      addBtn.classList.remove('is-added');
      addBtn.textContent = 'Add to cart';
    }, 1400);
  });
})();
