#!/usr/bin/env node
/**
 * Club Copy — video feed.
 *
 *   node scripts/sync-youtube-videos.js
 *
 * Reads the public RSS feed for the L.T. Drifta YouTube channel (no API key) and writes
 * data/videos.json. The home page renders the latest four at build time
 * (node scripts/build-site.js).
 *
 * The feed lists the latest 15 public uploads. Fewer than 15 means that list is the
 * whole channel, so anything missing was deleted or made private and is dropped.
 * A full page of 15 keeps older videos already on file. A stored video new enough
 * to have been inside that window, and missing from it, is dropped. A video that
 * shares the oldest day in the window is kept: the file only stores a date, so it
 * may sit just outside the 15.
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

/** Merge a previous list with a fresh RSS page. `limit` is the feed's page size (15). */
function mergeVideos(prevVideos, fresh, limit) {
  limit = limit || 15;
  const prev = prevVideos || [];
  const prevById = new Map(prev.map((v) => [v.id, v]));
  const freshIds = new Set(fresh.map((v) => v.id));
  const apply = (v) => Object.assign({}, prevById.get(v.id) || {}, v);
  let videos;
  if (fresh.length < limit) {
    videos = fresh.map(apply);
  } else {
    const oldest = fresh.reduce((m, v) => ((v.published || "") < m ? v.published || "" : m), fresh[0].published || "");
    const kept = prev.filter((v) => v.id && !freshIds.has(v.id) && (v.published || "") <= oldest);
    videos = kept.concat(fresh.map(apply));
  }
  return videos.sort((a, b) => (b.published || "").localeCompare(a.published || "") || a.title.localeCompare(b.title));
}

async function main() {
  const xml = await get("https://www.youtube.com/feeds/videos.xml?channel_id=" + CHANNEL_ID);
  const fresh = parse(xml);
  if (!fresh.length) throw new Error("feed had no entries");
  let prev = { videos: [] };
  try { prev = JSON.parse(fs.readFileSync(OUT, "utf8")); } catch (e) { /* first run */ }
  const videos = mergeVideos(prev.videos, fresh);
  const out = { channelId: CHANNEL_ID, handle: HANDLE, channelUrl: "https://www.youtube.com/@" + HANDLE, fetchedAt: new Date().toISOString().slice(0, 10), videos };
  const before = fs.existsSync(OUT) ? fs.readFileSync(OUT, "utf8") : "";
  const next = JSON.stringify(out, null, 2) + "\n";
  // fetchedAt alone is not a change worth a commit.
  const strip = (s) => s.replace(/"fetchedAt": "[^"]*"/, "");
  if (strip(before) === strip(next)) { console.log("videos.json unchanged (" + videos.length + " videos)"); return; }
  fs.writeFileSync(OUT, next);
  console.log("wrote data/videos.json: " + videos.length + " videos");
}

if (require.main === module) {
  main().catch((e) => { console.error(e.message); process.exit(1); });
}

module.exports = { mergeVideos, parse, CHANNEL_ID, HANDLE };
