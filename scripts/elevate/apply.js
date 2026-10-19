#!/usr/bin/env node
/** Apply Night Shift elevate rewrites and the three Issue 01 pieces. */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..", "..");
const pieces = {
  ...require("./label.js"),
  ...require("./reviews.js"),
  ...require("./essays.js")
};
const fresh = require("./new.js");

const surgical = {
  "deep-sleep": {
    dek: "On 15 October 2026 Roni Size played a timber booth 1,375 feet under a Welsh slate mine. The world-record claim went out as a submission.",
    replacements: [
      ["The world-record line is still a submission.", "The world-record line went out as a submission."]
    ]
  },
  "still-looking-for-the-warehouse": {
    dek: "In Pursuit of Repetitive Beats puts a visitor in a car, a service station, and a 1989 acid-house chase at Sensoria in Sheffield.",
    replacements: [
      [
        "while somebody in the passenger seat did their eyeliner by the glow of the dashboard. ",
        ""
      ],
      [
        "Even if you were born decades after 1989, the ritual is familiar, because every good afters still runs on a group chat, a pin drop and a little faith.",
        "Even if you were born decades after 1989, the shape of the hunt is familiar: a meeting point, a delay, and a room you have not seen yet."
      ]
    ]
  },
  "no-undo": {
    dek: "On 7 October 2026 Jesper Kouthoofd told Highsnobiety he plans to stop making synthesizers, OP-1 included. DJ Mag wrote it up on 15 October.",
    replacements: [
      ["and printed this month.", "and printed in October 2026."],
      ["a reorganization last autumn", "a reorganization in autumn 2025"]
    ]
  },
  "eight-rooms-one-basement": {
    replacements: [
      [
        " Once that name fits on a tent, the advertisement has won. Vancouver does not need eight rooms and a roof full of downtown to tell those nights apart. A small licensed room and a famous name are already a different evening.",
        " Once that name fits on a tent, the advertisement has won."
      ]
    ]
  }
};

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function write(rel, text) {
  fs.writeFileSync(path.join(root, rel), text);
}
function wordsFromHtml(html) {
  const m = html.match(/<div class="news-body[^"]*">([\s\S]*?)<div class="news-ctas">/);
  if (!m) return 0;
  const text = m[1]
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}
function paraHtml(list) {
  return (list || [])
    .map((p) => {
      const t = String(p).trim();
      if (/^<(p|h2|h3|ul|ol|blockquote|div|figure)\b/.test(t)) return "        " + t;
      return "        <p>" + t + "</p>";
    })
    .join("\n");
}
function ctaHtml(ctas) {
  return (ctas || [])
    .map(([href, text]) => `          <a href="${href}">${text}</a>`)
    .join("\n");
}
function attrEscape(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
function setMeta(html, key, value) {
  const esc = attrEscape(value);
  const re = new RegExp(
    `(<meta\\s+(?:name|property)="${key}"\\s+content=")[^"]*(")`,
    "g"
  );
  if (re.test(html)) {
    re.lastIndex = 0;
    return html.replace(re, `$1${esc}$2`);
  }
  if (key === "twitter:description" && /<meta name="twitter:title"/.test(html)) {
    return html.replace(
      /(<meta name="twitter:title" content="[^"]*"\/>)/,
      `$1\n  <meta name="twitter:description" content="${esc}"/>`
    );
  }
  throw new Error("meta not found: " + key);
}
function setJsonDescription(html, dek) {
  const encoded = JSON.stringify(dek);
  const next = html.replace(
    /"description":\s*"(?:\\.|[^"\\])*"/g,
    `"description": ${encoded}`
  );
  if (next === html) throw new Error("json description not found");
  return next;
}
function setStandfirst(html, dek) {
  if (/<p class="zine-dek">/.test(html)) {
    return html.replace(/<p class="zine-dek">[\s\S]*?<\/p>/, `<p class="zine-dek">${dek}</p>`);
  }
  if (/<p class="zine-pull">/.test(html)) {
    return html.replace(/<p class="zine-pull">[\s\S]*?<\/p>/, `<p class="zine-pull">${dek}</p>`);
  }
  throw new Error("no standfirst");
}
function setKicker(html, kicker) {
  return html.replace(/(<p class="news-kicker"><span>)[^<]*/, `$1${kicker}`);
}
function setBody(html, piece) {
  const paras = paraHtml([].concat(piece.paras || [], piece.afterParas || []));
  const ctas = ctaHtml(piece.ctas);
  const re = /(<div class="news-body[^"]*">)([\s\S]*?)(<div class="news-ctas">)([\s\S]*?)(<\/div>)/;
  if (!re.test(html)) throw new Error("body/ctas not found");
  return html.replace(re, (full, open, _old, ctaOpen, _cta, ctaClose) => {
    return `${open}\n${paras}\n\n        ${ctaOpen}\n${ctas}\n        ${ctaClose}`;
  });
}
function replaceAll(hay, needle, next) {
  if (!needle || needle === next) return { text: hay, n: 0 };
  const parts = hay.split(needle);
  return { text: parts.join(next), n: parts.length - 1 };
}

