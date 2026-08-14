/**
 * Create a Stripe Checkout Session for Club / Premium membership.
 *
 * POST /api/create-membership-session
 * Body: {
 *   level: "club" | "premium",
 *   email: string,
 *   displayName?: string,
 *   genres?: string[],
 *   weirdness?: number (0–100),
 *   origin?: string
 * }
 */
const { PRODUCTS, MEMBERSHIP, priceIdFromEnv } = require("./catalog");
const {
  normalizeEmail,
  isValidEmail,
  findOrCreateCustomer,
} = require("./lib/credit-ledger");

function formBody(params) {
  return Object.entries(params)
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");
}

async function stripeRequest(secret, method, path, params, idempotencyKey) {
  const headers = { Authorization: `Bearer ${secret}` };
  let body;
  if (method === "GET") {
    path = params ? `${path}?${formBody(params)}` : path;
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
    const err = new Error(
      (data.error && data.error.message) || `Stripe error ${res.status}`
    );
    err.status = res.status;
    throw err;
  }
  return data;
}

async function resolveRecurringPrice(secret, sku, product, currency) {
  const expected = product.unitAmount;
  const interval = product.subscription && product.subscription.interval;
  const fromEnv = priceIdFromEnv(sku);
  if (fromEnv) {
    const price = await stripeRequest(secret, "GET", `/prices/${fromEnv}`);
    if (
      price &&
      price.active !== false &&
      price.unit_amount === expected &&
      String(price.currency).toLowerCase() === currency &&
      price.recurring &&
      price.recurring.interval === interval
    ) {
      return price.id;
    }
  }
  const list = await stripeRequest(secret, "GET", "/prices", {
    "lookup_keys[]": sku,
    active: true,
    limit: 1,
  });
  const price = list.data && list.data[0];
  if (
    price &&
    price.unit_amount === expected &&
    String(price.currency).toLowerCase() === currency &&
    price.recurring &&
    price.recurring.interval === interval
  ) {
    return price.id;
  }
  return null;
}

function clampWeirdness(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 50;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function cleanGenres(list) {
  const allowed = new Set([
    "house",
    "techno",
    "jungle",
    "ukg",
    "hip-hop",
    "ambient",
    "experimental",
    "indie",
    "soul",
  ]);
  const out = [];
  (Array.isArray(list) ? list : []).forEach((g) => {
    const key = String(g || "")
      .trim()
      .toLowerCase();
    if (allowed.has(key) && out.indexOf(key) === -1 && out.length < 3) {
      out.push(key);
    }
  });
  return out;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "Method not allowed" }));
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        error: "Checkout is not configured yet.",
        code: "STRIPE_NOT_CONFIGURED",
      })
    );
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  if (!body || typeof body !== "object") body = {};

  const level = String(body.level || "").toLowerCase();
  if (level !== "club" && level !== "premium") {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({ error: "Choose Club or Premium.", code: "INVALID_LEVEL" })
    );
  }

  const email = normalizeEmail(body.email);
  if (!isValidEmail(email)) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({ error: "Valid email required", code: "INVALID_EMAIL" })
    );
  }

  const plan = MEMBERSHIP[level];
  const sku = plan.sku;
  const product = PRODUCTS[sku];
  if (!product || !product.subscription) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "Membership product missing" }));
  }

  const currency = (process.env.STRIPE_CURRENCY || "cad").toLowerCase();
  const origin =
    body.origin ||
    (req.headers.origin
      ? req.headers.origin
      : `https://${req.headers.host || "www.clubcopy.ca"}`);

  const genres = cleanGenres(body.genres);
  const weirdness = clampWeirdness(body.weirdness);
  const displayName = String(body.displayName || "")
    .trim()
    .slice(0, 40);

  try {
    const customer = await findOrCreateCustomer(secret, email);
    const memberMeta = {
      [`metadata[club_level]`]: level,
      [`metadata[club_genres]`]: genres.join(","),
      [`metadata[club_weirdness]`]: String(weirdness),
      [`metadata[club_display_name]`]: displayName || "",
      [`metadata[club_member]`]: "1",
    };
    if (!(customer.metadata && customer.metadata.club_member_since)) {
      memberMeta["metadata[club_member_since]"] = new Date().toISOString();
    }
    await stripeRequest(secret, "POST", `/customers/${customer.id}`, memberMeta);

    const priceId = await resolveRecurringPrice(
      secret,
      sku,
      product,
      currency
    );

    const line = {};
    if (priceId) {
      line["line_items[0][price]"] = priceId;
      line["line_items[0][quantity]"] = 1;
    } else {
      line["line_items[0][quantity]"] = 1;
      line["line_items[0][price_data][currency]"] = currency;
      line["line_items[0][price_data][unit_amount]"] = product.unitAmount;
      line["line_items[0][price_data][recurring][interval]"] =
        product.subscription.interval;
      line["line_items[0][price_data][product_data][name]"] = product.name;
      line["line_items[0][price_data][product_data][metadata][sku]"] = sku;
      line["line_items[0][price_data][product_data][metadata][level]"] = level;
    }

    const session = await stripeRequest(secret, "POST", "/checkout/sessions", {
      mode: "subscription",
      customer: customer.id,
      client_reference_id: email,
      success_url: `${origin}/thank-you?session_id={CHECKOUT_SESSION_ID}&member=1&level=${level}`,
      cancel_url: `${origin}/#join`,
      "metadata[skus]": sku,
      "metadata[source]": "clubcopy-membership",
      "metadata[club_level]": level,
      "metadata[club_credit_email]": email,
      "metadata[club_genres]": genres.join(","),
      "metadata[club_weirdness]": String(weirdness),
      "metadata[club_display_name]": displayName || "",
      "subscription_data[metadata][sku]": sku,
      "subscription_data[metadata][club_level]": level,
      ...line,
    });

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ url: session.url, id: session.id }));
  } catch (err) {
    res.statusCode = 502;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        error: err.message || "Could not start membership checkout",
        code: "MEMBERSHIP_CHECKOUT_FAILED",
      })
    );
  }
};
