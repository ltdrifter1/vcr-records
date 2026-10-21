#!/usr/bin/env node
/**
 * Tags Night Shift stories with listen / artists / places and writes the library pages.
 * Article prose is left alone.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const newsPath = path.join(ROOT, "data", "news.json");
const news = JSON.parse(fs.readFileSync(newsPath, "utf8"));

function bcAlbum(id) {
  return (
    "https://bandcamp.com/EmbeddedPlayer/album=" +
    id +
    "/size=large/bgcol=ffffff/linkcol=333333/tracklist=false/artwork=small/transparent=true/"
  );
}
function bcTrack(id) {
  return (
    "https://bandcamp.com/EmbeddedPlayer/track=" +
    id +
    "/size=large/bgcol=ffffff/linkcol=333333/tracklist=false/artwork=small/transparent=true/"
  );
}
function scEmbed(id) {
  return (
    "https://w.soundcloud.com/player/?url=" +
    encodeURIComponent("https://api.soundcloud.com/tracks/" + id) +
    "&color=%23111111&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false"
  );
}

function release(fields) {
  return Object.assign({ kind: "release", embedHeight: 120 }, fields);
}
function mix(fields) {
  return Object.assign({ kind: "mix", catalogue: "mix", page: "/tapes", embedHeight: 166 }, fields, {
    embed: scEmbed(fields.soundcloudId),
  });
}

const CUES = {
  "you-are-love": release({
    title: "You Are (Love)",
    artist: "Riscape",
    catalogue: "CC004",
    page: "/you-are-love",
    url: "https://riscape.bandcamp.com/album/you-are-love",
    embed: bcAlbum("3034108622"),
  }),
  "tell-me": release({
    title: "Tell Me",
    artist: "Riscape",
    catalogue: "CC009",
    page: "/tell-me",
    url: "https://riscape.bandcamp.com/album/tell-me-ep",
    embed: bcAlbum("1173735553"),
  }),
  "pitch-black": release({
    title: "Pitch Black",
    artist: "Forsberg",
    catalogue: "CC013",
    page: "/pitch-black",
    url: "https://forsberg.bandcamp.com/album/pitch-black",
    embed: bcAlbum("4167859801"),
  }),
  "try-to-love-again": release({
    title: "Try To Love Again",
    artist: "Forsberg",
    catalogue: "CC012",
    page: "/try-to-love-again",
    url: "https://forsberg.bandcamp.com/track/try-to-love-again",
    embed: bcTrack("898873433"),
  }),
  "run-it-back": release({
    title: "Run It Back",
    artist: "Forsberg",
    catalogue: "CC011",
    page: "/run-it-back",
    url: "https://forsberg.bandcamp.com/track/run-it-back",
    embed: bcTrack("2830265795"),
  }),
  "please-wait": release({
    title: "Please Wait",
    artist: "Forsberg",
    catalogue: "CC010",
    page: "/please-wait",
    url: "https://forsberg.bandcamp.com/track/please-wait",
    embed: bcTrack("1737504659"),
  }),
  jadore: release({
    title: "j'adore",
    artist: "Forsberg",
    catalogue: "CC007",
    page: "/j-adore",
    url: "https://forsberg.bandcamp.com/album/jadore",
    embed: bcAlbum("1515606478"),
  }),
  "classic-jazz": release({
    title: "Classic Jazz",
    artist: "L.T. Drifta",
    catalogue: "CC003",
    page: "/classic-jazz",
    url: "https://ltdrifta.bandcamp.com/album/classic-jazz",
    embed: bcAlbum("3806994513"),
  }),
  "summer-madness": release({
    title: "Summer Madness",
    artist: "L.T. Drifta",
    catalogue: "CC006",
    page: "/summer-madness",
    url: "https://ltdrifta.bandcamp.com/album/summer-madness",
    embed: bcAlbum("2185705270"),
  }),
  "champion-sound": release({
    title: "Champion Sound",
    artist: "L.T. Drifta",
    catalogue: "CC001",
    page: "/champion-sound",
    url: "https://ltdrifta.bandcamp.com/track/champion-sound",
    embed: bcTrack("24406599"),
  }),
  "three-4-zone": release({
    title: "Three 4 Zone",
    artist: "L.T. Drifta",
    catalogue: "CC014",
    page: "/three-4-zone",
    url: "https://ltdrifta.bandcamp.com/track/three-4-zone",
    embed: bcTrack("3048030883"),
  }),
  "molly-edit": release({
    title: "Get Me Down (Molly's Hazy Jungle Edit)",
    artist: "L.T. Drifta",
    catalogue: "edit",
    page: "/artists/molly-haze",
    url: "https://ltdrifta.bandcamp.com/track/nia-archives-get-me-down-mollys-hazy-jungle-edit",
    embed: bcTrack("2636373644"),
  }),
  nightshift3: mix({
    title: "NIGHTSHIFT (VOL.3)",
    artist: "L.T. Drifta",
    url: "https://soundcloud.com/ltdrifta/nightshift-vol-3",
    soundcloudId: "2411714829",
  }),
  nightshift1: mix({
    title: "NIGHTSHIFT (VOL.1)",
    artist: "L.T. Drifta",
    url: "https://soundcloud.com/ltdrifta/nightshift-vol-1",
    soundcloudId: "2409702330",
  }),
  jungle94: mix({
    title: "DEEP IN THA JUNGLE — '94 HARDCORE",
    artist: "L.T. Drifta",
    url: "https://soundcloud.com/ltdrifta/deep-in-tha-jungle-94-hardcore-1",
    soundcloudId: "2408944698",
  }),
  jungle96: mix({
    title: "DEEP IN THA JUNGLE — 1996 ATMOSPHERE",
    artist: "L.T. Drifta",
    url: "https://soundcloud.com/ltdrifta/deep-in-tha-jungle-1996-atmosphere-3",
    soundcloudId: "2408944689",
  }),
  akina: mix({
    title: "Akina (秋名山) Vol. 1",
    artist: "L.T. Drifta",
    url: "https://soundcloud.com/ltdrifta/akina-vol-1",
    soundcloudId: "2410281000",
  }),
  cafe: mix({
    title: "Café Après: Vol. 1 (Part 3)",
    artist: "L.T. Drifta",
    url: "https://soundcloud.com/ltdrifta/cafe-apres-vol-1-part-3-3",
    soundcloudId: "2410923741",
  }),
  liquid: mix({
    title: "Liquid Love: Volume 1",
    artist: "L.T. Drifta",
    url: "https://soundcloud.com/ltdrifta/volume-1-1",
    soundcloudId: "2408664954",
  }),
  radio: mix({
    title: "Club Copy Radio: Oct-02-26",
    artist: "L.T. Drifta",
    url: "https://soundcloud.com/ltdrifta/club-copy-radio-oct-02-26",
    soundcloudId: "2412223884",
  }),
  bliss: mix({
    title: "blissed out: shoegaze & dreampop (vol. 1) pt. 01",
    artist: "L.T. Drifta",
    url: "https://soundcloud.com/ltdrifta/blissed-out-shoegaze-dreampop-vol-1-pt-01-12",
    soundcloudId: "2412982683",
  }),
};

const LISTEN_FOR = {
  please: "you-are-love",
  "riscape-on-club-copy": "tell-me",
  "j-adore": "jadore",
  "inlet-knight-on-club-copy": "jadore",
  "champion-sound": "champion-sound",
  "summer-madness": "summer-madness",
  "lt-drifta-on-club-copy": "summer-madness",
  "beat-tape": "classic-jazz",
  "lions-gate": "champion-sound",
  "any-jungle": "jungle94",
  "summer-of-jungle": "jungle94",
  "romford-kept-the-receipts": "jungle94",
  "rupture-at-twenty": "jungle96",
  "deep-sleep": "jungle96",
  "initial-d": "akina",
  "the-after-is-the-point": "cafe",
  "they-sold-the-afters": "cafe",
  "they-settled-it-at-afterhours": "cafe",
  "stars-for-the-floor": "nightshift3",
  "love-deluxe": "you-are-love",
  dummy: "liquid",
  "the-velvet-rope": "liquid",
  donuts: "classic-jazz",
  "ahmad-jamal-73": "classic-jazz",
  "last-emperor": "classic-jazz",
  endtroducing: "classic-jazz",
  mezzanine: "pitch-black",
  homogenic: "tell-me",
  untrue: "tell-me",
  "crystal-tears-on-the-westside": "liquid",
  "black-girl-magic": "summer-madness",
  "cj-archer-interview": "jadore",
  "no-fun-city-still-raids-the-rooms": "nightshift3",
  "fifa-vs-the-underground": "nightshift3",
  "cobalt-party-like-the-lease-is-ending": "nightshift3",
  "madame-lous-is-dead-bottlerocket-wants-the-basement": "nightshift1",
  "portland-finally-got-an-all-ages-temple": "nightshift1",
  "radial-wants-the-midsize-room": "jungle94",
  "eight-rooms-one-basement": "nightshift1",
  "the-coat-on-the-chair": "cafe",
  "the-kitchen-was-the-club": "cafe",
  "the-rooms-opened": "cafe",
  "the-shoes-come-off": "nightshift3",
  "the-bathroom-line": "nightshift3",
  "im-outside": "nightshift3",
  "incense-before-the-aux": "bliss",
  "oil-and-chrome": "pitch-black",
  "the-file-is-the-record": "classic-jazz",
  "no-prompt-can-touch": "classic-jazz",
  "the-algorithm-is-not-a-room": "radio",
  "majors-monetized-the-booth": "radio",
  "the-camera-got-a-landlord": "radio",
  "buried-treasure": "classic-jazz",
  "the-sticker-on-the-lens": "nightshift3",
  "hello-kitty-pants": "nightshift3",
  "the-jersey-stayed-on": "nightshift3",
  "the-platforms-came-back": "nightshift3",
  "the-mini-held-nothing": "nightshift3",
  "the-wristband-in-the-drawer": "nightshift3",
  "the-object-came-back": "classic-jazz",
  "the-monk-in-the-booth": "bliss",
  bota: "summer-madness",
  "to-hell-with-it": "liquid",
  nymph: "bliss",
  "blue-rev": "bliss",
  "she-showed-up": "liquid",
  "headphones-on": "liquid",
  "fancy-that": "liquid",
  eusexua: "bliss",
  motomami: "liquid",
  "the-sad-banger": "pitch-black",
  "working-for-the-knife": "bliss",
  caprisongs: "liquid",
  "drill-lyrics-on-trial": "champion-sound",
  "the-group-chat-is-the-door": "nightshift3",
  "she-kept-the-flyer": "nightshift1",
  "the-door-still-says-no": "please-wait",
  "she-named-it-berghain": "pitch-black",
  "they-called-it-satan": "nightshift1",
  "the-chaos-came-back": "pitch-black",
  "still-looking-for-the-warehouse": "jungle96",
  "the-skinny-last-issue": "nightshift1",
  "while-he-was-playing": "summer-madness",
  "all-night-one-name": "nightshift3",
  "across-the-street": "nightshift1",
  "thirty-years-on-the-calendar": "radio",
  "leftism": "pitch-black",
  "jack-your-body": "pitch-black",
  "dubnobasswithmyheadman": "pitch-black",
  "homework": "pitch-black",
  "maxinquaye": "classic-jazz",
  "deliverance": "jungle94",
  "ray-of-light": "bliss",
  "silent-shout": "bliss",
  "get-ready": "pitch-black",
  "madvillainy": "classic-jazz",
  "selected-ambient-works-volume-ii": "bliss",
  "black-secret-technology": "jungle94",
  "the-thirty-first": "pitch-black",
  "blue-lines": "summer-madness",
  "illmatic": "classic-jazz",
  "music-has-the-right-to-children": "summer-madness",
  "the-infamous": "classic-jazz",
  "the-cold-vein": "classic-jazz",
  "inferno-warp": "summer-madness",
  "moby-play": "bliss",
  "walking-wounded": "jungle96",
  "new-forms": "jungle96",
  "the-fat-of-the-land": "jungle94",
  "surrender": "pitch-black",
  "criminology": "classic-jazz",
  "music-for-the-jilted-generation": "jungle94",
  "funcrusher-plus": "classic-jazz",
  "snivilisation": "pitch-black",
};

const ROTATION = [
  "you-are-love",
  "tell-me",
  "pitch-black",
  "try-to-love-again",
  "run-it-back",
  "please-wait",
  "jadore",
  "classic-jazz",
  "summer-madness",
  "champion-sound",
  "three-4-zone",
];

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h;
}

const ARTISTS = [
  ["L.T. Drifta", /l\.?\s*t\.?\s*drifta|\bdrifta\b/i],
  ["Forsberg", /\bforsberg\b/i],
  ["Riscape", /\briscape\b/i],
  ["Molly Haze", /molly haze|molly['’]s hazy/i],
  ["Roni Size", /\broni size\b/i],
  ["Sebadoh", /\bsebadoh\b/i],
  ["Lou Barlow", /\blou barlow\b|\bbarlow\b/i],
  ["Jhené Aiko", /jhen[eé]\s*aiko/i],
  ["Madonna", /\bmadonna\b/i],
  ["Charli xcx", /charli\s*xcx/i],
  ["Drake", /\bdrake\b/i],
  ["Sade", /\bsade\b/i],
  ["Portishead", /\bportishead\b/i],
  ["J Dilla", /\bdilla\b/i],
  ["Björk", /bj[oö]rk/i],
  ["Massive Attack", /massive attack/i],
  ["Burial", /\bburial\b/i],
  ["DJ Shadow", /dj shadow/i],
  ["Ahmad Jamal", /ahmad jamal/i],
  ["Ryuichi Sakamoto", /sakamoto/i],
  ["Janet Jackson", /janet jackson/i],
  ["PinkPantheress", /pinkpantheress/i],
  ["Addison Rae", /addison rae/i],
  ["Lorde", /\blorde\b/i],
  ["FKA twigs", /fka twigs|\btwigs\b/i],
  ["Rosalía", /rosal[ií]a/i],
  ["Mitski", /\bmitski\b/i],
  ["Olivia Rodrigo", /olivia rodrigo/i],
  ["Nia Archives", /nia archives/i],
  ["Demuja", /\bdemuja\b/i],
  ["deadmau5", /deadmau5/i],
  ["Sydney Sweeney", /sydney sweeney/i],
  ["Teenage Engineering", /teenage engineering|\bkouthoofd\b/i],
  ["The Weeknd", /the weeknd/i],
  ["Anyma", /\banyma\b/i],
  ["Marshmello", /\bmarshmello\b/i],
  ["David Guetta", /\bguetta\b/i],
  ["Born I", /\bborn i\b/i],
  ["Rupture", /\brupture\b/i],
];

const SHORT = new Set(["Drake", "Sade", "Lorde", "Burial", "Rupture", "Mitski", "Björk", "Anyma"]);

const PLACES = [
  ["Eryri", /\beryri\b|\bcwmorthin\b/i],
  ["Romford", /\bromford\b/i],
  ["Sheffield", /\bsheffield\b/i],
  ["Tottenham", /\btottenham\b/i],
  ["London", /\blondon\b/i],
  ["Toronto", /\btoronto\b/i],
  ["Amsterdam", /\bamsterdam\b/i],
  ["Vancouver", /\bvancouver\b|\beast van\b|\bkingsway\b|\bgranville\b|\bmount pleasant\b/i],
  ["Cumberland", /\bcumberland\b/i],
  ["Portland", /\bportland\b/i],
  ["Seattle", /\bseattle\b/i],
  ["Istanbul", /\bistanbul\b/i],
  ["Ibiza", /\bibiza\b/i],
  ["Athens", /\bathens\b/i],
  ["Berlin", /\bberlin\b|\bberghain\b/i],
  ["Los Angeles", /\blos angeles\b|\bwestside\b/i],
  ["New York", /\bnew york\b/i],
  ["Victoria", /\bvictoria,?\s*(bc|b\.c)/i],
  ["Bristol", /\bbristol\b/i],
  ["Cashel", /\bcashel\b/i],
  ["Essex", /\bessex\b/i],
  ["Scotland", /\bscotland\b/i],
];

const MANUAL_PLACES = {
  "eight-rooms-one-basement": ["Toronto"],
  "across-the-street": ["Amsterdam"],
  "thirty-years-on-the-calendar": ["Amsterdam"],
  "they-called-it-satan": ["Istanbul"],
  "deep-sleep": ["Eryri"],
  "the-skinny-last-issue": ["Scotland"],
  "she-named-it-berghain": ["Berlin"],
  "the-door-still-says-no": ["Berlin"],
  "radial-wants-the-midsize-room": ["London", "Tottenham"],
  "romford-kept-the-receipts": ["Romford", "Essex"],
  "still-looking-for-the-warehouse": ["Sheffield"],
  "no-fun-city-still-raids-the-rooms": ["Vancouver"],
  "fifa-vs-the-underground": ["Vancouver"],
  "cobalt-party-like-the-lease-is-ending": ["Vancouver"],
  "madame-lous-is-dead-bottlerocket-wants-the-basement": ["Seattle"],
  "portland-finally-got-an-all-ages-temple": ["Portland"],
  "lions-gate": ["Vancouver"],
  "riscape-on-club-copy": ["Athens"],
  "lt-drifta-on-club-copy": ["Cumberland"],
  "cj-archer-interview": ["Vancouver"],
  "the-missing-p": ["Seattle", "Cashel"],
  "the-coat-on-the-chair": ["Vancouver"],
};

const MANUAL_ARTISTS = {
  "cj-archer-interview": ["CJ Archer"],
  "the-missing-p": ["Sebadoh", "Lou Barlow"],
  "to-hell-with-it": ["PinkPantheress"],
  "deep-sleep": ["Roni Size"],
  "please": ["Riscape"],
  "j-adore": ["Forsberg"],
  "inlet-knight-on-club-copy": ["Forsberg"],
  "champion-sound": ["L.T. Drifta"],
  "summer-madness": ["L.T. Drifta"],
  "lt-drifta-on-club-copy": ["L.T. Drifta"],
  "beat-tape": ["L.T. Drifta"],
  "lions-gate": ["L.T. Drifta"],
  "any-jungle": ["L.T. Drifta"],
  "riscape-on-club-copy": ["Riscape"],
};

function bodyText(id) {
  const file = path.join(ROOT, "news", id + ".html");
  if (!fs.existsSync(file)) return "";
  const html = fs.readFileSync(file, "utf8");
  const m = html.match(/<div class="news-body[\s\S]*?<\/div>/);
  if (!m) return "";
  let t = m[0].replace(/<h2>Sources<\/h2>[\s\S]*/, " ");
  t = t.replace(/<[^>]+>/g, " ");
  return t.replace(/\s+/g, " ");
}

