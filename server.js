// server.js — VCR Recordings Stripe Checkout
import express from "express";
import Stripe from "stripe";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  console.warn("STRIPE_SECRET_KEY not set — /create-checkout-session will return 503.");
}
const stripe = secret ? new Stripe(secret) : null;

const SITE_URL = process.env.SITE_URL || "https://www.vcrrecords.com";

app.post("/create-checkout-session", async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: "Stripe is not configured" });
  }
  try {
    const { items, email } = req.body;
    const line_items = (items || []).map((it) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: it.name,
          images: it.image ? [it.image] : [],
        },
        unit_amount: Math.round((it.unitAmount || 0) * 100),
      },
      quantity: it.quantity || 1,
    }));

    if (!line_items.length) {
      return res.status(400).json({ error: "No items" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items,
      customer_email: email || undefined,
      success_url: `${SITE_URL}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/cart.html`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to create checkout session" });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`VCR server on http://localhost:${port}`));