const news = JSON.parse(read("data/news.json"));
const byId = new Map(news.articles.map((a) => [a.id, a]));
const report = [];
let newsHtml = read("news.html");
let issueHtml = read("news/issue-01.html");
let zineJs = read("js/zine.js");

function syncDek(oldDek, newDek) {
  if (!oldDek || !newDek || oldDek === newDek) return;
  for (const bucket of [
    ["news.html", newsHtml],
    ["issue-01", issueHtml],
    ["zine.js", zineJs]
  ]) {
    const hit = replaceAll(bucket[1], oldDek, newDek);
    if (bucket[0] === "news.html") newsHtml = hit.text;
    else if (bucket[0] === "issue-01") issueHtml = hit.text;
    else zineJs = hit.text;
  }
}

function applyStory(slug, piece, opts) {
  const rel = `news/${slug}.html`;
  let html = read(rel);
  const before = wordsFromHtml(html);
  const stand = html.match(/<p class="(?:zine-dek|zine-pull)">([\s\S]*?)<\/p>/);
  const oldStand = stand ? stand[1] : "";
  const art = byId.get(slug);
  const oldCard = art ? art.dek : oldStand;
  if (piece.dek) {
    html = setMeta(html, "description", piece.dek);
    html = setMeta(html, "og:description", piece.dek);
    html = setMeta(html, "twitter:description", piece.dek);
    html = setJsonDescription(html, piece.dek);
    html = setStandfirst(html, piece.dek);
    syncDek(oldCard, piece.dek);
    syncDek(oldStand, piece.dek);
    if (art) art.dek = piece.dek;
  }
  if (piece.kicker) html = setKicker(html, piece.kicker);
  if (piece.format && art) {
    const oldFormat = art.format;
    art.format = piece.format;
    if (oldFormat !== piece.format) {
      const em = new RegExp(
        `(<a href="/news/${slug}">[\\s\\S]*?</a>\\s*<em>)[^<]*(</em>)`
      );
      newsHtml = newsHtml.replace(em, `$1${piece.format}$2`);
      issueHtml = issueHtml.replace(em, `$1${piece.format}$2`);
    }
    if (art.kicker && piece.kicker) art.kicker = piece.kicker;
  }
  if (piece.paras) html = setBody(html, piece);
  if (opts && opts.replacements) {
    for (const [from, to] of opts.replacements) {
      if (!html.includes(from)) throw new Error(slug + " missing replacement: " + from.slice(0, 60));
      html = html.replace(from, to);
    }
  }
  if (slug === "riscape-on-club-copy") {
    html = html.replace(">signed 26<", ">two EPs<");
  }
  write(rel, html);
  report.push({
    slug,
    oldDek: oldCard || "",
    newDek: piece.dek || oldCard || "",
    wordsBefore: before,
    wordsAfter: wordsFromHtml(html),
    format: (art && art.format) || piece.format || ""
  });
}

