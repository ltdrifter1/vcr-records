"use strict";
const L = require("../lib");
const { esc, attr, asset, onSite } = L;
const { releaseRow } = require("./fragments");

function latestFor(artist, releases) {
  return releases.find((r) => r.artistId === artist.id) || null;
}

/** One artist as a row: number, tagline, count, name, bio, play key for the latest release, photo. */
function artistRow(a, i, releases) {
  const mine = releases.filter((r) => r.artistId === a.id);
  const latest = mine[0];
  return `<article class="row row--artist" id="${attr(a.id)}">
  <div class="row-main">
    <p class="mono row-meta"><span>${String(i + 1).padStart(2, "0")}</span><span>${esc(a.tagline || "")}</span>${mine.length ? `<span>${mine.length} ${mine.length === 1 ? "release" : "releases"}</span>` : ""}</p>
    <h2 class="row-artist"><a href="/artists/${attr(a.id)}">${esc(a.name)}</a></h2>
    ${L.bioBlock(a.bio, "row-dek")}
    <div class="row-actions">
  ${latest && L.hasCue(latest) ? `<button type="button" class="key key--play roster-play" data-play-release="${attr(latest.id)}" data-play-track="${attr(latest.previewTrackId || "")}" aria-pressed="false" aria-label="Play ${attr(latest.title)}"><svg class="sc-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><svg class="sc-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg><span class="sr-only roster-play-label">Play</span></button>` : ""}
  <a class="btn btn-small" href="/artists/${attr(a.id)}">Artist page</a>
  ${latest ? `<a class="btn btn-small btn-text" href="${attr(latest.page)}">Latest: ${esc(latest.title)}</a>` : ""}
    </div>
  </div>
  ${a.photo ? `<a class="row-art row-art--photo" href="/artists/${attr(a.id)}" aria-label="${attr(a.name)}"><img src="${asset(a.photo)}" alt="${attr(a.name)}" width="1000" height="1000" loading="lazy"/></a>` : ""}
</article>`;
}

function artistsIndex(data) {
  const { catalog } = data;
  const releases = catalog.releases.filter(onSite).sort((a, b) => String(b.released || "").localeCompare(String(a.released || "")));
  const rows = catalog.artists.map((a, i) => artistRow(a, i, releases)).join("\n");
  const main = `
<header class="page-head">
  ${L.crumbs([["/", "Home"], [null, "Artists"]])}
  <h1 class="page-title">Artists</h1>
  <p class="page-lede">The roster. Pacific Northwest and beyond: house, UK garage, jungle and breaks.</p>
</header>
<div class="rows">
${rows}
</div>`;
  return L.page({
    title: "Artists",
    description: "The Club Copy roster: " + catalog.artists.map((a) => a.name).join(", ") + ".",
    path: "/artists",
    main,
    scripts: ["cc.js", "roster-play.js"],
  });
}

function artistPage(artist, data) {
  const { catalog } = data;
  const releases = catalog.releases
    .filter((r) => onSite(r) && r.artistId === artist.id)
    .sort((a, b) => String(b.released || "").localeCompare(String(a.released || "")));
  const latest = releases[0];
  const bc = latest && latest.bandcampUrl ? latest.bandcampUrl.replace(/\/(track|album)\/.*$/, "") : "";
  const main = `
<section class="release-head" aria-label="${attr(artist.name)}">
  <div class="release-copy">
    ${L.crumbs([["/", "Home"], ["/artists", "Artists"], [null, artist.name]])}
    <p class="mono row-meta"><span>${esc(artist.tagline || "")}</span>${releases.length ? `<span>${releases.length} ${releases.length === 1 ? "release" : "releases"}</span>` : ""}</p>
    <h1 class="lead-title">${esc(artist.name)}</h1>
    ${L.bioBlock(artist.bio, "page-lede")}
    <div class="lead-actions">
      ${latest && L.hasCue(latest) ? `<button type="button" class="btn btn-solid" data-play-release="${attr(latest.id)}" data-play-track="${attr(latest.previewTrackId || "")}">Play ${esc(latest.title)}</button>` : ""}
      ${releases.length ? `<a class="btn" href="/library?artist=${attr(artist.id)}">In the library</a>` : ""}
      ${bc ? `<a class="btn btn-text" href="${attr(bc)}" rel="noopener noreferrer">Bandcamp ↗</a>` : ""}
    </div>
  </div>
  ${artist.photo ? `<div class="release-sleeve"><img class="artist-photo" src="${asset(artist.photo)}" alt="${attr(artist.name)}" width="1000" height="1000" fetchpriority="high"/></div>` : ""}
</section>
${releases.length ? `<section class="sec" aria-labelledby="rel-title">${L.sectionHead("Releases", { titleId: "rel-title" })}<div class="rows">${releases.map((r) => releaseRow(r, { hideArtist: true })).join("\n")}</div></section>` : `<section class="sec"><p class="page-lede">No releases on the site yet.</p></section>`}
`;
  return L.page({
    title: artist.name,
    description: `${artist.name}: ${artist.tagline || ""}. ${L.bioParagraphs(artist.bio)[0] || ""}`.replace(/\s+/g, " ").trim(),
    path: "/artists/" + artist.id,
    main,
    image: artist.photo,
    scripts: ["cc.js"],
    jsonld: [{ "@context": "https://schema.org", "@type": "MusicGroup", name: artist.name, url: L.ORIGIN + "/artists/" + artist.id, image: artist.photo ? L.ORIGIN + asset(artist.photo) : undefined, description: L.bioText(artist.bio), memberOf: { "@type": "Organization", name: "Club Copy" } }],
  });
}

module.exports = { artistsIndex, artistPage, artistRow };
