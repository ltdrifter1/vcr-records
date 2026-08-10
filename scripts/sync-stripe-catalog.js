#!/usr/bin/env node
/**
 * Sync Club Copy catalog → Stripe Products, Prices, and Payment Links.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_… node scripts/sync-stripe-catalog.js
 *   STRIPE_SECRET_KEY=sk_live_… node scripts/sync-stripe-catalog.js --merch-page
 *   STRIPE_SECRET_KEY=sk_live_… node scripts/sync-stripe-catalog.js --music-only
 *   STRIPE_SECRET_KEY=sk_live_… node scripts/sync-stripe-catalog.js --verify
 *
 * Creates/updates:
 *   - Format products: fmt-digital ($8), fmt-cassette ($20), fmt-vinyl ($45) CAD
 *   - Per-SKU Products + Prices (lookup_key = sku)
 *   - Payment Links for each shop SKU (buy-now URLs in Dashboard)
 *
 * Checkout on clubcopy.ca resolves Prices by lookup_key automatically —
 * no need to paste STRIPE_PRICE_* into Vercel (optional override only).
 */
const fs = require("fs");
const path = require("path");
const { FORMAT, PRODUCTS, MERCH_PAGE_SKUS } = require("../api/catalog");

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  console.error("Set STRIPE_SECRET_KEY before running.");
  process.exit(1);
}

const currency = (process.env.STRIPE_CURRENCY || "cad").toLowerCase();
const musicOnly = process.argv.includes("--music-only");
const merchPageOnly = process.argv.includes("--merch-page");
const verifyOnly = process.argv.includes("--verify");
const skipLinks = process.argv.includes("--no-links");

async function stripe(pathName, method, params) {
  const body =
    params &&
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== "")
      .map(
        ([k, v]) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join("&");
  const res = await fetch(`https://api.stripe.com/v1${pathName}`, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: method === "GET" ? undefined : body,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = (data.error && data.error.message) || res.statusText;
    throw new Error(`${method} ${pathName}: ${msg}`);
  }
  return data;
}

async function findPriceByLookupKey(lookupKey) {
  const q = encodeURIComponent(lookupKey);
  const list = await stripe(
    `/prices?lookup_keys[]=${q}&active=true&limit=1`,
    "GET"
  );
  return list.data && list.data[0] ? list.data[0] : null;
}

async function findProductByMetadataSku(sku) {
  const queries = [
    `metadata['sku']:'${sku}' AND metadata['label']:'club-copy'`,
    `metadata['sku']:'${sku}'`,
  ];
  for (const query of queries) {
    try {
      const list = await stripe(
        `/products/search?query=${encodeURIComponent(query)}&limit=5`,
        "GET"
      );
      const preferred = (list.data || []).find(
        (p) => p.metadata && p.metadata.label === "club-copy"
      );
      if (preferred) return preferred;
      // Skip Stripe auto-products (from Checkout price_data) — create our own.
      const manual = (list.data || []).find(
        (p) => !(p.metadata && p.metadata._stripe_product_source)
      );
      // Auto products often have no label; detect via update failure later.
      if (query.includes("club-copy") && preferred) return preferred;
      if (query.includes("club-copy")) continue;
    } catch (_) {
      /* search may be unavailable */
    }
  }
  let startingAfter = null;
  for (let page = 0; page < 10; page += 1) {
    const q = startingAfter
      ? `/products?limit=100&active=true&starting_after=${startingAfter}`
      : "/products?limit=100&active=true";
    const all = await stripe(q, "GET");
    const labeled = (all.data || []).find(
      (p) =>
        p.metadata &&
        p.metadata.sku === sku &&
        p.metadata.label === "club-copy"
    );
    if (labeled) return labeled;
    if (!all.has_more || !(all.data && all.data.length)) break;
    startingAfter = all.data[all.data.length - 1].id;
  }
  return null;
}

