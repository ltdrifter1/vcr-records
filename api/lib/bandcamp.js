/**
 * Shared Bandcamp stream helpers for the on-site player.
 * Resolves catalog cues to mp3-128 URLs without embedding the Bandcamp widget.
 */

const HOST_OK = /(^|\.)bandcamp\.com$/i;
const STREAM_OK = /(^|\.)bandcamp\.com$|\.bcbits\.com$/i;
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function decodeEntities(s) {
  return String(s || "")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normTitle(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&amp;/g, "&")
    .replace(/[^a-z0-9]+/g, "");
}

function absoluteUrl(src, base) {
  if (!src) return null;
  const raw = String(src).trim();
  try {
    const u = new URL(raw, base || "https://bandcamp.com");
    if (u.protocol === "http:") u.protocol = "https:";
    return u.toString();
  } catch (err) {
    return null;
  }
}

function streamAllowed(src) {
  const abs = absoluteUrl(src);
  if (!abs) return false;
  try {
    const u = new URL(abs);
    if (u.protocol !== "https:") return false;
    return STREAM_OK.test(u.hostname);
  } catch (err) {
    return false;
  }
}

function parseTralbum(html) {
  const m = String(html || "").match(/data-tralbum="([^"]+)"/);
  if (!m) return null;
  try {
    return JSON.parse(decodeEntities(m[1]));
  } catch (err) {
    return null;
  }
}

function mp3FromFile(file) {
  if (!file) return null;
  return file["mp3-128"] || file["mp3-v0"] || null;
}

function pickStream(tralbum, track) {
  const list = (tralbum && tralbum.trackinfo) || [];
  if (!list.length) return null;
  const wantId = track && track.bandcampTrackId != null ? String(track.bandcampTrackId) : "";
  let match = null;
  if (wantId) {
    match = list.find(function (t) {
      return String(t.id) === wantId || String(t.track_id) === wantId;
    });
  }
  if (!match && track && track.title) {
    const n = normTitle(track.title);
    match = list.find(function (t) {
      return normTitle(t.title) === n;
    });
  }
  if (!match && list.length === 1) match = list[0];
  if (!match) return null;
  const src = absoluteUrl(mp3FromFile(match.file));
  if (!src || !streamAllowed(src)) return null;
  return {
    src: src,
    duration: match.duration || null,
    title: match.title || (track && track.title) || "",
    bandcampTrackId: match.id || match.track_id,
  };
}

async function fetchHtml(url) {
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
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    const finalHost = new URL(resp.url).hostname;
    if (!HOST_OK.test(finalHost)) throw new Error("Unexpected redirect host");
    const body = await resp.text();
    if (/Client Challenge/i.test(body) && body.length < 8000) {
      const err = new Error("Bandcamp challenge");
      err.status = 503;
      throw err;
    }
    return { status: resp.status, body: body, url: resp.url };
  } finally {
    clearTimeout(timer);
  }
}

function artistOriginFromUrl(bandcampUrl) {
  try {
    const u = new URL(bandcampUrl);
    if (!HOST_OK.test(u.hostname)) return null;
    return u.origin;
  } catch (err) {
    return null;
  }
}

function slugish(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function findDiscographyHref(html, releaseTitle) {
  const want = slugish(releaseTitle);
  if (!want) return null;
  const hrefs = [];
  const re = /href="(\/(?:album|track)\/[^"]+)"/g;
  let m;
  while ((m = re.exec(html))) hrefs.push(m[1]);
  const unique = Array.from(new Set(hrefs));
  for (let i = 0; i < unique.length; i++) {
    const path = unique[i].replace(/\/+$/, "");
    const slug = path.split("/").pop();
    if (slug === want || slug.replace(/-\d+$/, "") === want) return path;
  }
  return null;
}

async function resolvePageUrl(release, catalog) {
  if (release.bandcampUrl || release.bandcamp) {
    return release.bandcampUrl || release.bandcamp;
  }
  const originFromSiblings = (catalog.releases || [])
    .filter(function (r) {
      return r.artistId && release.artistId && r.artistId === release.artistId && (r.bandcampUrl || r.bandcamp);
    })
    .map(function (r) {
      return artistOriginFromUrl(r.bandcampUrl || r.bandcamp);
    })
    .find(Boolean);
  if (!originFromSiblings) return null;
  const music = await fetchHtml(originFromSiblings + "/music");
  if (music.status >= 400) return null;
  const href = findDiscographyHref(music.body, release.title);
  if (!href) return null;
  return originFromSiblings + href;
}

async function resolveStream(pageUrl, track) {
  const fetched = await fetchHtml(pageUrl);
  if (fetched.status >= 400) {
    throw new Error("Bandcamp page " + fetched.status);
  }
  const tralbum = parseTralbum(fetched.body);
  if (!tralbum) throw new Error("No Bandcamp stream metadata");
  const stream = pickStream(tralbum, track || {});
  if (!stream) throw new Error("No audio on this Bandcamp cue");
  return stream;
}

module.exports = {
  decodeEntities,
  normTitle,
  absoluteUrl,
  streamAllowed,
  parseTralbum,
  pickStream,
  fetchHtml,
  resolvePageUrl,
  resolveStream,
  findDiscographyHref,
  slugish,
};
