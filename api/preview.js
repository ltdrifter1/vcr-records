/**
 * Resolve a live preview URL for the on-site player.
 * Prefers the Bandcamp mp3-128 stream for the wired cue; falls back to a
 * local /previews file when that file is actually on disk.
 *
 * GET /api/preview?release=&track=
 */
const fs = require("fs");
const path = require("path");

const CATALOG_PATH = path.join(process.cwd(), "data", "catalog.json");
const UA =
  "Mozilla/5.0 (compatible; ClubCopyPlayer/1.0; +https://www.clubcopy.ca/)";
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
  const tracks = release.tracks || [];
  if (!trackId) {
    return (
      tracks.find(function (t) {
        return t.bandcampTrackId || t.preview;
      }) || tracks[0] || null
    );
  }
  return (
    tracks.find(function (t) {
      return t.id === trackId;
    }) || null
  );
}

function normTitle(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9]+/g, "");
}

function decodeEntities(s) {
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
    return JSON.parse(decodeEntities(m[1]));
  } catch (e) {
    return null;
  }
}

async function fetchTralbum(url) {
  const now = Date.now();
  const hit = tralbumCache.get(url);
  if (hit && now - hit.at < CACHE_MS) return hit.data;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "text/html" },
    redirect: "follow",
  });
  if (!res.ok) {
    const err = new Error("Bandcamp page " + res.status);
    err.status = res.status;
    throw err;
  }
  const html = await res.text();
  if (/Client Challenge/i.test(html) && html.length < 8000) {
    const err = new Error("Bandcamp challenge");
    err.status = 503;
    throw err;
  }
  const data = parseTralbum(html);
  if (!data) {
    const err = new Error("Bandcamp page has no stream data");
    err.status = 502;
    throw err;
  }
  tralbumCache.set(url, { at: now, data: data });
  return data;
}

function pickStream(info, track) {
  const list = info.trackinfo || [];
  if (!list.length) return null;
  const wantId = track.bandcampTrackId != null ? String(track.bandcampTrackId) : "";
  let match = null;
  if (wantId) {
    match = list.find(function (t) {
      return String(t.id) === wantId || String(t.track_id) === wantId;
    });
  }
  if (!match && track.title) {
    const n = normTitle(track.title);
    match = list.find(function (t) {
      return normTitle(t.title) === n;
    });
  }
  if (!match && list.length === 1) match = list[0];
  if (!match) return null;
  const file = match.file || {};
  const src = file["mp3-128"] || file["mp3-v0"] || null;
  if (!src) return null;
  return {
    src: src,
    duration: match.duration || null,
    title: match.title || track.title,
    bandcampTrackId: match.id || match.track_id,
  };
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
  const releaseId = String(url.searchParams.get("release") || "").trim();
  const trackId = String(url.searchParams.get("track") || "").trim();
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

  const bandcampUrl =
    release.bandcampUrl || release.bandcamp || track.bandcamp || null;
  const localSrc = localPreviewPath(track.preview);

  if (bandcampUrl) {
    try {
      const info = await fetchTralbum(bandcampUrl);
      const stream = pickStream(info, track);
      if (stream && stream.src) {
        return json(res, 200, {
          src: stream.src,
          source: "bandcamp",
          wired: true,
          releaseId: release.id,
          trackId: track.id,
          title: stream.title,
          duration: stream.duration,
          page: bandcampUrl,
        });
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
        page: bandcampUrl,
      });
    }
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
