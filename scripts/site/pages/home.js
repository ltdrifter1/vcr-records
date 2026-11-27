"use strict";
const L = require("../lib");
const { onSite } = L;
const { releaseCard } = require("./fragments");
const { laneBar, tapeFilterBar } = require("../lanes");

module.exports = function home(data) {
  const { catalog } = data;
  const releases = catalog.releases.filter(onSite).slice().sort((a, b) => String(b.released || "").localeCompare(String(a.released || "")));
  // Three rows of four on the desktop grid. The rest stay in the markup for filters.
  const teaser = releases.slice(0, 12);
  const teaserIds = new Set(teaser.map((r) => r.id));
  const featured = releases[0];
  const main = `
<section class="sec sec--list" aria-labelledby="releases-title" id="listen">
  <header class="home-sec-head">
    <h1 class="home-sec-title" id="releases-title">New Arrivals</h1>
    <div class="home-sec-tools">
      <button type="button" class="btn btn-small home-find" id="listenFind" aria-expanded="false" aria-controls="listenFilters">Find…</button>
      <a class="sec-link" href="/library">Library</a>
    </div>
  </header>
  <div class="home-filters" id="listenFilters" hidden>
  ${laneBar({
    releases,
    artists: catalog.artists,
    label: "Release filters",
    countId: "listenCount",
    countText: `${teaser.length} on the wall`,
    extra: `<button type="button" class="btn btn-small" id="listenClear" hidden>Clear</button>`,
  })}
  </div>
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
`;

  return L.page({
    title: "",
    winTitle: "New Arrivals",
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
