/**
 * Live SoundCloud mixer for GET /api/soundcloud-feed.
 * RSS for @ltdrifta. Snapshot fallback: data/mixtapes.json
 * Refresh stills with: node scripts/sync-soundcloud-feed.js
 */
const fs = require("fs");
const path = require("path");
const sc = require("../lib/soundcloud");

const CACHE_MS = 5 * 60 * 1000;
const FALLBACK_PATH = path.join(process.cwd(), "data", "mixtapes.json");

let cache = { at: 0, body: null };

function json(res, status, body, cacheControl) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Cache-Control",
    cacheControl || "public, s-maxage=300, stale-while-revalidate=3600"
  );
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  return res.end(JSON.stringify(body));
}

function readFallback() {
  try {
    return JSON.parse(fs.readFileSync(FALLBACK_PATH, "utf8"));
  } catch (e) {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "GET") return json(res, 405, { ok: false, error: "Method not allowed" });

  const now = Date.now();
  if (cache.body && now - cache.at < CACHE_MS) {
    return json(res, 200, cache.body);
  }

  try {
    const body = await sc.fetchFeed();
    if (!body.tapes || !body.tapes.length) throw new Error("Empty SoundCloud feed");
    cache = { at: now, body: body };
    return json(res, 200, body);
  } catch (err) {
    const fallback = readFallback();
    if (fallback && Array.isArray(fallback.tapes) && fallback.tapes.length) {
      fallback.ok = true;
      fallback.source = fallback.source || "snapshot";
      fallback.stale = true;
      fallback.profile = fallback.profile || sc.PROFILE_URL;
      fallback.handle = fallback.handle || sc.HANDLE;
      fallback.error = String((err && err.message) || "live feed unavailable");
      cache = { at: now, body: fallback };
      return json(res, 200, fallback, "public, s-maxage=60, stale-while-revalidate=600");
    }
    return json(
      res,
      502,
      {
        ok: false,
        error: "SoundCloud feed unavailable",
        handle: sc.HANDLE,
        profile: sc.PROFILE_URL,
        tapes: [],
      },
      "public, max-age=30"
    );
  }
};
