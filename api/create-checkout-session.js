/**
 * Vercel serverless: create a Stripe Checkout Session for the full bag.
 * Requires env STRIPE_SECRET_KEY. Optional STRIPE_CURRENCY (default cad).
 *
 * POST /api/create-checkout-session
 * Body: { items: [{ sku, name, colour?, size?, qty, image? }] }
 */
const CATALOG = {
  "sm-simple-tee": { name: "Micro Logo Tee", unitAmount: 3200 },
  "sm-globe-tee": { name: "Logo Tee", unitAmount: 3400 },
  "sm-longsleeve": { name: "Logo Long Sleeve", unitAmount: 4200 },
  "sm-hoodie": { name: "Logo Hoodie", unitAmount: 6800 },
  "sm-crewneck": { name: "Logo Crewneck", unitAmount: 5800 },
  "sm-tote": { name: "Canvas Tote", unitAmount: 2400 },
  "sm-mug": { name: "Studio Mug", unitAmount: 1800 },
  "sm-bikini": { name: "Logo Bikini", unitAmount: 4800 },
  // legacy skus kept for older bags
  tshirt: { name: "T-Shirt", unitAmount: 3000 },
  hat: { name: "Hat", unitAmount: 2500 },
  bikini: { name: "Bikini", unitAmount: 3500 },
  "sm-stickers": { name: "Logo Sticker Pack", unitAmount: 800 },
};

function formBody(params, prefix) {
  const parts = [];
  for (const [key, value] of Object.entries(params)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (value === undefined || value === null) continue;
    if (typeof value === "object" && !Array.isArray(value)) {
      parts.push(formBody(value, fullKey));
    } else {
      parts.push(
        `${encodeURIComponent(fullKey)}=${encodeURIComponent(String(value))}`
      );
    }
  }
  return parts.filter(Boolean).join("&");
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

module.exports = async function handler(req, res) {
  cors(res);
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
        error:
          "Checkout is not configured yet. Set STRIPE_SECRET_KEY in Vercel env.",
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

  const items = Array.isArray(body.items) ? body.items : [];
  if (!items.length) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "Bag is empty" }));
  }

  const currency = (process.env.STRIPE_CURRENCY || "cad").toLowerCase();
  const origin =
    body.origin ||
    (req.headers.origin
      ? req.headers.origin
      : `https://${req.headers.host || "vcrrecords.com"}`);

  const lineParams = {};
  let lineIndex = 0;
  for (const raw of items) {
    const sku = String(raw.sku || "").toLowerCase();
    const product = CATALOG[sku];
    if (!product) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: `Unknown product: ${sku}` }));
    }
    const qty = Math.min(20, Math.max(1, parseInt(raw.qty, 10) || 1));
    const bits = [];
    if (raw.colour) bits.push(String(raw.colour));
    if (raw.size) bits.push(`Size ${raw.size}`);
    const description = bits.join(" · ") || undefined;
    const name = `${product.name}${description ? ` — ${description}` : ""}`;

    lineParams[`line_items[${lineIndex}][quantity]`] = qty;
    lineParams[`line_items[${lineIndex}][price_data][currency]`] = currency;
    lineParams[`line_items[${lineIndex}][price_data][unit_amount]`] =
      product.unitAmount;
    lineParams[`line_items[${lineIndex}][price_data][product_data][name]`] =
      name;
    if (raw.image && String(raw.image).startsWith("http")) {
      lineParams[
        `line_items[${lineIndex}][price_data][product_data][images][0]`
      ] = String(raw.image);
    }
    lineParams[`line_items[${lineIndex}][price_data][product_data][metadata][sku]`] =
      sku;
    if (raw.colour) {
      lineParams[
        `line_items[${lineIndex}][price_data][product_data][metadata][colour]`
      ] = String(raw.colour);
    }
    if (raw.size) {
      lineParams[
        `line_items[${lineIndex}][price_data][product_data][metadata][size]`
      ] = String(raw.size);
    }
    lineIndex += 1;
  }

  const params = {
    mode: "payment",
    success_url: `${origin}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart.html?canceled=1`,
    shipping_address_collection: {
      allowed_countries: ["CA", "US"],
    },
    ...lineParams,
  };

  // Flatten nested shipping_address_collection for urlencoded
  const flat = {
    mode: "payment",
    success_url: params.success_url,
    cancel_url: params.cancel_url,
    "shipping_address_collection[allowed_countries][0]": "CA",
    "shipping_address_collection[allowed_countries][1]": "US",
    ...lineParams,
  };

  try {
    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: Object.entries(flat)
        .map(
          ([k, v]) =>
            `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
        )
        .join("&"),
    });
    const data = await stripeRes.json();
    if (!stripeRes.ok) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({
          error: data.error && data.error.message ? data.error.message : "Stripe error",
        })
      );
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ url: data.url, id: data.id }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ error: "Failed to create checkout session" }));
  }
};
