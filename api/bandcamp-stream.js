/**
 * Resolve a Club Copy catalog cue to a Bandcamp mp3-128 stream and 302 there.
 * The site player uses this as audio.src so playback stays on-site.
 *
 * GET /api/bandcamp-stream?r=RELEASE_ID&t=TRACK_ID
 */
const fs = require("fs");
const path = require("path");
const bc = require("./lib/bandcamp");

const CACHE_MS = 4 * 60 * 1000;
const cache = new Map();
let catalogCache = null;
let catalogAt = 0;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.end(JSON.stringify(body));
}

function loadCatalog() {
  const now = Date.now();
  if (catalogCache && now - catalogAt < 60 * 1000) return catalogCache;
  const file = path.join(process.cwd(), "data", "catalog.json");
  catalogCache = JSON.parse(fs.readFileSync(file, "utf8"));
  catalogAt = now;
  return catalogCache;
}

function findCue(releaseId, trackId) {
  const catalog = loadCatalog();
  const release = (catalog.releases || []).find((r) => r.id === releaseId);
  if (!release) return { error: "Unknown release.", status: 404, catalog };
  const track = bc.pickCueTrack(release, trackId);
  if (trackId && !track) return { error: "Unknown track.", status: 404, catalog };
  if (!track) return { error: "No tracks on this release.", status: 404, catalog };
  return { release, track, catalog };
}

function cacheKey(pageUrl, track) {
  return [pageUrl, track && (track.bandcampTrackId || track.id || track.title)].join("::");
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    return res.end();
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const url = new URL(req.url, "http://localhost");
  const releaseId = url.searchParams.get("r") || url.searchParams.get("release") || "";
  const trackId = url.searchParams.get("t") || url.searchParams.get("track") || "";
  const asJson = url.searchParams.get("format") === "json";

  if (!releaseId) {
    return json(res, 400, { error: "Missing release." });
  }

  let cue;
  try {
    cue = findCue(releaseId, trackId || null);
  } catch (err) {
    return json(res, 500, { error: "Catalog unavailable." });
  }
  if (cue.error) {
    return json(res, cue.status || 404, { error: cue.error });
  }

  try {
    const pageUrl = await bc.resolvePageUrl(cue.release, cue.catalog);
    if (!pageUrl) {
      return json(res, 404, {
        error: "Preview unavailable — this title is not streaming from Bandcamp.",
      });
    }
    const key = cacheKey(pageUrl, cue.track);
    const hit = cache.get(key);
    let stream;
    if (hit && hit.exp > Date.now() && bc.streamAllowed(hit.src)) {
      stream = hit;
    } else {
      stream = await bc.resolveStream(pageUrl, cue.track);
      cache.set(key, { src: stream.src, exp: Date.now() + CACHE_MS, duration: stream.duration, title: stream.title });
    }
    if (asJson) {
      res.setHeader("Cache-Control", "private, max-age=60");
      return json(res, 200, {
        src: stream.src,
        releaseId: cue.release.id,
        trackId: cue.track.id,
        title: stream.title || cue.track.title,
      });
    }
    res.statusCode = 302;
    res.setHeader("Location", stream.src);
    res.setHeader("Cache-Control", "private, max-age=60");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Referrer-Policy", "no-referrer");
    return res.end();
  } catch (err) {
    return json(res, 502, {
      error: "Could not play this preview.",
      detail: err && err.message ? err.message : "stream",
    });
  }
};

module.exports._test = { findCue };
