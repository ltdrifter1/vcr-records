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
  "dg-the-mystic-jade-touch",
  "dg-lookout",
  "dg-bridget-in-my-room",
  "dg-need-you",
  "dg-solar-eclipse-part-2",
  "dg-lunar-eclipse-part-3",
  "dg-sun-and-moon-eclipse",
  "dg-champion-sound",
  "dg-summer-madness",
  "dg-ep1",
  "dg-ep-6",
  "dg-j-adore",
  "dg-together",
  "dg-letters-from-another-era",
  "sm-cassette-inlet-knight",
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
  "dg-letters-from-another-era": {
    name: "Letters From Another Era — Digital (EP)",
    unitAmount: FORMAT.digital.unitAmount,
    digital: true,
    format: "digital",
  },
  "dg-lookout": {
    name: "Lookout — Digital (Album) — Pre-order",
    unitAmount: FORMAT.digital.unitAmount,
    digital: true,
    format: "digital",
  },
  "dg-bridget-in-my-room": {
    name: "Bridget In My Room — Digital (Single)",
    unitAmount: FORMAT.digital.unitAmount,
    digital: true,
    format: "digital",
  },
  "dg-need-you": {
    name: "Need U — Digital (Album)",
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
  "dg-sun-and-moon-eclipse": {
    name: "Sun & Moon (Eclipse Part 1) — Digital (Single)",
    unitAmount: 199,
    digital: true,
    format: "digital",
  },
  "dg-solar-eclipse-part-2": {
    name: "Solar (Eclipse Part 2) — Digital (Single)",
    unitAmount: 199,
    digital: true,
    format: "digital",
  },
  "dg-lunar-eclipse-part-3": {
    name: "Lunar (Eclipse Part 3) — Digital (Single)",
    unitAmount: 199,
    digital: true,
    format: "digital",
  },
  "dg-the-mystic-jade-touch": {
    name: "The Mystic / Jade Touch — Digital (Single)",
    unitAmount: 150,
    digital: true,
    format: "digital",
  },
  "dg-champion-sound": {
    name: "Champion Sound — Digital (Single)",
    unitAmount: 150,
    digital: true,
    format: "digital",
  },
  "dg-summer-madness": {
    name: "Summer Madness — Digital (Album)",
    unitAmount: 900,
    digital: true,
    format: "digital",
  },
  "dg-ep1": {
    name: "EP1 — Digital (EP)",
    unitAmount: 300,
    digital: true,
    format: "digital",
  },
  "dg-ep-6": {
    name: "EP-6 — Digital (EP)",
    unitAmount: 900,
    digital: true,
    format: "digital",
  },

  // Membership — Club Copy record club
  // Free — release alerts + catalog (no SKU)
  // Club — $5/yr digital record club
  // Premium — $10+ /yr (pay what you want) → 2.5×–5.0× Club Credit
  "club-level": {
    name: "Club Copy Record Club — Club",
    unitAmount: 500,
    digital: true,
    format: "membership",
    level: "club",
    subscription: { interval: "year" },
  },
  "club-premium": {
    name: "Club Copy Record Club — Premium",
    unitAmount: 1000, // minimum; checkout accepts custom amount
    digital: true,
    format: "membership",
    level: "premium",
    // Annual contribution (variable amount) — not a fixed subscription price
    flexibleAmount: true,
    minAmountCents: 1000,
  },
  // Legacy alias
  "club-join": {
    name: "Club Copy Record Club — Premium",
    unitAmount: 1000,
    digital: true,
    format: "membership",
    level: "premium",
    flexibleAmount: true,
    minAmountCents: 1000,
  },

  // Bundles — tee + release (tee $40 + digital $8 / cassette $20)
  "bn-tee-together": {
    name: "Bundle: Micro Tee + Together Digital",
    unitAmount: 4800,
    stock: 80,
    bundle: true,
    format: "bundle",
  },
  "bn-tee-inlet-cass": {
    name: "Bundle: Micro Tee + Inlet Knight Cassette",
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

/** Club / Premium digital member price (cents). Retail $8→$6, $3→$2, $1.99→$1.50. */
function memberDigitalUnitAmount(unitAmount) {
  const n = Math.floor(Number(unitAmount) || 0);
  if (n === 150 || n === 200 || n === 600) return n;
  if (n >= 800) return 600;
  if (n === 300) return 200;
  if (n === 199) return 150;
  return null;
}

function isMemberPricedDigital(product) {
  return !!(
    product &&
    product.digital &&
    product.format === "digital" &&
    memberDigitalUnitAmount(product.unitAmount) != null
  );
}

module.exports = {
  FORMAT,
  PRODUCTS,
  MERCH_PAGE_SKUS,
  SHIPPING,
  priceIdFromEnv,
  memberDigitalUnitAmount,
  isMemberPricedDigital,
  MEMBERSHIP: {
    free: {
      id: "free",
      label: "Free",
      priceLabel: "$0",
      blurb: "Get the letters — release alerts, catalog access, first listens.",
      layer: "catalog",
    },
    club: {
      id: "club",
      sku: "club-level",
      label: "Club",
      priceLabel: "$5/yr",
      blurb:
        "Digital releases at member price, early access, exclusives.",
      layer: "digital",
    },
    premium: {
      id: "premium",
      sku: "club-premium",
      label: "Premium",
      priceLabel: "From $10/yr",
      blurb:
        "Get credit for the shelf — pay what you want, spend Club Credit on cassettes you choose, plus everything in Club.",
      minAmountCents: 1000,
      creditMultMin: 2.5,
      creditMultMax: 5.0,
      layer: "physical",
    },
  },
};
