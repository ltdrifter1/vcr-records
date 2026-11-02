"use strict";
const L = require("../lib");
const { esc, attr, asset, onSite } = L;
const { releaseCard } = require("./fragments");
const { laneBar, tapeFilterBar } = require("../lanes");
const { joinSection } = require("./join");
const { artistRow } = require("./artists");
const { signChart } = require("../signs");

function starsHome(zine, issues) {
  const stars = (zine && zine.stars) || [];
  if (!stars.length) return "";
  const vol = (issues.volumes || []).find((v) => Number(v.number) === Number(issues.current));
  const month = vol && vol.dateLabel ? vol.dateLabel : "";
  return `<article class="home-stars" aria-labelledby="home-stars-title">
  <div class="home-stars-head">
    <div>
      <p class="mono home-stars-kicker"><span>Monthly horoscope</span>${month ? `<span>${esc(month)}</span>` : ""}</p>
      <h3 class="home-stars-title" id="home-stars-title"><a href="/news/stars-for-the-floor">Stars for the Floor</a></h3>
    </div>
    <a class="sec-link" href="/news/stars-for-the-floor">The chart</a>
  </div>
  ${signChart(stars, (s) => "/news/stars-for-the-floor#" + s.id)}
</article>`;
}

function zineRows(articles, issues) {
  const current = issues.current;
  // Pictured pieces lead, newest first. Stars for the Floor is the horoscope chart above, not a photo row.
  const list = articles
    .filter((a) => !a.archived && Number(a.volume) === Number(current) && a.id !== "stars-for-the-floor")
    .sort((a, b) => (a.image ? 0 : 1) - (b.image ? 0 : 1) || (b.date || "").localeCompare(a.date || ""))
    .slice(0, 4);
  return list
    .map(
      (a) => `<a class="row row--story" href="${attr(a.slug)}">
  <div class="row-main">
    <p class="mono row-meta"><span>${esc(a.format || a.typeLabel || "")}</span><span>${esc(L.dateShort(a.date))}</span>${a.readMinutes ? `<span>${esc(a.readMinutes)} min</span>` : ""}</p>
    <h3 class="row-title">${esc(a.headline)}</h3>
    <p class="row-dek">${esc(a.dek || "")}</p>
    <p class="mono row-read">Read →</p>
  </div>
  ${a.image ? `<div class="row-art row-art--wide"><img src="${asset(a.image)}" alt="${attr(a.imageAlt || "")}" width="1600" height="1066" loading="lazy"/></div>` : ""}
</a>`
    )
    .join("\n");
}

function artistList(artists, releases) {
  return `<div class="rows">${artists.map((a, i) => artistRow(a, i, releases, { compact: true })).join("\n")}</div>`;
}

function videoSection(feed) {
  const videos = (feed && feed.videos) || [];
  if (!videos.length) return "";
  const channel = (feed && feed.channelUrl) || "https://www.youtube.com/@ltdrifta";
  const rows = videos
    .slice(0, 4)
    .map(
      (v) => `<article class="row row--video" data-video="${attr(v.id)}">
  <div class="row-main">
    <p class="mono row-meta"><span>Video</span><span>${esc(L.dateShort(v.published))}</span><span>YouTube</span></p>
    <h3 class="row-artist">LT Drifta</h3>
    <p class="row-title"><a href="${attr(v.url)}" rel="noopener noreferrer" data-video-embed="${attr(v.id)}">${esc(L.dashTitle(v.title))}</a></p>
    ${v.description ? `<p class="row-dek">${esc(v.description)}</p>` : ""}
    <div class="row-actions">
      <button type="button" class="key video-key" data-video-embed="${attr(v.id)}" aria-label="Play ${attr(v.title)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button>
      <a class="mono row-fmt" href="${attr(v.url)}" rel="noopener noreferrer">Watch on YouTube ↗</a>
    </div>
  </div>
  <a class="row-art row-art--wide video-art" href="${attr(v.url)}" rel="noopener noreferrer" data-video-embed="${attr(v.id)}" aria-label="Play ${attr(v.title)}"><img src="${attr(v.thumbnail)}" alt="" width="480" height="360" loading="lazy"/></a>
</article>`
    )
    .join("\n");
  return `<section class="sec" aria-labelledby="videos-title" id="videos">
  ${L.sectionHead("Video feed", { titleId: "videos-title", kicker: "YouTube · @ltdrifta", link: [channel, "Channel ↗"] })}
  <div class="rows">
    ${rows}
  </div>
</section>`;
}

