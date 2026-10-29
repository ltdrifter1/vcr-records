"use strict";
const L = require("./lib");
const { esc, attr } = L;

function groups(releases, artists) {
  const genreMap = new Map();
  releases.forEach((r) => {
    const name = String(r.genre || "").trim();
    const id = L.slugify(name);
    if (!id) return;
    const row = genreMap.get(id) || { id, name, count: 0 };
    row.count += 1;
    genreMap.set(id, row);
  });
  const genres = [...genreMap.values()].sort((a, b) => a.name.localeCompare(b.name));
  const artistItems = (artists || [])
    .filter((a) => releases.some((r) => r.artistId === a.id))
    .map((a) => ({ id: a.id, name: a.name, count: releases.filter((r) => r.artistId === a.id).length }));
  return { genres, artistItems, total: releases.length };
}

function lane(kind, label, items, total) {
  const buttons = [
    `<button type="button" role="radio" data-value="" data-label="All" aria-checked="true" tabindex="0">All<span class="n">${total}</span></button>`,
    ...items.map(
      (item) =>
        `<button type="button" role="radio" data-value="${attr(item.id)}" data-label="${attr(item.name)}" aria-checked="false" tabindex="-1">${esc(item.name)}<span class="n">${item.count}</span></button>`
    ),
  ].join("");
  return `<div class="lane">
      <span class="lane-label mono" id="lane-${kind}">${esc(label)}</span>
      <div class="seg" role="radiogroup" aria-labelledby="lane-${kind}" data-filter="${kind}">
        <span class="plate" aria-hidden="true"></span>
        ${buttons}
      </div>
    </div>`;
}

/** Counted genre and artist lanes. `extra` is markup for the meta side (view toggle, clear). */
function laneBar(opts) {
  const { genres, artistItems, total } = groups(opts.releases, opts.artists);
  return `<section class="filters" aria-label="${attr(opts.label || "Release filters")}">
  <div class="lanes">
    ${lane("genre", "Genre", genres, total)}
    ${lane("artist", "Artist", artistItems, total)}
  </div>
  <div class="filter-meta">
    <p class="mono filter-count" id="${attr(opts.countId || "releaseCount")}" aria-live="polite">${esc(opts.countText != null ? opts.countText : total + " releases")}</p>
    ${opts.extra || ""}
  </div>
</section>`;
}

/** Empty genre lane. tapes.js fills the buttons once the mixes load. */
function tapeFilterBar() {
  return `<div class="tape-filters" data-tape-filters hidden>
  <div class="lane">
    <span class="lane-label mono" id="tape-genre-label">Aisle</span>
    <div class="seg" role="radiogroup" aria-labelledby="tape-genre-label" data-filter="genre">
      <span class="plate" aria-hidden="true"></span>
    </div>
  </div>
  <p class="mono filter-count" data-tape-count aria-live="polite"></p>
</div>
<p class="listen-empty" data-tape-empty hidden>Nothing in this aisle.</p>`;
}

module.exports = { laneBar, groups, tapeFilterBar };