function count(re, text) {
  const flags = re.flags.includes("g") ? re.flags : re.flags + "g";
  const g = new RegExp(re.source, flags);
  return (text.match(g) || []).length;
}

function uniq(list) {
  const out = [];
  list.forEach(function (item) {
    if (item && out.indexOf(item) === -1) out.push(item);
  });
  return out;
}

function schemaArtists(id) {
  const file = path.join(ROOT, "news", id + ".html");
  if (!fs.existsSync(file)) return [];
  const html = fs.readFileSync(file, "utf8");
  const names = [];
  const re = /"byArtist"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    names.push(
      m[1].replace(/\\u([0-9a-fA-F]{4})/g, function (_, h) {
        return String.fromCharCode(parseInt(h, 16));
      })
    );
  }
  return names;
}

function tagArtists(article, body, lead) {
  const found = (MANUAL_ARTISTS[article.id] || []).concat(schemaArtists(article.id));
  ARTISTS.forEach(function (pair) {
    const name = pair[0];
    const re = pair[1];
    const inLead = count(re, lead) > 0;
    const n = count(re, body);
    if (inLead || n >= 2) found.push(name);
  });
  if (article.id === "cj-archer-interview") found.push("CJ Archer");
  return uniq(found);
}

function tagPlaces(article, body, lead) {
  const found = (MANUAL_PLACES[article.id] || []).slice();
  if (article.location && article.location !== "Pulsn") found.push(article.location);
  PLACES.forEach(function (pair) {
    const name = pair[0];
    const re = pair[1];
    const inLead = count(re, lead) > 0;
    const n = count(re, body);
    if (inLead || n >= 2) found.push(name);
  });
  return uniq(found);
}

