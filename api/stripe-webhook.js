/**
 * Stripe webhook — verify signature, then fulfill settled Checkout Sessions.
 *
 * Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 * Endpoint: https://www.clubcopy.ca/api/stripe-webhook
 * Events:
 *   checkout.session.completed
 *   checkout.session.async_payment_succeeded
 *   checkout.session.async_payment_failed
 *   customer.subscription.deleted
 *   customer.subscription.updated
 *
 * Club / Premium member rates are written here, after payment_status is paid.
 * Digital: log / forward for email fulfillment (download links).
 * Physical: packing notification (email inbox for now).
 * Premium: grant Club Credit (idempotent).
 * Club Credit spend: debit ledger when metadata.club_credit_cents is set.
 */
const { sessionPaymentSettled } = require("../lib/membership");
const {
  activatePaidMembership,
  revokeClubSubscription,
  memberNumberFromEmail,
} = require("./club-member");
const crypto = require("crypto");
const {
  CREDIT_GRANT_SKUS,
  JOIN_CREDIT_CENTS,
  grantCredit,
  spendCredit,
  normalizeEmail,
  isValidEmail,
  premiumCreditCents,
  PREMIUM_MIN_CENTS,
} = require("../lib/credit-ledger");
const { sendMail, welcomeEmail } = require("../lib/mailer");

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

  if (
    isValidEmail(email) &&
    skus.some((s) => CREDIT_GRANT_SKUS.has(s))
  ) {
    const fromMeta = Math.floor(
      Number(session.metadata && session.metadata.premium_credit_grant_cents) ||
        0
    );
    const fromAmount = Math.floor(
      Number(session.metadata && session.metadata.premium_amount_cents) ||
        session.amount_total ||
        0
    );
    const grantCents =
      fromMeta > 0
        ? fromMeta
        : fromAmount >= PREMIUM_MIN_CENTS
          ? premiumCreditCents(fromAmount)
          : JOIN_CREDIT_CENTS;
    results.grant = await grantCredit({
      email,
      amountCents: grantCents,
      reason: `Premium record club — $${(grantCents / 100).toFixed(2)} Club Credit`,
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
    const secret = process.env.STRIPE_SECRET_KEY;
    const sessionEvents = new Set([
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
    ]);

    if (sessionEvents.has(event.type)) {
      const session = event.data && event.data.object;
      if (!sessionPaymentSettled(session)) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end(JSON.stringify({ received: true, fulfilled: false }));
      }

      const skus = (session.metadata && session.metadata.skus) || "";
      const hasPhysical =
        session.metadata && session.metadata.has_physical === "1";
      const clubLevel = session.metadata && session.metadata.club_level;
      const email = sessionEmail(session);
      let activated = null;

      if (
        secret &&
        (clubLevel === "club" || clubLevel === "premium") &&
        isValidEmail(email)
      ) {
        const customerId =
          typeof session.customer === "string" ? session.customer : "";
        activated = await activatePaidMembership(secret, {
          email,
          customerId,
          level: clubLevel,
          displayName:
            (session.metadata && session.metadata.club_display_name) || "",
        });
      }

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

      if (activated && activated.changed && isValidEmail(email)) {
        const mail = welcomeEmail({
          email,
          displayName: (session.metadata && session.metadata.club_display_name) || "",
          level: activated.level,
          memberNumber: memberNumberFromEmail(email),
          creditCents: credit && credit.grant ? credit.grant.balanceCents : 0,
        });
        sendMail({ to: email, ...mail }).catch((e) => {
          console.warn("welcome email failed", e && e.message);
        });
      }

      console.log(
        JSON.stringify({
          type: "fulfillment",
          sessionId: session.id,
          email: session.customer_details && session.customer_details.email,
          skus: skus.split(",").filter(Boolean),
          hasPhysical,
          amountTotal: session.amount_total,
          currency: session.currency,
          memberLevel: activated ? activated.level : null,
          memberGranted: !!(activated && activated.changed),
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

    if (
      secret &&
      (event.type === "customer.subscription.deleted" ||
        event.type === "customer.subscription.updated")
    ) {
      const subscription = event.data && event.data.object;
      const status = subscription && subscription.status;
      const ended =
        event.type === "customer.subscription.deleted" ||
        status === "canceled" ||
        status === "unpaid" ||
        status === "incomplete_expired";
      if (ended) await revokeClubSubscription(secret, subscription);
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ received: true }));
  } catch (err) {
    res.statusCode = 500;
    return res.end("Webhook handler error");
  }
};

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
