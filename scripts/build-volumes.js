#!/usr/bin/env node
/** Build Night Shift monthly volumes for 2026. Idempotent. */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const ORDER = ["Feature", "Essay", "Interview", "Scene Report", "Review", "Release", "Mix", "Column"];
const EDITORS_NOTE = "Some pieces in this volume were published on 21 October 2026 and filed here because the month was thin. The file strip on those pages gives that date.";
const PUBLISHED = "2026-10-21";

const LISTEN_TITLES = {
  "pitch-black": "Pitch Black",
  "summer-madness": "Summer Madness",
  "classic-jazz": "Classic Jazz",
  jungle94: "DEEP IN THA JUNGLE — '94 HARDCORE",
  jungle96: "DEEP IN THA JUNGLE — 1996 ATMOSPHERE",
  bliss: "blissed out: shoegaze & dreampop (vol. 1) pt. 01",
};

const PHOTO_LINES = {
  "/news/cobalt-party-like-the-lease-is-ending": 'Gates of Ale · <a href="https://creativecommons.org/licenses/by-sa/3.0/" rel="noopener noreferrer">CC BY-SA 3.0</a> · <a href="https://commons.wikimedia.org/wiki/File%3ACobalt-Motor-Hotel-Vancouver-BC.jpg" rel="noopener noreferrer">Wikimedia Commons</a> · <a href="/news/cobalt-party-like-the-lease-is-ending">Party Like the Lease Is Ending</a>',
  "/news/no-fun-city-still-raids-the-rooms": 'Jerry Meaden · <a href="https://creativecommons.org/licenses/by/2.0/" rel="noopener noreferrer">CC BY 2.0</a> · <a href="https://commons.wikimedia.org/wiki/File%3AVancouver_Night_Skyline_%2815141299159%29.jpg" rel="noopener noreferrer">Wikimedia Commons</a> · <a href="/news/no-fun-city-still-raids-the-rooms">No Fun City Still Raids the Rooms</a>',
  "/news/madame-lous-is-dead-bottlerocket-wants-the-basement": 'Joe Mabel · <a href="https://creativecommons.org/licenses/by-sa/3.0/" rel="noopener noreferrer">CC BY-SA 3.0</a> · <a href="https://commons.wikimedia.org/wiki/File%3ACrocodile_Cafe.jpg" rel="noopener noreferrer">Wikimedia Commons</a> · <a href="/news/madame-lous-is-dead-bottlerocket-wants-the-basement">Madame Lou\'s Is Dead. Bottlerocket Wants the Basement.</a>',
  "/news/fifa-vs-the-underground": 'Mike · <a href="https://creativecommons.org/licenses/by-sa/2.0/" rel="noopener noreferrer">CC BY-SA 2.0</a> · <a href="https://commons.wikimedia.org/wiki/File%3ABC_Place_Stadium_%282015%29.jpg" rel="noopener noreferrer">Wikimedia Commons</a> · <a href="/news/fifa-vs-the-underground">FIFA vs the Underground</a>',
  "/news/the-missing-p": 'parttimemusic · <a href="https://creativecommons.org/licenses/by-sa/2.0/" rel="noopener noreferrer">CC BY-SA 2.0</a> · <a href="https://commons.wikimedia.org/wiki/File%3ASebadoh-16.jpg" rel="noopener noreferrer">Wikimedia Commons</a> · <a href="/news/the-missing-p">The Missing P</a>',
  "/news/portland-finally-got-an-all-ages-temple": 'Tony Webster · <a href="https://creativecommons.org/licenses/by/2.0/" rel="noopener noreferrer">CC BY 2.0</a> · <a href="https://commons.wikimedia.org/wiki/File%3ADowntown_Portland_Oregon_at_Night_%2818103693355%29.jpg" rel="noopener noreferrer">Wikimedia Commons</a> · <a href="/news/portland-finally-got-an-all-ages-temple">Portland Finally Got an All-Ages Temple</a>',
};

function pad(n) {
  return String(n).padStart(2, "0");
}

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function wordsOf(body) {
  const text = body.map((part) => (typeof part === "string" ? part : "")).join(" ");
  return text.split(/\s+/).filter(Boolean).length;
}

function prettyDate(iso) {
  const [y, m, d] = iso.split("-");
  return parseInt(d, 10) + " " + MONTHS_SHORT[parseInt(m, 10) - 1] + " " + y;
}

