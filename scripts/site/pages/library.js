"use strict";
const L = require("../lib");
const { onSite } = L;
const { catRow } = require("./fragments");
const { laneBar } = require("../lanes");

module.exports = function library(data) {
  const { catalog } = data;
  const releases = catalog.releases.filter(onSite).slice().sort((a, b) => String(b.released || "").localeCompare(String(a.released || "")));
  const filters = laneBar({
    releases,
    artists: catalog.artists,
    label: "Library filters",
    countId: "libCount",
    countText: `${releases.length} releases`,
    extra: `<div class="filter-view" role="group" aria-label="Library view">
      <button type="button" class="lib-view-btn is-active" id="libViewList" data-view="list" aria-pressed="true">List</button>
      <button type="button" class="lib-view-btn" id="libViewCovers" data-view="covers" aria-pressed="false">Sleeves</button>
    </div>
    <button type="button" class="btn btn-small" id="libFilterReset" hidden>Clear</button>`,
  });

  const main = `
<header class="page-head">
  ${L.crumbs([["/", "Home"], [null, "Library"]])}
  <h1 class="page-title">Library</h1>
  <p class="page-lede" id="libLead">Pacific Northwest house, jungle, and instrumental hip-hop. Files you keep. Edits, remixes and bootlegs are free downloads. <a href="/join">Club members 30% off music</a>.</p>
</header>

${filters}

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
    scripts: ["cc.js", "lanes.js", "library.js"],
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
