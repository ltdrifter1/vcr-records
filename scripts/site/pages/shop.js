"use strict";
const L = require("../lib");
const { esc, attr, asset, money } = L;

function productCard(p) {
  const dataAttrs = [
    ["data-type", p.type],
    ["data-sku", p.sku],
    ["data-name", p.name],
    ["data-price", p.price],
    ["data-sort", p.sort],
    ["data-fit", p.fit],
    ["data-ships", p.ships],
    ["data-stock", p.stock],
    ["data-stock-qty", p.stockQty],
    ["data-sizes", p.sizes.join(",")],
    ["data-colours", p.colours.join(",")],
  ]
    .filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => `${k}="${attr(v)}"`)
    .join(" ");
  const colourImgs = Object.entries(p.imageByColour || {}).map(([k, v]) => `data-img-${attr(k)}="${attr(v)}"`).join(" ");
  return `<li class="product${p.featured ? " product--featured" : ""} is-shown" ${dataAttrs} ${colourImgs}>
  <a class="product-plate" href="/merch/${attr(p.slug)}">
    <span class="product-visual"><img src="${asset(p.image)}" alt="" width="1200" height="1200" loading="lazy"/></span>
    <span class="product-cap">
      <span class="product-name">${esc(p.name)}</span>
      <span class="product-price mono">$${money(p.price)}</span>
    </span>
  </a>
</li>`;
}

function shopIndex(data) {
  const { merch } = data;
  const main = `
<header class="page-head shop-head">
  ${L.crumbs([["/", "Home"], [null, "Shop"]])}
  <h1 class="page-title">Shop</h1>
</header>
<section class="filters store-bar" aria-label="Shop filters">
  <div class="store-filters" role="group" aria-label="Filter">
    <button type="button" class="store-chip is-active" data-filter="all" aria-pressed="true">All</button>
    <button type="button" class="store-chip" data-filter="clothing" aria-pressed="false">Apparel</button>
    <button type="button" class="store-chip" data-filter="goods" aria-pressed="false">Goods</button>
  </div>
  <div class="store-sort">
    <label class="mono store-label" for="storeSort">Sort</label>
    <select id="storeSort">
      <option value="newest">Featured</option>
      <option value="price-asc">Price, low</option>
      <option value="price-desc">Price, high</option>
      <option value="az">A–Z</option>
      <option value="za">Z–A</option>
    </select>
  </div>
</section>
<ul class="store-grid" id="storeGrid" aria-label="Products">
${merch.products.map(productCard).join("\n")}
</ul>
<p class="store-empty" id="storeEmpty" hidden>Nothing in this filter yet.</p>
`;
  return L.page({
    title: "Shop",
    description: "Club Copy label goods: apparel, slipmats and sleeves. Ships to Canada and the US.",
    path: "/merch",
    bodyClass: "shop-page",
    main,
    scripts: ["shop.js"],
    jsonld: [{ "@context": "https://schema.org", "@type": "ItemList", name: "Club Copy shop", numberOfItems: merch.products.length, itemListElement: merch.products.map((p, i) => ({ "@type": "ListItem", position: i + 1, url: L.ORIGIN + "/merch/" + p.slug, name: p.name })) }],
  });
}

