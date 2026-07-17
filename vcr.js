/* VCR Recordings — shared interactions */
(function () {
  'use strict';

  const CART_KEY = 'vcr_cart_v1';

  /* ── Nav ─────────────────────────────────────────────── */
  function initNav() {
    const nav = document.querySelector('.site-nav');
    const ham = document.getElementById('navHam');
    const drawer = document.getElementById('navDrawer');
    if (!nav) return;

    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    if (ham && drawer) {
      ham.addEventListener('click', () => {
        const open = drawer.classList.toggle('on');
        ham.classList.toggle('on', open);
        ham.setAttribute('aria-expanded', String(open));
        drawer.setAttribute('aria-hidden', String(!open));
      });
      drawer.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
          drawer.classList.remove('on');
          ham.classList.remove('on');
          ham.setAttribute('aria-expanded', 'false');
          drawer.setAttribute('aria-hidden', 'true');
        });
      });
    }
  }

  /* ── Cart ────────────────────────────────────────────── */
  function loadCart() {
    try {
      const data = JSON.parse(localStorage.getItem(CART_KEY) || '{"items":[]}');
      data.items = Array.isArray(data.items) ? data.items : [];
      return data;
    } catch {
      return { items: [] };
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
  }

  function cartCount() {
    return loadCart().items.reduce((n, i) => n + (i.qty || 0), 0);
  }

  function updateCartBadge() {
    const count = cartCount();
    document.querySelectorAll('.cart-badge').forEach((el) => {
      el.textContent = count > 0 ? String(count) : '';
      el.dataset.count = String(count);
    });
  }

  function money(n) {
    return '$' + Number(n || 0).toFixed(2);
  }

  function ensureCartDrawer() {
    if (document.getElementById('cartDrawer')) return;
    const el = document.createElement('div');
    el.id = 'cartDrawerRoot';
    el.innerHTML = `
      <div class="cart-scrim" id="cartScrim" hidden></div>
      <aside class="cart-drawer" id="cartDrawer" aria-hidden="true" aria-label="Cart">
        <div class="cart-drawer-head">
          <strong>Cart</strong>
          <button type="button" class="cart-drawer-close" id="cartDrawerClose" aria-label="Close cart">×</button>
        </div>
        <div class="cart-drawer-body" id="cartDrawerBody"></div>
        <div class="cart-drawer-foot">
          <div class="cart-line"><span>Subtotal</span><strong id="cartDrawerSub">$0.00</strong></div>
          <a class="btn btn-primary btn-block" href="cart.html">View cart & checkout</a>
          <p class="cart-drawer-empty-hint small-note" id="cartDrawerHint"></p>
        </div>
      </aside>`;
    document.body.appendChild(el);
    document.getElementById('cartScrim').addEventListener('click', closeCartDrawer);
    document.getElementById('cartDrawerClose').addEventListener('click', closeCartDrawer);
  }

  function renderCartDrawer() {
    ensureCartDrawer();
    const body = document.getElementById('cartDrawerBody');
    const subEl = document.getElementById('cartDrawerSub');
    const hint = document.getElementById('cartDrawerHint');
    const cart = loadCart();
    if (!cart.items.length) {
      body.innerHTML = `<div class="cart-empty" style="padding:28px 8px">Your cart is empty.<div style="margin-top:14px"><a class="btn btn-ghost btn-sm" href="shop.html">Shop merch</a></div></div>`;
      subEl.textContent = '$0.00';
      hint.textContent = '';
      return;
    }
    let sub = 0;
    body.innerHTML = cart.items
      .map((it, idx) => {
        sub += it.price * it.qty;
        return `<div class="cart-drawer-item">
          <img src="${it.image || 'blank1400.png'}" alt=""/>
          <div>
            <div class="cart-item-title">${it.title}</div>
            <div class="cart-item-meta">${[it.color, it.size].filter(Boolean).join(' · ') || 'Standard'} · ×${it.qty}</div>
            <button type="button" class="cart-remove" data-rm="${idx}">Remove</button>
          </div>
          <strong>${money(it.price * it.qty)}</strong>
        </div>`;
      })
      .join('');
    subEl.textContent = money(sub);
    hint.textContent = 'Checkout runs through Stripe on the cart page.';
    body.querySelectorAll('[data-rm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const c = loadCart();
        c.items.splice(parseInt(btn.dataset.rm, 10), 1);
        saveCart(c);
        renderCartDrawer();
      });
    });
  }

  function openCartDrawer() {
    ensureCartDrawer();
    renderCartDrawer();
    document.getElementById('cartDrawer').classList.add('on');
    document.getElementById('cartDrawer').setAttribute('aria-hidden', 'false');
    document.getElementById('cartScrim').hidden = false;
  }

  function closeCartDrawer() {
    const d = document.getElementById('cartDrawer');
    if (!d) return;
    d.classList.remove('on');
    d.setAttribute('aria-hidden', 'true');
    document.getElementById('cartScrim').hidden = true;
  }

  function initCartDrawer() {
    ensureCartDrawer();
    document.querySelectorAll('[data-cart-toggle]').forEach((el) => {
      el.addEventListener('click', (e) => {
        // On cart page, don't intercept
        if (location.pathname.endsWith('/cart.html') || location.pathname.endsWith('cart.html')) return;
        e.preventDefault();
        openCartDrawer();
      });
    });
  }

  function addToCart(item) {
    const cart = loadCart();
    const color = item.color || item.colour || null;
    const key = [item.id, color, item.size].filter(Boolean).join('|');
    const existing = cart.items.find((i) => i.key === key);
    if (existing) {
      existing.qty += item.qty || 1;
    } else {
      cart.items.push({
        key,
        id: item.id,
        title: item.title,
        price: item.price,
        color: color,
        size: item.size || null,
        image: item.image || null,
        stripe: item.stripe || null,
        qty: item.qty || 1,
      });
    }
    saveCart(cart);
    showToast(`${item.title} added`);
    openCartDrawer();
    return cart;
  }

  function showToast(msg) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('on');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('on'), 2200);
  }

  /* ── Option toggles ──────────────────────────────────── */
  function initOptions(root = document) {
    root.querySelectorAll('[data-option-group]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const group = btn.dataset.optionGroup;
        const scope = btn.closest('[data-product]') || root;
        scope.querySelectorAll(`[data-option-group="${group}"]`).forEach((b) => {
          b.classList.remove('selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');

        if (btn.dataset.img) {
          const imgId = btn.dataset.imgTarget;
          const img = imgId ? document.getElementById(imgId) : scope.querySelector('[data-product-image]');
          if (img) {
            img.style.opacity = '0.4';
            setTimeout(() => {
              img.src = btn.dataset.img;
              img.style.opacity = '1';
            }, 120);
          }
        }

        scope.dispatchEvent(new CustomEvent('vcr:optionchange', { bubbles: true }));
      });
    });
  }

  /* ── Scroll reveal ───────────────────────────────────── */
  function initReveal() {
    const els = document.querySelectorAll('.rv');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('in'));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            obs.unobserve(e.target);
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -28px 0px' }
    );
    els.forEach((el) => obs.observe(el));
  }

  /* ── Listen embed ────────────────────────────────────── */
  function initListen() {
    const block = document.getElementById('listenBlock');
    const trig = document.getElementById('listenTrig');
    const embed = document.getElementById('listenEmbed');
    if (!block || !trig || !embed) return;

    trig.addEventListener('click', () => {
      if (embed.classList.contains('on')) return;
      trig.style.opacity = '.4';
      trig.style.pointerEvents = 'none';
      const f = document.createElement('iframe');
      f.title = 'Bandcamp player';
      f.src = block.dataset.src;
      f.allow = 'autoplay';
      f.style.cssText = 'width:100%;height:120px;display:block;border:0;background:#000;';
      f.onload = () => {
        trig.style.display = 'none';
        embed.classList.add('on');
      };
      embed.appendChild(f);
    });
  }

  /* ── Shop filter / search ────────────────────────────── */
  function initShopFilters() {
    const grid = document.getElementById('shopGrid');
    const search = document.getElementById('shopSearch');
    const chips = document.querySelectorAll('.filter-chip');
    if (!grid) return;

    let filter = 'all';
    let query = '';

    function apply() {
      const cards = grid.querySelectorAll('[data-category]');
      let visible = 0;
      cards.forEach((card) => {
        const cat = card.dataset.category || '';
        const hay = (card.dataset.search || card.textContent || '').toLowerCase();
        const okCat = filter === 'all' || cat === filter;
        const okQ = !query || hay.includes(query);
        const show = okCat && okQ;
        card.style.display = show ? '' : 'none';
        if (show) visible++;
      });
      const empty = document.getElementById('shopEmpty');
      if (empty) empty.hidden = visible > 0;
    }

    chips.forEach((chip) => {
      chip.onclick = () => {
        chips.forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        filter = chip.dataset.filter || 'all';
        apply();
      };
    });

    if (search) {
      search.oninput = () => {
        query = search.value.trim().toLowerCase();
        apply();
      };
    }

    apply();
  }

  /* ── Product gallery ─────────────────────────────────── */
  function initGallery() {
    const main = document.getElementById('productMainImg');
    const thumbs = document.querySelectorAll('[data-gallery-thumb]');
    if (!main || !thumbs.length) return;
    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        thumbs.forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
        main.style.opacity = '0.35';
        setTimeout(() => {
          main.src = thumb.dataset.galleryThumb;
          main.style.opacity = '1';
        }, 120);
      });
    });
  }

  /* ── Expose API ──────────────────────────────────────── */
  window.VCR = {
    loadCart,
    saveCart,
    addToCart,
    cartCount,
    updateCartBadge,
    showToast,
    initShopFilters,
    openCartDrawer,
    closeCartDrawer,
    renderCartDrawer,
  };

  document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('page-enter');
    initNav();
    initOptions();
    initReveal();
    initListen();
    initShopFilters();
    initGallery();
    initCartDrawer();
    updateCartBadge();
  });
})();