function fileDate(iso) {
  const [y, m, d] = iso.split("-");
  return MONTHS_SHORT[parseInt(m, 10) - 1] + " " + parseInt(d, 10) + ", " + y;
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function write(rel, text) {
  fs.writeFileSync(path.join(ROOT, rel), text);
}

function pieces() {
  return ["a", "b", "c", "d"].flatMap((part) => require("./pieces/part-" + part + ".js"));
}

function listenLibrary(articles) {
  const byTitle = {};
  articles.forEach((article) => {
    if (article.listen && article.listen.title && !byTitle[article.listen.title]) {
      byTitle[article.listen.title] = JSON.parse(JSON.stringify(article.listen));
    }
  });
  const out = {};
  Object.keys(LISTEN_TITLES).forEach((key) => {
    const found = byTitle[LISTEN_TITLES[key]];
    if (!found) throw new Error("Missing listen cue " + key);
    out[key] = found;
  });
  return out;
}

const REMOVED = new Set([
  "aquarius-ep",
  "geogaddi",
  "unfinished-sympathy",
  "shook-ones-part-ii",
  "hymn-of-the-big-wheel",
  "share-the-fall",
  "no-good-start-the-dance",
  "tomorrows-harvest",
]);

const BANNED = [
  "this page",
  "this piece",
  "this essay",
  "this volume",
  "this magazine",
  "this desk",
  "listed as",
  "the table",
  "will not",
  "the same site",
  "discography",
  "wikipedia",
  "the page",
  "does not give",
  "song history",
];

function assertVoice(piece) {
  const words = wordsOf(piece.body);
  if (words < 600) throw new Error(piece.id + " is " + words + " words");
  const blob = [piece.headline, piece.dek]
    .concat(piece.body.map((part) => (typeof part === "string" ? part : part.h2 || "")))
    .join("\n")
    .toLowerCase();
  BANNED.forEach((phrase) => {
    const re = new RegExp("\\b" + phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "i");
    if (re.test(blob)) throw new Error(piece.id + " contains “" + phrase + "”");
  });
}

function articleFromPiece(piece, cues) {
  assertVoice(piece);
  const words = wordsOf(piece.body);
  return {
    id: piece.id,
    slug: "/news/" + piece.id,
    date: PUBLISHED,
    volume: piece.volume,
    format: piece.format,
    dateLabel: fileDate(PUBLISHED),
    type: piece.format === "Feature" ? "feature" : "essay",
    author: "CJ Archer",
    headline: piece.headline,
    dek: piece.dek,
    kicker: piece.format,
    location: (piece.places && piece.places[0]) || "",
    home: false,
    typeLabel: piece.format,
    listen: cues[piece.listen],
    artists: piece.artists || [],
    places: piece.places || [],
    words,
    readMinutes: Math.max(1, Math.round(words / 220)),
    added: true,
    sources: piece.sources,
    body: piece.body,
  };
}

function assignVolumes(articles) {
  articles.forEach((article) => {
    const kept = article.added ? article.volume : null;
    if (Object.prototype.hasOwnProperty.call(article, "issue")) delete article.issue;
    const year = String(article.date || "").slice(0, 4);
    if (article.archived || year !== "2026") article.volume = null;
    else if (article.added && kept != null) article.volume = kept;
    else article.volume = parseInt(String(article.date).slice(5, 7), 10);
  });
}

function storiesFor(articles, number) {
  return articles.filter((article) => article.volume === number && !article.archived);
}

function coverOf(stories) {
  const features = stories.filter((article) => article.format === "Feature");
  const pool = (features.length ? features : stories).slice();
  pool.sort((a, b) => (b.words || 0) - (a.words || 0));
  const cover = pool[0];
  const credited = Boolean(cover && cover.image && cover.credit);
  return { cover, credited };
}

function toc(stories, cover) {
  const groups = {};
  stories.forEach((article) => {
    const name = article.format || "Essay";
    if (!groups[name]) groups[name] = [];
    groups[name].push(article);
  });
  let html = '<section class="issue-contents" aria-labelledby="contents-title">\n      <h2 id="contents-title">Contents</h2>\n';
  ORDER.forEach((name) => {
    const items = groups[name];
    if (!items || !items.length) return;
    items.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    items.sort((a, b) => (a.slug === cover.slug ? 0 : 1) - (b.slug === cover.slug ? 0 : 1));
    html += "      <section>\n        <h3>" + esc(name) + "</h3>\n        <ol class=\"issue-toc\">\n";
    items.forEach((article) => {
      html +=
        "          <li>\n            <a href=\"" + esc(article.slug) + "\">" + esc(article.headline) + "</a>\n            <span>" +
        esc(article.dek || "") + "</span>\n            <time datetime=\"" + esc(article.date) + "\">" +
        esc(prettyDate(article.date)) + "</time>\n          </li>\n";
    });
    html += "        </ol>\n      </section>\n";
  });
  return html + "    </section>\n";
}

function coverBlock(volume, stories, imagePrefix) {
  const { cover, credited } = coverOf(stories);
  const title = "Vol. " + pad(volume.number);
  const visual = credited
    ? '<figure class="issue-cover-figure">\n        <img src="' + esc(imagePrefix + cover.image) + '" alt="' + esc(cover.imageAlt || "") + '" width="1600" height="1066"/>\n        <figcaption>' + esc(cover.credit) + "</figcaption>\n      </figure>\n"
    : '<div class="cover-plate"><span>' + esc(title) + "</span><span>" + esc(volume.dateLabel) + "</span><span>" + esc(cover.headline) + "</span></div>\n";
  const note = stories.some((article) => article.added) ? '      <p class="issue-editors-note">' + esc(EDITORS_NOTE) + "</p>\n" : "";
  return (
    '    <article class="issue-cover">\n      <p class="issue-kicker">Night Shift · ' + esc(title) + " · " + esc(volume.dateLabel) + "</p>\n      " +
    visual +
    '      <p class="issue-cover-format">' + esc(cover.format || "") + "</p>\n      <h2 class=\"issue-cover-headline\"><a href=\"" +
    esc(cover.slug) + "\">" + esc(cover.headline) + "</a></h2>\n      <p class=\"issue-cover-dek\">" + esc(cover.dek || "") + "</p>\n" +
    note +
    "    </article>\n"
  );
}

function colophon(stories) {
  const writers = [];
  stories.forEach((article) => {
    const name = article.author || "CJ Archer";
    if (!writers.includes(name)) writers.push(name);
  });
  const photos = stories
    .filter((article) => article.credit)
    .map((article) => "          <li>" + (PHOTO_LINES[article.slug] || esc(article.credit) + ' · <a href="' + esc(article.slug) + '">' + esc(article.headline) + "</a>") + "</li>");
  const seen = new Set();
  const listens = [];
  stories.forEach((article) => {
    const listen = article.listen;
    if (!listen || !listen.title || seen.has(listen.title)) return;
    seen.add(listen.title);
    const cat = listen.catalogue && /^CC\d/.test(listen.catalogue) ? esc(listen.catalogue) + " · " : "";
    listens.push("          <li>" + cat + '<a href="' + esc(listen.page || listen.url) + '">' + esc(listen.title) + "</a> · " + esc(listen.artist || "") + "</li>");
  });
  let html = '    <section class="issue-colophon" data-issue-colophon aria-labelledby="colophon-title">\n      <h2 id="colophon-title">Colophon</h2>\n      <section>\n        <h3>Writers</h3>\n        <ul>\n' +
    writers.map((name) => "          <li>" + esc(name) + "</li>").join("\n") + "\n        </ul>\n      </section>\n";
  if (photos.length) html += "      <section>\n        <h3>Photographs</h3>\n        <ul>\n" + photos.join("\n") + "\n        </ul>\n      </section>\n";
  if (listens.length) html += "      <section>\n        <h3>Listen</h3>\n        <ul>\n" + listens.join("\n") + "\n        </ul>\n      </section>\n";
  return html + "    </section>\n";
}

function chrome(opts) {
  const imageMeta = opts.image
    ? '  <meta property="og:image" content="https://www.clubcopy.ca/' + esc(opts.image) + '"/>\n  <meta property="og:image:alt" content="' + esc(opts.imageAlt || "") + '"/>\n  <meta name="twitter:card" content="summary_large_image"/>\n  <meta name="twitter:image" content="https://www.clubcopy.ca/' + esc(opts.image) + '"/>\n  <meta name="twitter:image:alt" content="' + esc(opts.imageAlt || "") + '"/>\n'
    : '  <meta name="twitter:card" content="summary"/>\n';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <title>${esc(opts.title)}</title>
  <meta name="description" content="${esc(opts.description)}"/>
  <meta name="theme-color" content="#E8E8E6"/>
  <link rel="canonical" href="${esc(opts.canonical)}"/>
  <meta property="og:type" content="${opts.ogType || "website"}"/>
  <meta property="og:site_name" content="Club Copy"/>
  <meta property="og:title" content="${esc(opts.ogTitle || opts.title)}"/>
  <meta property="og:description" content="${esc(opts.description)}"/>
  <meta property="og:url" content="${esc(opts.canonical)}"/>
${imageMeta}  <meta property="og:locale" content="en_CA"/>
  <meta name="twitter:title" content="${esc(opts.ogTitle || opts.title)}"/>
  <meta name="twitter:description" content="${esc(opts.description)}"/>
${opts.extraHead || ""}  <link rel="icon" href="../favicon.png" type="image/png"/>
  <link rel="apple-touch-icon" href="../apple-touch-icon.png"/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,75,400;0,100,400;0,100,500;0,100,600;0,100,700;1,100,400&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/site.css?v=st33"/>
  <link rel="stylesheet" href="../css/news.css?v=vol1"/>
  <link rel="stylesheet" href="../css/zine-pages.css?v=st33"/>
  <link rel="stylesheet" href="/css/graphic-pass.css?v=gp4"/>
  <link rel="stylesheet" href="../css/player.css?v=st35"/>
</head>
<body id="top" class="${opts.bodyClass}">
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
${opts.main}
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
${opts.scripts || '<script src="../js/site.js"></script>\n<script src="../js/cart.js"></script>\n'}
</body>
</html>
`;
}

function bodyHtml(piece) {
  const parts = piece.body.map((part) => {
    if (typeof part === "string") return "        <p>" + esc(part) + "</p>";
    if (part && part.h2) return "        <h2>" + esc(part.h2) + "</h2>";
    return "";
  });
  const sources = (piece.sources || [])
    .map(([url, label]) => '          <li><a href="' + esc(url) + '">' + esc(label) + "</a></li>")
    .join("\n");
  return parts.join("\n") + "\n        <h2>Sources</h2>\n        <ul>\n" + sources + "\n        </ul>\n";
}

function storyPage(article, prev, next) {
  const vol = pad(article.volume);
  const description = article.dek;
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.headline,
    description,
    datePublished: article.date,
    dateModified: article.date,
    author: { "@type": "Person", name: "CJ Archer", url: "https://www.clubcopy.ca/artists/cj-archer" },
    mainEntityOfPage: "https://www.clubcopy.ca" + article.slug,
    publisher: {
      "@type": "Organization",
      name: "Club Copy",
      url: "https://www.clubcopy.ca",
      logo: { "@type": "ImageObject", url: "https://www.clubcopy.ca/apple-touch-icon.png", width: 512, height: 512 },
    },
  };
  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.clubcopy.ca/" },
      { "@type": "ListItem", position: 2, name: "Zine", item: "https://www.clubcopy.ca/news" },
      { "@type": "ListItem", position: 3, name: article.headline, item: "https://www.clubcopy.ca" + article.slug },
    ],
  };
  const places = article.places && article.places.length ? "        <div><dt>places</dt><dd>" + esc(article.places.join(", ")) + "</dd></div>\n" : "";
  const artists = article.artists && article.artists.length ? "        <div><dt>artists</dt><dd>" + esc(article.artists.join(", ")) + "</dd></div>\n" : "";
  const nav = ['      <nav class="news-nav" aria-label="News navigation">'];
  if (prev) nav.push('        <a href="' + esc(prev.slug) + '">previous: ' + esc(prev.headline) + "</a>");
  nav.push('        <a href="/news/vol-' + vol + '">Vol. ' + vol + "</a>");
  if (next) nav.push('        <a href="' + esc(next.slug) + '">next: ' + esc(next.headline) + "</a>");
  nav.push("      </nav>");
  const main = `<main id="main" class="news-page">
  <div class="zine-sheet zine-sheet--story">
    <nav class="crumbs zine-story-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/news">Night Shift</a><span>/</span>${esc(article.headline)}</nav>
    <article class="news-article news-article--essay" data-zine-story>
      <p class="news-kicker"><span>${esc(article.format)}</span><span>${esc(article.dateLabel)}</span></p>
      <h1 class="zine-headline">${esc(article.headline)}</h1>
      <p class="zine-dek">${esc(article.dek)}</p>
      <p class="news-byline">posted by cj archer · ${esc(article.dateLabel)}</p>
      <p class="story-meta">Vol. ${vol} · ${esc(prettyDate(article.date))}</p>
      <dl class="file-info" data-file-info>
        <div><dt>format</dt><dd>${esc(article.format)}</dd></div>
        <div><dt>volume</dt><dd>${vol}</dd></div>
        <div><dt>date</dt><dd>${esc(article.dateLabel)}</dd></div>
${places}${artists}        <div><dt>words</dt><dd>${article.words.toLocaleString("en-US")} words · ${article.readMinutes} min</dd></div>
        <div><dt>filed</dt><dd>Added to Vol. ${vol} — published ${esc(prettyDate(article.date))}</dd></div>
      </dl>
      <div class="news-body news-body--essay">
${bodyHtml(article)}        <div class="news-ctas">
          <a href="/news/vol-${vol}">Vol. ${vol}</a>
        </div>
      </div>
      <p class="news-byline news-byline--end">cj archer</p>
${nav.join("\n")}
    </article>
  </div>
</main>
`;
  return chrome({
    title: article.headline + " | Night Shift",
    ogTitle: article.headline + " | Club Copy",
    description,
    canonical: "https://www.clubcopy.ca" + article.slug,
    ogType: "article",
    bodyClass: "news-listing news-story nav-on-dark zine-surface nav-light",
    extraHead:
      '  <meta property="article:published_time" content="' + article.date + '"/>\n  <meta property="article:author" content="CJ Archer"/>\n  <script type="application/ld+json">\n' +
      JSON.stringify(crumbs, null, 2) +
      "\n  </script>\n  <script type=\"application/ld+json\">\n" +
      JSON.stringify(schema, null, 2) +
      "\n  </script>\n",
    main,
    scripts:
      '<script src="../js/zine.js?v=vol1"></script>\n<script src="../js/site.js"></script>\n<script src="../js/cart.js"></script>\n<script src="../js/player.js?v=st35"></script>\n<script src="../js/member.js"></script>\n',
  });
}

function volumeRecord(number, stories) {
  const { cover, credited } = coverOf(stories);
  const record = {
    number,
    title: "Vol. " + pad(number),
    month: "2026-" + pad(number),
    date: "2026-" + pad(number) + "-01",
    dateLabel: MONTHS[number - 1] + " 2026",
    coverSlug: cover.slug,
    coverHeadline: cover.headline,
  };
  if (credited) {
    record.coverImage = cover.image;
    record.coverImageAlt = cover.imageAlt || "";
  }
  if (stories.some((article) => article.added)) record.editorsNote = EDITORS_NOTE;
  return record;
}

function volumePage(record, stories) {
  const { cover, credited } = coverOf(stories);
  const main =
    '<main id="main" class="news-index">\n  <div class="zine-sheet">\n    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/news">Night Shift</a><span>/</span>' +
    esc(record.title) + "</nav>\n" +
    coverBlock(record, stories, "../") +
    "    " + toc(stories, cover).trim() + "\n" +
    colophon(stories) +
    '    <p class="issue-jump"><a href="/news">Current volume</a> · <a href="/news/issues">All volumes</a></p>\n  </div>\n</main>\n';
  return chrome({
    title: record.title + " | Night Shift",
    description: "Night Shift, " + record.title + ". " + record.dateLabel + ".",
    canonical: "https://www.clubcopy.ca/news/vol-" + pad(record.number),
    image: credited ? cover.image : "",
    imageAlt: credited ? cover.imageAlt : "",
    bodyClass: "news-listing nav-on-dark zine-surface nav-light",
    main,
  });
}

function spine(record, stories) {
  const { cover, credited } = coverOf(stories);
  const count = stories.length === 1 ? "1 story" : stories.length + " stories";
  const visual = credited
    ? '<img src="../' + esc(cover.image) + '" alt="' + esc(cover.imageAlt || "") + '" width="1600" height="1066"/>'
    : '<div class="cover-plate"><span>' + esc(record.title) + "</span><span>" + esc(record.dateLabel) + "</span><span>" + esc(cover.headline) + "</span></div>";
  return (
    '      <a class="issue-card" href="/news/vol-' + pad(record.number) + '">\n        ' + visual + "\n        <div>\n          <p>" +
    esc(record.title) + "</p>\n          <strong>" + esc(record.dateLabel) + '</strong>\n          <span class="issue-count">' +
    count + "</span>\n          <span>" + esc(cover.headline) + "</span>\n        </div>\n      </a>\n"
  );
}

function middle(article) {
  if (article.archived) return { href: "/news/archive", text: "Archive" };
  if (article.volume) return { href: "/news/vol-" + pad(article.volume), text: "Vol. " + pad(article.volume) };
  return { href: "/news", text: "Night Shift" };
}

function patchStory(html, article) {
  const link = middle(article);
  html = html.replace(/<a href="\/news">all issues<\/a>/g, '<a href="' + link.href + '">' + link.text + "</a>");
  if (article.volume) {
    const vol = pad(article.volume);
    html = html.replace(/<p class="story-meta">(?:Issue 01|Back Catalogue)/, '<p class="story-meta">Vol. ' + vol);
    if (/<dt>issue<\/dt>/.test(html)) {
      html = html.replace(/<dt>issue<\/dt>\s*<dd>[^<]*<\/dd>/, "<dt>volume</dt><dd>" + vol + "</dd>");
    } else if (!/<dt>volume<\/dt>/.test(html) && /<dt>format<\/dt>/.test(html)) {
      html = html.replace(/(<div><dt>format<\/dt><dd>[^<]*<\/dd><\/div>)/, '$1\n        <div><dt>volume</dt><dd>' + vol + "</dd></div>");
    }
  }
  if (article.id === "the-strait-is-not-a-scene" && !html.includes('href="/news/leftism"')) {
    html = html.replace(/<nav class="news-nav"[\s\S]*?<\/nav>/, (nav) => {
      if (/next:/.test(nav)) return nav;
      return nav.replace(/\s*<\/nav>/, '\n        <a href="/news/leftism">next: Leftism</a>\n      </nav>');
    });
  }
  return html;
}

function storyItem(article) {
  return (
    "<li>\n          <a href=\"" + esc(article.slug) + "\">" + esc(article.headline) + "</a>\n          <em>" +
    esc(article.format || "") + '</em>\n          <time datetime="' + esc(article.date) + '">' + esc(prettyDate(article.date)) + "</time>\n        </li>\n"
  );
}

function mergeIndex(rel, articles, key) {
  let html = read(rel);
  const start = html.indexOf('<div class="library-index">');
  const end = html.indexOf('<p class="issue-jump">');
  if (start < 0 || end < 0) throw new Error("No library index in " + rel);
  const block = html.slice(start, end);
  const intro = (block.match(/<p>[\s\S]*?<\/p>/) || ["<p></p>"])[0];
  const sections = [];
  const byId = {};
  const re = /<section id="([^"]+)">\s*<h2>([^<]*)<\/h2>\s*<ol class="catalogue-list">([\s\S]*?)<\/ol>\s*<\/section>/g;
  let match;
  if (!/<section id=/.test(block)) throw new Error("index parse failed " + rel);
  while ((match = re.exec(block))) {
    const entry = {
      id: match[1],
      nameHtml: match[2],
      name: match[2].replace(/&#x27;/g, "'").replace(/&amp;/g, "&"),
      inner: match[3],
      slugs: new Set(Array.from(match[3].matchAll(/href="([^"]+)"/g)).map((hit) => hit[1])),
    };
    sections.push(entry);
    byId[entry.id] = entry;
  }
  articles.forEach((article) => {
    (article[key] || []).forEach((name) => {
      const id = slugify(name);
      let entry = byId[id];
      if (!entry) {
        entry = { id, nameHtml: esc(name), name, inner: "\n", slugs: new Set() };
        sections.push(entry);
        byId[id] = entry;
      }
      if (entry.slugs.has(article.slug)) return;
      entry.inner += "        " + storyItem(article).trim() + "\n";
      entry.slugs.add(article.slug);
    });
  });
  sections.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }));
  const rebuilt =
    '<div class="library-index">\n      ' + intro + "\n" +
    sections.map((entry) => '      <section id="' + entry.id + '">\n        <h2>' + entry.nameHtml + '</h2>\n        <ol class="catalogue-list">' + entry.inner + "        </ol>\n      </section>\n").join("") +
    "    ";
  html = html.slice(0, start) + rebuilt + html.slice(end);
  html = html.replace('<a href="/news">Issue 01</a>', '<a href="/news">Vol. 10</a><a href="/news/issues">Volumes</a>');
  write(rel, html);
}

function sitemapUrl(loc, lastmod, extra) {
  return "  <url>\n    <loc>https://www.clubcopy.ca" + loc + "</loc>\n    <lastmod>" + lastmod + "</lastmod>\n" + (extra || "") + "  </url>\n";
}

function stripSlug(html, slugs) {
  slugs.forEach((slug) => {
    const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    html = html.replace(new RegExp("\\s*<li\\b[^>]*>[\\s\\S]*?href=\"" + escaped + "\"[\\s\\S]*?</li>", "g"), "");
    html = html.replace(new RegExp("\\s*<url>\\s*<loc>https://www\\.clubcopy\\.ca" + escaped + "</loc>[\\s\\S]*?</url>", "g"), "");
  });
  return html;
}

function main() {
  const drafted = pieces();
  const news = JSON.parse(read("data/news.json"));
  const removedSlugs = [];
  news.articles = news.articles.filter((article) => {
    if (!REMOVED.has(article.id)) return true;
    removedSlugs.push(article.slug);
    const file = path.join(ROOT, "news", article.id + ".html");
    if (fs.existsSync(file)) fs.unlinkSync(file);
    return false;
  });
  const cues = listenLibrary(news.articles);
  const built = drafted.map((piece) => articleFromPiece(piece, cues));
  const byId = new Map(news.articles.map((article) => [article.id, article]));
  built.forEach((article) => {
    const stored = {
      id: article.id,
      slug: article.slug,
      date: article.date,
      volume: article.volume,
      format: article.format,
      dateLabel: article.dateLabel,
      type: article.type,
      author: article.author,
      headline: article.headline,
      dek: article.dek,
      kicker: article.kicker,
      location: article.location,
      home: false,
      typeLabel: article.typeLabel,
      listen: article.listen,
      artists: article.artists,
      places: article.places,
      words: article.words,
      readMinutes: article.readMinutes,
      added: true,
    };
    const existing = byId.get(article.id);
    if (existing) Object.assign(existing, stored);
    else {
      news.articles.unshift(stored);
      byId.set(article.id, stored);
    }
  });
  assignVolumes(news.articles);
  write("data/news.json", JSON.stringify(news, null, 2) + "\n");

  const chain = [{ id: "the-strait-is-not-a-scene", headline: "The Strait Is Not a Scene", slug: "/news/the-strait-is-not-a-scene" }].concat(built);
  built.forEach((article, index) => {
    const prev = chain[index];
    const next = chain[index + 2] ? { slug: chain[index + 2].slug, headline: chain[index + 2].headline } : null;
    write("news/" + article.id + ".html", storyPage(article, { slug: prev.slug, headline: prev.headline }, next));
  });

  news.articles.forEach((article) => {
    if (built.some((piece) => piece.id === article.id)) return;
    const rel = "news/" + article.id + ".html";
    const full = path.join(ROOT, rel);
    if (!fs.existsSync(full)) return;
    write(rel, patchStory(read(rel), article));
  });

  const volumes = [];
  for (let number = 1; number <= 10; number++) {
    const stories = storiesFor(news.articles, number);
    if (!stories.length) throw new Error("Vol. " + number + " is empty");
    const features = stories.filter((article) => article.format === "Feature");
    if (!features.length) throw new Error("Vol. " + number + " has no long read");
    volumes.push(volumeRecord(number, stories));
  }
  const doc = {
    current: 10,
    cadence: "monthly",
    anchor: "2026-01",
    next: { number: 11, title: "Vol. 11", month: "2026-11", dateLabel: "November 2026" },
    volumes,
  };
  write("data/issues.json", JSON.stringify(doc, null, 2) + "\n");

  volumes.forEach((record) => {
    write("news/vol-" + pad(record.number) + ".html", volumePage(record, storiesFor(news.articles, record.number)));
  });

  let issues = read("news/issues.html");
  const spines = volumes.slice().reverse().map((record) => spine(record, storiesFor(news.articles, record.number))).join("");
  issues = issues.replace(/<div class="issue-index" data-issue-index>[\s\S]*?<\/div>/, '<div class="issue-index" data-issue-index>\n' + spines + "    </div>");
  issues = issues.replace(/\s*<section>\s*<h3>2026<\/h3>\s*<ol class="catalogue-list">[\s\S]*?<\/ol>\s*<\/section>/, "");
  issues = issues
    .replace(/Night Shift issues and the back catalogue\./g, "Night Shift volumes and the back catalogue.")
    .replace(/<title>Issues \| Night Shift<\/title>/, "<title>Volumes | Night Shift</title>")
    .replace(/content="Issues \| Night Shift"/g, 'content="Volumes | Night Shift"')
    .replace(/<h1>Issues<\/h1>/, "<h1>Volumes</h1>")
    .replace(/>Issues<\/nav>/, ">Volumes</nav>")
    .replace("They are not part of a numbered issue.", "They sit before the volumes.")
    .replace("../css/news.css?v=st38", "../css/news.css?v=vol1");
  write("news/issues.html", issues);

  let front = read("news.html");
  const october = volumes[9];
  const octoberStories = storiesFor(news.articles, 10);
  const block = coverBlock(october, octoberStories, "").replace(/<h2 id="contents-title">/g, '<h2 id="contents-title">') + "    " + toc(octoberStories, coverOf(octoberStories).cover);
  const coverStart = front.indexOf('<article class="issue-cover">');
  const coverEnd = front.indexOf('<aside class="zine-letters"');
  if (coverStart < 0 || coverEnd < 0) throw new Error("news.html cover block missing");
  front = front.slice(0, coverStart) + block + front.slice(coverEnd);
  front = front.replace(/Issue 01/g, "Vol. 10");
  front = front.replace("<span>issue 01</span>", "<span>vol. 10</span>");
  front = front.replace('aria-label="In the issue"', 'aria-label="In the volume"');
  front = front.replace("The issue is above.", "The volume is above.");
  front = front.replace("They are not part of a numbered issue.", "They sit before the volumes.");
  front = front.replace('data-sort="issue">Issue', 'data-sort="volume">Volume');
  front = front.replace(/data-issue="/g, 'data-volume="');
  front = front.replace(/<tr\b[^>]*\sdata-date="2026-[^"]*"[^>]*>[\s\S]*?<\/tr>\s*/g, "");
  front = front.replace(/\s*<section>\s*<h3>2026<\/h3>\s*<ol class="catalogue-list">[\s\S]*?<\/ol>\s*<\/section>/, "");
  front = front.replace('<a href="/news/issues">All issues</a>', '<a href="/news/issues">All volumes</a>');
  const ldMatch = front.match(/<script type="application\/ld\+json">\s*(\{[\s\S]*?"@type": "CollectionPage"[\s\S]*?\})\s*<\/script>/);
  if (!ldMatch) throw new Error("news.html collection json missing");
  const ld = JSON.parse(ldMatch[1]);
  ld.mainEntity.itemListElement = (ld.mainEntity.itemListElement || []).filter((item) => {
    return !removedSlugs.some((slug) => String(item.url || "").endsWith(slug));
  });
  const have = new Set(ld.mainEntity.itemListElement.map((item) => item.url));
  news.articles.forEach((article) => {
    if (article.archived) return;
    const url = "https://www.clubcopy.ca" + article.slug;
    if (have.has(url)) return;
    ld.mainEntity.itemListElement.push({ "@type": "ListItem", position: 0, name: article.headline, url });
    have.add(url);
  });
  ld.mainEntity.itemListElement.forEach((item, index) => { item.position = index + 1; });
  ld.mainEntity.numberOfItems = ld.mainEntity.itemListElement.length;
  ld.name = "Night Shift, Vol. 10";
  ld.description = "Night Shift, Vol. 10. October 2026.";
  front = front.replace(ldMatch[0], '<script type="application/ld+json">\n' + JSON.stringify(ld, null, 2) + "\n  </script>");
  write("news.html", front);

  let home = read("index.html");
  home = home.replace("<span>issue 01</span>", "<span>vol. 10</span>");
  home = home.replace("Night Shift · Issue 01 · October 2026", "Night Shift · Vol. 10 · October 2026");
  home = home.replace('<a href="/news">The issue</a>', '<a href="/news/vol-10">Vol. 10</a>');
  home = home.replace(">In this issue<", ">In this volume<");
  home = home.replace('<a href="/news">Issue 01</a>', '<a href="/news/vol-10">Vol. 10</a>');
  write("index.html", home);

  let archive = read("news/archive.html");
  archive = archive.replace("Pieces that have left the current Night Shift issue.", "Pieces that have left the current Night Shift volume.");
  archive = archive.replace("These pieces have left the issue and the back catalogue.", "These pieces have left the volume and the back catalogue.");
  archive = archive.replace('data-sort="issue">Issue', 'data-sort="volume">Volume');
  archive = archive.replace(/data-issue="/g, 'data-volume="');
  archive = archive.replace('<a href="/news">The current issue</a>', '<a href="/news">The current volume</a>');
  archive = archive.replace('<a href="/news/issues">All issues</a>', '<a href="/news/issues">All volumes</a>');
  write("news/archive.html", archive);

  let shell = read("news/issue.html");
  shell = shell.replace(/<title>Issue \| Night Shift<\/title>/, "<title>Volume | Night Shift</title>");
  shell = shell.replace(/A Night Shift issue\./g, "A Night Shift volume.");
  shell = shell.replace(/content="Issue \| Night Shift"/g, 'content="Volume | Night Shift"');
  write("news/issue.html", shell);

  ["news/artists.html", "news/places.html"].forEach((rel) => write(rel, stripSlug(read(rel), removedSlugs)));
  fs.readdirSync(path.join(ROOT, "news/series")).forEach((name) => {
    if (!name.endsWith(".html")) return;
    const rel = "news/series/" + name;
    write(rel, stripSlug(read(rel), removedSlugs));
  });
  mergeIndex("news/artists.html", news.articles, "artists");
  mergeIndex("news/places.html", news.articles, "places");
  fs.readdirSync(path.join(ROOT, "news/series")).forEach((name) => {
    if (!name.endsWith(".html")) return;
    const rel = "news/series/" + name;
    write(rel, read(rel).replace('<a href="/news">Issue 01</a>', '<a href="/news">Vol. 10</a><a href="/news/issues">Volumes</a>'));
  });

  let map = stripSlug(read("sitemap.xml"), removedSlugs);
  map = map.replace(/(<loc>https:\/\/www\.clubcopy\.ca\/news<\/loc>\s*<lastmod>)[^<]+/, "$12026-10-21");
  map = map.replace(/(<loc>https:\/\/www\.clubcopy\.ca\/news\/issues<\/loc>\s*<lastmod>)[^<]+/, "$12026-10-21");
  const volXml = volumes.slice().reverse().map((record) => sitemapUrl("/news/vol-" + pad(record.number), PUBLISHED, "    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n")).join("");
  map = map.replace(/\s*<url>\s*<loc>https:\/\/www\.clubcopy\.ca\/news\/issue-01<\/loc>[\s\S]*?<\/url>/, "\n" + volXml.trimEnd());
  built.forEach((article) => {
    const loc = "https://www.clubcopy.ca" + article.slug;
    if (map.includes(loc)) return;
    map = map.replace("</urlset>", sitemapUrl(article.slug, PUBLISHED) + "</urlset>");
  });
  write("sitemap.xml", map);

  let vercel = read("vercel.json");
  if (!vercel.includes('"/news/issue-01"')) {
    vercel = vercel.replace(
      '"redirects": [',
      '"redirects": [\n    {\n      "source": "/news/issue-01",\n      "destination": "/news/vol-10",\n      "statusCode": 301\n    },'
    );
  }
  if (!vercel.includes("/news/vol-:number")) {
    vercel = vercel.replace(
      '"source": "/news/issue-:number(\\\\d+)",\n      "destination": "/news/issue.html"\n    }',
      '"source": "/news/issue-:number(\\\\d+)",\n      "destination": "/news/issue.html"\n    },\n    {\n      "source": "/news/vol-:number(\\\\d+)",\n      "destination": "/news/issue.html"\n    }'
    );
  }
  if (!vercel.includes('"/news/issue-01"') || !vercel.includes("/news/vol-:number")) {
    throw new Error("vercel.json routes were not written");
  }
  write("vercel.json", vercel);

  let library = read("scripts/build-zine-library.js");
  const listenLines = built.map((article) => '  "' + article.id + '": "' + drafted.find((piece) => piece.id === article.id).listen + '",').join("\n");
  if (!/\n  "leftism":[\s\S]*?\n\};/.test(library)) throw new Error("LISTEN_FOR block missing");
  library = library.replace(/\n  "leftism":[\s\S]*?\n\};/, "\n" + listenLines + "\n};");
  library = library.replace('<a href="/news">Issue 01</a>', '<a href="/news">Vol. 10</a><a href="/news/issues">Volumes</a>');
  write("scripts/build-zine-library.js", library);

  const retired = path.join(ROOT, "news/issue-01.html");
  if (fs.existsSync(retired)) fs.unlinkSync(retired);

  const misses = [];
  news.articles.forEach((article) => {
    if (!article.volume) return;
    const rel = "news/" + article.id + ".html";
    if (!fs.existsSync(path.join(ROOT, rel))) return;
    const html = read(rel);
    if (!html.includes("Vol. " + pad(article.volume))) misses.push(article.id);
  });
  if (misses.length) throw new Error("Volume label missing on " + misses.join(", "));

  const watch = ["Boards of Canada", "Massive Attack", "The Prodigy", "Mobb Deep", "Roni Size", "Tricky", "El-P"];
  const caps = {};
  news.articles.forEach((article) => {
    if (article.archived) return;
    (article.artists || []).forEach((name) => {
      if (watch.indexOf(name) === -1) return;
      if (!caps[name]) caps[name] = [];
      caps[name].push(article.id);
    });
  });
  Object.keys(caps).forEach((name) => {
    if (caps[name].length > 2) throw new Error(name + " is on " + caps[name].join(", "));
  });
  removedSlugs.forEach((slug) => {
    const id = slug.split("/").pop();
    if (fs.existsSync(path.join(ROOT, "news", id + ".html"))) throw new Error(id + " was not removed");
  });

  const report = volumes.map((record) => {
    const stories = storiesFor(news.articles, record.number);
    const fresh = stories.filter((article) => article.added);
    return {
      volume: record.title,
      month: record.dateLabel,
      cover: record.coverHeadline,
      count: stories.length,
      added: fresh.map((article) => article.headline + " — " + article.dek),
    };
  });
  console.log(JSON.stringify({ next: doc.next, report }, null, 2));
}

main();
