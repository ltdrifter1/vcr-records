/* Club Copy — homepage listening plate. Play the feature if it has a cue;
   otherwise the sleeve is what's on air. Cassette buy stays on the feature. */
(function () {
  "use strict";

  var plate = document.querySelector("[data-listen-plate]");
  if (!plate) return;

  var FEATURED_ID = plate.getAttribute("data-release") || "you-are-love";
  var playBtn = document.getElementById("platePlay");
  var hitBtn = document.getElementById("platePlayHit");
  var buyBtn = document.getElementById("plateBuy");
  var statusEl = plate.querySelector("[data-plate-status]");
  var sleeve = plate.querySelector(".listen-sleeve");
  var art = plate.querySelector("[data-plate-art]");

  var featured = {
    id: FEATURED_ID,
    playable: false,
    sku: "cs-you-are-love",
    price: 20,
    name: "You Are (Love) — Cassette",
    image: "you-are-love-jcard.webp",
    cover: "you-are-love-cover.webp",
    title: "You Are (Love)",
    artist: "Riscape",
  };
  var onAir = {
    id: "gorilla",
    title: "Gorilla",
    artist: "Molly Haze",
    cover: "gorilla-cover.webp",
  };

  function hasCue(rel) {
    return (rel.tracks || []).some(function (t) {
      return t && (t.preview || t.bandcampTrackId || t.previewTrack);
    });
  }

  function playTarget() {
    if (featured.playable) return featured.id;
    return onAir.id;
  }

  function soundingCover() {
    if (featured.playable) {
      return { src: featured.cover, alt: featured.title + " — " + featured.artist };
    }
    return { src: onAir.cover, alt: onAir.title + " — " + onAir.artist };
  }

  function playLabel() {
    if (featured.playable) return "Play";
    return "Play on air";
  }

  function setStatus(html) {
    if (!statusEl) return;
    statusEl.innerHTML = html;
  }

  function showSleeveHit(on) {
    if (!hitBtn) return;
    hitBtn.hidden = !on;
    if (sleeve) sleeve.classList.toggle("is-uncued", !on && !featured.playable);
  }

  function applySleeveArt() {
    var next = soundingCover();
    if (!art) return;
    art.src = next.src;
    art.alt = next.alt;
  }

  function syncButtons() {
    var label = playLabel();
    var canHit = true;
    if (!featured.playable) {
      /* Sleeve is the on-air object; hit still plays. */
      canHit = true;
    }
    showSleeveHit(canHit);
    [playBtn, hitBtn].forEach(function (btn) {
      if (!btn) return;
      btn.setAttribute("aria-label", label);
      if (btn === playBtn) btn.textContent = label;
    });
  }

  function soundingId(detail) {
    var track = detail && detail.track;
    return track && track.releaseId ? track.releaseId : "";
  }

  function playNow() {
    if (!window.VCRPlayer || !VCRPlayer.playRelease) return;
    VCRPlayer.playRelease(playTarget(), null, { autoplay: true, stage: false });
  }

  function buyCassette() {
    if (!window.VCRCart) return;
    VCRCart.add({
      sku: featured.sku,
      name: featured.name,
      price: featured.price,
      image: featured.image,
      qty: 1,
      id: featured.sku,
    });
    if (buyBtn) {
      var prev = buyBtn.textContent;
      buyBtn.textContent = "Added";
      setTimeout(function () {
        buyBtn.textContent = prev;
      }, 1800);
    }
  }

  [playBtn, hitBtn].forEach(function (btn) {
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      playNow();
    });
  });

  if (buyBtn) {
    buyBtn.addEventListener("click", function (e) {
      e.preventDefault();
      buyCassette();
    });
  }

  window.addEventListener("vcr:player", function (e) {
    var d = e.detail || {};
    var mine = soundingId(d) === playTarget();
    var live = !!(d.playing && mine);
    if (sleeve) sleeve.classList.toggle("is-live", live);
    if (hitBtn) hitBtn.classList.toggle("is-playing", live);
  });

  fetch("/data/catalog.json")
    .then(function (r) {
      return r.ok ? r.json() : null;
    })
    .then(function (data) {
      var releases = (data && data.releases) || [];
      var feat = null;
      var i;
      for (i = 0; i < releases.length; i++) {
        if (releases[i].id === FEATURED_ID) feat = releases[i];
      }
      if (feat) {
        featured.playable = hasCue(feat);
        featured.title = feat.title || featured.title;
        featured.artist = feat.artist || featured.artist;
        featured.cover = feat.cover || featured.cover;
        var cassette = feat.formats && feat.formats.cassette;
        if (cassette) {
          if (cassette.sku) featured.sku = cassette.sku;
          if (cassette.price != null) featured.price = Number(cassette.price);
          if (cassette.image) featured.image = cassette.image;
        }
        featured.name = (feat.title || "Release") + " — Cassette";
      }
      var dated = releases
        .filter(function (r) {
          return r.id !== FEATURED_ID && hasCue(r);
        })
        .sort(function (a, b) {
          return String(b.released || "").localeCompare(String(a.released || ""));
        });
      if (dated[0]) {
        onAir = {
          id: dated[0].id,
          title: dated[0].title,
          artist: dated[0].artist,
          cover: dated[0].cover || dated[0].coverThumb || onAir.cover,
        };
      }
      applySleeveArt();
      if (featured.playable) {
        setStatus("On the plate · play the record");
      } else {
        setStatus(
          "Cassette pre-order. Sleeve is <a href=\"/" +
            onAir.id +
            "\">" +
            (onAir.title || "the library") +
            "</a> on air."
        );
      }
      syncButtons();
    })
    .catch(function () {
      applySleeveArt();
      syncButtons();
    });

  applySleeveArt();
  syncButtons();
})();
