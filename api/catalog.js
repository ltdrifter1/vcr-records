/**
 * Shared Club Copy commerce catalog (server-side source of truth).
 * Format tiers: digital $8 · cassette $20 · vinyl $45 (CAD).
 * Clothing prices = prior × 1.25, rounded up to the next dollar.
 */

const FORMAT = {
  digital: { key: "fmt-digital", label: "Digital download", unitAmount: 800 },
  cassette: { key: "fmt-cassette", label: "Cassette", unitAmount: 2000 },
  vinyl: { key: "fmt-vinyl", label: "Vinyl", unitAmount: 4500 },
};

/** SKUs sold on merch.html (must stay in sync with the shop page). */
const MERCH_PAGE_SKUS = [
  "dg-j-adore",
  "dg-enter",
  "dg-together",
  "dg-letters-from-another-era",
  "sm-cassette-inlet-knight",
  "bn-tee-enter",
  "bn-tee-together",
  "bn-tee-inlet-cass",
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

/** @type {Record<string, { name: string, unitAmount: number, stock?: number, digital?: boolean, format?: string, bundle?: boolean }>} */
const PRODUCTS = {
  // Apparel (clothing +25% round up)
  "sm-simple-tee": { name: "Micro Tee", unitAmount: 4000, stock: 80 },
  "sm-globe-tee": { name: "Logo Tee", unitAmount: 4300, stock: 40 },
  "sm-longsleeve": { name: "Long Sleeve", unitAmount: 5300, stock: 40 },
  "sm-sleeve-tee": { name: "Sleeve Tee", unitAmount: 5500, stock: 36 },
  "sm-hoodie": { name: "Hoodie", unitAmount: 8500, stock: 30 },
  "sm-crewneck": { name: "Crewneck", unitAmount: 7300, stock: 30 },
  "sm-tote": { name: "Canvas Tote", unitAmount: 2400, stock: 50 },
  "sm-mug": { name: "Mug", unitAmount: 1800, stock: 40 },
  "sm-bikini": { name: "Bikini", unitAmount: 6000, stock: 20 },
  "sm-cap": { name: "Cap", unitAmount: 4500, stock: 50 },
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
  "dg-letters-from-another-era": {
    name: "Letters From Another Era — Digital (EP)",
    unitAmount: FORMAT.digital.unitAmount,
    digital: true,
    format: "digital",
  },
  "dg-j-adore": {
    name: "j'adore — Digital (Single)",
    unitAmount: FORMAT.digital.unitAmount,
    digital: true,
    format: "digital",
  },

  // Bundles — tee + release (tee $40 + digital $8 / cassette $20)
  "bn-tee-enter": {
    name: "Micro Tee + Enter Digital",
    unitAmount: 4800,
    stock: 80,
    bundle: true,
    format: "bundle",
  },
  "bn-tee-together": {
    name: "Micro Tee + Together Digital",
    unitAmount: 4800,
    stock: 80,
    bundle: true,
    format: "bundle",
  },
  "bn-tee-inlet-cass": {
    name: "Micro Tee + Inlet Knight Cassette",
    unitAmount: 6000,
    stock: 36,
    bundle: true,
    format: "bundle",
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
