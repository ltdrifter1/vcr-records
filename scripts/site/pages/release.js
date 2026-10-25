"use strict";
const L = require("../lib");
const { esc, attr, asset, money, clock, specLine, priceLine, formatGlyphs, dateLong, onSite } = L;
const { releaseRow } = require("./fragments");

module.exports = function release(rel, data) {
  const { catalog } = data;
  const digital = rel.formats && rel.formats.digital;
  const cassette = rel.formats && rel.formats.cassette;
  const cassetteOut = cassette && (cassette.stock === 0 || cassette.soldOut);
  const tracks = rel.tracks || [];
  const total = clock(L.releaseSeconds(rel));
  const others = catalog.releases
    .filter((r) => onSite(r) && r.id !== rel.id && r.artistId === rel.artistId)
    .sort((a, b) => String(b.released || "").localeCompare(String(a.released || "")))
    .slice(0, 4);
  const notes = (rel.notes || []).map((p) => `<p>${esc(p)}</p>`).join("\n");
  const specs = Object.assign({ artist: rel.artist }, rel.specs || {});
  const specRows = [
    ["Artist", `<a href="/artists/${attr(rel.artistId)}">${esc(rel.artist)}</a>`],
    ["Catalogue", esc(rel.catalogue || "")],
    ["Format", esc(specs.format || [rel.kind, formatGlyphs(rel)].filter(Boolean).join(" · "))],
    ["Released", esc(specs.released || dateLong(rel.released))],
    ["Genre", esc(rel.genre || "")],
    ["Published", esc(specs.published || "Club Copy · Copy House Publishing")],
  ].filter(([, v]) => v);

  const bind = {
    releaseId: rel.id,
    previewTrackId: rel.previewTrackId || (tracks[0] && tracks[0].id) || null,
    tracks: tracks.map((t) => ({ id: t.id, title: t.title })),
  };
  const formats = {};
  if (cassette && cassette.sku) formats.cassette = { sku: cassette.sku, name: rel.title + " — Cassette", price: cassette.price, image: asset(rel.cover) };
  if (digital && digital.sku) formats.digital = { sku: digital.sku, name: rel.title + " — Digital (" + rel.kind + ")", price: digital.price, image: asset(rel.cover) };

  const inline = `VCRReleaseBind(${JSON.stringify(bind)});
(function(){var F=${JSON.stringify(formats)};var t=null;function bind(id,k){var b=document.getElementById(id);if(!b)return;var label=b.textContent;b.addEventListener("click",function(){var f=F[k];if(!f||!window.VCRCart)return;VCRCart.add({sku:f.sku,name:f.name,price:f.price,image:f.image,qty:1,id:f.sku});b.textContent="Added";clearTimeout(t);t=setTimeout(function(){b.textContent=label;},2200);});}bind("buyDigitalBtn","digital");bind("buyBtn","cassette");})();`;

  const main = `
<section class="lead lead--release" aria-label="${attr(rel.title)}" data-release="${attr(rel.id)}" style="--lead-size:${L.leadSize(rel.title, rel.artist)[0]};--lead-size-s:${L.leadSize(rel.title, rel.artist)[1]}">
  <p class="lead-top mono">
    <span class="lead-top-left"><span><a href="/">Home</a></span><span><a href="/library">Library</a></span><span class="lead-cat">${esc(rel.catalogue || "")}</span></span>
    <span class="lead-clock"><span class="p-hide">Released</span><span>${esc(dateLong(rel.released))}</span></span>
  </p>
  <div class="lead-body listen-plate">
    <div class="lead-copy">
      <div class="lead-lockup">
        <p class="lead-artist"><a href="/artists/${attr(rel.artistId)}">${esc(rel.artist)}</a></p>
        <h1 class="lead-title">${esc(L.dashTitle(rel.title))}</h1>
      </div>
      <div class="lead-player">
        <div class="lead-keys ra-hero-ctas">
          <button type="button" class="btn btn-solid" id="heroListen" aria-label="Play"><svg class="glyph-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v16l14-8z"/></svg><svg class="glyph-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/></svg><span class="btn-label btn-label--play">Play</span><span class="btn-label btn-label--pause">Pause</span></button>
          ${digital && digital.sku ? `<button type="button" class="btn" id="buyDigitalBtn">Digital · $${money(digital.price)}</button>` : ""}
          ${cassette && cassette.sku ? `<button type="button" class="btn" id="buyBtn"${cassetteOut ? " disabled" : ""}>${cassetteOut ? "Cassette · Sold out" : "Cassette · $" + money(cassette.price)}</button>` : ""}
        </div>
        <div class="ra-tracks hero-tracks" role="list" aria-label="Tracks">
          ${tracks.map((t, i) => `<div class="track-row" role="button" tabindex="0" data-index="${i}" data-duration="${attr(t.duration || 0)}"><span class="track-no">${String(t.trackNum || i + 1).padStart(2, "0")}</span><span class="track-title">${esc(t.title)}</span><span class="track-dur"><span data-track-elapsed></span>${clock(t.duration)}</span><button class="track-play-btn" type="button" aria-label="Play ${attr(t.title)}" tabindex="-1"></button></div>`).join("\n          ")}
        </div>
        <p class="mono p-msg ra-tracks-note" id="pMsg" aria-live="polite">Total ${total} · streaming on site · files after checkout</p>
      </div>
    </div>
    <div class="lead-sleeve listen-sleeve" id="artworkWrap">
      <img src="${asset(rel.cover)}" alt="${attr(rel.title + " — " + rel.artist)}" width="1200" height="1200" fetchpriority="high"/>
      <button type="button" class="listen-sleeve-hit" id="ipPlay" aria-label="Play / pause"><span class="listen-glyph"><svg class="i-play glyph-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4v16l14-8z"/></svg><svg class="i-pause glyph-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h4.5v16H6zM13.5 4H18v16h-4.5z"/></svg></span></button>
    </div>
  </div>
  <p class="lead-foot mono"><span class="lead-foot-left"><span class="lead-cat">${esc(rel.catalogue || "")}</span><span>${esc(rel.kind || "")}</span><span class="p-hide">${tracks.length} ${tracks.length === 1 ? "track" : "tracks"}</span><span>${esc(formatGlyphs(rel) || Object.keys(rel.formats || {}).join(" + "))}</span></span>${rel.bandcampUrl ? `<a href="${attr(rel.bandcampUrl)}" rel="noopener noreferrer">Bandcamp ↗</a>` : `<a href="/library">Library →</a>`}</p>
</section>

<section class="sec release-about" aria-label="About the release">
  <div class="fact-rows">
    <div class="fact-row fact-row--notes"><p class="fact-label mono">Notes</p><div class="release-notes">${notes || `<p>${esc(rel.kind)} from ${esc(rel.artist)} on Club Copy.</p>`}</div></div>
    ${specRows.map(([k, v]) => `<div class="fact-row"><p class="fact-label mono">${k}</p><p class="fact-value">${v}</p></div>`).join("\n    ")}
  </div>
</section>

${others.length ? `<section class="sec" aria-labelledby="also-title">${L.sectionHead("Also by " + rel.artist, { titleId: "also-title", link: ["/artists/" + rel.artistId, "Artist page"] })}<div class="rows">${others.map((r) => releaseRow(r, { hideArtist: true })).join("\n")}</div></section>` : ""}
`;

  const offers = [];
  if (digital && digital.price != null) offers.push({ "@type": "Offer", price: String(digital.price), priceCurrency: "CAD", availability: "https://schema.org/InStock", itemOffered: { "@type": "Product", name: rel.title + " — Digital" } });
  if (cassette && cassette.price != null) offers.push({ "@type": "Offer", price: String(cassette.price), priceCurrency: "CAD", availability: cassetteOut ? "https://schema.org/SoldOut" : "https://schema.org/InStock", itemOffered: { "@type": "Product", name: rel.title + " — Cassette" } });

  return L.page({
    title: `${rel.title} — ${rel.artist}`,
    description: rel.description || `${rel.title} by ${rel.artist}. ${specLine(rel)}. ${priceLine(rel)}. Club Copy.`,
    path: rel.page,
    bodyClass: "archive-release release-page",
    main,
    image: rel.cover,
    preload: rel.cover,
    ogType: "music.album",
    scripts: ["cc.js", "release-bind.js"],
    inline,
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "MusicAlbum",
        name: rel.title,
        byArtist: { "@type": "MusicGroup", name: rel.artist, url: L.ORIGIN + "/artists/" + rel.artistId },
        albumReleaseType: rel.kind === "Album" ? "AlbumRelease" : rel.kind === "EP" ? "EPRelease" : "SingleRelease",
        datePublished: rel.released,
        image: L.ORIGIN + asset(rel.cover),
        recordLabel: { "@type": "Organization", name: "Club Copy" },
        catalogNumber: rel.catalogue,
        numTracks: tracks.length,
        track: tracks.map((t, i) => ({ "@type": "MusicRecording", name: t.title, position: i + 1, duration: t.duration ? `PT${Math.floor(t.duration / 60)}M${t.duration % 60}S` : undefined })),
        offers,
      },
    ],
  });
};
