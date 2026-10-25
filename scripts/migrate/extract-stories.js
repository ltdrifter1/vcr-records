#!/usr/bin/env node
/**
 * One-time migration: lift each Night Shift story body out of news/<id>.html
 * into content/news/<id>.html so the generator owns the page shell and the
 * prose stays exactly as written.
 *
 * Output file = optional hero <figure> (normalised to class="story-hero …")
 * followed by the inner HTML of <div class="news-body …">.
 *
 *   node scripts/migrate/extract-stories.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const news = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "news.json"), "utf8"));
const outDir = path.join(ROOT, "content", "news");
fs.mkdirSync(outDir, { recursive: true });

/** Return inner HTML of the first element whose opening tag matches `open` (balanced on the tag name). */
function innerOf(html, open, tag) {
  const start = html.search(open);
  if (start < 0) return null;
  const from = html.indexOf(">", start) + 1;
  const re = new RegExp(`<\\/?${tag}\\b[^>]*>`, "g");
  re.lastIndex = from;
  let depth = 1;
  let m;
  while ((m = re.exec(html))) {
    if (m[0][1] === "/") depth--;
    else if (!/\/>$/.test(m[0])) depth++;
    if (depth === 0) return html.slice(from, m.index);
  }
  return null;
}

let n = 0;
const missing = [];
for (const a of news.articles) {
  const file = path.join(ROOT, "news", a.id + ".html");
  if (!fs.existsSync(file)) {
    missing.push(a.id);
    continue;
  }
  const html = fs.readFileSync(file, "utf8");
  const body = innerOf(html, /<div class="news-body[^"]*">/, "div");
  if (body == null) {
    missing.push(a.id + " (no body)");
    continue;
  }
  let hero = "";
  const heroMatch = html.match(/<figure class="news-article-hero([^"]*)">([\s\S]*?)<\/figure>/);
  if (heroMatch) {
    const variant = heroMatch[1].trim();
    const inner = heroMatch[2].replace(/<span class="zine-tape"[^>]*><\/span>\s*/g, "").trim();
    hero = `<figure class="story-hero${variant ? " " + variant : ""}">\n${inner}\n</figure>\n`;
  }
  const bodyClass = (html.match(/<div class="news-body([^"]*)">/) || [, ""])[1].trim();
  const flags = bodyClass
    .split(/\s+/)
    .filter((c) => c && c !== "news-body--essay")
    .map((c) => c.replace("news-body--", ""));
  const head = flags.length ? `<!-- story-flags: ${flags.join(" ")} -->\n` : "";
  fs.writeFileSync(path.join(outDir, a.id + ".html"), head + hero + body.trim() + "\n");
  n++;
}
console.log(`wrote ${n} story bodies to content/news/`);
if (missing.length) console.log("missing:", missing.join(", "));
