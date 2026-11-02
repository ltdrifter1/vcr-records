/**
 * POST /api/restock-notify
 * Body: { email, sku, size?, colour? }
 *
 * Saves a sold-out shop signup. See lib/restock.js for where it lands.
 */
const { validateRestock, captureRestock } = require("../lib/restock");

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return res.end(JSON.stringify(body));
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.end();
  }
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
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

  const check = validateRestock(body);
  if (!check.ok) {
    return json(res, check.status || 400, { error: check.error || "Could not save that." });
  }
  if (check.spam) return json(res, 200, { ok: true });

  const result = await captureRestock(check.entry);
  if (!result.captured) {
    return json(res, 503, {
      error: "We couldn't save that. Email charlie@clubcopy.ca and we'll add you.",
      code: "RESTOCK_NOT_CAPTURED",
    });
  }
  return json(res, 200, { ok: true, already: !!result.already });
};
