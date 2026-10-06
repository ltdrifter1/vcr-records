/**
 * SoundCloud RSS for https://soundcloud.com/ltdrifta
 * Public podcast feed — no API key. Paginate via atom:link rel="next".
 */

const USER_ID = "1733974502";
const HANDLE = "ltdrifta";
const PROFILE_URL = "https://soundcloud.com/ltdrifta";
const FEED_URL =
  "https://feeds.soundcloud.com/users/soundcloud:users:" + USER_ID + "/sounds.rss";
const MAX_PAGES = 20;
const MAX_ITEMS = 200;

function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

function inner(xml, tag) {
  const re = new RegExp("<" + tag + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + tag + ">", "i");
  const m = xml.match(re);
  return m ? decode(m[1]) : "";
}

function attr(xml, tag, name) {
  const re = new RegExp("<" + tag + "\\b[^>]*\\s" + name + "=\"([^\"]+)\"", "i");
  const m = xml.match(re);
  return m ? decode(m[1]) : "";
}

function coverThumb(url) {
  if (!url) return "";
  return url.replace(/-t\d+x\d+(\.\w+)$/, "-t500x500$1");
}

function formatRuntime(raw) {
  const s = String(raw || "").trim();
  if (!s) return "";
  const parts = s.split(":");
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10) || 0;
    const m = String(parts[1] || "0").padStart(2, "0");
    const sec = String(parts[2] || "0").padStart(2, "0");
    if (!h) return String(parseInt(parts[1], 10) || 0) + ":" + sec;
    return h + ":" + m + ":" + sec;
  }
  return s.replace(/^0+(?=\d)/, "");
}

function trackIdFrom(itemXml, link) {
  const guid = inner(itemXml, "guid");
  const fromGuid = /tracks\/(\d+)/.exec(guid);
  if (fromGuid) return fromGuid[1];
  const fromEncl = /\/stream\/(\d+)-/.exec(attr(itemXml, "enclosure", "url") || "");
  if (fromEncl) return fromEncl[1];
  const fromLink = /soundcloud\.com\/[^/]+\/([^/?#]+)/.exec(link || "");
  return fromLink ? fromLink[1] : "";
}

function mapItem(itemXml) {
  const title = inner(itemXml, "title");
  const link = inner(itemXml, "link");
  if (!title || !link) return null;
  const id = trackIdFrom(itemXml, link);
  const pub = inner(itemXml, "pubDate");
  let published = "";
  let year = "";
  if (pub) {
    const d = new Date(pub);
    if (!isNaN(d.getTime())) {
      published = d.toISOString();
      year = String(d.getUTCFullYear());
    }
  }
  const dek = inner(itemXml, "itunes:summary") || inner(itemXml, "description");
  return {
    id: id ? "sc-" + id : "sc-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    soundcloudId: id,
    title: title,
    dj: inner(itemXml, "itunes:author") || "L.T. Drifta",
    year: year,
    runtime: formatRuntime(inner(itemXml, "itunes:duration")),
    dek: dek,
    cover: coverThumb(attr(itemXml, "itunes:image", "href")),
    permalink: link,
    published: published,
  };
}

function parseRss(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const mapped = mapItem(m[1]);
    if (mapped) items.push(mapped);
  }
  const next =
    (xml.match(/<atom:link[^>]*rel="next"[^>]*href="([^"]+)"/i) ||
      xml.match(/<atom:link[^>]*href="([^"]+)"[^>]*rel="next"/i) ||
      [])[1] || "";
  return { items: items, next: next };
}

/**
 * SoundCloud's own `genre` and `tag_list` for a track. The RSS feed does not carry them, so they
 * are read from the track page, which embeds the sound as JSON in `window.__sc_hydration`.
 * tag_list is space separated with multi-word tags in double quotes: `house "deep house" chill`.
 * Returns [] when the page has no such block (consent wall, bot check, changed markup) or the
 * block is for a different track: no tags is the safe answer, a wrong tag is not.
 */
function splitTagList(raw) {
  const out = [];
  const re = /"([^"]+)"|(\S+)/g;
  let m;
  while ((m = re.exec(String(raw || "")))) out.push((m[1] || m[2]).trim());
  return out;
}