async function ensureProduct({ name, sku, format, description }) {
  let product = await findProductByMetadataSku(sku);
  if (product) {
    try {
      product = await stripe(`/products/${product.id}`, "POST", {
        name,
        description: description || undefined,
        "metadata[sku]": sku,
        "metadata[format]": format || "",
        "metadata[label]": "club-copy",
      });
      return product;
    } catch (err) {
      const msg = String((err && err.message) || "");
      if (!/cannot be updated/i.test(msg)) throw err;
      console.log(
        `  · auto product ${product.id} for ${sku} — creating club-copy product`
      );
      // Fall through and create a managed product.
    }
  }
  return stripe("/products", "POST", {
    name,
    description: description || undefined,
    "metadata[sku]": sku,
    "metadata[format]": format || "",
    "metadata[label]": "club-copy",
  });
}

async function ensurePrice({ productId, unitAmount, lookupKey }) {
  const existing = await findPriceByLookupKey(lookupKey);
  const productMatch =
    existing &&
    (existing.product === productId ||
      (existing.product && existing.product.id === productId));
  if (existing) {
    if (
      existing.unit_amount === unitAmount &&
      existing.currency === currency &&
      productMatch
    ) {
      return existing;
    }
    await stripe(`/prices/${existing.id}`, "POST", { active: "false" });
    await stripe(`/prices/${existing.id}`, "POST", {
      lookup_key: "",
      transfer_lookup_key: "true",
    }).catch(() => {});
  }
  return stripe("/prices", "POST", {
    product: productId,
    currency,
    unit_amount: String(unitAmount),
    lookup_key: lookupKey,
    transfer_lookup_key: "true",
  });
}

async function ensurePaymentLink({ priceId, productId, sku, digital }) {
  const product = await stripe(`/products/${productId}`, "GET");
  const existingId = product.metadata && product.metadata.payment_link_id;
  if (existingId) {
    try {
      const existing = await stripe(
        `/payment_links/${existingId}?expand[]=line_items`,
        "GET"
      );
      const items = (existing.line_items && existing.line_items.data) || [];
      const samePrice = items.some(
        (li) => li.price && li.price.id === priceId
      );
      if (existing.active !== false && samePrice) {
        await stripe(`/payment_links/${existing.id}`, "POST", {
          "metadata[sku]": sku,
          "metadata[label]": "club-copy",
        });
        return existing;
      }
      // Price changed — deactivate old link and create a fresh one.
      if (existing.active !== false) {
        await stripe(`/payment_links/${existing.id}`, "POST", {
          active: "false",
        });
        console.log(`  · archived stale payment link for ${sku}`);
      }
    } catch (_) {
      /* recreate below */
    }
  }

  const params = {
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "metadata[sku]": sku,
    "metadata[label]": "club-copy",
    "after_completion[type]": "redirect",
    "after_completion[redirect][url]":
      "https://www.clubcopy.ca/thank-you?session_id={CHECKOUT_SESSION_ID}",
  };
  if (!digital) {
    params["shipping_address_collection[allowed_countries][0]"] = "CA";
    params["shipping_address_collection[allowed_countries][1]"] = "US";
  }
  const link = await stripe("/payment_links", "POST", params);
  await stripe(`/products/${productId}`, "POST", {
    "metadata[payment_link_id]": link.id,
    "metadata[sku]": sku,
    "metadata[label]": "club-copy",
    "metadata[format]": product.metadata && product.metadata.format
      ? product.metadata.format
      : "",
  });
  return link;
}

function isMusicSku(sku, product) {
  return (
    product.digital ||
    product.format === "cassette" ||
    product.format === "vinyl" ||
    sku.startsWith("dg-") ||
    sku.includes("cassette") ||
    sku.includes("vinyl")
  );
}

function skusToSync() {
  const entries = Object.entries(PRODUCTS);
  if (merchPageOnly) {
    return entries.filter(([sku]) => MERCH_PAGE_SKUS.includes(sku));
  }
  if (musicOnly) {
    return entries.filter(([sku, p]) => isMusicSku(sku, p));
  }
  return entries;
}

