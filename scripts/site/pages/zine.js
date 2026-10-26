"use strict";
const fs = require("fs");
const path = require("path");
const L = require("../lib");
const { esc, attr, asset, dateShort, dateLong, slugify } = L;

const ORDER = ["Feature", "Essay", "Interview", "Scene Report", "Review", "Release", "Mix", "Column"];
const byDateDesc = (a, b) => (b.date || "").localeCompare(a.date || "");

function fmt(a) {
  return a.format || a.typeLabel || a.kicker || "";
}
function volumeOf(issues, n) {
  return issues.volumes.find((v) => Number(v.number) === Number(n)) || null;
}
function volLabel(n) {
  return "Vol. " + String(n).padStart(2, "0");
}
function inVolume(articles, n) {
  return articles.filter((a) => !a.archived && Number(a.volume) === Number(n));
}
function backCatalogue(articles) {
  return articles.filter((a) => !a.archived && (a.volume == null || a.volume === ""));
}
function archived(articles) {
  return articles.filter((a) => a.archived);
}

/* Fragments ------------------------------------------------------------- */

function tocItem(a) {
  return `<li>
  <a href="${attr(a.slug)}">${esc(a.headline)}</a>
  <span>${esc(a.dek || "")}</span>
  <time datetime="${attr(a.date)}">${esc(dateShort(a.date))}</time>
</li>`;
}

function contents(list, opts) {
  opts = opts || {};
  const groups = ORDER.map((f) => [f, list.filter((a) => fmt(a) === f && a.slug !== opts.excludeSlug).sort(byDateDesc)]).filter(([, l]) => l.length);
  if (!groups.length) return "";
  return `<section class="issue-contents" aria-labelledby="${opts.id || "contents-title"}">
  <h2 id="${opts.id || "contents-title"}">${esc(opts.title || "Contents")}</h2>
  ${groups
    .map(
      ([f, l]) => `<section>
    <h3 class="mono">${esc(f)}</h3>
    <ol class="issue-toc">
      ${l.map(tocItem).join("\n      ")}
    </ol>
  </section>`
    )
    .join("\n  ")}
</section>`;
}

function coverBlock(vol, article, zine) {
  if (!article) return "";
  const count = vol.count;
  return `<article class="issue-cover row row--story row--cover">
  <div class="row-main">
    <p class="issue-cover-meta mono row-meta"><span>${esc(volLabel(vol.number))}</span><span>${esc(vol.dateLabel)}</span><span>${count} ${count === 1 ? "story" : "stories"}</span>${article.credit || article.imageCredit ? `<span>Cover: ${esc((article.imageCredit || article.credit || "").replace(/^Photo:\s*/i, ""))}</span>` : ""}</p>
    <p class="issue-cover-format mono">${esc(fmt(article))}</p>
    <h2 class="issue-cover-headline row-title"><a href="${attr(article.slug)}">${esc(article.headline)}</a></h2>
    <p class="issue-cover-dek row-dek">${esc(article.dek || "")}</p>
  </div>
  ${article.image ? `<figure class="issue-cover-figure row-art row-art--wide"><a href="${attr(article.slug)}"><img src="${asset(article.image)}" alt="${attr(article.imageAlt || "")}" width="1600" height="1066" loading="eager" fetchpriority="high"/></a></figure>` : ""}
</article>`;
}

