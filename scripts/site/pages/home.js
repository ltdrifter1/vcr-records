"use strict";
const L = require("../lib");
const { esc, attr, onSite } = L;
const { releaseCard } = require("./fragments");
const { laneBar, tapeFilterBar } = require("../lanes");

/** Two System 7 group boxes. The whole box is the link. */
function homePlates(artists, issues, zine) {
  const vol = (issues.volumes || []).find((v) => Number(v.number) === Number(issues.current));
  const num = String(issues.current).padStart(2, "0");
  const when = vol && vol.dateLabel ? vol.dateLabel : "";
  const beats = String((zine && zine.tagline) || "The floor · The fit · The afters")
    .split("·")
    .map((s) => s.trim())
    .filter(Boolean);
  const count = artists.length === 1 ? "1 artist" : `${artists.length} artists`;
  const lines = (items) => items.map((item) => `<span class="home-plate-line">${esc(item)}</span>`).join("");
  return `<section class="home-plates" aria-label="Night Shift and the roster">
  <a class="home-plate" id="news" href="/news">
    <h2 class="home-plate-title" id="zine-title">Night Shift</h2>
    <p class="home-plate-kicker">Vol. ${esc(num)}${when ? ` · ${esc(when)}` : ""}</p>
    ${lines(beats)}
  </a>
  <a class="home-plate" id="artists" href="/artists">
    <h2 class="home-plate-title" id="artists-title">Artists</h2>
    <p class="home-plate-kicker">${esc(count)}</p>
    ${lines(artists.map((a) => a.name))}
  </a>
</section>`;
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
  const { catalog, issues, zine } = data;
  const releases = catalog.releases.filter(onSite).slice().sort((a, b) => String(b.released || "").localeCompare(String(a.released || "")));
  // Three rows of four on the desktop grid. The rest stay in the markup for filters.
  const teaser = releases.slice(0, 12);
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

${homePlates(catalog.artists, issues, zine)}

${videoSection(data.videos)}
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
    scripts: ["cc.js", "tapes.js", "lanes.js"],
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
        genre: ["House", "Jungle", "UK Garage", "Instrumental Hip Hop", "Drum & Bass"],
        member: catalog.artists.map((a) => ({ "@type": "MusicGroup", name: a.name, url: L.ORIGIN + "/artists/" + a.id })),
      },
    ],
  });
};
