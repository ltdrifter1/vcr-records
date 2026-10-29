"use strict";
const L = require("../lib");
const { tapeFilterBar } = require("../lanes");

module.exports = function tapes(data) {
  const skel = '<span class="mix-skel" aria-hidden="true"></span>'.repeat(8);
  const main = `
<div class="mix-bay mix-bay--page">
  <header class="mix-marquee">
    ${L.crumbs([["/", "Home"], [null, "Mixtapes"]])}
    <p class="mix-ticket mono"><span>The wall</span><span>LT Drifta</span><span>No late fees</span></p>
    <div class="mix-marquee-row">
      <h1 class="mix-word">Mixtapes</h1>
      <a class="mix-all" href="https://soundcloud.com/ltdrifta" rel="noopener noreferrer">@ltdrifta ↗</a>
    </div>
    <p class="mix-dek">Long sets, streamed from SoundCloud. Day bin is the mellow wall. Night bin is the heavy one. Tap a case and it plays here.</p>
  </header>
  ${tapeFilterBar()}
  <p class="tapes-now" data-tapes-now role="status" hidden></p>
  <section class="mix-bin" data-tapes-panel aria-labelledby="day-title">
    <header class="bin-tab">
      <h2 class="bin-name" id="day-title">Day</h2>
      <p class="bin-note">Chill · variety</p>
    </header>
    <div class="tapes-grid" data-tapes-grid data-tapes-slot="day" aria-busy="true">${skel}</div>
  </section>
  <section class="mix-bin mix-bin--night" data-tapes-panel aria-labelledby="night-title">
    <header class="bin-tab">
      <h2 class="bin-name" id="night-title">Night</h2>
      <p class="bin-note">Heavy · dance</p>
    </header>
    <div class="tapes-grid" data-tapes-grid data-tapes-slot="night" aria-busy="true">${skel}</div>
  </section>
  <noscript><p class="mix-dek">Mixtapes need JavaScript. Listen at <a href="https://soundcloud.com/ltdrifta" rel="noopener noreferrer">soundcloud.com/ltdrifta</a>.</p></noscript>
</div>
`;
  return L.page({
    title: "Mixtapes",
    description: "Long DJ sets from LT Drifta: day and night mixes, streamed from SoundCloud through the Club Copy player.",
    path: "/tapes",
    bodyClass: "mixtapes-page",
    main,
    scripts: ["cc.js", "lanes.js", "tapes.js"],
  });
};
