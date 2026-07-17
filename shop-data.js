/* Render shop grid from data/products.json when #shopGrid[data-from-json] is present */
(function () {
  async function init() {
    const grid = document.getElementById('shopGrid');
    if (!grid || grid.dataset.fromJson !== 'true') return;
    try {
      const res = await fetch('data/products.json', { cache: 'no-store' });
      const data = await res.json();
      const products = data.products || [];
      grid.innerHTML = products.map((p, i) => `
        <a class="merch-card rv ${i ? 'd' + Math.min(i, 2) : ''}"
           href="${p.slug}"
           data-category="${p.category}"
           data-search="${p.search || p.name}">
          <div class="merch-img"><img src="${p.images[0]}" alt="${p.name}" loading="lazy"/></div>
          <div class="merch-body">
            <div>
              <div class="merch-name">${p.name}</div>
              <div class="merch-price">${p.priceLabel}</div>
            </div>
            <span class="btn btn-primary btn-sm btn-block">View product</span>
          </div>
        </a>`).join('');
      document.querySelectorAll('#shopGrid .rv').forEach((el) => el.classList.add('in'));
      if (window.VCR && window.VCR.initShopFilters) window.VCR.initShopFilters();
    } catch (e) {
      console.error('products.json', e);
    }
  }
  document.addEventListener('DOMContentLoaded', init);
})();