function productPage(p, data) {
  const { merch } = data;
  const related = (p.related || []).filter((s) => s !== p.slug).map((s) => merch.products.find((x) => x.slug === s)).filter(Boolean).slice(0, 3);
  const gallery = p.gallery && p.gallery.length ? p.gallery : [{ src: p.heroImage || asset(p.image), alt: p.heroAlt || p.title, colour: null, cover: false }];
  const imgMap = Object.keys(p.imageByColour || {}).length ? ` data-img-map='${JSON.stringify(p.imageByColour).replace(/'/g, "&#39;")}'` : "";
  const stockNote = p.stock && p.stock !== "In stock" ? `<span>${esc(p.stock)}</span>` : "";
  const facts = [p.fit, p.ships].filter(Boolean);
  const main = `
<section class="release-head product-head" aria-label="${attr(p.name)}">
  <div class="release-sleeve pdp-gallery">
    <div class="pdp-art" id="pdpArt"><img id="pdpImage" src="${attr(gallery[0].src)}" alt="${attr(gallery[0].alt || p.title)}" width="1200" height="1200" fetchpriority="high"${imgMap}/></div>
    ${gallery.length > 1 ? `<div class="pdp-thumbs" id="pdpThumbs" role="group" aria-label="Product images">${gallery.map((g, i) => `<button type="button" class="pdp-thumb${i === 0 ? " is-active" : ""}" aria-pressed="${i === 0}" data-src="${attr(g.src)}" data-alt="${attr(g.alt || "")}"${g.colour ? ` data-colour="${attr(g.colour)}"` : ""}${g.cover ? ' data-cover="1"' : ""}><img src="${attr(g.src)}" alt="" loading="lazy"/></button>`).join("")}</div>` : ""}
  </div>
  <div class="release-copy">
    ${L.crumbs([["/", "Home"], ["/merch", "Shop"], [null, p.name]])}
    <p class="mono row-meta"><span>${esc(p.typeLabel)}</span>${stockNote}</p>
    <h1 class="lead-title">${esc(p.name)}</h1>
    <p class="pdp-price"><span class="pdp-price-num">$${money(p.price)}</span> <span class="mono pdp-currency">CAD</span></p>
    ${facts.length ? `<p class="mono pdp-meta">${facts.map((m) => `<span>${esc(m)}</span>`).join("")}</p>` : ""}
    ${p.colours.length ? `<div class="pdp-block"><span class="mono pdp-label">Colour</span><div class="pdp-opts" id="pdpColours" role="group">${p.colours.map((c, i) => `<button type="button" class="pdp-opt${i === 0 ? " is-active" : ""}" data-colour="${attr(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join("")}</div></div>` : ""}
    ${p.sizes.length ? `<div class="pdp-block"><span class="mono pdp-label">Size</span><div class="pdp-opts" id="pdpSizes" role="group">${p.sizes.map((s) => `<button type="button" class="pdp-opt" data-size="${attr(s)}" aria-pressed="false">${esc(s)}</button>`).join("")}</div><p class="pdp-error mono" id="pdpSizeError" hidden>Select a size to continue.</p></div>` : ""}
    <div class="lead-actions pdp-actions">
      <button type="button" class="btn btn-solid" id="pdpAdd" data-sku="${attr(p.sku)}" data-name="${attr(p.cartName || p.name)}" data-price="${attr(p.price)}" data-image="${attr(p.cartImage || asset(p.image))}" data-needs-size="${p.needsSize || p.sizes.length ? "1" : "0"}">Add to cart</button>
      <a class="btn btn-text" href="/shipping">Shipping &amp; returns</a>
    </div>
    ${p.description || p.lede ? `<p class="pdp-dek">${esc(p.description || p.lede || "")}</p>` : ""}
  </div>
</section>
${related.length ? `<section class="sec" aria-labelledby="more-title">${L.sectionHead("Also in the shop", { titleId: "more-title", link: ["/merch", "All goods"] })}<ul class="store-grid store-grid--related">${related.map(productCard).join("\n")}</ul></section>` : ""}
`;
  return L.page({
    title: p.name,
    description: p.description || p.lede || `${p.name} from Club Copy.`,
    path: "/merch/" + p.slug,
    bodyClass: "shop-page pdp",
    main,
    image: p.heroImage || p.image,
    ogType: "product",
    scripts: ["product.js"],
    jsonld: [{ "@context": "https://schema.org", "@type": "Product", name: p.name, image: L.ORIGIN + asset(p.heroImage || p.image), description: p.description || p.lede, sku: p.sku, brand: { "@type": "Brand", name: "Club Copy" }, offers: { "@type": "Offer", priceCurrency: "CAD", price: String(p.price), availability: "https://schema.org/InStock", url: L.ORIGIN + "/merch/" + p.slug } }],
  });
}

module.exports = { shopIndex, productPage };