for (const slug of Object.keys(pieces)) {
  if (!byId.has(slug)) throw new Error("missing news.json id " + slug);
  applyStory(slug, pieces[slug]);
}
for (const slug of Object.keys(surgical)) {
  applyStory(slug, surgical[slug], surgical[slug]);
}

function page(spec, prev, next) {
  const dek = spec.dek;
  const paras = paraHtml(spec.paras);
  const ctas = ctaHtml(spec.ctas);
  const navPrev = prev
    ? `<a href="/news/${prev.slug}">previous: ${prev.headline}</a>`
    : "";
  const navNext = next
    ? `<a href="/news/${next.slug}">next: ${next.headline}</a>`
    : "";
  const desc = attrEscape(dek);
  const alt = attrEscape(spec.imageAlt);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <title>${spec.headline} | Night Shift</title>
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {"@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.clubcopy.ca/"},
    {"@type": "ListItem", "position": 2, "name": "Zine", "item": "https://www.clubcopy.ca/news"},
    {"@type": "ListItem", "position": 3, "name": ${JSON.stringify(spec.headline)}, "item": "https://www.clubcopy.ca/news/${spec.slug}"}
  ]
}
  </script>
  <meta name="description" content="${desc}"/>
  <meta name="theme-color" content="#F7F5F1"/>
  <link rel="canonical" href="https://www.clubcopy.ca/news/${spec.slug}"/>
  <meta property="og:type" content="article"/>
  <meta property="og:site_name" content="Club Copy"/>
  <meta property="og:title" content="${attrEscape(spec.headline)}"/>
  <meta property="og:description" content="${desc}"/>
  <meta property="og:url" content="https://www.clubcopy.ca/news/${spec.slug}"/>
  <meta property="og:image" content="https://www.clubcopy.ca/${spec.image}"/>
  <meta property="og:image:alt" content="${alt}"/>
  <meta property="og:image:width" content="1200"/>
  <meta property="og:image:height" content="1200"/>
  <meta property="og:locale" content="en_CA"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <meta name="twitter:title" content="${attrEscape(spec.headline)} | Club Copy"/>
  <meta name="twitter:description" content="${desc}"/>
  <meta name="twitter:image" content="https://www.clubcopy.ca/${spec.image}"/>
  <meta name="twitter:image:alt" content="${alt}"/>
  <meta property="article:published_time" content="2026-10-19"/>
  <meta property="article:author" content="CJ Archer"/>
  <script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": ${JSON.stringify(spec.headline)},
  "description": ${JSON.stringify(dek)},
  "datePublished": "2026-10-19",
  "dateModified": "2026-10-19",
  "author": {"@type": "Person", "name": "CJ Archer", "url": "https://www.clubcopy.ca/artists/cj-archer"},
  "image": ["https://www.clubcopy.ca/${spec.image}"],
  "mainEntityOfPage": "https://www.clubcopy.ca/news/${spec.slug}",
  "publisher": {
    "@type": "Organization",
    "name": "Club Copy",
    "url": "https://www.clubcopy.ca",
    "logo": {"@type": "ImageObject", "url": "https://www.clubcopy.ca/apple-touch-icon.png", "width": 512, "height": 512}
  }
}
  </script>
  <link rel="icon" href="../favicon.png" type="image/png"/>
  <link rel="apple-touch-icon" href="../apple-touch-icon.png"/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,75,400;0,100,400;0,100,500;0,100,600;0,100,700;1,100,400&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/site.css?v=st33"/>
  <link rel="stylesheet" href="../css/news.css?v=st33"/>
  <link rel="stylesheet" href="../css/zine-pages.css?v=st33"/>
  <link rel="stylesheet" href="/css/graphic-pass.css?v=gp3"/>
  <link rel="stylesheet" href="../css/player.css?v=st35"/>
