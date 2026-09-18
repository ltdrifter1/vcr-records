/**
 * Resolve a live preview URL for the on-site player.
 * Prefers the Bandcamp mp3-128 stream for the wired cue; falls back to a
 * local /previews file when that file is actually on disk.
 *
 * GET /api/preview?release=&track=
 */
const fs = require("fs");
const path = require("path");
const bc = require("../lib/bandcamp");

const CATALOG_PATH = path.join(process.cwd(), "data", "catalog.json");
const CACHE_MS = 4 * 60 * 1000;
const tralbumCache = new Map();
let catalogCache = null;
let catalogMtime = 0;

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "private, max-age=30");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  return res.end(JSON.stringify(body));
}

function loadCatalog() {
  const st = fs.statSync(CATALOG_PATH);
  if (!catalogCache || st.mtimeMs !== catalogMtime) {
    catalogCache = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
    catalogMtime = st.mtimeMs;
  }
  return catalogCache;
}

function findRelease(catalog, releaseId) {
  return (catalog.releases || []).find(function (r) {
    return r.id === releaseId;
  });
}

function findTrack(release, trackId) {
  return bc.pickCueTrack(release, trackId);
}

function localPreviewPath(preview) {
  if (!preview) return null;
  const rel = String(preview).replace(/^\/+/, "");
  if (rel.indexOf("..") >= 0) return null;
  const abs = path.join(process.cwd(), rel);
  if (!abs.startsWith(process.cwd())) return null;
  if (!fs.existsSync(abs)) return null;
  return "/" + rel;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });

  const url = new URL(req.url, "http://localhost");
  const releaseId = String(url.searchParams.get("release") || url.searchParams.get("r") || "").trim();
  const trackId = String(url.searchParams.get("track") || url.searchParams.get("t") || "").trim();
  if (!releaseId) {
    return json(res, 400, { error: "Missing release id." });
  }

  let catalog;
  try {
    catalog = loadCatalog();
  } catch (e) {
    return json(res, 500, { error: "Catalog could not be loaded." });
  }

  const release = findRelease(catalog, releaseId);
  if (!release) {
    return json(res, 404, {
      error: "Release is not in the library.",
      wired: false,
    });
  }
  const track = findTrack(release, trackId);
  if (!track) {
    return json(res, 404, {
      error: "That cue is not on this release.",
      wired: false,
    });
  }

  const localSrc = localPreviewPath(track.preview);

  try {
    const pageUrl = await bc.resolvePageUrl(release, catalog);
    if (pageUrl) {
      const now = Date.now();
      const hit = tralbumCache.get(pageUrl);
      let tralbum;
      if (hit && now - hit.at < CACHE_MS) {
        tralbum = hit.data;
      } else {
        const fetched = await bc.fetchHtml(pageUrl);
        if (fetched.status >= 400) throw new Error("Bandcamp page " + fetched.status);
        tralbum = bc.parseTralbum(fetched.body);
        if (!tralbum) throw new Error("No Bandcamp stream metadata");
        tralbumCache.set(pageUrl, { at: now, data: tralbum });
      }
      const stream = bc.pickStream(tralbum, track);
      if (stream && stream.src) {
        return json(res, 200, {
          src: stream.src,
          source: "bandcamp",
          wired: true,
          releaseId: release.id,
          trackId: track.id,
          title: stream.title,
          duration: stream.duration,
          page: pageUrl,
        });
      }
    }
  } catch (e) {
    if (localSrc) {
      return json(res, 200, {
        src: localSrc,
        source: "file",
        wired: true,
        fallback: true,
        releaseId: release.id,
        trackId: track.id,
        warning: "Bandcamp stream failed; using local preview file.",
      });
    }
    return json(res, 502, {
      error: "Bandcamp preview is wired but not active right now.",
      wired: false,
      releaseId: release.id,
      trackId: track.id,
    });
  }

  if (localSrc) {
    return json(res, 200, {
      src: localSrc,
      source: "file",
      wired: true,
      releaseId: release.id,
      trackId: track.id,
    });
  }

  if (track.preview && !localSrc) {
    return json(res, 409, {
      error: "Preview file is listed but not on the server.",
      wired: false,
      releaseId: release.id,
      trackId: track.id,
      preview: track.preview,
    });
  }

  return json(res, 409, {
    error: "This cue is not wired to Bandcamp.",
    wired: false,
    releaseId: release.id,
    trackId: track.id,
  });
};
