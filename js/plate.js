/* Club Copy — homepage listening plate. Play the feature if it has a cue;
   otherwise the sleeve is what's on air. Cassette buy stays on the feature. */
(function () {
  "use strict";

  var plate = document.querySelector("[data-listen-plate]");
  if (!plate) return;

  var FEATURED_ID = plate.getAttribute("data-release") || "bridget-in-my-room";
  var playBtn = document.getElementById("platePlay");
  var hitBtn = document.getElementById("platePlayHit");
  var buyBtn = document.getElementById("plateBuy");
  var buyDigitalBtn = document.getElementById("plateBuyDigital");
  var statusEl = plate.querySelector("[data-plate-status]");
  var specEl = plate.querySelector(".listen-plate-spec");
  var specRest = specEl ? specEl.textContent : "";
  var sleeve = plate.querySelector(".listen-sleeve");
  var art = plate.querySelector("[data-plate-art]");

  // Link-out feature: a release that lives on Bandcamp has no on-site cue or cart SKU,
  // so the plate just shows its own sleeve and sends Play to the Bandcamp page.
  var EXTERNAL_URL = plate.getAttribute("data-external-url");
  if (EXTERNAL_URL) {
    [playBtn, hitBtn].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        window.open(EXTERNAL_URL, "_blank", "noopener");
      });
    });
    if (buyBtn) buyBtn.hidden = true;
    if (buyDigitalBtn) buyDigitalBtn.hidden = true;
    return;
  }

  var featured = {
    id: FEATURED_ID,
    playable: false,
    sku: null,
    price: null,
    name: "",
    image: "",
    cover: "bridget-in-my-room-cover.webp",
    title: "Bridget In My Room",
    artist: "Rainier",
    digitalSku: "dg-bridget-in-my-room",
    digitalPrice: 8,
    digitalName: "Bridget In My Room — Digital",
    digitalImage: "bridget-in-my-room-cover.webp",
    cassetteBackorder: false,
    cassetteOut: false,
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

  function fmtClock(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    var m = Math.floor(sec / 60);
    var s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function lcdLine(detail) {
    var track = detail && detail.track;
    if (!track) return specRest;
    var no = Number(track.trackNum) || 1;
    var idx = (no < 10 ? "0" : "") + no;
    var title = track.title || track.releaseTitle || "";
    return idx + "  ·  " + title + "  ·  " + fmtClock(detail.currentTime);
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

  var fallingThrough = false;

  function playNow() {
    if (!window.VCRPlayer || !VCRPlayer.playRelease) return;
    var id = playTarget();
    var st = VCRPlayer.getState && VCRPlayer.getState();
    if (st && st.playing && st.track && (st.track.releaseId === id || st.track.releaseId === featured.id || st.track.releaseId === onAir.id)) {
      VCRPlayer.toggle();
      return;
    }
    setPlayUi(true);
    VCRPlayer.playRelease(id, null, { autoplay: true, stage: false }).then(function (queued) {
      if (queued) return;
      if (featured.playable && onAir.id && onAir.id !== id && !fallingThrough) {
        fallingThrough = true;
        if (statusEl) statusEl.textContent = "Stream unavailable. Playing " + onAir.title + " instead.";
        return VCRPlayer.playRelease(onAir.id, null, { autoplay: true, stage: false });
      }
      setPlayUi(false);
    }).catch(function () {
      setPlayUi(false);
    });
  }

  function buyCassette() {
    if (!window.VCRCart || !featured.sku || featured.cassetteOut) return;
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
    var mine = soundingId(d) === playTarget() || soundingId(d) === featured.id || soundingId(d) === onAir.id;
    var live = !!(d.playing && mine);
    setPlayUi(live);
    if (specEl) {
      specEl.textContent = d.playing && d.track ? lcdLine(d) : specRest;
    }
    if (d.error && d.track && d.track.releaseId === featured.id && onAir.id && onAir.id !== featured.id && !fallingThrough) {
      fallingThrough = true;
      VCRPlayer.playRelease(onAir.id, null, { autoplay: true, stage: false });
    }
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
        featured.sku = null;
        if (cassette) {
          if (cassette.sku) featured.sku = cassette.sku;
          if (cassette.price != null) featured.price = Number(cassette.price);
          if (cassette.image) featured.image = cassette.image;
          featured.cassetteBackorder = !!cassette.backorder;
          featured.cassetteOut = cassette.stock != null && Number(cassette.stock) <= 0;
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
          buyBtn.hidden = !featured.sku;
          if (featured.sku) {
            buyBtn.textContent = featured.cassetteOut ? "Cassette · Sold out" : "Cassette · $" + featured.price;
            buyBtn.disabled = !!featured.cassetteOut;
          }
        }
        if (buyDigitalBtn && featured.digitalSku) {
          buyDigitalBtn.textContent = featured.digitalPrice != null
            ? "Digital · $" + featured.digitalPrice
            : "Digital";
        }
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
        var digitalBit =
          featured.digitalSku && featured.digitalPrice != null
            ? "Digital $" + featured.digitalPrice
            : "Digital";
        setStatus(
          !featured.sku
            ? digitalBit
            : featured.cassetteOut
              ? digitalBit + " · cassette sold out"
              : featured.cassetteBackorder
                ? digitalBit + " · cassette backorder"
                : digitalBit + " · cassette $" + featured.price
        );
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
