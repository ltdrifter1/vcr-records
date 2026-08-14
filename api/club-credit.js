/**
 * Club Credit API
 *
 * GET  /api/club-credit?email=…          → balance + recent entries
 * POST /api/club-credit                  → { email } balance lookup (same as GET)
 * POST /api/club-credit  admin grant     → { email, action:"grant", amountCents?, secret }
 *
 * Admin: set CLUB_CREDIT_ADMIN_SECRET (or reuse a restricted ops secret).
 */
const {
  getAccount,
  grantCredit,
  isValidEmail,
  normalizeEmail,
  JOIN_CREDIT_CENTS,
} = require("./lib/credit-ledger");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.end(JSON.stringify(body));
}

function parseBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  if (!body || typeof body !== "object") body = {};
  return body;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.end();
  }

  try {
    if (req.method === "GET") {
      const email = normalizeEmail(
        (req.query && req.query.email) ||
          (req.url && new URL(req.url, "http://localhost").searchParams.get("email"))
      );
      if (!isValidEmail(email)) {
        return json(res, 400, { error: "Valid email required", code: "INVALID_EMAIL" });
      }
      const account = await getAccount(email);
      return json(res, 200, {
        email: account.email,
        balanceCents: account.balanceCents,
        balance: (account.balanceCents / 100).toFixed(2),
        currency: account.currency,
        memberSince: account.memberSince,
        entries: (account.entries || []).slice(-12).reverse(),
      });
    }

    if (req.method === "POST") {
      const body = parseBody(req);
      const email = normalizeEmail(body.email);
      if (!isValidEmail(email)) {
        return json(res, 400, { error: "Valid email required", code: "INVALID_EMAIL" });
      }

      if (body.action === "grant") {
        const admin = process.env.CLUB_CREDIT_ADMIN_SECRET;
        if (!admin || body.secret !== admin) {
          return json(res, 401, { error: "Unauthorized", code: "UNAUTHORIZED" });
        }
        const amount =
          body.amountCents != null
            ? Math.floor(Number(body.amountCents))
            : JOIN_CREDIT_CENTS;
        const account = await grantCredit({
          email,
          amountCents: amount,
          reason: body.reason || "Admin Club Credit grant",
          ref: body.ref || `admin:${email}:${Date.now()}`,
        });
        return json(res, 200, {
          email: account.email,
          balanceCents: account.balanceCents,
          balance: (account.balanceCents / 100).toFixed(2),
          currency: account.currency,
          duplicate: !!account.duplicate,
        });
      }

      // Default POST = balance lookup (same as GET; handy for forms)
      const account = await getAccount(email);
      return json(res, 200, {
        email: account.email,
        balanceCents: account.balanceCents,
        balance: (account.balanceCents / 100).toFixed(2),
        currency: account.currency,
        memberSince: account.memberSince,
        entries: (account.entries || []).slice(-12).reverse(),
      });
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (err) {
    const code = err.code || "LEDGER_ERROR";
    const status =
      code === "INVALID_EMAIL" || code === "INVALID_AMOUNT"
        ? 400
        : code === "LEDGER_NOT_CONFIGURED"
          ? 503
          : 500;
    return json(res, status, {
      error: err.message || "Club Credit error",
      code,
    });
  }
};
