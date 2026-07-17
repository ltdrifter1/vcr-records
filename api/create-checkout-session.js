import { createCheckoutSession } from './_lib/create-checkout.js';

/**
 * Classic Vercel Node.js serverless handler.
 * GET returns a health JSON so opening the URL in a browser does not crash.
 */
export default async function handler(req, res) {
  try {
    if (req.method === 'GET' || req.method === 'HEAD') {
      return res.status(200).json({
        ok: true,
        endpoint: '/api/create-checkout-session',
        method: 'POST',
        stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, GET');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body || '{}');
      } catch {
        return res.status(400).json({ error: 'Invalid JSON body' });
      }
    }
    if (!body || typeof body !== 'object') body = {};

    const result = await createCheckoutSession(body, req);
    return res.status(200).json(result);
  } catch (err) {
    console.error('checkout error', err);
    const status = Number(err.status) || 500;
    const message =
      status === 503
        ? 'Stripe is not configured'
        : status === 400
          ? err.message || 'Bad request'
          : 'Unable to create checkout session';
    return res.status(status).json({ error: message });
  }
}
