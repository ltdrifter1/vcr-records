/**
 * Club member profile (taste + card).
 *
 * GET  /api/club-member?email=
 * POST /api/club-member  { email, displayName?, genres?, weirdness?, level? }
 *
 * Stored on Stripe Customer metadata; mirrored to Redis when available.
 */
const {
  normalizeEmail,
  isValidEmail,
  findOrCreateCustomer,
  redisConfig,
} = require("./lib/credit-ledger");

const GENRES = [
  "house",
  "techno",
  "jungle",
  "ukg",
  "hip-hop",
  "ambient",
  "experimental",
  "indie",
  "soul",
];

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return res.end(JSON.stringify(body));
}

function formBody(params) {
  return Object.entries(params)
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    )
    .join("&");
}

async function stripeRequest(secret, method, path, params) {
  const headers = { Authorization: `Bearer ${secret}` };
  let body;
  if (method === "GET") {
    path = params ? `${path}?${formBody(params)}` : path;
  } else {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = formBody(params || {});
  }
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers,
    body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      (data.error && data.error.message) || `Stripe error ${res.status}`
    );
    err.status = res.status;
    throw err;
  }
  return data;
}

function cleanGenres(list) {
  const allowed = new Set(GENRES);
  const out = [];
  (Array.isArray(list) ? list : String(list || "").split(",")).forEach((g) => {
    const key = String(g || "")
      .trim()
      .toLowerCase();
    if (allowed.has(key) && out.indexOf(key) === -1 && out.length < 3) {
      out.push(key);
    }
  });
  return out;
}

function clampWeirdness(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 50;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function memberNumberFromEmail(email) {
  let hash = 0;
  const s = normalizeEmail(email);
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  const n = (hash % 9000) + 1000;
  return String(n).padStart(4, "0");
}

function profileFromCustomer(customer, email) {
  const meta = (customer && customer.metadata) || {};
  const genres = cleanGenres(meta.club_genres);
  const weirdness = clampWeirdness(
    meta.club_weirdness != null ? meta.club_weirdness : 50
  );
  const level = ["free", "club", "premium"].includes(meta.club_level)
    ? meta.club_level
    : "free";
  return {
    email: normalizeEmail(email),
    displayName: meta.club_display_name || "",
    level,
    genres,
    weirdness,
    memberNumber: meta.club_member_number || memberNumberFromEmail(email),
    memberSince: meta.club_member_since || null,
    card: {
      title: "CLUB COPY",
      levelLabel:
        level === "premium" ? "PREMIUM" : level === "club" ? "CLUB" : "FREE",
      memberNumber:
        meta.club_member_number || memberNumberFromEmail(email),
      signal: genres.length
        ? genres.map((g) => g.toUpperCase()).join(" · ")
        : "UNSET",
      weirdLabel:
        weirdness < 34 ? "SAFE" : weirdness > 66 ? "WEIRD" : "IN BETWEEN",
      weirdness,
    },
  };
}

async function redisGetSet(email, profile) {
  const cfg = redisConfig();
  if (!cfg) return;
  const key = `club:member:${normalizeEmail(email)}`;
  await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["SET", key, JSON.stringify(profile)]),
  });
}

async function redisGet(email) {
  const cfg = redisConfig();
  if (!cfg) return null;
  const key = `club:member:${normalizeEmail(email)}`;
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(["GET", key]),
  });
  const data = await res.json().catch(() => ({}));
  if (!data.result) return null;
  try {
    return typeof data.result === "string"
      ? JSON.parse(data.result)
      : data.result;
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.end();
  }

  const secret = process.env.STRIPE_SECRET_KEY;

  try {
    if (req.method === "GET") {
      const email = normalizeEmail(
        (req.query && req.query.email) ||
          (req.url &&
            new URL(req.url, "http://localhost").searchParams.get("email"))
      );
      if (!isValidEmail(email)) {
        return json(res, 400, {
          error: "Valid email required",
          code: "INVALID_EMAIL",
        });
      }

      const cached = await redisGet(email);
      if (cached) return json(res, 200, cached);

      if (!secret) {
        return json(res, 200, profileFromCustomer(null, email));
      }
      const list = await stripeRequest(secret, "GET", "/customers", {
        email,
        limit: 1,
      });
      const customer = list.data && list.data[0];
      const profile = profileFromCustomer(customer, email);
      return json(res, 200, profile);
    }

    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") {
        try {
          body = JSON.parse(body);
        } catch (e) {
          body = {};
        }
      }
      if (!body || typeof body !== "object") body = {};

      const email = normalizeEmail(body.email);
      if (!isValidEmail(email)) {
        return json(res, 400, {
          error: "Valid email required",
          code: "INVALID_EMAIL",
        });
      }

      const genres = cleanGenres(body.genres);
      const weirdness = clampWeirdness(body.weirdness);
      const displayName = String(body.displayName || "")
        .trim()
        .slice(0, 40);
      const level = ["free", "club", "premium"].includes(body.level)
        ? body.level
        : "free";
      const memberNumber = memberNumberFromEmail(email);

      let customer = null;
      if (secret) {
        customer = await findOrCreateCustomer(secret, email);
        const meta = {
          "metadata[club_level]": level,
          "metadata[club_genres]": genres.join(","),
          "metadata[club_weirdness]": String(weirdness),
          "metadata[club_display_name]": displayName,
          "metadata[club_member_number]": memberNumber,
          "metadata[club_member]": "1",
        };
        if (!(customer.metadata && customer.metadata.club_member_since)) {
          meta["metadata[club_member_since]"] = new Date().toISOString();
        }
        customer = await stripeRequest(
          secret,
          "POST",
          `/customers/${customer.id}`,
          meta
        );
      }

      const profile = profileFromCustomer(
        customer || {
          metadata: {
            club_level: level,
            club_genres: genres.join(","),
            club_weirdness: String(weirdness),
            club_display_name: displayName,
            club_member_number: memberNumber,
            club_member_since: new Date().toISOString(),
          },
        },
        email
      );
      await redisGetSet(email, profile);
      return json(res, 200, profile);
    }

    return json(res, 405, { error: "Method not allowed" });
  } catch (err) {
    return json(res, 500, {
      error: err.message || "Member profile error",
      code: "MEMBER_ERROR",
    });
  }
};

module.exports.GENRES = GENRES;
module.exports.memberNumberFromEmail = memberNumberFromEmail;
