/* Club Copy — homepage listening plate. Play the featured record.
   Cassette buy stays on the feature. */
(function () {
  "use strict";

  var plate = document.querySelector("[data-listen-plate]");
  if (!plate) return;

  var FEATURED_ID = plate.getAttribute("data-release") || "you-are-love";
  var playBtn = document.getElementById("platePlay");
  var hitBtn = document.getElementById("platePlayHit");
  var buyBtn = document.getElementById("plateBuy");
  var buyDigitalBtn = document.getElementById("plateBuyDigital");
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
    digitalSku: "dg-you-are-love",
    digitalPrice: 9,
    digitalName: "You Are (Love) — Digital",
    digitalImage: "you-are-love-cover.webp",
    cassetteBackorder: true,
  };

  function hasCue(rel) {
    return (rel.tracks || []).some(function (t) {
      return t && (t.preview || t.bandcampTrackId || t.previewTrack);
    });
  }

  function playTarget() {
    return featured.id;
  }

  function soundingCover() {
    return { src: featured.cover, alt: featured.title + " — " + featured.artist };
  }

  function playLabel(playing) {
    if (playing) return "Pause";
    return "Play";
  }

  function setPlayUi(playing) {
    var label = playLabel(playing);
    if (hitBtn) {
      hitBtn.hidden = false;
      hitBtn.classList.toggle("is-playing", !!playing);
      hitBtn.setAttribute("aria-label", label);
    }
    if (playBtn) {
      playBtn.textContent = label;
      playBtn.classList.toggle("is-playing", !!playing);
      playBtn.setAttribute("aria-label", label);
    }
    if (sleeve) sleeve.classList.toggle("is-live", !!playing);
    if (plate) plate.classList.toggle("is-live", !!playing);
    var plateRoot = plate && plate.querySelector(".listen-plate");
    if (plateRoot) plateRoot.classList.toggle("is-live", !!playing);
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
    showSleeveHit(true);
    setPlayUi(false);
  }

  function soundingId(detail) {
    var track = detail && detail.track;
    return track && track.releaseId ? track.releaseId : "";
  }

  function playNow() {
    if (!window.VCRPlayer || !VCRPlayer.playRelease) return;
    var id = playTarget();
    var st = VCRPlayer.getState && VCRPlayer.getState();
    if (st && st.playing && st.track && st.track.releaseId === id) {
      VCRPlayer.toggle();
      return;
    }
    setPlayUi(true);
    VCRPlayer.playRelease(id, null, { autoplay: true, stage: false }).then(function (queued) {
      if (queued) return;
      setPlayUi(false);
    }).catch(function () {
      setPlayUi(false);
    });
  }

  function buyCassette() {
    if (!window.VCRCart || !featured.sku) return;
    VCRCart.add({
      sku: featured.sku,
      name: featured.name,
      price: featured.price,
      image: featured.image,
      qty: 1,
      id: featured.sku,
    });
    flashBuy(buyBtn);
  }

  function buyDigital() {
    if (!window.VCRCart || !featured.digitalSku) return;
    VCRCart.add({
      sku: featured.digitalSku,
      name: featured.digitalName,
      price: featured.digitalPrice,
      image: featured.digitalImage || featured.cover,
      qty: 1,
      id: featured.digitalSku,
    });
    flashBuy(buyDigitalBtn);
  }

  function flashBuy(btn) {
    if (!btn) return;
    var prev = btn.textContent;
    btn.textContent = "Added";
    setTimeout(function () {
      btn.textContent = prev;
    }, 1800);
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

  if (buyDigitalBtn) {
    buyDigitalBtn.addEventListener("click", function (e) {
      e.preventDefault();
      buyDigital();
    });
  }

  window.addEventListener("vcr:player", function (e) {
    var d = e.detail || {};
    var mine = soundingId(d) === playTarget() || soundingId(d) === featured.id;
    var live = !!(d.playing && mine);
    setPlayUi(live);
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
        var digital = feat.formats && feat.formats.digital;
        if (cassette) {
          if (cassette.sku) featured.sku = cassette.sku;
          if (cassette.price != null) featured.price = Number(cassette.price);
          if (cassette.image) featured.image = cassette.image;
          featured.cassetteBackorder = !!cassette.backorder;
        }
        featured.name = (feat.title || "Release") + " — Cassette";
        if (digital && digital.sku) {
          featured.digitalSku = digital.sku;
          if (digital.price != null) featured.digitalPrice = Number(digital.price);
          featured.digitalName = (feat.title || "Release") + " — Digital";
          featured.digitalImage = feat.cover || featured.cover;
          if (buyDigitalBtn) buyDigitalBtn.hidden = false;
        } else if (buyDigitalBtn) {
          buyDigitalBtn.hidden = true;
        }
        if (buyBtn) {
          buyBtn.textContent = "Cassette · $" + featured.price;
        }
        if (buyDigitalBtn && featured.digitalSku) {
          buyDigitalBtn.textContent = featured.digitalPrice != null
            ? "Digital · $" + featured.digitalPrice
            : "Digital";
        }
      }
      applySleeveArt();
      if (featured.playable) {
        var digitalBit =
          featured.digitalSku && featured.digitalPrice != null
            ? "Digital $" + featured.digitalPrice
            : "Digital";
        setStatus(
          featured.cassetteBackorder
            ? digitalBit + " · cassette backorder"
            : digitalBit + " · cassette $" + featured.price
        );
      } else {
        setStatus("Cassette pre-order. Open the record to listen.");
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
