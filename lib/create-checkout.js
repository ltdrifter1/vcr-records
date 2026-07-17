import Stripe from 'stripe';

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  return secret ? new Stripe(secret) : null;
}

export function resolveSiteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://www.vcrrecords.com';
}

export async function createCheckoutSession({ items, email }) {
  const stripe = getStripe();
  if (!stripe) {
    const err = new Error('Stripe is not configured');
    err.status = 503;
    throw err;
  }

  const line_items = (items || []).map((it) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: it.name,
        images: it.image ? [it.image] : [],
      },
      unit_amount: Math.round((it.unitAmount || 0) * 100),
    },
    quantity: it.quantity || 1,
  }));

  if (!line_items.length) {
    const err = new Error('No items');
    err.status = 400;
    throw err;
  }

  const site = resolveSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    customer_email: email || undefined,
    success_url: `${site}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/cart.html`,
  });

  return { url: session.url };
}
