#!/usr/bin/env node
/**
 * Sync Club Copy format tiers + catalog SKUs to Stripe Products/Prices.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=rk_test_… node scripts/sync-stripe-catalog.js
 *   STRIPE_SECRET_KEY=rk_test_… node scripts/sync-stripe-catalog.js --music-only
 *
 * Creates/updates:
 *   - Format products: fmt-digital ($8), fmt-cassette ($20), fmt-vinyl ($45) CAD
 *   - Per-SKU products for music (and merch unless --music-only)
 *
 * Prints env var suggestions (STRIPE_PRICE_…) to paste into Vercel.
 */
const { FORMAT, PRODUCTS } = require("../api/catalog");

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  console.error("Set STRIPE_SECRET_KEY before running.");
  process.exit(1);
}

const currency = (process.env.STRIPE_CURRENCY || "cad").toLowerCase();
const musicOnly = process.argv.includes("--music-only");

async function stripe(path, method, params) {
  const body =
    params &&
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(
        ([k, v]) =>
          `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
      )
      .join("&");
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
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
    throw new Error(`${method} ${path}: ${msg}`);
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
  const list = await stripe(
    `/products/search?query=${encodeURIComponent(`metadata['sku']:'${sku}'`)}&limit=1`,
    "GET"
  ).catch(() => null);
  if (list && list.data && list.data[0]) return list.data[0];
  // Fallback: list + filter (search may need Products search enabled)
  const all = await stripe("/products?limit=100&active=true", "GET");
  return (all.data || []).find((p) => p.metadata && p.metadata.sku === sku) || null;
}

async function ensureProduct({ name, sku, format, description }) {
  let product = await findProductByMetadataSku(sku);
  if (product) {
    product = await stripe(`/products/${product.id}`, "POST", {
      name,
      description: description || undefined,
      "metadata[sku]": sku,
      "metadata[format]": format || "",
      "metadata[label]": "club-copy",
    });
    return product;
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
  if (existing) {
    if (
      existing.unit_amount === unitAmount &&
      existing.currency === currency &&
      existing.product === productId
    ) {
      return existing;
    }
    // Prices are immutable for amount — archive old, create new with same lookup_key
    await stripe(`/prices/${existing.id}`, "POST", { active: "false" });
    // Clear lookup_key on archived price so we can reuse it
    await stripe(`/prices/${existing.id}`, "POST", {
      lookup_key: "",
    }).catch(() => {});
  }
  return stripe("/prices", "POST", {
    product: productId,
    currency,
    unit_amount: String(unitAmount),
    lookup_key: lookupKey,
    "transfer_lookup_key": "true",
  });
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

async function main() {
  console.log("Syncing Club Copy → Stripe Products/Prices\n");

  const envLines = [];
  const summary = [];

  // 1) Format tier products (the three codes)
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
    const envKey = `STRIPE_PRICE_${meta.key.toUpperCase().replace(/-/g, "_")}`;
    envLines.push(`${envKey}=${price.id}`);
    console.log(
      `✓ format ${meta.key}  $${(meta.unitAmount / 100).toFixed(2)}  ${price.id}`
    );
  }

  console.log("");

  // 2) Per-SKU products
  for (const [sku, product] of Object.entries(PRODUCTS)) {
    if (musicOnly && !isMusicSku(sku, product)) continue;
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
    summary.push({
      kind: "sku",
      sku,
      amount: product.unitAmount,
      product: p.id,
      price: price.id,
    });
    const envKey = `STRIPE_PRICE_${sku.toUpperCase().replace(/-/g, "_")}`;
    envLines.push(`${envKey}=${price.id}`);
    console.log(
      `✓ ${sku.padEnd(28)} $${(product.unitAmount / 100).toFixed(2)}  ${price.id}`
    );
  }

  console.log("\n--- Vercel env (paste) ---\n");
  console.log(envLines.join("\n"));
  console.log("\nDone.", summary.length, "prices ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