async function verify() {
  console.log("Verifying Stripe Prices for merch page SKUs\n");
  let ok = 0;
  let bad = 0;
  for (const sku of MERCH_PAGE_SKUS) {
    const expected = PRODUCTS[sku];
    if (!expected) {
      console.log(`✗ ${sku} missing from catalog`);
      bad += 1;
      continue;
    }
    const price = await findPriceByLookupKey(sku);
    if (!price) {
      console.log(`✗ ${sku}  no Stripe Price with lookup_key`);
      bad += 1;
      continue;
    }
    const amountOk = price.unit_amount === expected.unitAmount;
    const curOk = price.currency === currency;
    if (amountOk && curOk) {
      console.log(
        `✓ ${sku.padEnd(28)} $${(expected.unitAmount / 100).toFixed(2)} CAD  ${price.id}`
      );
      ok += 1;
    } else {
      console.log(
        `✗ ${sku} amount/currency mismatch stripe=${price.unit_amount}${price.currency} expected=${expected.unitAmount}${currency}`
      );
      bad += 1;
    }
  }
  console.log(`\n${ok} ok · ${bad} bad`);
  if (bad) process.exit(1);
}

async function main() {
  if (verifyOnly) {
    await verify();
    return;
  }

  const live = String(secret).includes("_live_");
  console.log(
    `Syncing Club Copy → Stripe (${live ? "LIVE" : "TEST"}) Products/Prices/Links\n`
  );

  const envLines = [];
  const summary = [];
  const linkLines = [];

  for (const [format, meta] of Object.entries(FORMAT)) {
    const product = await ensureProduct({
      name: `Club Copy — ${meta.label}`,
      sku: meta.key,
      format,
      description: `Format tier: ${meta.label} at $${(meta.unitAmount / 100).toFixed(2)} ${currency.toUpperCase()}`,
    });
    const price = await ensurePrice({
      productId: product.id,
      unitAmount: meta.unitAmount,
      lookupKey: meta.key,
    });
    summary.push({
      kind: "format",
      sku: meta.key,
      amount: meta.unitAmount,
      product: product.id,
      price: price.id,
    });
    envLines.push(
      `STRIPE_PRICE_${meta.key.toUpperCase().replace(/-/g, "_")}=${price.id}`
    );
    console.log(
      `✓ format ${meta.key}  $${(meta.unitAmount / 100).toFixed(2)}  ${price.id}`
    );
  }

  console.log("");

  for (const [sku, product] of skusToSync()) {
    const p = await ensureProduct({
      name: product.name,
      sku,
      format: product.format || (product.digital ? "digital" : "merch"),
    });
    const price = await ensurePrice({
      productId: p.id,
      unitAmount: product.unitAmount,
      lookupKey: sku,
    });
    let link = null;
    if (!skipLinks && MERCH_PAGE_SKUS.includes(sku)) {
      link = await ensurePaymentLink({
        priceId: price.id,
        productId: p.id,
        sku,
        digital: !!product.digital,
      });
      linkLines.push(`${sku}\t$${(product.unitAmount / 100).toFixed(2)}\t${link.url}`);
      console.log(
        `✓ ${sku.padEnd(28)} $${(product.unitAmount / 100).toFixed(2)}  ${price.id}  link=${link.url}`
      );
    } else {
      console.log(
        `✓ ${sku.padEnd(28)} $${(product.unitAmount / 100).toFixed(2)}  ${price.id}`
      );
    }
    summary.push({
      kind: "sku",
      sku,
      amount: product.unitAmount,
      product: p.id,
      price: price.id,
      paymentLink: link ? link.url : null,
    });
    envLines.push(
      `STRIPE_PRICE_${sku.toUpperCase().replace(/-/g, "_")}=${price.id}`
    );
  }

  const outPath = path.join(__dirname, "..", "data", "stripe-sync.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        syncedAt: new Date().toISOString(),
        live,
        currency,
        items: summary,
      },
      null,
      2
    )
  );

  console.log("\n--- Payment links (merch page) ---\n");
  console.log(linkLines.join("\n") || "(none — use --merch-page without --no-links)");
  console.log("\n--- Optional Vercel env ---\n");
  console.log(envLines.join("\n"));
  console.log(`\nWrote ${outPath}`);
  console.log("Done.", summary.length, "prices ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
