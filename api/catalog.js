/**
 * Shared Club Copy commerce catalog (server-side source of truth).
 * Format tiers: digital $8 · cassette $20 · vinyl $45 (CAD).
 * Merch SKUs keep individual prices; music SKUs lock to format tiers.
 */

const FORMAT = {
  digital: { key: "fmt-digital", label: "Digital download", unitAmount: 800 },
  cassette: { key: "fmt-cassette", label: "Cassette", unitAmount: 2000 },
  vinyl: { key: "fmt-vinyl", label: "Vinyl", unitAmount: 4500 },
};

/** SKUs sold on merch.html (must stay in sync with the shop page). */
const MERCH_PAGE_SKUS = [
  "dg-enter",
  "dg-together",
  "sm-cassette-inlet-knight",
  "sm-slipmat",
  "sm-poly-outer",
  "sm-simple-tee",
  "sm-longsleeve",
  "sm-sleeve-tee",
  "sm-hoodie",
  "sm-crewneck",
  "sm-cap",
  "sm-bikini",
];

/** @type {Record<string, { name: string, unitAmount: number, stock?: number, digital?: boolean, format?: string }>} */
const PRODUCTS = {
  // Apparel / essentials
  "sm-simple-tee": { name: "Micro Tee", unitAmount: 3200, stock: 80 },
  "sm-globe-tee": { name: "Logo Tee", unitAmount: 3400, stock: 40 },
  "sm-longsleeve": { name: "Long Sleeve", unitAmount: 4200, stock: 40 },
  "sm-sleeve-tee": { name: "Sleeve Tee", unitAmount: 4400, stock: 36 },
  "sm-hoodie": { name: "Hoodie", unitAmount: 6800, stock: 30 },
  "sm-crewneck": { name: "Crewneck", unitAmount: 5800, stock: 30 },
  "sm-tote": { name: "Canvas Tote", unitAmount: 2400, stock: 50 },
  "sm-mug": { name: "Mug", unitAmount: 1800, stock: 40 },
  "sm-bikini": { name: "Bikini", unitAmount: 4800, stock: 20 },
  "sm-cap": { name: "Dad Cap", unitAmount: 3600, stock: 50 },
  "sm-slipmat": { name: "Slipmat Pair", unitAmount: 2200, stock: 60 },
  "sm-sticker-pack": { name: "Logo Sticker Pack", unitAmount: 800, stock: 100 },
  "sm-poster": { name: "Chrome Logo Poster", unitAmount: 2000, stock: 40 },
  "sm-poly-outer": { name: "Poly Outer", unitAmount: 500, stock: 100 },
  "sm-pin": { name: "Logo Enamel Pin", unitAmount: 1200, stock: 80 },

  // Music — format-tier amounts
  "sm-cassette-inlet-knight": {
    name: "Inlet Knight — Cassette",
    unitAmount: FORMAT.cassette.unitAmount,
    stock: 36,
    format: "cassette",
  },
  "dg-together": {
    name: "Together — Digital (EP)",
    unitAmount: FORMAT.digital.unitAmount,
    digital: true,
    format: "digital",
  },
  "dg-inlet-knight": {
    name: "Inlet Knight — Digital (Album)",
    unitAmount: FORMAT.digital.unitAmount,
    digital: true,
    format: "digital",
  },
  "dg-enter": {
    name: "Enter, Double-Edge — Digital (EP)",
    unitAmount: FORMAT.digital.unitAmount,
    digital: true,
    format: "digital",
  },
};

/** Flat shipping rates (CAD cents). Ships CA + US only. */
const SHIPPING = {
  ca: { label: "Canada — tracked", amount: 800 },
  us: { label: "United States — tracked", amount: 1400 },
};

/**
 * Optional env override: STRIPE_PRICE_<SKU_WITH_UNDERSCORES>=price_xxx
 * e.g. STRIPE_PRICE_DG_ENTER=price_...
 */
function priceIdFromEnv(sku) {
  const key = `STRIPE_PRICE_${String(sku).toUpperCase().replace(/-/g, "_")}`;
  return process.env[key] || null;
}

module.exports = {
  FORMAT,
  PRODUCTS,
  MERCH_PAGE_SKUS,
  SHIPPING,
  priceIdFromEnv,
};