function parseTrackPage(html, expectedId) {
  const block = /__sc_hydration\s*=\s*(\[[\s\S]*?\])\s*;?\s*<\/script>/.exec(String(html || ""));
  if (!block) return [];
  let sound = null;
  try {
    sound = JSON.parse(block[1]).find(function (e) {
      return e && e.hydratable === "sound" && e.data;
    });
  } catch (e) {
    return [];
  }
  if (!sound) return [];
  const data = sound.data;
  if (expectedId && data.id && String(data.id) !== String(expectedId)) return [];
  const seen = Object.create(null);
  const tags = [];
  [data.genre].concat(splitTagList(data.tag_list)).forEach(function (t) {
    const s = String(t || "").replace(/\s+/g, " ").trim();
    const key = s.toLowerCase();
    if (!s || s.length > 30 || seen[key]) return;
    seen[key] = true;
    tags.push(s);
  });
  return tags;
}

async function fetchTrackPage(permalink) {
  const res = await fetch(permalink, {
    headers: {
      Accept: "text/html",
      "User-Agent":
        "ClubCopy/1.0 (+https://www.clubcopy.ca; mixtape genres from soundcloud.com/ltdrifta)",
    },
  });
  return { status: res.status, html: res.ok ? await res.text() : "" };
}

async function fetchTrackTags(permalink, soundcloudId) {
  const page = await fetchTrackPage(permalink);
  if (!page.status || page.status >= 400) throw new Error("SoundCloud page " + page.status);
  return parseTrackPage(page.html, soundcloudId);
}

/** What a track page actually contains, for the sync log when no tags come back. */
function describeTrackPage(page) {
  const html = String((page && page.html) || "");
  const title = /<title[^>]*>([^<]*)<\/title>/i.exec(html);
  const block = /__sc_hydration\s*=\s*(\[[\s\S]*?\])\s*;?\s*<\/script>/.exec(html);
  let hydratables = [];
  let sound = null;
  if (block) {
    try {
      const arr = JSON.parse(block[1]);
      hydratables = arr.map(function (e) { return e && e.hydratable; });
      const e = arr.find(function (x) { return x && x.hydratable === "sound" && x.data; });
      if (e) sound = { id: e.data.id, genre: e.data.genre, tag_list: e.data.tag_list };
    } catch (err) {
      hydratables = ["(hydration JSON did not parse)"];
    }
  }
  return {
    status: page && page.status,
    bytes: html.length,
    title: title ? title[1].trim().slice(0, 100) : null,
    hasHydration: !!block,
    hydratables: hydratables,
    sound: sound,
    hasTagListString: /tag_list/.test(html),
    hasGenreString: /"genre"/.test(html),
  };
}

async function fetchXml(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
      "User-Agent":
        "ClubCopy/1.0 (+https://www.clubcopy.ca; mixtapes from soundcloud.com/ltdrifta)",
    },
  });
  if (!res.ok) throw new Error("SoundCloud RSS " + res.status);
  return res.text();
}

async function fetchFeed() {
  const tapes = [];
  const seen = Object.create(null);
  let url = FEED_URL;
  for (let page = 0; page < MAX_PAGES && url && tapes.length < MAX_ITEMS; page++) {
    const xml = await fetchXml(url);
    const parsed = parseRss(xml);
    parsed.items.forEach(function (t) {
      if (!t.id || seen[t.id]) return;
      seen[t.id] = true;
      tapes.push(t);
    });
    url = parsed.next && parsed.next !== url ? parsed.next : "";
    if (parsed.items.length === 0) break;
  }
  return {
    ok: true,
    source: "soundcloud-rss",
    handle: HANDLE,
    profile: PROFILE_URL,
    userId: USER_ID,
    fetchedAt: new Date().toISOString(),
    tapes: tapes.slice(0, MAX_ITEMS),
  };
}

module.exports = {
  USER_ID,
  HANDLE,
  PROFILE_URL,
  FEED_URL,
  parseRss,
  mapItem,
  coverThumb,
  formatRuntime,
  splitTagList,
  parseTrackPage,
  fetchTrackPage,
  fetchTrackTags,
  describeTrackPage,
  fetchFeed,
};
