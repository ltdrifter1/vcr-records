/**
 * Live Instagram mixer for GET /api/instagram-feed.
 * Guest-session profile JSON for @ltdrifta + @clubcopyrecords.
 * Snapshot fallback: data/instagram-feed.json
 * Refresh stills with: node scripts/sync-instagram-feed.js
 */
const fs = require("fs");
const path = require("path");

const { fetchProfile } = require("./ig-session");

const HANDLES = ["ltdrifta", "clubcopyrecords"];
const LIMIT = 16;
const CACHE_MS = 5 * 60 * 1000;
const FALLBACK_PATH = path.join(process.cwd(), "data", "instagram-feed.json");

let cache = { at: 0, body: null };

function json(res, status, body, cacheControl) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", cacheControl || "public, s-maxage=300, stale-while-revalidate=3600");
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

function captionOf(node) {
  const edges = ((node.edge_media_to_caption || {}).edges || []);
  if (!edges.length) return "";
  return String(((edges[0] || {}).node || {}).text || "");
}

function mapNode(node, handle, name) {
  const short = String(node.shortcode || "").trim();
  if (!short) return null;
  const caption = captionOf(node);
  const alt = String(node.accessibility_caption || caption || "Instagram post from @" + handle).slice(0, 180);
  return {
    id: String(node.id || short),
    shortcode: short,
    href: "https://www.instagram.com/p/" + short + "/",
    image: fs.existsSync(path.join(process.cwd(), "media", "ig", short + ".jpg"))
      ? "/media/ig/" + short + ".jpg"
      : "/api/instagram-media?p=" + encodeURIComponent(short),
    caption: caption.slice(0, 240),
    alt: alt,
    takenAt: Number(node.taken_at_timestamp) || 0,
    isVideo: !!node.is_video,
    handle: handle,
    name: name || handle,
  };
}

function mixProfiles(payloads) {
  const posts = [];
  payloads.forEach(function (data, i) {
    const handle = HANDLES[i];
    const user = ((data || {}).data || {}).user || {};
    const edges = ((user.edge_owner_to_timeline_media || {}).edges || []);
    const name = user.full_name || handle;
    edges.forEach(function (edge) {
      const mapped = mapNode(edge.node || {}, handle, name);
      if (mapped) posts.push(mapped);
    });
  });
  posts.sort(function (a, b) {
    return b.takenAt - a.takenAt;
  });
  const seen = Object.create(null);
  const uniq = [];
  for (let i = 0; i < posts.length && uniq.length < LIMIT; i++) {
    const p = posts[i];
    if (seen[p.shortcode]) continue;
    seen[p.shortcode] = true;
    uniq.push(p);
  }
  return uniq;
}

module.exports = async function handler(req, res) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "GET") return json(res, 405, { ok: false, error: "Method not allowed" });

  const now = Date.now();
  if (cache.body && now - cache.at < CACHE_MS) {
    return json(res, 200, cache.body);
  }

  try {
    const payloads = [];
    for (let i = 0; i < HANDLES.length; i++) {
      if (i) await new Promise(function (r) { setTimeout(r, 400); });
      payloads.push(await fetchProfile(HANDLES[i]));
    }
    const posts = mixProfiles(payloads);
    if (!posts.length) throw new Error("Empty Instagram payload");
    const body = {
      ok: true,
      source: "live",
      limit: LIMIT,
      handles: HANDLES,
      fetchedAt: new Date().toISOString(),
      posts: posts,
    };
    cache = { at: now, body: body };
    return json(res, 200, body);
  } catch (err) {
    const fallback = readFallback();
    if (fallback && Array.isArray(fallback.posts) && fallback.posts.length) {
      fallback.ok = true;
      fallback.source = fallback.source || "snapshot";
      fallback.stale = true;
      fallback.error = String((err && err.message) || "live feed unavailable");
      cache = { at: now, body: fallback };
      return json(res, 200, fallback, "public, s-maxage=60, stale-while-revalidate=600");
    }
    return json(res, 502, {
      ok: false,
      error: "Instagram feed unavailable",
      handles: HANDLES,
      posts: [],
    }, "public, max-age=30");
  }
};
