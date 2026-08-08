/**
 * Vercel serverless: create a Stripe Checkout Session for the full bag.
 * Requires env STRIPE_SECRET_KEY (prefer a restricted key rk_…).
 * Optional STRIPE_CURRENCY (default cad).
 *
 * Physical goods and digital downloads (dg-* SKUs, fulfilled by email —
 * shipping is only collected when the bag contains a physical item).
 *
 * POST /api/create-checkout-session
 * Body: { items: [{ sku, name, colour?, size?, qty, image? }] }
 */
const { PRODUCTS, SHIPPING, priceIdFromEnv } = require("./catalog");

function formBody(params) {
  return Object.entries(params)
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");
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
      : `https://${req.headers.host || "clubcopy.ca"}`);

  const lineParams = {};
  let lineIndex = 0;
  let hasPhysical = false;
  const skusOrdered = [];

  for (const raw of items) {
    const sku = String(raw.sku || "").toLowerCase();
    const product = PRODUCTS[sku];
    if (!product) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify({ error: `Unknown product: ${sku}` }));
    }
    if (!product.digital) hasPhysical = true;
    const qty = Math.min(20, Math.max(1, parseInt(raw.qty, 10) || 1));
    if (product.stock != null && qty > product.stock) {
      res.statusCode = 409;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({
          error:
            product.stock < 1
              ? `${product.name} is sold out.`
              : `Only ${product.stock} left of ${product.name}.`,
          code: "OUT_OF_STOCK",
        })
      );
    }

    const bits = [];
    if (raw.colour) bits.push(String(raw.colour));
    if (raw.size) bits.push(`Size ${raw.size}`);
    const description = bits.join(" · ") || undefined;
    const name = `${product.name}${description ? ` — ${description}` : ""}`;
    const stripePrice = priceIdFromEnv(sku);

    lineParams[`line_items[${lineIndex}][quantity]`] = qty;

    if (stripePrice) {
      // Prefer Dashboard Price IDs once synced (scripts/sync-stripe-catalog.js)
      lineParams[`line_items[${lineIndex}][price]`] = stripePrice;
    } else {
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
      lineParams[
        `line_items[${lineIndex}][price_data][product_data][metadata][sku]`
      ] = sku;
      if (product.format) {
        lineParams[
          `line_items[${lineIndex}][price_data][product_data][metadata][format]`
        ] = product.format;
      }
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
    }

    skusOrdered.push(sku);
    lineIndex += 1;
  }

  const shippingParams = {
    "shipping_address_collection[allowed_countries][0]": "CA",
    "shipping_address_collection[allowed_countries][1]": "US",
    "shipping_options[0][shipping_rate_data][type]": "fixed_amount",
    "shipping_options[0][shipping_rate_data][fixed_amount][amount]":
      SHIPPING.ca.amount,
    "shipping_options[0][shipping_rate_data][fixed_amount][currency]": currency,
    "shipping_options[0][shipping_rate_data][display_name]": SHIPPING.ca.label,
    "shipping_options[0][shipping_rate_data][delivery_estimate][minimum][unit]":
      "business_day",
    "shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]":
      "3",
    "shipping_options[0][shipping_rate_data][delivery_estimate][maximum][unit]":
      "business_day",
    "shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]":
      "7",
    "shipping_options[1][shipping_rate_data][type]": "fixed_amount",
    "shipping_options[1][shipping_rate_data][fixed_amount][amount]":
      SHIPPING.us.amount,
    "shipping_options[1][shipping_rate_data][fixed_amount][currency]": currency,
    "shipping_options[1][shipping_rate_data][display_name]": SHIPPING.us.label,
    "shipping_options[1][shipping_rate_data][delivery_estimate][minimum][unit]":
      "business_day",
    "shipping_options[1][shipping_rate_data][delivery_estimate][minimum][value]":
      "5",
    "shipping_options[1][shipping_rate_data][delivery_estimate][maximum][unit]":
      "business_day",
    "shipping_options[1][shipping_rate_data][delivery_estimate][maximum][value]":
      "12",
  };

  const flat = {
    mode: "payment",
    success_url: `${origin}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart.html?canceled=1`,
    "metadata[skus]": skusOrdered.join(","),
    "metadata[has_physical]": hasPhysical ? "1" : "0",
    "metadata[source]": "clubcopy-cart",
    ...(hasPhysical ? shippingParams : {}),
    ...lineParams,
  };

  try {
    const stripeRes = await fetch(
      "https://api.stripe.com/v1/checkout/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formBody(flat),
      }
    );
    const data = await stripeRes.json();
    if (!stripeRes.ok) {
      res.statusCode = 502;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({
          error:
            data.error && data.error.message
              ? data.error.message
              : "Stripe error",
        })
      );
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ url: data.url, id: data.id }));
  } catch (err) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({ error: "Failed to create checkout session" })
    );
  }
};
