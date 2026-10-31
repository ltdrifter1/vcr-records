"use strict";
const L = require("../lib");
const { esc, attr, asset, money } = L;

/** Same inbox as the footer list. Subject marks these as restock requests. */
const RESTOCK_FORM = "https://formspree.io/f/xdkwjzzr";

function soldOut(p) {
  return p.stockQty != null && Number(p.stockQty) <= 0;
}

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
  const facts = [p.typeLabel, p.fit, p.stock].filter(Boolean);
  const sold = soldOut(p);
  return `<li class="product row row--product${p.featured ? " product--featured" : ""}${sold ? " product--sold" : ""} is-shown" ${dataAttrs} ${colourImgs}>
  <div class="product-info row-main">
    <p class="mono row-meta product-meta-row">${facts.map((f) => `<span>${esc(f)}</span>`).join("")}</p>
    <h3 class="product-title row-artist"><a href="/merch/${attr(p.slug)}">${esc(p.name)}</a></h3>
    ${p.lede ? `<p class="row-dek">${esc(p.lede)}</p>` : ""}
    <div class="row-actions">
      <a class="btn btn-small" href="/merch/${attr(p.slug)}">${sold ? "Sold out" : "View"} · $${money(p.price)}</a>
      <span class="mono row-fmt product-type">${esc(p.typeLabel)}</span><span class="product-price sr-only">$${money(p.price)}</span>
    </div>
  </div>
  <a class="product-visual row-art" href="/merch/${attr(p.slug)}" aria-label="${attr(p.name)}"><img src="${asset(p.image)}" alt="${attr(p.title)}" width="1200" height="1200" loading="lazy"/></a>
</li>`;
}

