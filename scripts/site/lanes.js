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
  const options = [
    `<option value="" data-label="All">All ${total}</option>`,
    ...items.map(
      (item) =>
        `<option value="${attr(item.id)}" data-label="${attr(item.name)}">${esc(item.name)} ${item.count}</option>`
    ),
  ].join("");
  return `<div class="lane">
      <label class="lane-label mono" for="pick-${kind}">${esc(label)}</label>
      <select class="lane-pick" id="pick-${kind}" data-filter="${kind}" autocomplete="off">
        ${options}
      </select>
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

/** Empty genre dropdown. tapes.js fills the options once the mixes load. */
function tapeFilterBar() {
  return `<div class="tape-filters" data-tape-filters hidden>
  <div class="lane">
    <label class="lane-label mono" for="tape-genre">Genre</label>
    <select class="lane-pick" id="tape-genre" data-filter="genre" autocomplete="off">
      <option value="" data-label="All">All</option>
    </select>
  </div>
  <p class="mono filter-count" data-tape-count aria-live="polite"></p>
</div>
<p class="listen-empty" data-tape-empty hidden>No mixes in this genre.</p>`;
}

module.exports = { laneBar, groups, tapeFilterBar };
