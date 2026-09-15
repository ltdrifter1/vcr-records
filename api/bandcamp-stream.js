/**
 * Resolve a Club Copy catalog cue to a Bandcamp mp3-128 stream and 302 there.
 * The site player uses this as audio.src so playback stays on-site.
 *
 * GET /api/bandcamp-stream?r=RELEASE_ID&t=TRACK_ID
 */
const fs = require("fs");
const path = require("path");

const CACHE_MS = 4 * 60 * 1000;
const cache = new Map();
let catalogCache = null;
let catalogAt = 0;

const HOST_OK = /(^|\.)bandcamp\.com$/i;

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
  if (!release) return { error: "Unknown release.", status: 404 };
  const tracks = release.tracks || [];
  let track = null;
  if (trackId) {
    track = tracks.find((t) => t.id === trackId) || null;
    if (!track) return { error: "Unknown track.", status: 404 };
  } else {
    track = tracks.find((t) => t.bandcampTrackId || t.preview) || tracks[0] || null;
  }
  if (!track) return { error: "No tracks on this release.", status: 404 };
  if (!track.bandcampTrackId || !release.bandcampUrl) {
    return {
      error: "Preview unavailable — this title is not streaming from Bandcamp.",
      status: 404,
      release,
      track,
    };
  }
  return { release, track };
}

async function getHttps(url) {
  const pageUrl = new URL(url);
  if (pageUrl.protocol !== "https:" || !HOST_OK.test(pageUrl.hostname)) {
    throw new Error("Bandcamp host not allowed");
  }
  const ctrl = new AbortController();
  const timer = setTimeout(function () {
    ctrl.abort();
  }, 8000);
  try {
    const resp = await fetch(pageUrl.toString(), {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const finalHost = new URL(resp.url).hostname;
    if (!HOST_OK.test(finalHost)) throw new Error("Unexpected redirect host");
    const body = await resp.text();
    return { status: resp.status, body };
  } finally {
    clearTimeout(timer);
  }
}

function unescapeHtml(s) {
  return String(s || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function parseTralbum(html) {
  const m = html.match(/data-tralbum="([^"]+)"/);
  if (!m) return null;
  try {
    return JSON.parse(unescapeHtml(m[1]));
  } catch (err) {
    return null;
  }
}

function mp3FromTralbum(tralbum, bandcampTrackId) {
  const want = String(bandcampTrackId);
  const tracks = (tralbum && tralbum.trackinfo) || [];
  for (let i = 0; i < tracks.length; i++) {
    const t = tracks[i];
    const id = String(t.track_id || t.id || "");
    if (id !== want) continue;
    const file = t.file || {};
    return file["mp3-128"] || file["mp3-v0"] || null;
  }
  if (tracks.length === 1) {
    const file = tracks[0].file || {};
    return file["mp3-128"] || file["mp3-v0"] || null;
  }
  return null;
}

function streamAllowed(src) {
  try {
    const u = new URL(src);
    if (u.protocol !== "https:") return false;
    return HOST_OK.test(u.hostname) || /\.bcbits\.com$/i.test(u.hostname);
  } catch (err) {
    return false;
  }
}

async function resolveStream(bandcampUrl, bandcampTrackId) {
  const key = String(bandcampTrackId);
  const hit = cache.get(key);
  if (hit && hit.exp > Date.now() && streamAllowed(hit.src)) return hit.src;

  let pageUrl;
  try {
    pageUrl = new URL(bandcampUrl);
  } catch (err) {
    throw new Error("Invalid Bandcamp URL");
  }
  if (pageUrl.protocol !== "https:" || !HOST_OK.test(pageUrl.hostname)) {
    throw new Error("Bandcamp host not allowed");
  }

  const fetched = await getHttps(pageUrl.toString());
  if (fetched.status >= 400) {
    throw new Error("Bandcamp page " + fetched.status);
  }
  const tralbum = parseTralbum(fetched.body);
  if (!tralbum) throw new Error("No Bandcamp stream metadata");
  const tracks = (tralbum.trackinfo || []);
  tracks.forEach(function (t) {
    const id = t.track_id || t.id;
    const file = t.file || {};
    const mp3 = file["mp3-128"] || file["mp3-v0"] || null;
    if (id && mp3 && streamAllowed(mp3)) {
      cache.set(String(id), { src: mp3, exp: Date.now() + CACHE_MS });
    }
  });
  const src = mp3FromTralbum(tralbum, bandcampTrackId);
  if (!src || !streamAllowed(src)) throw new Error("No audio on this Bandcamp cue");
  cache.set(key, { src, exp: Date.now() + CACHE_MS });
  return src;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
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
    const src = await resolveStream(cue.release.bandcampUrl, cue.track.bandcampTrackId);
    if (asJson) {
      res.setHeader("Cache-Control", "private, max-age=60");
      return json(res, 200, {
        src,
        releaseId: cue.release.id,
        trackId: cue.track.id,
        title: cue.track.title,
      });
    }
    res.statusCode = 302;
    res.setHeader("Location", src);
    res.setHeader("Cache-Control", "private, max-age=60");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.end();
  } catch (err) {
    return json(res, 502, {
      error: "Could not play this preview.",
      detail: err && err.message ? err.message : "stream",
    });
  }
};

module.exports._test = { findCue, parseTralbum, mp3FromTralbum, streamAllowed, resolveStream };
