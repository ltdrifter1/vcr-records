import Stripe from 'stripe';

export function getStripe() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return null;
  try {
    return new Stripe(secret, {
      apiVersion: '2024-06-20',
    });
  } catch (err) {
    console.error('Stripe init failed', err);
    return null;
  }
}

export function resolveSiteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const host = req?.headers?.host;
  if (host) {
    const proto = req.headers['x-forwarded-proto'] || 'https';
    return `${proto}://${host}`;
  }
  return 'https://www.vcrrecords.com';
}

export async function createCheckoutSession({ items, email }, req) {
  const stripe = getStripe();
  if (!stripe) {
    const err = new Error('Stripe is not configured');
    err.status = 503;
    throw err;
  }

  const line_items = (items || []).map((it) => {
    const images = [];
    if (it.image && /^https?:\/\//i.test(it.image)) {
      images.push(it.image);
    }
    return {
      price_data: {
        currency: 'usd',
        product_data: {
          name: String(it.name || 'Item').slice(0, 200),
          ...(images.length ? { images } : {}),
        },
        unit_amount: Math.max(0, Math.round(Number(it.unitAmount || 0) * 100)),
      },
      quantity: Math.max(1, parseInt(it.quantity, 10) || 1),
    };
  });

  if (!line_items.length) {
    const err = new Error('No items');
    err.status = 400;
    throw err;
  }

  const site = resolveSiteUrl(req);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    customer_email: email || undefined,
    success_url: `${site}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/cart.html`,
  });

  return { url: session.url };
}
