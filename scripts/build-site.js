#!/usr/bin/env node
/**
 * Club Copy — static site generator.
 *
 *   node scripts/build-site.js
 *
 * Reads data/*.json and content/news/*.html, writes every page in place.
 * No dependencies. The output is committed and served as static files.
 */
"use strict";
const fs = require("fs");
const path = require("path");
const L = require("./site/lib");
const home = require("./site/pages/home");
const library = require("./site/pages/library");
const release = require("./site/pages/release");
const { artistsIndex, artistPage } = require("./site/pages/artists");
const zine = require("./site/pages/zine");
const tapes = require("./site/pages/tapes");
const { shopIndex, productPage } = require("./site/pages/shop");
const misc = require("./site/pages/misc");

const data = {
  catalog: L.readJSON("data/catalog.json"),
  news: L.readJSON("data/news.json"),
  issues: L.readJSON("data/issues.json"),
  zine: L.readJSON("data/zine.json"),
  merch: L.readJSON("data/merch.json"),
  videos: (() => { try { return L.readJSON("data/videos.json"); } catch (e) { return { videos: [] }; } })(),
};

const written = [];
function out(rel, html) {
  L.write(rel, html);
  written.push(rel);
}

out("index.html", home(data));
out("library.html", library(data));
out("artists.html", artistsIndex(data));
data.catalog.artists.forEach((a) => out(`artists/${a.id}.html`, artistPage(a, data)));
out("artists/cj-archer.html", misc.person(data));
data.catalog.releases.filter(L.onSite).forEach((r) => out(r.page.replace(/^\//, "") + ".html", release(r, data)));
out("tapes.html", tapes(data));
out("merch.html", shopIndex(data));
data.merch.products.forEach((p) => out(`merch/${p.slug}.html`, productPage(p, data)));

out("news.html", zine.zineIndex(data));
data.news.articles.forEach((a) => out(`news/${a.id}.html`, zine.storyPage(a, data)));
data.issues.volumes.forEach((v) => out(`news/vol-${String(v.number).padStart(2, "0")}.html`, zine.volumePage(v, data)));
out("news/issues.html", zine.issuesPage(data));
out("news/issue.html", zine.issueShell(data));
out("news/archive.html", zine.archivePage(data));
out("news/artists.html", zine.tagIndex(data, "artists", "Artists", "Names the stories actually turn on. A byline is not an entry."));
out("news/places.html", zine.tagIndex(data, "places", "Places", "Rooms, cities and coastlines the stories were filed from."));
out("news/series/stars-for-the-floor.html", zine.seriesPage(data));

out("join.html", misc.joinPage());
out("about.html", misc.about(data));
out("contact.html", misc.contact());
out("shipping.html", misc.shipping());
out("cart.html", misc.cart());
out("account.html", misc.account());
out("thank-you.html", misc.thankYou(data));
out("planet.html", misc.planet());
out("404.html", misc.notFound(data));

/* Sitemap ---------------------------------------------------------------- */
const today = new Date().toISOString().slice(0, 10);
const urls = written
  .filter((f) => !/^(404|news\/issue|cart|account|thank-you)\.html$/.test(f))
  .map((f) => (f === "index.html" ? "/" : "/" + f.replace(/\.html$/, "")));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url><loc>${L.ORIGIN}${u}</loc><lastmod>${today}</lastmod></url>`)
  .join("\n")}\n</urlset>\n`;
fs.writeFileSync(path.join(L.ROOT, "sitemap.xml"), sitemap);

console.log(`wrote ${written.length} pages + sitemap.xml`);
