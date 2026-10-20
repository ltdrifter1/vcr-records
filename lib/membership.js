/**
 * Record-club level rules.
 * Browser profile writes cannot raise a paid level. Club and Premium are
 * applied only after a Checkout Session payment has settled.
 */

const LEVELS = ["free", "club", "premium"];
const RANK = { free: 0, club: 1, premium: 2 };

function normalizeLevel(level) {
  const value = String(level || "").toLowerCase();
  return LEVELS.includes(value) ? value : "free";
}

function levelRank(level) {
  return RANK[normalizeLevel(level)];
}

/** Keep the higher of two levels. A later Club payment must not erase Premium. */
function higherLevel(current, incoming) {
  const a = normalizeLevel(current);
  const b = normalizeLevel(incoming);
  return levelRank(b) > levelRank(a) ? b : a;
}

/**
 * @returns {{ ok: true, level: string } | { ok: false, code: "PAYMENT_REQUIRED", level: string }}
 */
function resolveProfileWrite(existingLevel, requestedLevel) {
  const existing = normalizeLevel(existingLevel);
  const requested = normalizeLevel(requestedLevel);
  if (levelRank(requested) > levelRank(existing)) {
    return { ok: false, code: "PAYMENT_REQUIRED", level: existing };
  }
  return { ok: true, level: existing === "free" ? requested : existing };
}

/** Fulfill when Checkout is paid. `unpaid` means an async method is still pending. */
function sessionPaymentSettled(session) {
  const status = session && session.payment_status;
  return status === "paid" || status === "no_payment_required";
}

function layerForLevel(level) {
  const value = normalizeLevel(level);
  if (value === "premium") return "DIGITAL + PHYSICAL";
  if (value === "club") return "DIGITAL";
  return "CATALOG";
}

module.exports = {
  LEVELS,
  normalizeLevel,
  levelRank,
  higherLevel,
  resolveProfileWrite,
  sessionPaymentSettled,
  layerForLevel,
};
