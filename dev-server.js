// Local Express server (npm run dev). On Vercel, use /api/* serverless functions instead.
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCheckoutSession, getStripe } from './lib/create-checkout.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(__dirname));

if (!getStripe()) {
  console.warn('STRIPE_SECRET_KEY not set — /api/create-checkout-session will return 503.');
}

async function checkoutHandler(req, res) {
  try {
    const result = await createCheckoutSession(req.body || {});
    res.json(result);
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    const message =
      status === 503
        ? 'Stripe is not configured'
        : status === 400
          ? err.message
          : 'Unable to create checkout session';
    res.status(status).json({ error: message });
  }
}

app.post('/api/create-checkout-session', checkoutHandler);
app.post('/create-checkout-session', checkoutHandler); // legacy local path

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`VCR server on http://localhost:${port}`));
