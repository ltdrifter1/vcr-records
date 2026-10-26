"use strict";
const L = require("../lib");
const { esc, attr, onSite } = L;
const { catRow } = require("./fragments");

module.exports = function library(data) {
  const { catalog } = data;
  const releases = catalog.releases.filter(onSite).slice().sort((a, b) => String(b.released || "").localeCompare(String(a.released || "")));
  const genres = [...new Set(releases.map((r) => r.genre).filter(Boolean))].sort();
  const artists = catalog.artists.filter((a) => releases.some((r) => r.artistId === a.id));

  const main = `
<header class="page-head">
  ${L.crumbs([["/", "Home"], [null, "Library"]])}
  <h1 class="page-title">Library</h1>
  <p class="page-lede" id="libLead">Pacific Northwest house, jungle, and instrumental hip-hop. Files you keep. Edits, remixes and bootlegs are free downloads. <a href="/join">Club members 30% off music</a>.</p>
</header>

<section class="filters" aria-label="Library filters">
  <div class="filter">
    <label class="mono" for="libGenreSelect">Genre</label>
    <select id="libGenreSelect" aria-label="Filter by genre"><option value="">All genres</option>${genres.map((g) => `<option value="${attr(L.slugify(g))}">${esc(g)}</option>`).join("")}</select>
  </div>
  <div class="filter">
    <label class="mono" for="libArtistSelect">Artist</label>
    <select id="libArtistSelect" aria-label="Filter by artist"><option value="">All artists</option>${artists.map((a) => `<option value="${attr(a.id)}">${esc(a.name)}</option>`).join("")}</select>
  </div>
  <p class="mono filter-count" id="libCount" aria-live="polite">${releases.length} releases</p>
  <div class="filter-view" role="group" aria-label="Library view">
    <button type="button" class="lib-view-btn is-active" id="libViewList" data-view="list" aria-pressed="true">List</button>
    <button type="button" class="lib-view-btn" id="libViewCovers" data-view="covers" aria-pressed="false">Sleeves</button>
  </div>
  <button type="button" class="btn btn-small" id="libFilterReset" hidden>Clear</button>
</section>

<div class="cat-list" id="catList" aria-live="polite">
${releases.map(catRow).join("\n")}
</div>
`;
  return L.page({
    title: "Library",
    description: `${releases.length} releases from Club Copy. House, jungle and instrumental hip-hop on digital and cassette, streamed on site.`,
    path: "/library",
    bodyClass: "library-index",
    main,
    scripts: ["cc.js", "library.js"],
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Club Copy library",
        numberOfItems: releases.length,
        itemListElement: releases.map((r, i) => ({ "@type": "ListItem", position: i + 1, url: L.ORIGIN + r.page, name: r.title })),
      },
    ],
  });
};
