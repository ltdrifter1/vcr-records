#!/usr/bin/env node
/**
 * One-time migration: product data out of merch.html (grid attributes) and
 * merch/<slug>.html (lede, gallery, options) into data/merch.json.
 *
 *   node scripts/migrate/extract-merch.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

function decode(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, "…");
}
function attrs(tag) {
  const out = {};
  for (const m of tag.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)) out[m[1]] = decode(m[2]);
  return out;
}
function text(html) {
  return decode(String(html).replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

const grid = fs.readFileSync(path.join(ROOT, "merch.html"), "utf8");
const products = [];
for (const m of grid.matchAll(/<li class="product[^"]*"([^>]*)>([\s\S]*?)<\/li>/g)) {
  const a = attrs(m[1]);
  const inner = m[2];
  const href = (inner.match(/href="([^"]+)"/) || [])[1] || "";
  const img = (inner.match(/<img src="([^"]+)"/) || [])[1] || "";
  const title = text((inner.match(/<h3 class="product-title">([\s\S]*?)<\/h3>/) || [, ""])[1]);
  const type = text((inner.match(/<span class="product-type">([\s\S]*?)<\/span>/) || [, ""])[1]);
  const p = {
    slug: href.replace(/^\/merch\//, ""),
    sku: a["data-sku"],
    name: a["data-name"] || title,
    title,
    type: a["data-type"],
    typeLabel: type,
    price: Number(a["data-price"]),
    sort: Number(a["data-sort"] || 0),
    featured: /product--featured/.test(m[0]),
    fit: a["data-fit"] || "",
    ships: a["data-ships"] || "",
    stock: a["data-stock"] || "",
    stockQty: a["data-stock-qty"] ? Number(a["data-stock-qty"]) : null,
    sizes: a["data-sizes"] ? a["data-sizes"].split(",") : [],
    colours: a["data-colours"] ? a["data-colours"].split(",") : [],
    image: img,
    imageByColour: {},
  };
  for (const [k, v] of Object.entries(a)) {
    const cm = k.match(/^data-img-(.+)$/);
    if (cm) p.imageByColour[cm[1]] = v;
  }
  // product page details
  const pdpFile = path.join(ROOT, "merch", p.slug + ".html");
  if (fs.existsSync(pdpFile)) {
    const pdp = fs.readFileSync(pdpFile, "utf8");
    p.lede = text((pdp.match(/<p class="station-bumper__lede">([\s\S]*?)<\/p>/) || [, ""])[1]);
    p.description = decode((pdp.match(/<meta name="description" content="([^"]*)"/) || [, ""])[1]);
    p.gallery = [...pdp.matchAll(/<button type="button" class="pdp-thumb[^"]*"([^>]*)>/g)].map((t) => {
      const ta = attrs(t[1]);
      return { src: ta["data-src"], alt: ta["data-alt"] || "", colour: ta["data-colour"] || null, cover: ta["data-cover"] === "1" };
    });
    const imgTag = pdp.match(/<img id="pdpImage"([^>]*)>/);
    if (imgTag) {
      const ia = attrs(imgTag[1]);
      p.heroImage = ia.src;
      p.heroAlt = ia.alt || "";
      if (ia["data-img-map"]) {
        try { p.imageByColour = Object.assign(p.imageByColour, JSON.parse(ia["data-img-map"])); } catch (e) {}
      }
    }
    const add = pdp.match(/<button type="button" class="btn btn-dark" id="pdpAdd"([\s\S]*?)>/);
    if (add) {
      const aa = attrs(add[1].replace(/\s+/g, " "));
      p.cartName = aa["data-name"];
      p.cartImage = aa["data-image"];
      p.needsSize = aa["data-needs-size"] === "1";
    }
    p.metaLines = [...pdp.matchAll(/<p class="pdp-meta">([\s\S]*?)<\/p>/g)].map((x) => text(x[1]));
    p.related = [...pdp.matchAll(/<div class="pdp-related__row">([\s\S]*?)<\/div>/g)]
      .flatMap((r) => [...r[1].matchAll(/href="\/merch\/([^"]+)"/g)].map((x) => x[1]));
  }
  products.push(p);
}
const out = { currency: "CAD", products };
fs.writeFileSync(path.join(ROOT, "data", "merch.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`wrote ${products.length} products to data/merch.json`);