</head>
<body id="top" class="news-listing news-story nav-on-dark zine-surface nav-light">
<a class="skip-link" href="#main">Skip to content</a>
<header class="nav" id="nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo" aria-label="Club Copy home"><img src="../club-copy-nav-ink.webp" alt="Club Copy" width="901" height="418"/></a>
    <nav class="nav-links" aria-label="Primary">
      <a href="/library">Library</a>
      <a href="/artists">Artists</a>
      <a href="/tapes">Mixtapes</a>
      <a href="/news">Zine</a>
      <a href="/merch">Shop</a>
      <a href="/#join">Join</a>
    </nav>
    <div class="nav-end">
      <a href="/cart" class="nav-cart" data-cart-link aria-label="Cart">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M6 8h15l-1.4 8.4a2 2 0 0 1-2 1.6H9a2 2 0 0 1-2-1.6L5 4H2"/>
          <circle cx="10" cy="20" r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="18" cy="20" r="1.2" fill="currentColor" stroke="none"/>
        </svg>
        <span class="nav-cart-count" data-cart-count hidden>0</span>
      </a>
      <button class="nav-ham" id="navHam" aria-label="Menu" aria-expanded="false"><span></span><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="nav-drawer" id="navDrawer" aria-hidden="true">
  <a href="/library">Library</a>
  <a href="/artists">Artists</a>
  <a href="/tapes">Mixtapes</a>
  <a href="/news">Zine</a>
  <a href="/merch">Shop</a>
  <a href="/#join">Join</a>
  <a href="/contact">Contact</a>
  <a href="/cart">Cart</a>
</div>
<main id="main" class="news-page">
  <div class="zine-sheet zine-sheet--story">
    <nav class="crumbs zine-story-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/news">Night Shift</a><span>/</span>${spec.headline}</nav>
    <article class="news-article news-article--essay" data-zine-story>
      <figure class="news-article-hero">
        <span class="zine-tape" aria-hidden="true"></span>
        <img src="../${spec.image}" alt="${alt}" width="1200" height="1200" fetchpriority="high"/>
        <figcaption>Artwork: VCR Recordings</figcaption>
      </figure>
      <p class="news-kicker"><span>${spec.kicker}</span><span>Oct 19, 2026</span></p>
      <h1 class="zine-headline">${spec.headline}</h1>
      <p class="zine-dek">${dek}</p>
      <p class="news-byline">posted by cj archer · Oct 19, 2026</p>
      <p class="story-meta">Issue 01 · Artwork: VCR Recordings · 19 Oct 2026</p>
      <div class="news-body news-body--essay">
${paras}

        <div class="news-ctas">
${ctas}
        </div>
      </div>
      <p class="news-byline news-byline--end">CJ Archer</p>
      <nav class="news-nav" aria-label="News navigation">
        ${navPrev}
        <a href="/news">all issues</a>
        ${navNext}
      </nav>
    </article>
  </div>
</main>
<footer class="footer">
  <div class="band">
    <div class="footer-top">
      <div>
        <a class="footer-wordmark" href="/">Club Copy</a>
        <p class="footer-publisher"><a href="/about">Copy House Publishing</a></p>
        <p class="footer-mail"><a href="mailto:charlie@clubcopy.ca">charlie@clubcopy.ca</a></p>
      </div>
      <div>
        <label for="footerEmail">Email updates</label>
        <form class="footer-form" action="https://formspree.io/f/xdkwjzzr" method="POST">
          <input type="email" id="footerEmail" name="email" placeholder="Email" required autocomplete="email"/>
          <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px"/>
          <button type="submit">Join</button>
        </form>
        <p class="footer-note">Subscribe for updates.</p>
      </div>
    </div>
    <div class="footer-bottom">
      <p class="footer-copy">© 2026 Club Copy</p>
      <div class="footer-links">
        <a href="/library">Library</a>
        <a href="/artists">Artists</a>
        <a href="/tapes">Mixtapes</a>
        <a href="/news">Zine</a>
        <a href="/merch">Shop</a>
        <a href="/shipping">Shipping</a>
        <a href="/planet">Planet MP3</a>
        <a href="/contact">Contact</a>
      </div>
    </div>
  </div>
