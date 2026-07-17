import { createCheckoutSession } from '../lib/create-checkout.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const result = await createCheckoutSession(body);
    return Response.json(result);
  } catch (err) {
    console.error(err);
    const status = err.status || 500;
    const message =
      status === 503
        ? 'Stripe is not configured'
        : status === 400
          ? err.message
          : 'Unable to create checkout session';
    return Response.json({ error: message }, { status });
  }
}
