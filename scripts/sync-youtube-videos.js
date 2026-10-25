#!/usr/bin/env node
/**
 * Club Copy — video feed.
 *
 *   node scripts/sync-youtube-videos.js
 *
 * Reads the public RSS feed for the L.T. Drifta YouTube channel (no API key) and writes
 * data/videos.json. The home page renders it at build time (node scripts/build-site.js).
 * The feed carries the latest 15 uploads; existing entries in videos.json are kept so the
 * list grows past 15 over time.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");

const CHANNEL_ID = "UCoUAHrbj51FuAMl2lsRYjbA";
const HANDLE = "ltdrifta";
const OUT = path.join(__dirname, "..", "data", "videos.json");

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "user-agent": "clubcopy-sync/1.0" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) return resolve(get(res.headers.location));
        if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode + " for " + url));
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

function unescapeXml(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}
function tag(xml, name) {
  const m = xml.match(new RegExp("<" + name + "(?:\\s[^>]*)?>([\\s\\S]*?)</" + name + ">"));
  return m ? unescapeXml(m[1]).trim() : "";
}
function attr(xml, name, a) {
  const m = xml.match(new RegExp("<" + name + "[^>]*\\s" + a + '="([^"]*)"'));
  return m ? unescapeXml(m[1]) : "";
}

function parse(xml) {
  return (xml.match(/<entry>[\s\S]*?<\/entry>/g) || []).map((e) => {
    const id = tag(e, "yt:videoId");
    return {
      id,
      title: tag(e, "title"),
      published: tag(e, "published").slice(0, 10),
      url: "https://www.youtube.com/watch?v=" + id,
      thumbnail: attr(e, "media:thumbnail", "url") || "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg",
      description: tag(e, "media:description").split(/\r?\n/)[0].trim(),
      views: Number(attr(e, "media:statistics", "views")) || 0,
    };
  }).filter((v) => v.id && v.title);
}

(async () => {
  const xml = await get("https://www.youtube.com/feeds/videos.xml?channel_id=" + CHANNEL_ID);
  const fresh = parse(xml);
  if (!fresh.length) throw new Error("feed had no entries");
  let prev = { videos: [] };
  try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch (e) { /* first run */ }
  const byId = new Map((prev.videos || []).map((v) => [v.id, v]));
  fresh.forEach((v) => byId.set(v.id, Object.assign({}, byId.get(v.id) || {}, v)));
  const videos = [...byId.values()].sort((a, b) => (b.published || "").localeCompare(a.published || "") || a.title.localeCompare(b.title));
  const out = { channelId: CHANNEL_ID, handle: HANDLE, channelUrl: "https://www.youtube.com/@" + HANDLE, fetchedAt: new Date().toISOString().slice(0, 10), videos };
  const before = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  const next = JSON.stringify(out, null, 2) + "\n";
  // fetchedAt alone is not a change worth a commit.
  const strip = (s) => s.replace(/"fetchedAt": "[^"]*"/, "");
  if (strip(before) === strip(next)) { console.log("videos.json unchanged (" + videos.length + " videos)"); return; }
  fs.writeFileSync(OUT, next);
  console.log("wrote data/videos.json: " + videos.length + " videos");
})().catch((e) => { console.error(e.message); process.exit(1); });