</footer>
<script src="../js/zine.js"></script>
<script src="../js/site.js"></script>
<script src="../js/cart.js"></script>
<script src="../js/player.js?v=st35"></script>
<script src="../js/member.js"></script>
</body>
</html>
`;
}

const chain = [
  { slug: "five-records-from-cumberland", headline: fresh["five-records-from-cumberland"].headline },
  { slug: "nightshift-vol-3", headline: fresh["nightshift-vol-3"].headline },
  { slug: "the-strait-is-not-a-scene", headline: fresh["the-strait-is-not-a-scene"].headline }
];
const stars = read("news/stars-for-the-floor.html");
if (!stars.includes('href="/news">all issues</a>')) throw new Error("stars nav missing");
if (stars.includes("next:")) throw new Error("stars already has next");
write(
  "news/stars-for-the-floor.html",
  stars.replace(
    '<a href="/news">all issues</a>',
    `<a href="/news">all issues</a>\n        <a href="/news/five-records-from-cumberland">next: Five Records from Cumberland</a>`
  )
);
chain.forEach((item, i) => {
  const spec = { ...fresh[item.slug], slug: item.slug };
  const prev = i === 0 ? { slug: "stars-for-the-floor", headline: "Stars for the Floor" } : chain[i - 1];
  const next = chain[i + 1];
  write(`news/${item.slug}.html`, page(spec, prev, next));
  const article = {
    id: item.slug,
    slug: "/news/" + item.slug,
    date: "2026-10-19",
    issue: 1,
    format: spec.format,
    dateLabel: "Oct 19, 2026",
    type: spec.format === "Mix" ? "mix" : spec.format === "Essay" ? "essay" : "feature",
    author: "CJ Archer",
    headline: spec.headline,
    dek: spec.dek,
    kicker: spec.kicker,
    image: spec.image,
    imageAlt: spec.imageAlt,
    credit: "Artwork: VCR Recordings",
    location: spec.location,
    home: true,
    typeLabel: spec.format
  };
  news.articles.unshift(article);
  report.push({
    slug: item.slug,
    oldDek: "",
    newDek: spec.dek,
    wordsBefore: 0,
    wordsAfter: wordsFromHtml(read(`news/${item.slug}.html`)),
    format: spec.format,
    headline: spec.headline,
    added: true
  });
});

function tocItem(slug, headline, dek) {
  return `          <li>
            <a href="/news/${slug}">${headline}</a>
            <span>${dek}</span>
            <time datetime="2026-10-19">19 Oct 2026</time>
          </li>
`;
}
function insertBeforeLink(html, href, block) {
  const needle = `<li>\n            <a href="${href}">`;
  if (!html.includes(needle)) throw new Error("toc anchor missing " + href);
  return html.replace(needle, block + needle);
}
const five = fresh["five-records-from-cumberland"];
const mix = fresh["nightshift-vol-3"];
const essay = fresh["the-strait-is-not-a-scene"];
for (const which of ["news", "issue"]) {
  let html = which === "news" ? newsHtml : issueHtml;
  html = insertBeforeLink(html, "/news/still-looking-for-the-warehouse", tocItem("five-records-from-cumberland", five.headline, five.dek));
  html = insertBeforeLink(html, "/news/they-settled-it-at-afterhours", tocItem("the-strait-is-not-a-scene", essay.headline, essay.dek));
  const mixSection = `      <section>
        <h3>Mix</h3>
        <ol class="issue-toc">