function shopIndex(data) {
  const { merch } = data;
  const main = `
<header class="page-head">
  ${L.crumbs([["/", "Home"], [null, "Shop"]])}
  <h1 class="page-title">Shop</h1>
  <p class="page-lede">Label goods. Music lives in the <a href="/library">library</a>. Ships to Canada and the United States.</p>
</header>
<section class="filters store-bar" aria-label="Shop filters">
  <div class="store-filters filter" role="group" aria-label="Filter">
    <span class="mono store-label">Filter</span>
    <button type="button" class="store-chip is-active" data-filter="all" aria-pressed="true">All</button>
    <button type="button" class="store-chip" data-filter="clothing" aria-pressed="false">Apparel</button>
    <button type="button" class="store-chip" data-filter="goods" aria-pressed="false">Goods</button>
  </div>
  <div class="store-sort filter">
    <label class="mono store-label" for="storeSort">Sort</label>
    <select id="storeSort">
      <option value="newest">Catalogue order</option>
      <option value="oldest">Reverse catalogue</option>
      <option value="az">A–Z</option>
      <option value="za">Z–A</option>
    </select>
  </div>
</section>
<ul class="store-grid" id="storeGrid" aria-label="Products">
${merch.products.map(productCard).join("\n")}
</ul>
<p class="page-lede" id="storeEmpty" hidden>Nothing in this filter yet.</p>
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

function restockForm(p) {
  const note = p.sizes.length
    ? "Sold out. Leave your email and we'll write when it's back. Pick a size above if you want that noted."
    : "Sold out. Leave your email and we'll write when it's back.";
  return `<form class="pdp-restock" id="pdpRestock" data-sku="${attr(p.sku)}" data-name="${attr(p.name)}" data-fallback="${attr(RESTOCK_FORM)}" novalidate>
    <p class="mono pdp-label">Back in stock</p>
    <p class="pdp-restock-lede">${esc(note)}</p>
    <div class="field">
      <label for="pdpRestockEmail">Email</label>
      <input type="email" id="pdpRestockEmail" name="email" placeholder="you@email.com" autocomplete="email" required/>
    </div>
    <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" class="sr-only"/>
    <button type="submit" class="btn btn-solid" id="pdpRestockSubmit">Email me</button>
    <p class="pdp-restock-status mono" id="pdpRestockStatus" role="status" hidden></p>
  </form>`;
}

function productPage(p, data) {
  const { merch } = data;
  const related = (p.related || []).filter((s) => s !== p.slug).map((s) => merch.products.find((x) => x.slug === s)).filter(Boolean).slice(0, 3);
  const gallery = p.gallery && p.gallery.length ? p.gallery : [{ src: p.heroImage || asset(p.image), alt: p.heroAlt || p.title, colour: null, cover: false }];
  const imgMap = Object.keys(p.imageByColour || {}).length ? ` data-img-map='${JSON.stringify(p.imageByColour).replace(/'/g, "&#39;")}'` : "";
  const sold = soldOut(p);
  const main = `
<section class="release-head product-head" aria-label="${attr(p.name)}">
  <div class="release-copy">
    ${L.crumbs([["/", "Home"], ["/merch", "Shop"], [null, p.name]])}
    <p class="mono row-meta"><span>${esc(p.typeLabel)}</span><span${sold ? ' class="is-sold"' : ""}>${esc(p.stock || "")}</span></p>
    <h1 class="lead-title">${esc(p.name)}</h1>
    <p class="page-lede">${esc(p.description || p.lede || "")}</p>
    <p class="mono pdp-price">$${money(p.price)} CAD</p>
    ${(p.metaLines || []).map((m) => `<p class="mono pdp-meta">${esc(m)}</p>`).join("\n    ")}
    ${p.colours.length ? `<div class="pdp-block"><span class="mono pdp-label">Colour</span><div class="pdp-opts" id="pdpColours" role="group">${p.colours.map((c, i) => `<button type="button" class="pdp-opt${i === 0 ? " is-active" : ""}" data-colour="${attr(c)}" aria-pressed="${i === 0}">${esc(c)}</button>`).join("")}</div></div>` : ""}
    ${p.sizes.length ? `<div class="pdp-block"><span class="mono pdp-label">Size</span><div class="pdp-opts" id="pdpSizes" role="group">${p.sizes.map((s) => `<button type="button" class="pdp-opt" data-size="${attr(s)}" aria-pressed="false">${esc(s)}</button>`).join("")}</div><p class="pdp-error mono" id="pdpSizeError" hidden>Select a size to continue.</p></div>` : ""}
    <div class="lead-actions pdp-actions">
      <button type="button" class="btn btn-solid" id="pdpAdd" data-sku="${attr(p.sku)}" data-name="${attr(p.cartName || p.name)}" data-price="${attr(p.price)}" data-image="${attr(p.cartImage || asset(p.image))}" data-needs-size="${p.needsSize || p.sizes.length ? "1" : "0"}"${sold ? " disabled" : ""}>${sold ? "Sold out" : "Add to cart"}</button>
      <a class="btn" href="/merch">Back to shop</a>
      <a class="btn btn-text" href="/shipping">Shipping &amp; returns</a>
    </div>${sold ? `\n    ${restockForm(p)}` : ""}
  </div>
  <div class="release-sleeve pdp-gallery">
    <div class="pdp-art" id="pdpArt"><img id="pdpImage" src="${attr(gallery[0].src)}" alt="${attr(gallery[0].alt || p.title)}" width="1200" height="1200" fetchpriority="high"${imgMap}/></div>
    ${gallery.length > 1 ? `<div class="pdp-thumbs" id="pdpThumbs" role="group" aria-label="Product images">${gallery.map((g, i) => `<button type="button" class="pdp-thumb${i === 0 ? " is-active" : ""}" aria-pressed="${i === 0}" data-src="${attr(g.src)}" data-alt="${attr(g.alt || "")}"${g.colour ? ` data-colour="${attr(g.colour)}"` : ""}${g.cover ? ' data-cover="1"' : ""}><img src="${attr(g.src)}" alt="" loading="lazy"/></button>`).join("")}</div>` : ""}
  </div>
</section>
${related.length ? `<section class="sec" aria-labelledby="more-title">${L.sectionHead("More from the collection", { titleId: "more-title", link: ["/merch", "All goods"] })}<ul class="store-grid store-grid--related">${related.map(productCard).join("\n")}</ul></section>` : ""}
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
    jsonld: [{ "@context": "https://schema.org", "@type": "Product", name: p.name, image: L.ORIGIN + asset(p.heroImage || p.image), description: p.description || p.lede, sku: p.sku, brand: { "@type": "Brand", name: "Club Copy" }, offers: { "@type": "Offer", priceCurrency: "CAD", price: String(p.price), availability: sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock", url: L.ORIGIN + "/merch/" + p.slug } }],
  });
}

module.exports = { shopIndex, productPage };