/** Front page: the volume's cover photograph full width, then the cover story. */
function frontCover(vol, article) {
  if (!article) return "";
  const count = vol.count;
  const credit = (article.imageCredit || article.credit || "").replace(/^Photo:\s*/i, "");
  return `<a class="front-cover" href="${attr(article.slug)}" aria-label="${attr(article.headline)}">
  ${article.image ? `<span class="front-cover-art"><img src="${asset(article.image)}" alt="${attr(article.imageAlt || "")}" width="1600" height="1066" loading="eager" fetchpriority="high"/></span>` : ""}
  <span class="front-cover-copy">
    <span class="mono row-meta front-cover-meta"><span>${esc(volLabel(vol.number))}</span><span>${esc(vol.dateLabel)}</span><span>${count} ${count === 1 ? "story" : "stories"}</span><span>${esc(fmt(article))}</span>${credit ? `<span>Cover: ${esc(credit)}</span>` : ""}</span>
    <span class="front-cover-main"><strong class="display front-cover-headline">${esc(article.headline)}</strong><span class="front-cover-dek">${esc(article.dek || "")}</span></span>
    <span class="front-cover-read">Read →</span>
  </span>
</a>`;
}

/** The volume's stories as numbered rows with pictures where there are pictures. */
function frontContents(list, opts) {
  opts = opts || {};
  const items = ORDER.flatMap((f) => list.filter((a) => fmt(a) === f && a.slug !== opts.excludeSlug).sort(byDateDesc));
  if (!items.length) return "";
  const pictured = items.filter((a) => a.image);
  const text = items.filter((a) => !a.image);
  let no = 0;
  const num = () => String(++no).padStart(2, "0");
  return `<section class="front-contents" aria-labelledby="contents-title">
  <h2 id="contents-title">${esc(opts.title || "In this volume")}</h2>
  ${pictured.length ? `<div class="front-grid">
    ${pictured
      .map(
        (a) => `<a class="front-card" href="${attr(a.slug)}">
  <span class="row-art row-art--wide"><img src="${asset(a.image)}" alt="${attr(a.imageAlt || "")}" width="1600" height="1066" loading="lazy"/></span>
  <span class="mono row-meta"><span class="row-no">${num()}</span><span>${esc(fmt(a))}</span><span>${esc(dateShort(a.date))}</span></span>
  <span class="front-card-main"><strong class="row-title">${esc(a.headline)}</strong><span class="row-dek">${esc(a.dek || "")}</span></span>
</a>`
      )
      .join("\n    ")}
  </div>` : ""}
  ${text.length ? `<ol class="front-list">
    ${text
      .map(
        (a) => `<li><a href="${attr(a.slug)}"><span class="front-list-no">${num()}</span><span class="front-list-title">${esc(a.headline)}</span><span class="front-list-meta">${esc(fmt(a))} · ${esc(dateShort(a.date))}</span><span class="front-list-dek">${esc(a.dek || "")}</span></a></li>`
      )
      .join("\n    ")}
  </ol>` : ""}
</section>`;
}

function starsPin(zine) {
  const stars = zine.stars || [];
  if (!stars.length) return "";
  return `<aside class="zine-stars-pin" aria-labelledby="stars-pin-title">
  <div class="zine-stars-pin-head">
    <p class="zine-stars-kicker mono">Weekly</p>
    <div class="zine-stars-pin-bar">
      <h2 class="zine-stars-title" id="stars-pin-title">Stars for the Floor</h2>
      <a class="sec-link zine-stars-pin-chart" href="/news/stars-for-the-floor">The chart</a>
    </div>
  </div>
  <p class="mono zine-stars-pin-count" data-stars-count><span class="zine-stars-pin-swipe">Swipe · </span><span data-stars-index>1</span> / ${stars.length}</p>
  <div class="zine-stars-pin-scroll">
    <ol>
      ${stars.map((s) => `<li><a href="/news/stars-for-the-floor#${attr(s.id)}"><span>${esc(s.sign)}</span><em class="mono">${esc(s.dates)}</em><p>${esc(s.text)}</p></a></li>`).join("\n      ")}
    </ol>
  </div>
</aside>`;
}