${tocItem("nightshift-vol-3", mix.headline, mix.dek)}        </ol>
      </section>
      <section>
        <h3>Column</h3>`;
  if (!html.includes("<h3>Column</h3>")) throw new Error("column heading missing");
  html = html.replace("      <section>\n        <h3>Column</h3>", mixSection);
  if (which === "news") newsHtml = html;
  else issueHtml = html;
}

function rebuildItemList(html) {
  const re = /\{"@type": "ListItem", "position": \d+, "name": "((?:\\.|[^"\\])*)", "url": "(https:\/\/www\.clubcopy\.ca\/news\/[^"]+)"\}/g;
  const items = [];
  let m;
  const blockStart = html.indexOf('"itemListElement"');
  const blockEnd = html.indexOf("</script>", blockStart);
  const block = html.slice(blockStart, blockEnd);
  while ((m = re.exec(block))) items.push({ name: JSON.parse(`"${m[1]}"`), url: m[2] });
  if (items.length < 70) throw new Error("item list parse " + items.length);
  function insertAfter(urlSuffix, item) {
    const i = items.findIndex((x) => x.url.endsWith(urlSuffix));
    if (i < 0) throw new Error("list missing " + urlSuffix);
    items.splice(i + 1, 0, item);
  }
  function insertBefore(urlSuffix, item) {
    const i = items.findIndex((x) => x.url.endsWith(urlSuffix));
    if (i < 0) throw new Error("list missing " + urlSuffix);
    items.splice(i, 0, item);
  }
  insertAfter("/news/deep-sleep", {
    name: five.headline,
    url: "https://www.clubcopy.ca/news/five-records-from-cumberland"
  });
  insertBefore("/news/they-settled-it-at-afterhours", {
    name: essay.headline,
    url: "https://www.clubcopy.ca/news/the-strait-is-not-a-scene"
  });
  insertBefore("/news/stars-for-the-floor", {
    name: mix.headline,
    url: "https://www.clubcopy.ca/news/nightshift-vol-3"
  });
  const body = items
    .map(
      (item, i) =>
        `      {"@type": "ListItem", "position": ${i + 1}, "name": ${JSON.stringify(item.name)}, "url": ${JSON.stringify(item.url)}}`
    )
    .join(",\n");
  const next = html.replace(
    /"numberOfItems": \d+/,
    `"numberOfItems": ${items.length}`
  ).replace(/"itemListElement": \[[\s\S]*?\n    \]/, `"itemListElement": [\n${body}\n    ]`);
  return next;
}
newsHtml = rebuildItemList(newsHtml);

let sitemap = read("sitemap.xml");
const siteBlock = `  <url>
    <loc>https://www.clubcopy.ca/news/stars-for-the-floor</loc>
    <lastmod>2026-10-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
if (!sitemap.includes(siteBlock)) throw new Error("sitemap stars block missing");
const extra = ["five-records-from-cumberland", "nightshift-vol-3", "the-strait-is-not-a-scene"]
  .map(
    (slug) => `  <url>
    <loc>https://www.clubcopy.ca/news/${slug}</loc>
    <lastmod>2026-10-19</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("\n");
sitemap = sitemap.replace(siteBlock, siteBlock + "\n" + extra);

write("data/news.json", JSON.stringify(news, null, 2) + "\n");
write("news.html", newsHtml);
write("news/issue-01.html", issueHtml);
write("js/zine.js", zineJs);
write("sitemap.xml", sitemap);
write("scripts/elevate/report.json", JSON.stringify(report, null, 2) + "\n");

const problems = [];
for (const row of report) {
  const len = [...row.newDek].length;
  if (row.newDek && len > 160) problems.push(row.slug + " dek " + len);
  if (row.added && (row.wordsAfter < 600 || row.wordsAfter > 1200)) {
    problems.push(row.slug + " words " + row.wordsAfter);
  }
}
const labelSlugs = new Set(Object.keys(require("./label.js")));
for (const row of report) {
  if (row.added || row.slug === "deep-sleep") continue;
  const n = row.wordsAfter;
  if (labelSlugs.has(row.slug) && row.slug !== "cj-archer-interview") {
    if (n < 500 || n > 900) problems.push(row.slug + " label words " + n);
  } else if (n < 600 || n > 1200) {
    problems.push(row.slug + " words " + n);
  }
}
if (problems.length) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log("applied " + report.length);
for (const row of report.filter((r) => r.added)) {
  console.log("NEW", row.slug, row.wordsAfter, row.newDek.length);
}
