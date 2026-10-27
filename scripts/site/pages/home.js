"use strict";
const L = require("../lib");
const { esc, attr, asset, money, clock, specLine, priceLine, hasCue, onSite, dateLong, playKey, freeDownload } = L;
const { releaseRow } = require("./fragments");
const { joinSection } = require("./join");
const { artistRow } = require("./artists");

function leadRelease(rel) {
  const digital = rel.formats && rel.formats.digital;
  const cassette = rel.formats && rel.formats.cassette;
  const [big, small] = L.leadSize(rel.title, rel.artist);
  const n = (rel.tracks || []).length;
  const tracks = (rel.tracks || []).map((t, i) => `<li><button type="button" class="hero-track" data-play-release="${attr(rel.id)}" data-play-track="${attr(t.id)}" data-duration="${attr(t.duration || 0)}"><span class="ht-no">${String(t.trackNum || i + 1).padStart(2, "0")}</span><span class="ht-title">${esc(t.title)}</span><span class="ht-dur"><span data-track-elapsed></span>${clock(t.duration)}</span></button></li>`).join("\n        ");
  const glyphs = `<svg class="glyph-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v16l14-8z"/></svg><svg class="glyph-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/></svg>`;
  return `<section class="lead" id="room" data-listen-plate data-release="${attr(rel.id)}" aria-label="${attr(rel.title)}" style="--lead-size:${big};--lead-size-s:${small}">
  <p class="lead-top mono">
    <span class="lead-top-left"><span class="lead-state" data-lead-state>Club Copy</span><span class="lead-place" data-lead-idle>Cumberland, BC</span><span class="lead-now" data-lead-now hidden></span></span>
    <span class="lead-clock" data-clock><span><time data-clock-time>··:··</time></span></span>
  </p>
  <div class="lead-body listen-plate">
    <div class="lead-copy">
      <div class="lead-lockup">
        <p class="lead-artist"><a href="/artists/${attr(rel.artistId)}">${esc(rel.artist)}</a></p>
        <h1 class="lead-title"><a href="${attr(rel.page)}">${esc(L.dashTitle(rel.title))}</a></h1>
      </div>
      <div class="lead-player">
        <div class="lead-keys listen-plate-actions">
          <button type="button" class="btn btn-solid" id="platePlay" aria-label="Play">${glyphs}<span class="btn-label">Play</span></button>
          ${digital ? `<button type="button" class="btn" id="plateBuyDigital">${freeDownload(rel) ? "Free download" : "Digital · $" + money(digital.price)}</button>` : ""}
          <button type="button" class="btn" id="plateBuy"${cassette ? "" : " hidden"}>Cassette</button>
        </div>
        <ol class="hero-tracks" aria-label="Tracks">
        ${tracks}
        </ol>
      </div>
    </div>
    <div class="lead-sleeve listen-sleeve">
      <img data-plate-art src="${asset(rel.cover)}" alt="${attr(rel.title + " — " + rel.artist)}" width="1200" height="1200" fetchpriority="high"/>
      <button type="button" class="listen-sleeve-hit" id="platePlayHit" aria-label="Play ${attr(rel.title)}"><span class="listen-glyph">${glyphs}</span></button>
    </div>
  </div>
  <p class="lead-foot mono"><span class="lead-foot-left"><span class="lead-cat">${esc(rel.catalogue || "")}</span><span class="p-hide">${esc(rel.kind || "")}</span><span class="lead-cat">${esc(dateLong(rel.released))}</span></span><a href="${attr(rel.page)}">Release page →</a></p>
</section>`;
}

function zineRows(articles, issues) {
  const current = issues.current;
  // Pictured pieces lead, newest first; text pieces follow if the volume is short of pictures.
  const list = articles
    .filter((a) => !a.archived && Number(a.volume) === Number(current))
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
  return `<div class="rows">${artists.map((a, i) => artistRow(a, i, releases)).join("\n")}</div>`;
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
    <h3 class="row-artist">L.T. Drifta</h3>
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
  // The lead is catalog.lead when it names a streamable release on site; otherwise the newest with a stream.
  const pinned = catalog.lead && releases.find((r) => r.id === catalog.lead && hasCue(r));
  const featured = pinned || releases.find(hasCue) || releases[0];
  const rest = releases.filter((r) => r.id !== featured.id).slice(0, 8);

  const main = `
${leadRelease(featured)}

<section class="sec sec--list" aria-label="Releases" id="listen">
  <div class="rows">
    ${rest.map((r) => releaseRow(r)).join("\n")}
  </div>
  <p class="rows-more mono"><a href="/library">All ${releases.length} releases →</a></p>
</section>

<section class="sec sec--zine" aria-labelledby="zine-title" id="news">
  <header class="sec-head sec-head--zine">
    <p class="sec-kicker">Vol. ${String(issues.current).padStart(2, "0")} · ${esc(issues.volumes.find((v) => v.number === issues.current)?.dateLabel || "")}</p>
    <a class="sec-link" href="/news">The volume</a>
    <h2 class="zine-home-title" id="zine-title"><a class="zine-logo" href="/news"><span class="zine-logo-night">Night</span> <span class="zine-logo-shift">Shift</span></a></h2>
  </header>
  <div class="rows">
    ${zineRows(news.articles, issues)}
  </div>
</section>

<section class="sec" aria-labelledby="mixtapes-title" id="mixtapes">
  ${L.sectionHead("Mixtapes", { titleId: "mixtapes-title", kicker: "Long sets · SoundCloud", link: ["/tapes", "All mixtapes"] })}
  <p class="tapes-now mono" data-tapes-now hidden></p>
  <div class="mix-slot" data-tapes-panel>
    <p class="mono slot-label">Day</p>
    <div class="tapes-grid" data-tapes-grid data-tapes-slot="day" data-tapes-limit="3" aria-busy="true"><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span></div>
  </div>
  <div class="mix-slot" data-tapes-panel>
    <p class="mono slot-label">Night</p>
    <div class="tapes-grid" data-tapes-grid data-tapes-slot="night" data-tapes-limit="3" aria-busy="true"><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span></div>
  </div>
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
    image: featured.cover,
    preload: featured.cover,
    scripts: ["cc.js", "plate.js", "tapes.js", "join.js"],
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
