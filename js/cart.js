/* Club Copy — shared cart (localStorage) */
(function (global) {
  var CART_KEY = 'vcr_cart_v1';

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(raw) ? raw.filter(function (i) {
        return i && i.id && i.qty > 0 && Number.isFinite(i.price);
      }) : [];
    } catch (e) {
      return [];
    }
  }

  function save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    global.dispatchEvent(new CustomEvent('vcr:cart', { detail: { items: items } }));
  }

  function count(items) {
    return (items || load()).reduce(function (n, i) { return n + (i.qty || 0); }, 0);
  }

  function subtotal(items) {
    return (items || load()).reduce(function (n, i) { return n + i.price * i.qty; }, 0);
  }

  function money(n) {
    return '$' + (Number(n) || 0).toFixed(2);
  }

  function lineId(item) {
    return [item.sku, item.colour || '', item.size || ''].join('::');
  }

  function add(item) {
    var items = load();
    var id = item.id || lineId(item);
    var existing = items.find(function (i) { return i.id === id; });
    var price = Number(item.price);
    var sku = String(item.sku || '');
    if (
      global.ClubMember &&
      ClubMember.hasMemberPricing() &&
      sku.indexOf('dg-') === 0
    ) {
      // Prefer retail→member mapping; ignore if line is already member-priced
      var memberPrice = ClubMember.memberDigitalPrice(price);
      if (memberPrice != null) price = memberPrice;
    }
    if (existing) {
      existing.qty += item.qty || 1;
      if (Number.isFinite(price)) existing.price = price;
    } else {
      items.push({
        id: id,
        sku: item.sku,
        name: item.name,
        colour: item.colour || null,
        size: item.size || null,
        price: price,
        image: item.image,
        stripe: item.stripe,
        qty: item.qty || 1
      });
    }
    save(items);
    return items;
  }

  function setQty(id, qty) {
    var items = load();
    var row = items.find(function (i) { return i.id === id; });
    if (!row) return items;
    row.qty = Math.max(0, Math.floor(Number(qty) || 0));
    items = items.filter(function (i) { return i.qty > 0; });
    save(items);
    return items;
  }

  function remove(id) {
    var items = load().filter(function (i) { return i.id !== id; });
    save(items);
    return items;
  }

  function clear() {
    save([]);
  }

  function updateBadges() {
    var n = count();
    document.querySelectorAll('[data-cart-count]').forEach(function (el) {
      el.textContent = String(n);
      el.hidden = n < 1;
      el.setAttribute('aria-label', n + ' item' + (n === 1 ? '' : 's') + ' in cart');
    });
    document.querySelectorAll('[data-cart-link]').forEach(function (el) {
      el.classList.toggle('has-items', n > 0);
    });
  }

  global.VCRCart = {
    load: load,
    save: save,
    add: add,
    setQty: setQty,
    remove: remove,
    clear: clear,
    count: count,
    subtotal: subtotal,
    money: money,
    updateBadges: updateBadges,
    lineId: lineId
  };

  document.addEventListener('DOMContentLoaded', updateBadges);
  global.addEventListener('vcr:cart', updateBadges);
  global.addEventListener('storage', function (e) {
    if (e.key === CART_KEY) updateBadges();
  });
})(window);
