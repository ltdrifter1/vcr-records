/**
 * Club Copy — Club Credit ledger
 *
 * Source of truth (preferred): Upstash Redis / Vercel KV REST
 * Fallback: Stripe Customer metadata + balance transactions (audit trail)
 *
 * Env (optional Redis):
 *   KV_REST_API_URL / UPSTASH_REDIS_REST_URL
 *   KV_REST_API_TOKEN / UPSTASH_REDIS_REST_TOKEN
 * Env (Stripe fallback / coupons):
 *   STRIPE_SECRET_KEY
 *
 * Join grant: Premium ($10/yr) → +$25.00 CAD (2500¢)
 */

const JOIN_SKU = "club-join"; // legacy
const PREMIUM_SKU = "club-premium";
const CLUB_LEVEL_SKU = "club-level";
const MEMBERSHIP_SKUS = new Set([JOIN_SKU, PREMIUM_SKU, CLUB_LEVEL_SKU]);
const CREDIT_GRANT_SKUS = new Set([JOIN_SKU, PREMIUM_SKU]);
const JOIN_CREDIT_CENTS = 2500;
const CURRENCY = "cad";
const META_BALANCE = "club_credit_cents";

function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

function isValidEmail(email) {
  const e = normalizeEmail(email);
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254;
}