function lettersBlock() {
  return `<aside class="zine-letters sec" id="desk" aria-labelledby="desk-title">
  <div class="join-grid">
    <div>
      <p class="mono sec-kicker">Write the desk</p>
      <h2 class="sec-title" id="desk-title">If it happened after two.</h2>
      <p class="page-lede">Gossip, corrections, what you wore, what you played. We read it. The good ones get printed.</p>
    </div>
    <form class="zine-letters-form" action="https://formspree.io/f/xdkwjzzr" method="POST">
      <input type="hidden" name="_subject" value="Night Shift desk letter"/>
      <div class="field"><label for="zine-letter-email">Email</label><input id="zine-letter-email" type="email" name="email" placeholder="your email" required autocomplete="email"/></div>
      <div class="field"><label for="zine-letter-body">Letter</label><textarea id="zine-letter-body" name="letter" rows="4" placeholder="what happened / what you wore / what you played" required></textarea></div>
      <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" class="sr-only zine-honeypot"/>
      <button type="submit" class="btn btn-solid">Send to the desk</button>
    </form>
  </div>
</aside>`;
}

function yearGroups(list) {
  const years = {};
  list.forEach((a) => {
    const y = String(a.date || "").slice(0, 4) || "Undated";
    (years[y] = years[y] || []).push(a);
  });
  return Object.keys(years)
    .sort((a, b) => b.localeCompare(a))
    .map((y) => [y, years[y].sort(byDateDesc)]);
}

function catalogueList(list) {
  return `<ol class="catalogue-list">${list.map((a) => `<li><a href="${attr(a.slug)}">${esc(a.headline)}</a><em class="mono">${esc(fmt(a))}</em><time class="mono" datetime="${attr(a.date)}">${esc(dateShort(a.date))}</time></li>`).join("\n")}</ol>`;
}

function zineHead(issues, zine, title, opts) {
  opts = opts || {};
  const vol = volumeOf(issues, issues.current);
  return `<header class="page-head zine-masthead${opts.compact ? " zine-masthead--compact" : ""}">
  ${L.crumbs(opts.crumbs || [["/", "Home"], [null, "Night Shift"]])}
  <p class="zine-slug mono"><span>${esc(volLabel(issues.current))}</span><span>${esc(vol ? vol.dateLabel : "")}</span></p>
  <${opts.h || "h1"} class="page-title zine-title" id="news-title"><a class="zine-logo" href="/news">Night Shift</a></${opts.h || "h1"}>
  <p class="zine-tagline">${esc(zine.tagline || "The floor · The fit · The afters")}</p>
  <nav class="zine-cols mono" aria-label="In the volume">
    <a href="/news">${esc(volLabel(issues.current))}</a>
    <a href="/news/series/stars-for-the-floor">Stars</a>
    <a href="/news/artists">Artists</a>
    <a href="/news/places">Places</a>
    <a href="/news/issues">Volumes</a>
    <a href="/news/archive">Archive</a>
    <a href="#desk">Write the desk</a>
  </nav>
</header>`;
}

/* Pages ----------------------------------------------------------------- */

