/* Club Copy site generator — shared helpers and the page shell. */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const ORIGIN = "https://www.clubcopy.ca";
const VERSION = "cc17";
const CSS_VERSION = "cc25";

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function attr(value) {
  return esc(value).replace(/'/g, "&#39;");
}
function money(n) {
  const cents = Math.round(Number(n) * 100);
  if (!isFinite(cents)) return "";
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2);
}
function clock(sec) {
  sec = Math.max(0, Math.floor(Number(sec) || 0));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (v) => (v < 10 ? "0" : "") + v;
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}
function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function parseISO(iso) {
  const m = String(iso || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? { y: +m[1], mo: +m[2], d: +m[3] } : null;
}
function dateLong(iso) {
  const p = parseISO(iso);
  return p ? `${p.d} ${MONTHS[p.mo - 1]} ${p.y}` : "";
}
function dateShort(iso) {
  const p = parseISO(iso);
  return p ? `${p.d} ${MONTHS_SHORT[p.mo - 1]} ${p.y}` : "";
}
function dateMono(iso) {
  const p = parseISO(iso);
  return p ? `${String(p.d).padStart(2, "0")}.${String(p.mo).padStart(2, "0")}.${String(p.y).slice(2)}` : "";
}
function asset(src) {
  if (!src) return "";
  if (/^(https?:)?\/\//.test(src) || src.startsWith("/") || src.startsWith("data:")) return src;
  return "/" + src.replace(/^(\.\.\/)+/, "");
}
function releaseSeconds(rel) {
  return (rel.tracks || []).reduce((sum, t) => sum + (isFinite(Number(t && t.duration)) ? Number(t.duration) : 0), 0);
}
function specLine(rel) {
  const n = rel.tracksCount || (rel.tracks || []).length;
  const bits = [];
  if (rel.catalogue) bits.push(rel.catalogue);
  if (rel.kind) bits.push(rel.kind);
  if (n) bits.push(n + (n === 1 ? " track" : " tracks"));
  const total = releaseSeconds(rel);
  if (total) bits.push(clock(total));
  return bits.join(" · ");
}
function formatGlyphs(rel) {
  const f = rel.formats || {};
  return [f.digital ? "DL" : "", f.cassette ? "CS" : "", f.vinyl ? "LP" : ""].filter(Boolean).join(" / ");
}
function freeDownload(rel) {
  const d = rel && rel.formats && rel.formats.digital;
  return !!(d && (d.free || Number(d.price) === 0));
}
function downloadHref(rel) {
  const track = (rel && rel.previewTrackId) || (((rel && rel.tracks) || [])[0] && rel.tracks[0].id) || "";
  return (
    "/api/bandcamp-stream?r=" +
    encodeURIComponent(rel && rel.id ? rel.id : "") +
    "&t=" +
    encodeURIComponent(track) +
    "&download=1"
  );
}
function priceLine(rel) {
  const f = rel.formats || {};
  const bits = [];
  if (f.digital && f.digital.price != null) bits.push(freeDownload(rel) ? "Free download" : "Digital $" + money(f.digital.price));
  if (f.cassette) {
    if (f.cassette.stock === 0 || f.cassette.soldOut) bits.push("Cassette sold out");
    else if (f.cassette.price != null) bits.push("Cassette $" + money(f.cassette.price));
  }
  if (f.vinyl && f.vinyl.price != null) bits.push("Vinyl $" + money(f.vinyl.price));
  return bits.join(" · ");
}
function hasCue(rel) {
  return (rel.tracks || []).some((t) => t && (t.preview || t.bandcampTrackId || t.previewTrack || t.soundcloud));
}
function onSite(rel) {
  return !!(rel && rel.page && String(rel.page).charAt(0) === "/");
}
function readJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
}
function write(rel, html) {
  const file = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

/* ---------------------------------------------------------------------- */
/* Shell                                                                   */
/* ---------------------------------------------------------------------- */

const NAV = [
  ["/library", "Library"],
  ["/artists", "Artists"],
  ["/tapes", "Mixtapes"],
  ["/news", "Night Shift"],
  ["/merch", "Shop"],
  ["/join", "Join"],
];

const THEME_BOOT = `<script>
    (function () {
      try {
        var t = localStorage.getItem("cc.theme");
        if (t !== "day" && t !== "night") t = "night";
        document.documentElement.setAttribute("data-theme", t);
        var m = document.querySelector('meta[name="theme-color"]');
        if (m) m.setAttribute("content", t === "day" ? "#f3efe6" : "#cfc6b8");
        var s = document.querySelector('meta[name="color-scheme"]');
        if (s) s.setAttribute("content", "light");
      } catch (e) {}
    })();
  </script>`;

const SKY = `<div class="sky" id="sky" role="region" aria-label="Cumberland time and Long Beach surf">
  <p class="sky-live">
    <a class="sky-home" href="/">clubcopy.ca</a>
    <span>Cumberland</span>
    <time data-sky-time>··:·· PT</time>
    <span class="sky-surf" data-sky-surf hidden><span data-sky-surf-now></span><span class="sky-surf-cast" data-sky-surf-cast></span></span>
  </p>
  <button type="button" class="sky-theme" id="themeToggle" aria-pressed="true" aria-label="Switch colour mode">
    <span class="sky-knob" aria-hidden="true"></span>
    <span class="sky-theme-lab" aria-hidden="true"><span class="sky-lab-day">Day</span><span class="sky-lab-night">Night</span></span>
  </button>
</div>`;

function navHtml(current) {
  const links = NAV.map(([href, label]) => {
    const on = current && (current === href || (href !== "/" && current.startsWith(href + "/")));
    return `<a href="${href}"${on ? ' aria-current="page"' : ""}>${label}</a>`;
  }).join("\n      ");
  return `${SKY}
<header class="nav" id="nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo" aria-label="Club Copy home"><img src="/club-copy-nav-ink.webp" alt="Club Copy" width="901" height="418"/></a>
    <nav class="nav-links" aria-label="Primary">
      ${links}
    </nav>
    <div class="nav-end">
      <a href="/account" class="nav-account" id="navAccount" aria-label="Account"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="12" cy="8" r="3.15"/><path d="M5.4 19.1c1-3.1 3.5-4.8 6.6-4.8s5.6 1.7 6.6 4.8"/></svg></a>
      <a href="/cart" class="nav-cart" data-cart-link aria-label="Cart"><span class="nav-cart-word">Cart</span><span class="nav-cart-count" data-cart-count hidden>0</span></a>
      <button class="nav-ham" id="navHam" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="nav-drawer" id="navDrawer" aria-hidden="true">
  ${NAV.map(([href, label]) => `<a href="${href}">${label}</a>`).join("\n  ")}
  <a href="/account">Account</a>
  <a href="/contact">Contact</a>
  <a href="/cart">Cart</a>
</div>`;
}

function footerHtml() {
  const year = new Date().getFullYear();
  return `<footer class="footer">
  <div class="footer-row footer-row--mark">
    <a class="footer-wordmark" href="/">Club Copy</a>
    <p class="footer-fact mono"><span>Independent record label</span><span>British Columbia, Canada</span><span>© 2024 — ${year}</span></p>
  </div>
  <div class="footer-row">
    <p class="footer-label">Contact</p>
    <p class="footer-fact"><a href="mailto:charlie@clubcopy.ca">charlie@clubcopy.ca</a> · Press, bookings, demos: <a href="/contact">contact</a></p>
  </div>
  <div class="footer-row">
    <p class="footer-label">Orders</p>
    <p class="footer-fact">Ships to Canada and the United States · <a href="/shipping">Shipping &amp; returns</a> · Streaming on site via Bandcamp, files after checkout</p>
  </div>
  <div class="footer-row">
    <p class="footer-label">Published by</p>
    <p class="footer-fact"><a href="/about">Copy House Publishing</a> · <a href="/about">About the label</a></p>
  </div>
  <div class="footer-row">
    <p class="footer-label">Newsletter</p>
    <div class="footer-news">
      <form class="footer-form" action="https://formspree.io/f/xdkwjzzr" method="POST">
        <label class="sr-only" for="footerEmail">Email</label>
        <input type="email" id="footerEmail" name="email" placeholder="Email address" required autocomplete="email"/>
        <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" class="sr-only"/>
        <button type="submit">Subscribe</button>
      </form>
      <p class="footer-fact">Release alerts and first listens. No noise.</p>
    </div>
  </div>
  <div class="footer-row footer-row--end">
    <p class="footer-label">Pages</p>
    <nav class="footer-links" aria-label="Footer">
      <a href="/library">Library</a>
      <a href="/artists">Artists</a>
      <a href="/tapes">Mixtapes</a>
      <a href="/news">Night Shift</a>
      <a href="/merch">Shop</a>
      <a href="/join">Record Club</a>
      <a href="/about">About</a>
      <a href="/planet">Planet MP3</a>
      <a href="/contact">Contact</a>
    </nav>
  </div>
</footer>`;
}

const BASE_SCRIPTS = ["site.js", "cart.js", "member.js", "player.js"];

function scriptTags(list) {
  return list.map((s) => `<script src="/js/${s}?v=${VERSION}"></script>`).join("\n");
}

/**
 * page({ title, description, path, canonical, bodyClass, main, scripts, jsonld, image, noindex })
 */
function page(o) {
  const title = o.title ? `${o.title} — Club Copy` : "Club Copy";
  const canonical = o.canonical || ORIGIN + (o.path === "/index" ? "/" : o.path || "/");
  const image = asset(o.image || "/pitch-black-cover.webp");
  const ogImage = /^https?:/.test(image) ? image : ORIGIN + image;
  const jsonld = (o.jsonld || [])
    .map((obj) => `<script type="application/ld+json">${JSON.stringify(obj)}</script>`)
    .join("\n  ");
  const scripts = scriptTags(BASE_SCRIPTS.concat(o.scripts || []));
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <title>${esc(title)}</title>
  <meta name="description" content="${attr(o.description || "Club Copy is an independent record label from the Pacific Northwest. House, jungle and instrumental hip-hop on digital and cassette.")}"/>
  <meta name="theme-color" content="#cfc6b8"/>
  <meta name="color-scheme" content="light"/>
  <link rel="canonical" href="${canonical}"/>
  ${o.noindex ? '<meta name="robots" content="noindex"/>' : ""}
  <meta property="og:site_name" content="Club Copy"/>
  <meta property="og:type" content="${o.ogType || "website"}"/>
  <meta property="og:title" content="${attr(o.title || "Club Copy")}"/>
  <meta property="og:description" content="${attr(o.description || "Independent record label from the Pacific Northwest.")}"/>
  <meta property="og:url" content="${canonical}"/>
  <meta property="og:image" content="${ogImage}"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <link rel="icon" href="/apple-touch-icon.png"/>
  <link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,400..700;1,100,400&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet"/>
  ${THEME_BOOT}
  <link rel="stylesheet" href="/css/cc.css?v=${CSS_VERSION}"/>
  ${o.preload ? `<link rel="preload" as="image" href="${asset(o.preload)}" fetchpriority="high"/>` : ""}
  ${jsonld}
</head>
<body class="${esc(["cc", o.bodyClass || ""].join(" ").trim())}"${o.bodyAttrs ? " " + o.bodyAttrs : ""}>
<a class="skip-link" href="#main">Skip to content</a>
${navHtml(o.nav || o.path)}
<main id="main"${o.mainClass ? ` class="${o.mainClass}"` : ""}${o.mainAttrs ? " " + o.mainAttrs : ""}>
${o.main}
</main>
${footerHtml()}
${scripts}
${o.inline ? `<script>${o.inline}</script>` : ""}
</body>
</html>
`;
}

/* Shared fragments ------------------------------------------------------ */

/** Display size for a two-line artist/title lockup, from the longer string. */
function leadSize(title, artist) {
  const n = Math.max(String(title || "").length, String(artist || "").length);
  if (n <= 12) return ["clamp(44px, 7.6vw, 120px)", "clamp(40px, 12vw, 56px)"];
  if (n <= 20) return ["clamp(40px, 6vw, 92px)", "clamp(36px, 10.5vw, 48px)"];
  if (n <= 32) return ["clamp(36px, 4.6vw, 68px)", "clamp(30px, 8.6vw, 40px)"];
  return ["clamp(32px, 3.9vw, 58px)", "clamp(28px, 7.6vw, 36px)"];
}
/** Typographic title: a spaced hyphen becomes an en dash. */
function dashTitle(t) {
  return String(t || "").replace(/\s-\s/g, " – ");
}

function playKey(rel, opts) {
  opts = opts || {};
  if (!hasCue(rel)) return "";
  const track = rel.previewTrackId || (rel.tracks && rel.tracks[0] && rel.tracks[0].id) || "";
  return `<button type="button" class="key key--play${opts.className ? " " + opts.className : ""}" data-play-release="${attr(rel.id)}"${track ? ` data-play-track="${attr(track)}"` : ""} aria-label="Play ${attr(rel.title)}"><svg class="sc-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><svg class="sc-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg></button>`;
}

function crumbs(items) {
  return `<nav class="crumbs" aria-label="Breadcrumb">${items
    .map(([href, label], i) => (href && i < items.length - 1 ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`))
    .join('<span class="crumbs-sep" aria-hidden="true">/</span>')}</nav>`;
}

/** Artist bios are plain text. A blank line starts a new paragraph. */
function bioParagraphs(bio) {
  return String(bio || "")
    .split(/\n\s*\n/)
    .map((s) => s.replace(/\s*\n\s*/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);
}
function bioText(bio) {
  return bioParagraphs(bio).join(" ");
}
function bioBlock(bio, className) {
  const parts = bioParagraphs(bio);
  if (!parts.length) return "";
  return `<div class="${className} bio">${parts.map((p) => `<p>${esc(p)}</p>`).join("")}</div>`;
}

function sectionHead(title, opts) {
  opts = opts || {};
  const H = opts.h || "h2";
  return `<header class="sec-head"${opts.id ? ` id="${opts.id}"` : ""}>
  <${H} class="sec-title"${opts.titleId ? ` id="${opts.titleId}"` : ""}>${opts.kicker ? `<span class="sec-kicker">${esc(opts.kicker)}</span>` : ""}${esc(title)}</${H}>
  ${opts.link ? `<a class="sec-link" href="${opts.link[0]}">${esc(opts.link[1])}</a>` : ""}
</header>`;
}

module.exports = {
  ROOT, ORIGIN, VERSION, NAV,
  esc, attr, money, clock, slugify, dateLong, dateShort, dateMono, asset,
  releaseSeconds, specLine, formatGlyphs, priceLine, freeDownload, downloadHref, hasCue, onSite,
  readJSON, write, page, navHtml, footerHtml, playKey, crumbs, sectionHead, leadSize, dashTitle, bioParagraphs, bioText, bioBlock, MONTHS, MONTHS_SHORT, parseISO,
};