function redisConfig() {
  const url =
    process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || "";
  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    "";
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

function accountKey(email) {
  return `club:credit:account:${normalizeEmail(email)}`;
}

function idempKey(ref) {
  return `club:credit:idemp:${ref}`;
}

async function redisCommand(cfg, args) {
  const res = await fetch(`${cfg.url}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(args),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data && (data.error || data.message)) || `Redis error ${res.status}`;
    throw new Error(msg);
  }
  return data.result;
}

function emptyAccount(email) {
  const now = new Date().toISOString();
  return {
    email: normalizeEmail(email),
    balanceCents: 0,
    currency: CURRENCY,
    memberSince: null,
    updatedAt: now,
    entries: [],
  };
}

async function loadRedisAccount(email) {
  const cfg = redisConfig();
  if (!cfg) return null;
  const raw = await redisCommand(cfg, ["GET", accountKey(email)]);
  if (!raw) return emptyAccount(email);
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return emptyAccount(email);
    return {
      ...emptyAccount(email),
      ...parsed,
      email: normalizeEmail(email),
      balanceCents: Math.max(0, Number(parsed.balanceCents) || 0),
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
    };
  } catch (e) {
    return emptyAccount(email);
  }
}

async function saveRedisAccount(account) {
  const cfg = redisConfig();
  if (!cfg) return false;
  account.updatedAt = new Date().toISOString();
  // Keep last 100 entries in the hot document
  if (account.entries && account.entries.length > 100) {
    account.entries = account.entries.slice(-100);
  }
  await redisCommand(cfg, [
    "SET",
    accountKey(account.email),
    JSON.stringify(account),
  ]);
  return true;
}

async function claimIdempotency(ref) {
  if (!ref) return true;
  const cfg = redisConfig();
  if (!cfg) return null; // unknown — caller uses Stripe idempotency
  const result = await redisCommand(cfg, [
    "SET",
    idempKey(ref),
    new Date().toISOString(),
    "NX",
    "EX",
    "2592000", // 30 days
  ]);
  return result === "OK";
}

function formBody(params) {
  return Object.entries(params)
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");
}

async function stripeRequest(secret, method, path, params, idempotencyKey) {
  const headers = {
    Authorization: `Bearer ${secret}`,
  };
  let body;
  if (method === "GET") {
    const q = params ? `?${formBody(params)}` : "";
    path = `${path}${q}`;
  } else {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = formBody(params || {});
  }
  if (idempotencyKey) headers["Idempotency-Key"] = String(idempotencyKey);

  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers,
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (data.error && data.error.message) || `Stripe error ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.code = data.error && data.error.code;
    throw err;
  }
  return data;
}

async function findCustomerByEmail(secret, email) {
  const normalized = normalizeEmail(email);
  const existing = await stripeRequest(secret, "GET", "/customers", {
    email: normalized,
    limit: 1,
  });
  if (existing.data && existing.data[0]) return existing.data[0];
  return null;
}

async function findOrCreateCustomer(secret, email) {
  const found = await findCustomerByEmail(secret, email);
  if (found) return found;
  return stripeRequest(secret, "POST", "/customers", {
    email: normalizeEmail(email),
    "metadata[source]": "clubcopy",
    "metadata[club_member]": "1",
  });
}

function balanceFromCustomer(customer) {
  const fromMeta = Number(
    customer && customer.metadata && customer.metadata[META_BALANCE]
  );
  if (Number.isFinite(fromMeta) && fromMeta >= 0) return Math.floor(fromMeta);
  // Stripe customer.balance: negative means the customer has credit
  if (customer && Number.isFinite(customer.balance) && customer.balance < 0) {
    return Math.abs(Math.floor(customer.balance));
  }
  return 0;
}

async function loadStripeAccount(email, { create = false } = {}) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return emptyAccount(email);
  const customer = create
    ? await findOrCreateCustomer(secret, email)
    : await findCustomerByEmail(secret, email);
  if (!customer) {
    return { ...emptyAccount(email), storage: "stripe" };
  }
  const balanceCents = balanceFromCustomer(customer);
  let entries = [];
  try {
    const txs = await stripeRequest(
      secret,
      "GET",
      `/customers/${customer.id}/balance_transactions`,
      { limit: 40 }
    );
    entries = (txs.data || []).map((tx) => ({
      id: tx.id,
      // Stripe: negative amount = credit to customer
      type: tx.amount < 0 ? "grant" : "spend",
      amountCents: Math.abs(tx.amount),
      reason: tx.description || (tx.metadata && tx.metadata.reason) || "",
      ref: (tx.metadata && tx.metadata.ref) || null,
      createdAt: new Date((tx.created || 0) * 1000).toISOString(),
    }));
  } catch (e) {
    entries = [];
  }
  return {
    email: normalizeEmail(email),
    balanceCents,
    currency: CURRENCY,
    memberSince:
      (customer.metadata && customer.metadata.club_member_since) ||
      new Date((customer.created || 0) * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    customerId: customer.id,
    entries: entries.reverse(),
    storage: "stripe",
  };
}

/**
 * Eligible merchandise subtotal in cents (excludes membership join + shipping).
 */
function creditEligibleCents(lineItems, catalogProducts) {
  let total = 0;
  for (const raw of lineItems || []) {
    const sku = String(raw.sku || "").toLowerCase();
    if (!sku || MEMBERSHIP_SKUS.has(sku)) continue;
    const product = catalogProducts[sku];
    if (!product) continue;
    const qty = Math.min(20, Math.max(1, parseInt(raw.qty, 10) || 1));
    total += product.unitAmount * qty;
  }
  return total;
}

function maxApplicableCredit(balanceCents, eligibleCents) {
  const bal = Math.max(0, Math.floor(Number(balanceCents) || 0));
  const elig = Math.max(0, Math.floor(Number(eligibleCents) || 0));
  return Math.min(bal, elig);
}

async function getAccount(email) {
  if (!isValidEmail(email)) {
    const err = new Error("Invalid email");
    err.code = "INVALID_EMAIL";
    throw err;
  }
  const redis = await loadRedisAccount(email);
  if (redis && redisConfig()) {
    return { ...redis, storage: "redis" };
  }
  return loadStripeAccount(email);
}

async function getBalance(email) {
  const account = await getAccount(email);
  return {
    email: account.email,
    balanceCents: account.balanceCents,
    currency: account.currency,
    memberSince: account.memberSince,
    storage: account.storage,
  };
}

async function applyLedgerChange({
  email,
  amountCents,
  type,
  reason,
  ref,
}) {
  if (!isValidEmail(email)) {
    const err = new Error("Invalid email");
    err.code = "INVALID_EMAIL";
    throw err;
  }
  const delta = Math.floor(Number(amountCents) || 0);
  if (delta <= 0) {
    const err = new Error("Amount must be positive");
    err.code = "INVALID_AMOUNT";
    throw err;
  }
  if (type !== "grant" && type !== "spend" && type !== "adjust") {
    const err = new Error("Invalid ledger type");
    err.code = "INVALID_TYPE";
    throw err;
  }

  const signed = type === "spend" ? -delta : delta;
  const idempRef = ref || `${type}:${normalizeEmail(email)}:${delta}:${reason}`;

  // Redis path
  if (redisConfig()) {
    const claimed = await claimIdempotency(idempRef);
    if (claimed === false) {
      const account = await loadRedisAccount(email);
      return { ...account, storage: "redis", duplicate: true };
    }
    const account = await loadRedisAccount(email);
    const next = account.balanceCents + signed;
    if (next < 0) {
      const err = new Error("Insufficient Club Credit");
      err.code = "INSUFFICIENT_CREDIT";
      throw err;
    }
    account.balanceCents = next;
    if (type === "grant" && !account.memberSince) {
      account.memberSince = new Date().toISOString();
    }
    account.entries.push({
      id: idempRef,
      type,
      amountCents: delta,
      reason: reason || "",
      ref: ref || null,
      createdAt: new Date().toISOString(),
    });
    await saveRedisAccount(account);

    // Best-effort mirror onto Stripe customer for Dashboard visibility
    try {
      await mirrorStripeBalance(email, account.balanceCents, {
        type,
        amountCents: delta,
        reason,
        ref: idempRef,
      });
    } catch (e) {
      console.warn("stripe mirror failed", e.message);
    }

    return { ...account, storage: "redis", duplicate: false };
  }

  // Stripe-only path
  return mirrorStripeBalance(email, null, {
    type,
    amountCents: delta,
    reason,
    ref: idempRef,
    adjustAbsolute: false,
  });
}

async function mirrorStripeBalance(email, absoluteBalanceCents, change) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    const err = new Error(
      "Club Credit storage is not configured. Set Upstash/Vercel KV or STRIPE_SECRET_KEY."
    );
    err.code = "LEDGER_NOT_CONFIGURED";
    throw err;
  }

  const customer = await findOrCreateCustomer(secret, email);
  const current = balanceFromCustomer(customer);
  let next = current;

  if (change) {
    const delta = Math.floor(Number(change.amountCents) || 0);
    if (change.type === "spend") next = current - delta;
    else if (change.type === "grant" || change.type === "adjust")
      next = current + delta;
    if (next < 0) {
      const err = new Error("Insufficient Club Credit");
      err.code = "INSUFFICIENT_CREDIT";
      throw err;
    }

    // Stripe balance_transaction: negative amount credits the customer
    const stripeAmount =
      change.type === "spend" ? delta : change.type === "grant" ? -delta : -delta;

    await stripeRequest(
      secret,
      "POST",
      `/customers/${customer.id}/balance_transactions`,
      {
        amount: stripeAmount,
        currency: CURRENCY,
        description:
          change.reason ||
          (change.type === "grant" ? "Club Credit grant" : "Club Credit spend"),
        "metadata[reason]": change.reason || "",
        "metadata[ref]": change.ref || "",
        "metadata[type]": change.type,
        "metadata[source]": "clubcopy-ledger",
      },
      change.ref ? `club-ledger-${change.ref}` : undefined
    );
  } else if (absoluteBalanceCents != null) {
    next = Math.max(0, Math.floor(absoluteBalanceCents));
  }

  const meta = {
    [`metadata[${META_BALANCE}]`]: String(next),
    "metadata[club_member]": "1",
  };
  if (!(customer.metadata && customer.metadata.club_member_since)) {
    meta["metadata[club_member_since]"] = new Date().toISOString();
  }
  await stripeRequest(secret, "POST", `/customers/${customer.id}`, meta);

  const account = await loadStripeAccount(email, { create: true });
  return { ...account, duplicate: false };
}

