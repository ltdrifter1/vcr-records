"use strict";
const L = require("../lib");

module.exports = function tapes(data) {
  const skel = '<span class="mix-skel" aria-hidden="true"></span>'.repeat(4);
  const main = `
<header class="page-head">
  ${L.crumbs([["/", "Home"], [null, "Mixtapes"]])}
  <h1 class="page-title">Mixtapes</h1>
  <p class="page-lede">Long sets from L.T. Drifta, streamed from SoundCloud. Tap a cover to play. <a href="https://soundcloud.com/ltdrifta" rel="noopener noreferrer">@ltdrifta ↗</a></p>
</header>
<p class="tapes-now mono" data-tapes-now role="status" hidden></p>
<section class="sec sec--tight mix-slot" data-tapes-panel aria-labelledby="day-title">
  ${L.sectionHead("Day", { titleId: "day-title", kicker: "Chill · variety" })}
  <div class="tapes-grid" data-tapes-grid data-tapes-slot="day" aria-busy="true">${skel}</div>
</section>
<section class="sec sec--tight mix-slot" data-tapes-panel aria-labelledby="night-title">
  ${L.sectionHead("Night", { titleId: "night-title", kicker: "Heavy · dance" })}
  <div class="tapes-grid" data-tapes-grid data-tapes-slot="night" aria-busy="true">${skel}</div>
</section>
<noscript><p class="page-lede">Mixtapes need JavaScript. Listen at <a href="https://soundcloud.com/ltdrifta" rel="noopener noreferrer">soundcloud.com/ltdrifta</a>.</p></noscript>
`;
  return L.page({
    title: "Mixtapes",
    description: "Long DJ sets from L.T. Drifta: day and night mixes, streamed from SoundCloud through the Club Copy player.",
    path: "/tapes",
    bodyClass: "mixtapes-page",
    main,
    scripts: ["cc.js", "tapes.js"],
  });
};
