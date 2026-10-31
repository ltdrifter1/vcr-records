/**
 * Shared Bandcamp stream helpers for the on-site player.
 * Resolves catalog cues to mp3-128 URLs without embedding the Bandcamp widget.
 */

const https = require("https");

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

/** Public Bandcamp release page. Safe to send a browser to when the server cannot pass the client challenge. */
function publicPage(release) {
  const raw = release && (release.bandcampUrl || release.bandcamp);
  if (!raw || typeof raw !== "string") return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" || !HOST_OK.test(u.hostname)) return null;
    return u.toString();
  } catch (err) {
    return null;
  }
}

/** Bandcamp's signed free-download page, when the release is name-your-price at $0. */
function freeDownloadUrl(tralbum) {
  const raw = tralbum && tralbum.freeDownloadPage;
  if (!raw || typeof raw !== "string") return null;
  const abs = absoluteUrl(raw);
  if (!abs) return null;
  try {
    const u = new URL(abs);
    if (u.protocol !== "https:" || !HOST_OK.test(u.hostname)) return null;
    return u.toString();
  } catch (err) {
    return null;
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

function titlesClose(a, b) {
  const na = normTitle(a);
  const nb = normTitle(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const shorter = na.length <= nb.length ? na : nb;
  const longer = na.length <= nb.length ? nb : na;
  return shorter.length >= 10 && longer.indexOf(shorter) !== -1;
}

function pickCueTrack(release, trackId) {
  const tracks = (release && release.tracks) || [];
  const want = String(trackId || "").trim();
  if (want) {
    return (
      tracks.find(function (t) {
        return t && t.id === want;
      }) || null
    );
  }
  if (release && release.previewTrackId) {
    const featured = tracks.find(function (t) {
      return t && t.id === release.previewTrackId;
    });
    if (featured) return featured;
  }
  const flagged = tracks.find(function (t) {
    return t && t.previewTrack;
  });
  if (flagged) return flagged;
  return (
    tracks.find(function (t) {
      return t && (t.bandcampTrackId || t.preview);
    }) ||
    tracks[0] ||
    null
  );
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
    match = list.find(function (t) {
      return titlesClose(t.title, track.title);
    });
  }
  const wantNum = track && track.trackNum != null ? Number(track.trackNum) : NaN;
  if (!match && isFinite(wantNum)) {
    match = list.find(function (t) {
      return Number(t.track_num) === wantNum;
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

function isClientChallenge(body) {
  const text = String(body || "");
  return /Client Challenge/i.test(text) && text.length < 8000;
}

function challengeError(message) {
  const err = new Error(message || "Bandcamp challenge");
  err.status = 503;
  return err;
}

/**
 * fetch() keeps a socket that Fastly pins to a challenged cache node.
 * A new https request with Connection: close asks a different node.
 */
function fetchHtmlOnce(url, redirectsLeft) {
  const remaining = redirectsLeft == null ? 4 : redirectsLeft;
  return new Promise(function (resolve, reject) {
    let pageUrl;
    try {
      pageUrl = new URL(url);
    } catch (err) {
      reject(new Error("Bandcamp host not allowed"));
      return;
    }
    if (pageUrl.protocol !== "https:" || !HOST_OK.test(pageUrl.hostname)) {
      reject(new Error("Bandcamp host not allowed"));
      return;
    }
    let settled = false;
    function finish(err, value) {
      if (settled) return;
      settled = true;
      if (err) reject(err);
      else resolve(value);
    }
    // A custom https.Agent is challenged on every connection. The default
    // agent, with Connection: close, lands on a node that serves the page.
    const req = https.request(
      {
        hostname: pageUrl.hostname,
        path: pageUrl.pathname + pageUrl.search,
        method: "GET",
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Accept-Encoding": "identity",
          Connection: "close",
        },
      },
      function (resp) {
        const status = resp.statusCode || 0;
        const location = resp.headers.location;
        if (status >= 300 && status < 400 && location && remaining > 0) {
          resp.resume();
          let next;
          try {
            next = new URL(location, pageUrl).toString();
          } catch (err) {
            finish(new Error("Unexpected redirect host"));
            return;
          }
          settled = true;
          resolve(fetchHtmlOnce(next, remaining - 1));
          return;
        }
        const chunks = [];
        resp.on("data", function (chunk) {
          chunks.push(chunk);
        });
        resp.on("end", function () {
          const body = Buffer.concat(chunks).toString("utf8");
          if (isClientChallenge(body)) {
            finish(challengeError());
            return;
          }
          finish(null, { status: status, body: body, url: pageUrl.toString() });
        });
      }
    );
    req.setTimeout(8000, function () {
      req.destroy(challengeError("Bandcamp timeout"));
    });
    req.on("error", function (err) {
      if (!err.status) err.status = 503;
      finish(err);
    });
    req.end();
  });
}

/** A challenged Fastly node is sticky for one socket. The next connection often serves the page. */
async function fetchHtml(url) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      return await fetchHtmlOnce(url);
    } catch (err) {
      lastErr = err;
      if (!err || err.status !== 503) throw err;
    }
  }
  throw lastErr;
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
  titlesClose,
  pickCueTrack,
  absoluteUrl,
  streamAllowed,
  parseTralbum,
  pickStream,
  isClientChallenge,
  publicPage,
  freeDownloadUrl,
  fetchHtml,
  resolvePageUrl,
  resolveStream,
  findDiscographyHref,
  slugish,
};