async function grantCredit({ email, amountCents, reason, ref }) {
  return applyLedgerChange({
    email,
    amountCents,
    type: "grant",
    reason: reason || "Club Credit grant",
    ref,
  });
}

async function spendCredit({ email, amountCents, reason, ref }) {
  return applyLedgerChange({
    email,
    amountCents,
    type: "spend",
    reason: reason || "Club Credit applied at checkout",
    ref,
  });
}

/**
 * Create a one-time Stripe coupon for the credit amount to apply at Checkout.
 */
async function createCreditCoupon({ email, amountCents, sessionRef }) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    const err = new Error("STRIPE_SECRET_KEY not configured");
    err.code = "STRIPE_NOT_CONFIGURED";
    throw err;
  }
  const amount = Math.floor(Number(amountCents) || 0);
  if (amount <= 0) return null;

  const coupon = await stripeRequest(
    secret,
    "POST",
    "/coupons",
    {
      amount_off: amount,
      currency: CURRENCY,
      duration: "once",
      max_redemptions: 1,
      name: `Club Credit $${(amount / 100).toFixed(2)}`,
      "metadata[club_credit]": "1",
      "metadata[email]": normalizeEmail(email),
      "metadata[amount_cents]": String(amount),
      "metadata[ref]": sessionRef || "",
    },
    sessionRef ? `club-coupon-${sessionRef}` : undefined
  );
  return coupon;
}

module.exports = {
  JOIN_SKU,
  PREMIUM_SKU,
  CLUB_LEVEL_SKU,
  MEMBERSHIP_SKUS,
  CREDIT_GRANT_SKUS,
  JOIN_CREDIT_CENTS,
  CURRENCY,
  normalizeEmail,
  isValidEmail,
  redisConfig,
  getAccount,
  getBalance,
  grantCredit,
  spendCredit,
  creditEligibleCents,
  maxApplicableCredit,
  createCreditCoupon,
  findOrCreateCustomer,
};
