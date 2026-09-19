#!/usr/bin/env node
/**
 * Snapshot mixer for the homepage floor.
 * Mixes @ltdrifta + @clubcopyrecords, newest first, 16 posts.
 * Writes data/instagram-feed.json and stills under media/ig/.
 * Not a Vercel function — Hobby deploys break if scrapers live in /api.
 */
const fs = require("fs");
const path = require("path");

const { execFile } = require("child_process");
const { fetchProfile, UA } = require("./ig-session");

const HANDLES = ["ltdrifta", "clubcopyrecords"];
const LIMIT = 16;
const ROOT = process.cwd();
const OUT_JSON = path.join(ROOT, "data", "instagram-feed.json");
const OUT_DIR = path.join(ROOT, "media", "ig");

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
  const displayUrl = String(node.display_url || "").trim();
  return {
    id: String(node.id || short),
    shortcode: short,
    href: "https://www.instagram.com/p/" + short + "/",
    image: "/media/ig/" + short + ".jpg",
    thumb: displayUrl,
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

function curlFile(url, dest) {
  return new Promise(function (resolve, reject) {
    execFile(
      "curl",
      ["-sS", "-L", "-A", UA, "-H", "Referer: https://www.instagram.com/", "-o", dest, url],
      { timeout: 20000 },
      function (err) {
        if (err) return reject(err);
        try {
          const size = fs.statSync(dest).size;
          if (size < 800) return reject(new Error("too small"));
        } catch (statErr) {
          return reject(statErr);
        }
        resolve(dest);
      }
    );
  });
}

async function downloadStill(post) {
  const dest = path.join(OUT_DIR, post.shortcode + ".jpg");
  if (fs.existsSync(dest) && fs.statSync(dest).size > 800) return dest;
  const candidates = [
    "https://www.instagram.com/p/" + post.shortcode + "/media/?size=l",
    post.thumb,
  ].filter(Boolean);

  let lastErr = null;
  for (let i = 0; i < candidates.length; i++) {
    try {
      return await curlFile(candidates[i], dest);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Could not download " + post.shortcode);
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

function readExisting() {
  try {
    return JSON.parse(fs.readFileSync(OUT_JSON, "utf8"));
  } catch (e) {
    return null;
  }
}

async function loadPosts() {
  const payloads = [];
  for (let i = 0; i < HANDLES.length; i++) {
    if (i) await sleep(2500);
    payloads.push(await fetchProfile(HANDLES[i]));
  }
  return mixProfiles(payloads);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  let posts;
  let source = "live";
  try {
    posts = await loadPosts();
  } catch (err) {
    const fallback = readExisting();
    if (!fallback || !Array.isArray(fallback.posts) || !fallback.posts.length) throw err;
    console.warn("Live mix unavailable (" + (err && err.message) + "); using existing snapshot.");
    posts = fallback.posts.slice();
    source = "snapshot";
  }
  posts.sort(function (a, b) {
    return (b.takenAt || 0) - (a.takenAt || 0);
  });
  const seen = Object.create(null);
  const uniq = [];
  for (let i = 0; i < posts.length && uniq.length < LIMIT; i++) {
    const p = posts[i];
    if (!p || !p.shortcode || seen[p.shortcode]) continue;
    seen[p.shortcode] = true;
    uniq.push(p);
  }
  if (!uniq.length) throw new Error("Empty Instagram payload");

  for (let i = 0; i < uniq.length; i++) {
    uniq[i].image = "/media/ig/" + uniq[i].shortcode + ".jpg";
    await downloadStill(uniq[i]);
    delete uniq[i].thumb;
  }

  const body = {
    ok: true,
    source: source,
    limit: LIMIT,
    handles: HANDLES,
    fetchedAt: new Date().toISOString(),
    posts: uniq,
  };
  fs.writeFileSync(OUT_JSON, JSON.stringify(body, null, 2) + "\n");
  console.log("Wrote " + uniq.length + " posts to " + path.relative(ROOT, OUT_JSON));
}

main().catch(function (err) {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
