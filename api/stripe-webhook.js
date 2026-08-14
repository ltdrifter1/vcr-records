/**
 * Stripe webhook — verify signature, handle checkout.session.completed.
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 * Configure endpoint in Dashboard → Developers → Webhooks:
 *   https://www.clubcopy.ca/api/stripe-webhook
 * Events: checkout.session.completed
 *
 * Digital: log / forward for email fulfillment (download links).
 * Physical: packing notification (email inbox for now).
 * Club join: grant $25 Club Credit (idempotent).
 * Club Credit spend: debit ledger when metadata.club_credit_cents is set.
 */
const crypto = require("crypto");
const {
  JOIN_SKU,
  JOIN_CREDIT_CENTS,
  grantCredit,
  spendCredit,
  normalizeEmail,
  isValidEmail,
} = require("./lib/credit-ledger");

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Verify Stripe-Signature header (v1).
 * @see https://docs.stripe.com/webhooks#verify-events
 */
function verifyStripeSignature(payload, header, secret, toleranceSec = 300) {
  if (!header || !secret) return null;
  const parts = {};
  String(header)
    .split(",")
    .forEach((piece) => {
      const [k, v] = piece.split("=");
      if (!parts[k]) parts[k] = [];
      parts[k].push(v);
    });
  const timestamp = parts.t && parts.t[0];
  const signatures = parts.v1 || [];
  if (!timestamp || !signatures.length) return null;

  const age = Math.floor(Date.now() / 1000) - Number(timestamp);
  if (!Number.isFinite(age) || Math.abs(age) > toleranceSec) return null;

  const signed = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signed, "utf8")
    .digest("hex");

  const ok = signatures.some((sig) => timingSafeEqual(sig, expected));
  return ok ? JSON.parse(payload) : null;
}

async function readRawBody(req) {
  if (typeof req.body === "string") return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString("utf8");
  if (req.body && typeof req.body === "object") {
    // Vercel may have parsed JSON — reconstruct is unsafe for sig verify.
    // Prefer disabling body parsing via vercel.json / config when possible.
    return JSON.stringify(req.body);
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function sessionEmail(session) {
  return normalizeEmail(
    (session.customer_details && session.customer_details.email) ||
      session.customer_email ||
      (session.metadata && session.metadata.club_credit_email) ||
      ""
  );
}

async function handleClubCredit(session) {
  const email = sessionEmail(session);
  const skus = String((session.metadata && session.metadata.skus) || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const results = { grant: null, spend: null };

  if (isValidEmail(email) && skus.includes(JOIN_SKU)) {
    results.grant = await grantCredit({
      email,
      amountCents: JOIN_CREDIT_CENTS,
      reason: "Club join — $25 Club Credit",
      ref: `grant:${session.id}`,
    });
  }

  const spendCents = Math.floor(
    Number(session.metadata && session.metadata.club_credit_cents) || 0
  );
  if (isValidEmail(email) && spendCents > 0) {
    results.spend = await spendCredit({
      email,
      amountCents: spendCents,
      reason: "Applied at Club Copy checkout",
      ref: `spend:${session.id}`,
    });
  }

  return results;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method not allowed");
  }

  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whSecret) {
    res.statusCode = 503;
    res.setHeader("Content-Type", "application/json");
    return res.end(
      JSON.stringify({
        error: "STRIPE_WEBHOOK_SECRET not configured",
        code: "WEBHOOK_NOT_CONFIGURED",
      })
    );
  }

  let raw;
  try {
    raw = await readRawBody(req);
  } catch (e) {
    res.statusCode = 400;
    return res.end("Invalid body");
  }

  const event = verifyStripeSignature(
    raw,
    req.headers["stripe-signature"],
    whSecret
  );
  if (!event) {
    res.statusCode = 400;
    return res.end("Invalid signature");
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data && event.data.object;
      const skus = (session.metadata && session.metadata.skus) || "";
      const hasPhysical =
        session.metadata && session.metadata.has_physical === "1";

      let credit = null;
      try {
        credit = await handleClubCredit(session);
      } catch (creditErr) {
        console.error(
          JSON.stringify({
            type: "club_credit_error",
            sessionId: session.id,
            message: creditErr.message,
            code: creditErr.code,
          })
        );
        // Retry webhook so credit is not silently dropped
        res.statusCode = 500;
        return res.end("Club Credit ledger error");
      }

      // Fulfillment hook: replace with email provider / packing queue.
      console.log(
        JSON.stringify({
          type: "fulfillment",
          sessionId: session.id,
          email: session.customer_details && session.customer_details.email,
          skus: skus.split(",").filter(Boolean),
          hasPhysical,
          amountTotal: session.amount_total,
          currency: session.currency,
          clubCredit: credit
            ? {
                granted: credit.grant
                  ? credit.grant.balanceCents
                  : null,
                spent: credit.spend ? true : false,
                grantDuplicate: !!(credit.grant && credit.grant.duplicate),
                spendDuplicate: !!(credit.spend && credit.spend.duplicate),
              }
            : null,
        })
      );
    }
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ received: true }));
  } catch (err) {
    res.statusCode = 500;
    return res.end("Webhook handler error");
  }
};
