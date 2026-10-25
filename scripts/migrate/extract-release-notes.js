#!/usr/bin/env node
/**
 * One-time migration: lift the release notes and the specs table out of the
 * 27 hand-written release pages into data/catalog.json, so the generator can
 * render release pages from data alone.
 *
 *   node scripts/migrate/extract-release-notes.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const catalogPath = path.join(ROOT, "data", "catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

function decode(s) {
  return String(s)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}
function text(html) {
  return decode(String(html).replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

let touched = 0;
for (const rel of catalog.releases) {
  const file = path.join(ROOT, String(rel.page || "").replace(/^\//, "") + ".html");
  if (!rel.page || !fs.existsSync(file)) {
    console.log("skip (no page):", rel.id);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const notesMatch = html.match(/<div class="ra-notes[^"]*">([\s\S]*?)<\/div>/);
  const notes = notesMatch
    ? [...notesMatch[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) => text(m[1])).filter(Boolean)
    : [];
  const specsMatch = html.match(/<dl class="ra-specs[^"]*">([\s\S]*?)<\/dl>/);
  const specs = {};
  if (specsMatch) {
    for (const m of specsMatch[1].matchAll(/<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>/g)) {
      const k = text(m[1]);
      if (k === "Artist") continue; // already a field
      specs[k.toLowerCase()] = text(m[2]);
    }
  }
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  const description = descMatch ? decode(descMatch[1]) : "";
  rel.notes = notes;
  rel.specs = specs;
  if (description) rel.description = description;
  touched++;
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2) + "\n");
console.log(`notes + specs written for ${touched} releases`);