module.exports = function home(data) {
  const { catalog, news, issues } = data;
  const releases = catalog.releases.filter(onSite).slice().sort((a, b) => String(b.released || "").localeCompare(String(a.released || "")));
  const teaser = releases.slice(0, 8);
  const teaserIds = new Set(teaser.map((r) => r.id));
  const featured = releases[0];

  const main = `
<section class="sec sec--list" aria-labelledby="releases-title" id="listen">
  <header class="home-sec-head">
    <h1 class="home-sec-title" id="releases-title">Releases</h1>
    <a class="sec-link" href="/library">Library</a>
  </header>
  ${laneBar({
    releases,
    artists: catalog.artists,
    label: "Release filters",
    countId: "listenCount",
    countText: `${teaser.length} releases`,
    extra: `<button type="button" class="btn btn-small" id="listenClear" hidden>Clear</button>`,
  })}
  <div class="release-grid" id="listenRows">
    ${releases.map((r, i) => releaseCard(r, { extra: !teaserIds.has(r.id), eager: i === 0 })).join("\n")}
  </div>
  <p class="listen-empty" id="listenEmpty" hidden>No releases match these filters.</p>
  <p class="rows-more mono"><a href="/library" id="listenMore">All ${releases.length} releases →</a></p>
</section>

<section class="sec sec--zine" aria-labelledby="zine-title" id="news">
  <header class="sec-head sec-head--zine">
    <p class="sec-kicker">Vol. ${String(issues.current).padStart(2, "0")} · ${esc(issues.volumes.find((v) => v.number === issues.current)?.dateLabel || "")}</p>
    <a class="sec-link" href="/news">The volume</a>
    <h2 class="zine-home-title" id="zine-title"><a class="zine-logo" href="/news"><span class="zine-logo-night">Night</span> <span class="zine-logo-shift">Shift</span></a></h2>
  </header>
  ${starsHome(data.zine, issues)}
  <div class="rows">
    ${zineRows(news.articles, issues)}
  </div>
</section>

<section class="sec sec--tapes" aria-labelledby="mixtapes-title" id="mixtapes">
  ${L.sectionHead("Mixtapes", { titleId: "mixtapes-title", kicker: "Long sets · SoundCloud", link: ["/tapes", "All mixtapes"] })}
  ${tapeFilterBar()}
  <p class="tapes-now mono" data-tapes-now role="status" hidden></p>
  <section class="mix-bin" data-tapes-panel aria-labelledby="day-bin">
    ${L.sectionHead("Day", { h: "h3", titleId: "day-bin", kicker: "Chill · variety" })}
    <div class="tapes-grid" data-tapes-grid data-tapes-slot="day" data-tapes-limit="4" aria-busy="true"><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span></div>
  </section>
  <section class="mix-bin" data-tapes-panel aria-labelledby="night-bin">
    ${L.sectionHead("Night", { h: "h3", titleId: "night-bin", kicker: "Heavy · dance" })}
    <div class="tapes-grid" data-tapes-grid data-tapes-slot="night" data-tapes-limit="4" aria-busy="true"><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span></div>
  </section>
</section>

${videoSection(data.videos)}

<section class="sec" aria-labelledby="artists-title">
  ${L.sectionHead("Artists", { titleId: "artists-title", link: ["/artists", "Roster"] })}
  ${artistList(catalog.artists, releases)}
</section>

${joinSection()}
`;

  return L.page({
    title: "",
    description: "Club Copy is an independent record label from the Pacific Northwest. House, jungle and instrumental hip-hop on digital and cassette, streamed on site.",
    path: "/",
    canonical: L.ORIGIN + "/",
    bodyClass: "home",
    main,
    image: featured && featured.cover,
    preload: featured && (featured.coverThumb || featured.cover),
    scripts: ["cc.js", "tapes.js", "join.js", "lanes.js"],
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "RecordLabel",
        name: "Club Copy",
        url: L.ORIGIN + "/",
        logo: L.ORIGIN + "/apple-touch-icon.png",
        email: "charlie@clubcopy.ca",
        foundingDate: "2024-02-12",
        foundingLocation: { "@type": "Place", name: "British Columbia, Canada" },
        genre: ["House", "Jungle", "UK Garage", "Instrumental Hip Hop", "Electronic"],
        member: catalog.artists.map((a) => ({ "@type": "MusicGroup", name: a.name, url: L.ORIGIN + "/artists/" + a.id })),
      },
    ],
  });
};