function zineIndex(data) {
  const { news, issues, zine } = data;
  const articles = news.articles;
  const cur = issues.current;
  const vol = Object.assign({ count: inVolume(articles, cur).length }, volumeOf(issues, cur));
  const cover = articles.find((a) => a.slug === vol.coverSlug) || inVolume(articles, cur).sort(byDateDesc)[0];
  const start = (zine.startHere && zine.startHere.slugs ? zine.startHere.slugs : []).map((s) => articles.find((a) => a.slug === s)).filter(Boolean);
  const back = backCatalogue(articles).sort(byDateDesc);
  const main = `
${zineHead(issues, zine, "Night Shift")}
${starsPin(zine)}
<div class="news-index-front">
  ${frontCover(vol, cover)}
  ${frontContents(inVolume(articles, cur), { excludeSlug: cover && cover.slug, title: "In this volume" })}
  <section class="back-catalogue" id="back-catalogue" aria-labelledby="back-title">
    <h2 id="back-title">Before the volumes</h2>
    ${catalogueList(back.slice(0, 10))}
    ${back.length > 10 ? `<p class="front-more mono"><span>${back.length} pieces before the volumes</span><a href="/news/issues#before">All of them →</a></p>` : ""}
  </section>
  <p class="issue-jump mono"><a href="/news/issues">All volumes</a><a href="/news/archive">From the archive</a><a href="/news/artists">Artists</a><a href="/news/places">Places</a><a href="/news/series/stars-for-the-floor">Stars</a></p>
  ${lettersBlock()}
</div>`;
  return L.page({
    title: "Night Shift",
    description: `Night Shift is the Club Copy magazine: the floor, the fit, the afters. ${volLabel(cur)}, ${vol.dateLabel}.`,
    path: "/news",
    bodyClass: "news-listing",
    mainClass: "news-index",
    main,
    image: cover && cover.image,
    scripts: ["cc.js", "zine.js"],
    jsonld: [{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Night Shift", url: L.ORIGIN + "/news", isPartOf: { "@type": "WebSite", name: "Club Copy", url: L.ORIGIN + "/" }, hasPart: inVolume(articles, cur).map((a) => ({ "@type": "Article", headline: a.headline, url: L.ORIGIN + a.slug, datePublished: a.date })) }],
  });
}

function volumePage(vol, data) {
  const { news, issues, zine } = data;
  const list = inVolume(news.articles, vol.number);
  const cover = news.articles.find((a) => a.slug === vol.coverSlug) || list.slice().sort(byDateDesc)[0];
  const v = Object.assign({ count: list.length }, vol);
  const prev = volumeOf(issues, vol.number - 1);
  const next = volumeOf(issues, vol.number + 1);
  const main = `
${zineHead(issues, zine, volLabel(vol.number), { compact: true, crumbs: [["/", "Home"], ["/news", "Night Shift"], ["/news/issues", "Volumes"], [null, volLabel(vol.number)]] })}
${coverBlock(v, cover, zine)}
${contents(list, { excludeSlug: cover && cover.slug })}
<p class="issue-jump mono">${prev ? `<a href="/news/vol-${String(prev.number).padStart(2, "0")}">← ${esc(volLabel(prev.number))}</a>` : ""}<a href="/news/issues">All volumes</a>${next ? `<a href="/news/vol-${String(next.number).padStart(2, "0")}">${esc(volLabel(next.number))} →</a>` : ""}</p>`;
  return L.page({
    title: `Night Shift ${volLabel(vol.number)} — ${vol.dateLabel}`,
    description: `Night Shift ${volLabel(vol.number)}, ${vol.dateLabel}: ${list.length} stories. Cover: ${cover ? cover.headline : ""}.`,
    path: "/news/vol-" + String(vol.number).padStart(2, "0"),
    nav: "/news",
    bodyClass: "news-listing",
    mainClass: "news-index",
    main,
    image: cover && cover.image,
    scripts: ["cc.js", "zine.js"],
  });
}

function issuesPage(data) {
  const { news, issues, zine } = data;
  const vols = issues.volumes.slice().sort((a, b) => b.number - a.number);
  const start = (zine.startHere && zine.startHere.slugs ? zine.startHere.slugs : []).map((s) => news.articles.find((a) => a.slug === s)).filter(Boolean);
  const cards = vols
    .map((v) => {
      const list = inVolume(news.articles, v.number);
      const cover = news.articles.find((a) => a.slug === v.coverSlug);
      const n = String(v.number).padStart(2, "0");
      return `<a class="issue-card row row--story${v.number === issues.current ? " is-current" : ""}" href="/news/vol-${n}">
  <div class="row-main">
    <p class="mono row-meta"><span class="issue-spine">${esc(volLabel(v.number))}</span><span class="issue-count">${list.length} ${list.length === 1 ? "story" : "stories"}</span></p>
    <strong class="row-title"><span class="issue-month">${esc(v.dateLabel)}</span></strong>
    <span class="row-dek">${esc(cover ? cover.headline : v.coverHeadline || "")}</span>
  </div>
  <div class="issue-face row-art">${cover && cover.image ? `<img src="${asset(cover.image)}" alt="${attr(cover.imageAlt || "")}" width="1600" height="1066" loading="lazy"/>` : `<div class="cover-plate"><span class="cover-plate-num">${n}</span></div>`}</div>
</a>`;
    })
    .join("\n");
  const main = `
${zineHead(issues, zine, "Volumes", { compact: true, crumbs: [["/", "Home"], ["/news", "Night Shift"], [null, "Volumes"]] })}
<header class="issues-head sec-head"><h2 class="sec-title"><span class="sec-kicker">Monthly</span>Volumes</h2></header>
<div class="issue-index rows" data-issue-index>
${cards}
</div>
${issues.next ? `<p class="issue-jump mono"><span>Next: ${esc(volLabel(issues.next.number))} · ${esc(issues.next.dateLabel)}</span></p>` : ""}
${start.length ? `<section class="start-here" aria-labelledby="start-here-title"><h2 id="start-here-title">Start here</h2><p class="page-lede">${esc(zine.startHere.lead || "")}</p><ol class="issue-toc">${start.map(tocItem).join("\n")}</ol></section>` : ""}
<section class="back-catalogue" id="before" aria-labelledby="before-title">
  <h2 id="before-title">Before the volumes</h2>
  <p class="page-lede">Earlier pieces from the desk, grouped by year.</p>
  ${yearGroups(backCatalogue(news.articles)).map(([y, l]) => `<section><h3 class="mono">${esc(y)}</h3>${catalogueList(l)}</section>`).join("\n")}
</section>`;
  return L.page({ title: "Night Shift volumes", description: "Every monthly volume of Night Shift, the Club Copy magazine.", path: "/news/issues", nav: "/news", bodyClass: "news-listing", mainClass: "news-index", main, scripts: ["cc.js", "zine.js"] });
}

function issueShell(data) {
  const { issues, zine } = data;
  const main = `
${zineHead(issues, zine, "Volume", { compact: true, crumbs: [["/", "Home"], ["/news", "Night Shift"], ["/news/issues", "Volumes"], [null, "Volume"]] })}
<div data-issue-page></div>`;
  return L.page({ title: "Night Shift volume", description: "A Night Shift volume.", path: "/news/issue", nav: "/news", bodyClass: "news-listing", mainClass: "news-index", main, noindex: true, scripts: ["cc.js", "zine.js", "issue.js"] });
}

function archivePage(data) {
  const { news, issues, zine } = data;
  const list = archived(news.articles).sort(byDateDesc);
  const rows = list
    .map(
      (a) => `<tr data-title="${attr(a.headline)}" data-artist="${attr((a.artists || []).join(", "))}" data-format="${attr(fmt(a))}" data-volume="${attr(a.volume || "")}" data-date="${attr(a.date)}" data-read="${attr(a.readMinutes || "")}"><td><a href="${attr(a.slug)}">${esc(a.headline)}</a></td><td>${esc((a.artists || []).join(", "))}</td><td>${esc(fmt(a))}</td><td>${esc(a.volume ? volLabel(a.volume) : "")}</td><td><time datetime="${attr(a.date)}">${esc(dateShort(a.date))}</time></td><td>${esc(a.readMinutes ? a.readMinutes + " min" : "")}</td></tr>`
    )
    .join("\n");
  const main = `
${zineHead(issues, zine, "Archive", { compact: true, crumbs: [["/", "Home"], ["/news", "Night Shift"], [null, "From the archive"]] })}
<header class="issues-head sec-head"><h2 class="sec-title"><span class="sec-kicker">${list.length} pieces</span>From the archive</h2></header>
<p class="page-lede">These pieces have left the volume and the back catalogue. Each one is still at its own address.</p>
<form class="library-search filters" role="search" data-library-search action="/news/archive">
  <div class="filter"><label class="mono" for="library-q">Search the archive</label><input id="library-q" type="search" name="q" placeholder="Headline, artist, city, format" autocomplete="off" enterkeyhint="search"/></div>
  <p class="mono filter-count library-search-status" data-library-status hidden></p>
</form>
<section class="back-catalogue" id="archive">
  <div class="library-files" data-library-files>
    <table>
      <caption class="sr-only">From the archive</caption>
      <thead><tr>
        <th scope="col" aria-sort="none"><button type="button" data-sort="title">Title</button></th>
        <th scope="col" aria-sort="none"><button type="button" data-sort="artist">Artist</button></th>
        <th scope="col" aria-sort="none"><button type="button" data-sort="format">Format</button></th>
        <th scope="col" aria-sort="none"><button type="button" data-sort="volume">Volume</button></th>
        <th scope="col" aria-sort="descending"><button type="button" data-sort="date">Date</button></th>
        <th scope="col" aria-sort="none"><button type="button" data-sort="read" aria-label="Read time">Read</button></th>
      </tr></thead>
      <tbody>
${rows}
      </tbody>
    </table>
  </div>
</section>`;
  return L.page({ title: "Night Shift archive", description: `${list.length} archived Night Shift pieces.`, path: "/news/archive", nav: "/news", bodyClass: "news-listing", mainClass: "news-index", main, scripts: ["cc.js", "zine.js"] });
}

function tagIndex(data, key, title, lede) {
  const { news, issues, zine } = data;
  const map = {};
  news.articles.forEach((a) => (a[key] || []).forEach((t) => ((map[t] = map[t] || []).push(a))));
  const names = Object.keys(map).sort((a, b) => a.localeCompare(b));
  const main = `
${zineHead(issues, zine, title, { compact: true, crumbs: [["/", "Home"], ["/news", "Night Shift"], [null, title]] })}
<header class="issues-head sec-head"><h2 class="sec-title"><span class="sec-kicker">${names.length} ${title.toLowerCase()}</span>${esc(title)}</h2></header>
<p class="page-lede">${esc(lede)}</p>
<div class="library-index">
${names.map((n) => `<section id="${attr(slugify(n))}"><h3>${esc(n)}</h3>${catalogueList(map[n].sort(byDateDesc))}</section>`).join("\n")}
</div>`;
  return L.page({ title: `Night Shift ${title.toLowerCase()}`, description: lede, path: "/news/" + title.toLowerCase(), nav: "/news", bodyClass: "news-listing", mainClass: "news-index", main, scripts: ["cc.js", "zine.js"] });
}

function seriesPage(data) {
  const { news, issues, zine } = data;
  const list = news.articles.filter((a) => a.series === "Stars for the Floor").sort(byDateDesc);
  const main = `
${zineHead(issues, zine, "Stars", { compact: true, crumbs: [["/", "Home"], ["/news", "Night Shift"], [null, "Stars for the Floor"]] })}
${starsPin(zine)}
<section class="back-catalogue" aria-labelledby="series-title"><h2 id="series-title">The column</h2>${catalogueList(list)}</section>`;
  return L.page({ title: "Stars for the Floor", description: "Night Shift's horoscope for the dancefloor.", path: "/news/series/stars-for-the-floor", nav: "/news", bodyClass: "news-listing", mainClass: "news-index", main, scripts: ["cc.js", "zine.js"] });
}

function storyPage(a, data) {
  const { news, issues } = data;
  const articles = news.articles;
  const file = path.join(L.ROOT, "content", "news", a.id + ".html");
  let content = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "<p>This piece is being refiled.</p>";
  const flagsMatch = content.match(/^<!-- story-flags: ([^>]*) -->\n/);
  const flags = flagsMatch ? flagsMatch[1].trim().split(/\s+/) : [];
  if (flagsMatch) content = content.slice(flagsMatch[0].length);
  let hero = "";
  const heroMatch = content.match(/^<figure class="story-hero[^"]*">[\s\S]*?<\/figure>\n?/);
  if (heroMatch) {
    hero = heroMatch[0].replace(/src="(\.\.\/)+/g, 'src="/');
    content = content.slice(heroMatch[0].length);
  }
  content = content.replace(/(src|href)="(\.\.\/)+/g, '$1="/');

  // neighbours within the same shelf
  const group = a.archived ? archived(articles) : a.volume ? inVolume(articles, a.volume) : backCatalogue(articles);
  const ordered = group.slice().sort(byDateDesc);
  const i = ordered.findIndex((x) => x.id === a.id);
  const newer = i > 0 ? ordered[i - 1] : null;
  const older = i >= 0 && i < ordered.length - 1 ? ordered[i + 1] : null;
  const shelfHref = a.volume ? "/news/vol-" + String(a.volume).padStart(2, "0") : a.archived ? "/news/archive" : "/news#back-catalogue";
  const shelfLabel = a.volume ? volLabel(a.volume) : a.archived ? "Archive" : "Back catalogue";
  const info = [
    ["format", fmt(a)],
    ["volume", a.volume ? String(a.volume) : ""],
    ["date", a.dateLabel || dateShort(a.date)],
    ["author", a.author || ""],
    ["places", (a.places || []).join(", ")],
    ["artists", (a.artists || []).join(", ")],
    ["words", a.words ? `${a.words.toLocaleString("en-CA")} words · ${a.readMinutes || Math.max(1, Math.round(a.words / 230))} min` : ""],
    ["photo", a.credit || a.imageCredit || ""],
  ].filter(([, v]) => v);

  const main = `
<div class="zine-sheet zine-sheet--story">
  ${L.crumbs([["/", "Home"], ["/news", "Night Shift"], [null, a.headline]]).replace('class="crumbs"', 'class="crumbs zine-story-crumbs"')}
  <article class="news-article news-article--essay" data-zine-story>
    ${hero}
    <p class="news-kicker mono"><span>${esc((a.kicker || fmt(a)).toUpperCase())}</span></p>
    <h1 class="zine-headline">${esc(a.headline)}</h1>
    ${a.dek ? `<p class="zine-dek">${esc(a.dek)}</p>` : ""}
    <dl class="file-info mono" data-file-info>
      ${info.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("\n      ")}
    </dl>
    <div class="news-body news-body--essay${flags.map((f) => " news-body--" + f).join("")}">
${content.trim()}
    </div>
    <p class="news-byline news-byline--end mono">${esc(a.author || "Night Shift")}</p>
    <nav class="news-nav" aria-label="News navigation">
      ${newer ? `<a href="${attr(newer.slug)}">← ${esc(newer.headline)}</a>` : "<span></span>"}
      <a href="${shelfHref}">${esc(shelfLabel)}</a>
      ${older ? `<a href="${attr(older.slug)}">${esc(older.headline)} →</a>` : "<span></span>"}
    </nav>
  </article>
</div>`;
  return L.page({
    title: a.headline,
    description: a.dek || a.headline,
    path: a.slug,
    nav: "/news",
    bodyClass: "news-listing news-story",
    mainClass: "news-page",
    main,
    image: a.image,
    ogType: "article",
    scripts: ["cc.js", "zine.js"],
    jsonld: [{ "@context": "https://schema.org", "@type": "Article", headline: a.headline, description: a.dek, datePublished: a.date, author: { "@type": "Person", name: a.author || "CJ Archer" }, publisher: { "@type": "Organization", name: "Club Copy", logo: { "@type": "ImageObject", url: L.ORIGIN + "/apple-touch-icon.png" } }, image: a.image ? L.ORIGIN + asset(a.image) : undefined, mainEntityOfPage: L.ORIGIN + a.slug, isPartOf: { "@type": "Periodical", name: "Night Shift" }, articleSection: fmt(a), wordCount: a.words }],
  });
}

module.exports = { zineIndex, volumePage, issuesPage, issueShell, archivePage, tagIndex, seriesPage, storyPage, inVolume };
