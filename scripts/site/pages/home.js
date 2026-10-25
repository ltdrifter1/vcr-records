"use strict";
const L = require("../lib");
const { esc, attr, asset, money, clock, specLine, priceLine, hasCue, onSite, dateLong, playKey } = L;
const { releaseRow } = require("./fragments");
const { joinSection } = require("./join");

function leadRelease(rel) {
  const digital = rel.formats && rel.formats.digital;
  const cassette = rel.formats && rel.formats.cassette;
  const tracks = (rel.tracks || []).map((t, i) => `<li><button type="button" class="hero-track" data-play-release="${attr(rel.id)}" data-play-track="${attr(t.id)}"><span class="ht-no">${String(t.trackNum || i + 1).padStart(2, "0")}</span><span class="ht-title">${esc(t.title)}</span><span class="ht-dur">${clock(t.duration)}</span></button></li>`).join("\n");
  return `<section class="lead" id="room" data-listen-plate data-release="${attr(rel.id)}" aria-label="${attr(rel.title)}">
  <div class="listen-plate lead-grid">
    <div class="lead-copy">
      <p class="mono lead-kicker"><span>Out now</span><span>${esc(dateLong(rel.released))}</span></p>
      <p class="lead-artist"><a href="/artists/${attr(rel.artistId)}">${esc(rel.artist)}</a></p>
      <h1 class="lead-title"><a href="${attr(rel.page)}">${esc(rel.title)}</a></h1>
      <div class="lcd" aria-live="polite">
        <p class="listen-plate-spec">${esc(specLine(rel))}</p>
        <p class="listen-plate-status" data-plate-status>${esc(priceLine(rel))}</p>
      </div>
      <div class="lead-actions listen-plate-actions">
        <button type="button" class="btn btn-solid" id="platePlay">Play</button>
        ${digital ? `<button type="button" class="btn" id="plateBuyDigital">Digital · $${money(digital.price)}</button>` : ""}
        <button type="button" class="btn" id="plateBuy"${cassette ? "" : " hidden"}>Cassette</button>
        <a class="btn btn-text" href="${attr(rel.page)}">Release page</a>
      </div>
      <ol class="hero-tracks index" aria-label="Tracks">
        ${tracks}
      </ol>
    </div>
    <div class="lead-sleeve">
      <div class="listen-sleeve">
        <img data-plate-art src="${asset(rel.cover)}" alt="${attr(rel.title + " — " + rel.artist)}" width="1200" height="1200" fetchpriority="high"/>
        <button type="button" class="listen-sleeve-hit" id="platePlayHit" aria-label="Play ${attr(rel.title)}"><span class="listen-glyph"><svg class="glyph-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><svg class="glyph-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg></span></button>
      </div>
    </div>
  </div>
</section>`;
}

function zineRows(articles, issues) {
  const current = issues.current;
  const list = articles
    .filter((a) => !a.archived && Number(a.volume) === Number(current))
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .slice(0, 4);
  return list
    .map(
      (a) => `<a class="row row--story" href="${attr(a.slug)}">
  <div class="row-main">
    <p class="mono row-meta"><span>${esc(a.format || a.typeLabel || "")}</span><span>${esc(L.dateShort(a.date))}</span></p>
    <h3 class="row-title">${esc(a.headline)}</h3>
    <p class="row-dek">${esc(a.dek || "")}</p>
  </div>
  ${a.image ? `<div class="row-art row-art--wide"><img src="${asset(a.image)}" alt="${attr(a.imageAlt || "")}" width="1600" height="1066" loading="lazy"/></div>` : ""}
</a>`
    )
    .join("\n");
}

function artistList(artists, releases) {
  const counts = {};
  releases.forEach((r) => { counts[r.artistId] = (counts[r.artistId] || 0) + 1; });
  return `<ol class="artist-list">${artists
    .map((a) => {
      const n = counts[a.id] || 0;
      return `<li><a class="artist-line" href="/artists/${attr(a.id)}"><span class="artist-line-name">${esc(a.name)}</span><span class="mono artist-line-meta">${esc(a.tagline || "")}</span><span class="mono artist-line-count">${n ? n + (n === 1 ? " release" : " releases") : "Roster"}</span></a></li>`;
    })
    .join("")}</ol>`;
}

module.exports = function home(data) {
  const { catalog, news, issues } = data;
  const releases = catalog.releases.filter(onSite).slice().sort((a, b) => String(b.released || "").localeCompare(String(a.released || "")));
  const featured = catalog.releases.find((r) => r.id === "pitch-black" && hasCue(r)) || releases.find(hasCue) || releases[0];
  const rest = releases.filter((r) => r.id !== featured.id).slice(0, 8);

  const main = `
${leadRelease(featured)}

<section class="sec" aria-labelledby="releases-title" id="listen">
  ${L.sectionHead("Releases", { titleId: "releases-title", link: ["/library", `All ${releases.length} releases`] })}
  <div class="rows">
    ${rest.map((r) => releaseRow(r)).join("\n")}
  </div>
</section>

<section class="sec" aria-labelledby="zine-title" id="news">
  ${L.sectionHead("Night Shift", { titleId: "zine-title", kicker: `Vol. ${String(issues.current).padStart(2, "0")} · ${issues.volumes.find((v) => v.number === issues.current)?.dateLabel || ""}`, link: ["/news", "The volume"] })}
  <div class="rows">
    ${zineRows(news.articles, issues)}
  </div>
</section>

<section class="sec" aria-labelledby="mixtapes-title" id="mixtapes">
  ${L.sectionHead("Mixtapes", { titleId: "mixtapes-title", kicker: "Long sets · SoundCloud", link: ["/tapes", "All mixtapes"] })}
  <p class="tapes-now mono" data-tapes-now hidden></p>
  <div class="mix-slot" data-tapes-panel>
    <p class="mono slot-label">Day</p>
    <div class="tapes-grid" data-tapes-grid data-tapes-slot="day" data-tapes-limit="4" aria-busy="true"><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span></div>
  </div>
  <div class="mix-slot" data-tapes-panel>
    <p class="mono slot-label">Night</p>
    <div class="tapes-grid" data-tapes-grid data-tapes-slot="night" data-tapes-limit="4" aria-busy="true"><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span><span class="mix-skel" aria-hidden="true"></span></div>
  </div>
</section>

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
