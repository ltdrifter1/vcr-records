#!/usr/bin/env node
/**
 * Snapshot mixer for the homepage floor.
 * Mixes @ltdrifta + @clubcopyrecords, newest first, 12 posts.
 * Writes data/instagram-feed.json and stills under media/ig/.
 * Not a Vercel function — Hobby deploys break if scrapers live in /api.
 */
const fs = require("fs");
const path = require("path");

const HANDLES = ["ltdrifta", "clubcopyrecords"];
const LIMIT = 12;
const ROOT = process.cwd();
const OUT_JSON = path.join(ROOT, "data", "instagram-feed.json");
const OUT_DIR = path.join(ROOT, "media", "ig");
const IG_APP_ID = "936619743392459";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

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

async function fetchProfile(username) {
  const url = "https://www.instagram.com/api/v1/users/web_profile_info/?username=" + encodeURIComponent(username);
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/json",
      "Accept-Language": "en-US,en;q=0.9",
      "X-IG-App-ID": IG_APP_ID,
      "X-ASBD-ID": "129477",
      "X-IG-WWW-Claim": "0",
      Referer: "https://www.instagram.com/" + username + "/",
      Origin: "https://www.instagram.com",
    },
  });
  if (!res.ok) {
    const err = new Error("Instagram " + username + " " + res.status);
    err.status = res.status;
    throw err;
  }
  return res.json();
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

async function downloadStill(post) {
  const dest = path.join(OUT_DIR, post.shortcode + ".jpg");
  const candidates = [
    "https://www.instagram.com/p/" + post.shortcode + "/media/?size=l",
    post.thumb,
  ].filter(Boolean);

  let lastErr = null;
  for (let i = 0; i < candidates.length; i++) {
    try {
      const res = await fetch(candidates[i], {
        headers: {
          "User-Agent": UA,
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          Referer: "https://www.instagram.com/",
        },
        redirect: "follow",
      });
      if (!res.ok) {
        lastErr = new Error(post.shortcode + " " + res.status);
        continue;
      }
      const type = res.headers.get("content-type") || "";
      if (type.indexOf("image/") !== 0 && type.indexOf("octet-stream") === -1) {
        lastErr = new Error(post.shortcode + " type " + type);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 800) {
        lastErr = new Error(post.shortcode + " too small");
        continue;
      }
      fs.writeFileSync(dest, buf);
      return dest;
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