news.articles.forEach(function (article) {
  const key = LISTEN_FOR[article.id];
  const cue = CUES[key] || CUES[ROTATION[hash(article.id) % ROTATION.length]];
  const listen = {
    kind: cue.kind,
    title: cue.title,
    artist: cue.artist,
    catalogue: cue.catalogue,
    page: cue.page,
    url: cue.url,
    embed: cue.embed,
    embedHeight: cue.embedHeight,
  };
  article.listen = listen;
  const body = bodyText(article.id);
  const lead = [article.headline, article.dek, article.kicker, article.location].filter(Boolean).join(" ");
  article.artists = tagArtists(article, body, lead);
  article.places = tagPlaces(article, body, lead);
  if (article.id === "stars-for-the-floor") article.series = "Stars for the Floor";
  else delete article.series;
});

fs.writeFileSync(newsPath, JSON.stringify(news, null, 2) + "\n");

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function dateLabel(iso) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const d = new Date(iso + "T12:00:00");
  return d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear();
}

function byDate(a, b) {
  return (b.date || "").localeCompare(a.date || "");
}

const shell = function (opts) {
  const depth = opts.depth || 1;
  const root = "../".repeat(depth);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <title>${esc(opts.title)}</title>
  <meta name="description" content="${esc(opts.description)}"/>
  <meta name="theme-color" content="#E8E8E6"/>
  <link rel="canonical" href="${esc(opts.canonical)}"/>
  <meta property="og:type" content="website"/>
  <meta property="og:site_name" content="Club Copy"/>
  <meta property="og:title" content="${esc(opts.title)}"/>
  <meta property="og:description" content="${esc(opts.description)}"/>
  <meta property="og:url" content="${esc(opts.canonical)}"/>
  <meta property="og:locale" content="en_CA"/>
  <link rel="icon" href="${root}favicon.png" type="image/png"/>
  <link rel="apple-touch-icon" href="${root}apple-touch-icon.png"/>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,75,400;0,100,400;0,100,500;0,100,600;0,100,700;1,100,400&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Oswald:wght@500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${root}css/site.css?v=st33"/>
  <link rel="stylesheet" href="${root}css/news.css?v=st38"/>
  <link rel="stylesheet" href="${root}css/zine-pages.css?v=st33"/>
  <link rel="stylesheet" href="/css/graphic-pass.css?v=gp4"/>
</head>
<body id="top" class="news-listing nav-on-dark zine-surface nav-light">
<a class="skip-link" href="#main">Skip to content</a>
<header class="nav" id="nav">
  <div class="nav-inner">
    <a href="/" class="nav-logo" aria-label="Club Copy home"><img src="${root}club-copy-nav-ink.webp" alt="Club Copy" width="901" height="418"/></a>
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
<main id="main" class="news-index">
  <div class="zine-sheet">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>/</span><a href="/news">Night Shift</a><span>/</span>${esc(opts.crumb)}</nav>
    <header class="issues-head">
      <p>Night Shift</p>
      <h1>${esc(opts.heading)}</h1>
    </header>
    ${opts.body}
    <p class="issue-jump"><a href="/news">Vol. 10</a><a href="/news/issues">Volumes</a><a href="/news/archive">From the archive</a><a href="/news/artists">Artists</a><a href="/news/places">Places</a><a href="/news/series/stars-for-the-floor">Stars</a></p>
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
<script src="${root}js/site.js"></script>
<script src="${root}js/cart.js"></script>
</body>
</html>
`;
};

function storyItem(a) {
  return (
    "<li>\n          <a href=\"" +
    esc(a.slug) +
    "\">" +
    esc(a.headline) +
    "</a>\n          <em>" +
    esc(a.format || "") +
    "</em>\n          <time datetime=\"" +
    esc(a.date) +
    "\">" +
    esc(dateLabel(a.date)) +
    "</time>\n        </li>"
  );
}

function indexPage(kind) {
  const field = kind === "artists" ? "artists" : "places";
  const groups = {};
  news.articles.forEach(function (a) {
    (a[field] || []).forEach(function (name) {
      if (!groups[name]) groups[name] = [];
      groups[name].push(a);
    });
  });
  const names = Object.keys(groups).sort(function (a, b) {
    return a.localeCompare(b);
  });
  const sections = names
    .map(function (name) {
      const items = groups[name].slice().sort(byDate).map(storyItem).join("\n        ");
      return (
        '<section id="' +
        slug(name) +
        '">\n        <h2>' +
        esc(name) +
        '</h2>\n        <ol class="catalogue-list">\n        ' +
        items +
        "\n        </ol>\n      </section>"
      );
    })
    .join("\n      ");
  const intro =
    kind === "artists"
      ? "Names the stories actually turn on. A byline is not an entry."
      : "Cities and places the pieces are about. One mention in a closer does not open a shelf.";
  const body =
    '<div class="library-index">\n      <p>' +
    intro +
    "</p>\n      " +
    sections +
    "\n    </div>";
  const title = kind === "artists" ? "Artists | Night Shift" : "Places | Night Shift";
  const heading = kind === "artists" ? "Artists" : "Places";
  const description =
    kind === "artists"
      ? "An index of the artists, bands and crews in Night Shift."
      : "An index of the cities and places in Night Shift.";
  return {
    count: names.length,
    html: shell({
      depth: 1,
      title: title,
      heading: heading,
      crumb: heading,
      description: description,
      canonical: "https://www.clubcopy.ca/news/" + kind,
      body: body,
    }),
  };
}

const artistsPage = indexPage("artists");
const placesPage = indexPage("places");
fs.writeFileSync(path.join(ROOT, "news", "artists.html"), artistsPage.html);
fs.writeFileSync(path.join(ROOT, "news", "places.html"), placesPage.html);

const stars = news.articles.filter(function (a) {
  return a.series === "Stars for the Floor";
});
const starsBody =
  '<div class="library-index">\n      <p>Stars for the Floor. The column for what the floor is reading.</p>\n      <ol class="catalogue-list">\n        ' +
  stars.sort(byDate).map(storyItem).join("\n        ") +
  "\n      </ol>\n    </div>";
fs.mkdirSync(path.join(ROOT, "news", "series"), { recursive: true });
fs.writeFileSync(
  path.join(ROOT, "news", "series", "stars-for-the-floor.html"),
  shell({
    depth: 2,
    title: "Stars for the Floor | Night Shift",
    heading: "Stars for the Floor",
    crumb: "Stars for the Floor",
    description: "Stars for the Floor, the Night Shift column.",
    canonical: "https://www.clubcopy.ca/news/series/stars-for-the-floor",
    body: starsBody,
  })
);

const matched = news.articles.filter(function (a) {
  return LISTEN_FOR[a.id];
}).length;
const artistsTagged = news.articles.filter(function (a) {
  return a.artists && a.artists.length;
}).length;
const placesTagged = news.articles.filter(function (a) {
  return a.places && a.places.length;
}).length;
console.log(
  JSON.stringify(
    {
      stories: news.articles.length,
      listen: news.articles.filter(function (a) {
        return a.listen && a.listen.url;
      }).length,
      matched: matched,
      rotated: news.articles.length - matched,
      artistsIndexed: artistsPage.count,
      placesIndexed: placesPage.count,
      storiesWithArtists: artistsTagged,
      storiesWithPlaces: placesTagged,
      series: stars.length,
    },
    null,
    2
  )
);
console.log("--- artists ---");
const ag = {};
news.articles.forEach(function (a) {
  (a.artists || []).forEach(function (n) {
    ag[n] = (ag[n] || 0) + 1;
  });
});
Object.keys(ag)
  .sort()
  .forEach(function (n) {
    console.log(ag[n], n);
  });
console.log("--- places ---");
const pg = {};
news.articles.forEach(function (a) {
  (a.places || []).forEach(function (n) {
    pg[n] = (pg[n] || 0) + 1;
  });
});
Object.keys(pg)
  .sort()
  .forEach(function (n) {
    console.log(pg[n], n);
  });
const bare = news.articles.filter(function (a) {
  return !a.artists.length && !a.places.length;
});
console.log("--- neither", bare.length);
bare.forEach(function (a) {
  console.log(a.id);
});
