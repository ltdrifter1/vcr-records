"use strict";
const L = require("../lib");
const { esc, attr, asset, money, clock, specLine, priceLine, formatGlyphs, playKey, dateShort, freeDownload, downloadHref } = L;

function digitalButton(rel, digital, className) {
  if (!digital || !digital.sku) return "";
  if (freeDownload(rel)) {
    return `<a class="${className}" href="${attr(downloadHref(rel))}">Free download</a>`;
  }
  return `<button type="button" class="${className}" data-add-release="${attr(rel.id)}" data-sku="${attr(digital.sku)}" data-name="${attr(rel.title + " — Digital")}" data-price="${attr(digital.price)}" data-image="${attr(asset(rel.cover))}">Digital · $${money(digital.price)}</button>`;
}

/** A release as a full-width row: text left, cover right. */
function releaseRow(rel, opts) {
  opts = opts || {};
  const digital = rel.formats && rel.formats.digital;
  const n = rel.tracksCount || (rel.tracks || []).length;
  return `<article class="row row--release" data-release="${attr(rel.id)}">
  <div class="row-main">
    <p class="mono row-meta"><span>${esc(rel.catalogue || "")}</span><span>${esc(rel.kind || "")}</span>${n ? `<span>${n} ${n === 1 ? "track" : "tracks"}</span>` : ""}<span>${esc(clock(L.releaseSeconds(rel)))}</span><span>${esc(dateShort(rel.released))}</span></p>
    <h3 class="row-artist">${opts.hideArtist ? "" : esc(rel.artist)}</h3>
    <p class="row-title"><a href="${attr(rel.page)}">${esc(L.dashTitle(rel.title))}</a></p>
    <div class="row-actions">
      ${playKey(rel)}
      ${digitalButton(rel, digital, "btn btn-small cat-add")}
      <span class="mono row-fmt">${esc(formatGlyphs(rel))}</span>
    </div>
  </div>
  <a class="row-art" href="${attr(rel.page)}" aria-label="${attr(rel.title)}"><img src="${asset(rel.coverThumb || rel.cover)}" srcset="${asset(rel.coverThumb || rel.cover)} 480w, ${asset(rel.cover)} 1200w" sizes="(min-width: 900px) 280px, 40vw" alt="${attr(rel.title + " — artwork")}" width="1200" height="1200" loading="lazy"/></a>
</article>`;
}

/** The catalogue row library.js also renders at runtime. Same classes. */
function catRow(rel) {
  const digital = rel.formats && rel.formats.digital;
  const href = rel.page || "#";
  const play = L.hasCue(rel)
    ? `<button type="button" class="cat-play" data-play-release="${attr(rel.id)}"${rel.previewTrackId ? ` data-play-track="${attr(rel.previewTrackId)}"` : ""} aria-label="Play ${attr(rel.title)}"><svg class="cp-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg><svg class="cp-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg></button><span class="cat-air status-chip status-chip--air" aria-hidden="true">On air</span>`
    : "";
  const price = digital && digital.price != null
    ? `<div class="cat-price"><p class="cat-price-line"><span class="cat-price-amt">${freeDownload(rel) ? "Free" : "$" + money(digital.price)}</span></p></div>`
    : "";
  const add = digital && digital.sku
    ? (freeDownload(rel)
      ? `<a class="btn btn-small cat-add cat-add--link" href="${attr(downloadHref(rel))}">Free download</a>`
      : `<button type="button" class="btn btn-small cat-add" data-add-release="${attr(rel.id)}" data-sku="${attr(digital.sku)}" data-name="${attr(rel.title + " — Digital")}" data-price="${attr(digital.price)}" data-image="${attr(asset(rel.cover))}">Add to cart</button>`)
    : "";
  return `<article class="cat-row" data-release="${attr(rel.id)}" data-artist-id="${attr(rel.artistId || "")}" data-genre="${attr(L.slugify(rel.genre))}"><div class="cat-cover"><a href="${attr(href)}" tabindex="-1" aria-hidden="true"><img src="${asset(rel.coverThumb || rel.cover)}" alt="${attr(rel.title + " — " + rel.artist)}" width="480" height="480" loading="lazy"/></a>${play}</div><div class="cat-main"><p class="cat-id">${esc(rel.catalogue || "")}</p><a class="cat-title" href="${attr(href)}">${esc(rel.title)}</a><span class="cat-artist">${esc(rel.artist)}</span><div class="cat-tags"><span class="cat-cue">${esc([rel.kind, formatGlyphs(rel), clock(L.releaseSeconds(rel))].filter(Boolean).join(" · "))}</span></div></div><div class="cat-side">${price}${add}</div></article>`;
}

module.exports = { releaseRow, catRow };
