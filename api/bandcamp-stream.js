/**
 * Resolve a Club Copy catalog cue to a Bandcamp mp3-128 stream and 302 there.
 * The site player uses this as audio.src so playback stays on-site.
 *
 * GET /api/bandcamp-stream?r=RELEASE_ID&t=TRACK_ID
 */
const fs = require("fs");
const path = require("path");
const { Readable } = require("stream");
const bc = require("../lib/bandcamp");

const PIPE_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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

/** Browser-facing download links should land on the release, not a JSON error. */
function redirectToPublicPage(res, release) {
  const page = bc.publicPage(release);
  if (!page) return false;
  res.statusCode = 302;
  res.setHeader("Location", page);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.end();
  return true;
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

function isFreeRelease(release) {
  const digital = release && release.formats && release.formats.digital;
  return !!(digital && (digital.free || Number(digital.price) === 0));
}

function downloadFilename(title) {
  const base = String(title || "club-copy")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s.'()-]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "club-copy";
  return base + ".mp3";
}

async function pipeStream(req, res, streamUrl, opts) {
  opts = opts || {};
  if (!bc.streamAllowed(streamUrl)) {
    return json(res, 502, { error: "Stream host not allowed." });
  }
  /* Pass the client's Range through. Capping an open Range: bytes=0-
     at 256KB made WebKit treat a full track as a 16s file and end it.
     A free-download attachment asks for the whole file. */
  const headers = {
    "User-Agent": PIPE_UA,
    Accept: "*/*",
  };
  if (!opts.downloadName && req.headers.range) headers.Range = req.headers.range;
  const upstream = await fetch(streamUrl, {
    method: "GET",
    redirect: "follow",
    headers: headers,
  });
  let finalUrl = streamUrl;
  try {
    finalUrl = upstream.url || streamUrl;
  } catch (err) {}
  if (!bc.streamAllowed(finalUrl)) {
    return json(res, 502, { error: "Unexpected stream host." });
  }
  if (upstream.status >= 400) {
    return json(res, 502, { error: "Upstream stream " + upstream.status });
  }
  res.statusCode = upstream.status === 200 ? 200 : 206;
  const pass = ["content-type", "content-length", "content-range", "accept-ranges"];
  pass.forEach(function (name) {
    const value = upstream.headers.get(name);
    if (value) res.setHeader(name, value);
  });
  if (!res.getHeader("Accept-Ranges")) res.setHeader("Accept-Ranges", "bytes");
  if (opts.downloadName) {
    const name = String(opts.downloadName).replace(/"/g, "");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="' + name + "\"; filename*=UTF-8''" + encodeURIComponent(name)
    );
    res.setHeader("Cache-Control", "private, no-store");
  } else {
    res.setHeader("Cache-Control", "private, max-age=60");
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Referrer-Policy", "no-referrer");
  if (req.method === "HEAD" || !upstream.body) return res.end();
  await new Promise(function (resolve, reject) {
    const body = Readable.fromWeb(upstream.body);
    body.on("error", reject);
    res.on("error", reject);
    res.on("finish", resolve);
    body.pipe(res);
  });
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
  const pipe = url.searchParams.get("pipe") === "1";
  const download = url.searchParams.get("download") === "1";

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
    if (download) {
      if (!isFreeRelease(cue.release)) {
        return json(res, 403, { error: "This release is not a free download." });
      }
      const fetched = await bc.fetchHtml(pageUrl);
      if (fetched.status >= 400) {
        return json(res, 502, { error: "Bandcamp page " + fetched.status });
      }
      const tralbum = bc.parseTralbum(fetched.body);
      if (!tralbum) {
        if (redirectToPublicPage(res, cue.release)) return;
        return json(res, 502, { error: "No Bandcamp stream metadata" });
      }
      const freePage = bc.freeDownloadUrl(tralbum);
      if (freePage) {
        res.statusCode = 302;
        res.setHeader("Location", freePage);
        res.setHeader("Cache-Control", "private, no-store");
        res.setHeader("Referrer-Policy", "no-referrer");
        return res.end();
      }
      const stream = bc.pickStream(tralbum, cue.track);
      if (!stream) return json(res, 502, { error: "No audio on this Bandcamp cue" });
      return await pipeStream(req, res, stream.src, {
        downloadName: downloadFilename(cue.track.title || cue.release.title),
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
    if (pipe) {
      return await pipeStream(req, res, stream.src);
    }
    res.statusCode = 302;
    res.setHeader("Location", stream.src);
    res.setHeader("Cache-Control", "private, max-age=60");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Referrer-Policy", "no-referrer");
    return res.end();
  } catch (err) {
    if (download && redirectToPublicPage(res, cue && cue.release)) return;
    return json(res, 502, {
      error: "Could not play this preview.",
      detail: err && err.message ? err.message : "stream",
    });
  }
};

module.exports._test = { findCue };
