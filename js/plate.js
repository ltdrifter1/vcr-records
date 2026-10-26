/* Club Copy — homepage listening plate. Play the feature if it has a cue;
   otherwise the sleeve is what's on air. Cassette buy stays on the feature. */
(function () {
  "use strict";

  var plate = document.querySelector("[data-listen-plate]");
  if (!plate) return;

  var FEATURED_ID = plate.getAttribute("data-release") || "pitch-black";
  var playBtn = document.getElementById("platePlay");
  var hitBtn = document.getElementById("platePlayHit");
  var buyBtn = document.getElementById("plateBuy");
  var buyDigitalBtn = document.getElementById("plateBuyDigital");
  var statusEl = plate.querySelector("[data-plate-status]");
  var specEl = plate.querySelector(".listen-plate-spec");
  var specRest = specEl ? specEl.textContent : "";
  var sleeve = plate.querySelector(".listen-sleeve");
  var art = plate.querySelector("[data-plate-art]");
  var stateEl = plate.querySelector("[data-lead-state]");
  var dateEl = plate.querySelector("[data-lead-idle], [data-lead-date]");
  var nowEl = plate.querySelector("[data-lead-now]");
  var stateRest = stateEl ? stateEl.textContent : "";

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
    cover: "pitch-black-cover.webp",
    title: "Pitch Black",
    artist: "Forsberg",
    digitalSku: "dg-pitch-black",
    digitalPrice: 4,
    digitalName: "Pitch Black — Digital",
    digitalImage: "pitch-black-cover.webp",
    cassetteBackorder: false,
    cassetteOut: false,
  };
  var onAir = {
    id: "pitch-black",
    title: "Pitch Black",
    artist: "Forsberg",
    cover: "pitch-black-cover.webp",
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
      var labelEl = playBtn.querySelector(".btn-label");
      if (labelEl) labelEl.textContent = label;
      else playBtn.textContent = label;
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

  function money(n) {
    var cents = Math.round(Number(n) * 100);
    if (!isFinite(cents)) return "";
    if (cents % 100 === 0) return String(cents / 100);
    return (cents / 100).toFixed(2);
  }

  function fmtClock(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    var h = Math.floor(sec / 3600);
    var m = Math.floor((sec % 3600) / 60);
    var s = sec % 60;
    if (h) return h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function releaseSeconds(rel) {
    return (rel.tracks || []).reduce(function (sum, t) {
      var d = Number(t && t.duration);
      return sum + (isFinite(d) ? d : 0);
    }, 0);
  }

  function specLine(rel) {
    var n = rel.tracksCount || (rel.tracks || []).length;
    var bits = [];
    if (rel.catalogue) bits.push(rel.catalogue);
    if (rel.kind) bits.push(rel.kind);
    if (n) bits.push(n + (n === 1 ? " track" : " tracks"));
    var total = releaseSeconds(rel);
    if (total) bits.push(fmtClock(total));
    return bits.join(" · ");
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
      // The chosen record stays on the plate. The dock reports the failure
      // (NO SIGNAL, Retry, Bandcamp); nothing else is cued in its place.
      if (statusEl) statusEl.textContent = "Stream unavailable.";
      if (stateEl) { stateEl.textContent = "No signal"; stateEl.classList.add("is-on"); }
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
    if (Number(featured.digitalPrice) === 0 && featured.id) {
      window.location.href = "/api/bandcamp-stream?r=" + encodeURIComponent(featured.id) + "&t=" + encodeURIComponent(featured.previewTrackId || "") + "&download=1";
      return;
    }
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
    var labelEl = btn.querySelector(".btn-label");
    if (labelEl) {
      var prevLabel = labelEl.textContent;
      labelEl.textContent = "Added";
      setTimeout(function () { labelEl.textContent = prevLabel; }, 1800);
      return;
    }
    var prev = btn.textContent;
    btn.textContent = "Added";
    setTimeout(function () {
      btn.textContent = prev;
    }, 1800);
  }

  function withSleeveDrop(run) {
    var sleeve = plate.querySelector(".listen-sleeve");
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!sleeve || reduce || typeof document.startViewTransition !== "function") {
      run();
      return;
    }
    sleeve.style.viewTransitionName = "cc-sleeve";
    var ran = false;
    var once = function () {
      if (ran) return;
      ran = true;
      run();
    };
    var clear = function () {
      sleeve.style.viewTransitionName = "";
      var jewel = document.querySelector("#vcr-player .vcr-player__jewel");
      if (jewel) jewel.style.viewTransitionName = "";
    };
    try {
      var vt = document.startViewTransition(function () {
        sleeve.style.viewTransitionName = "none";
        var dock = document.getElementById("vcr-player");
        var jewel = dock && dock.querySelector(".vcr-player__jewel");
        if (dock) {
          dock.classList.add("is-visible");
          document.body.classList.add("has-vcr-player");
        }
        if (jewel) jewel.style.viewTransitionName = "cc-sleeve";
        once();
      });
      vt.finished.then(clear, clear);
    } catch (err) {
      clear();
      once();
    }
  }

  [playBtn, hitBtn].forEach(function (btn) {
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var st = window.VCRPlayer && VCRPlayer.getState && VCRPlayer.getState();
      var id = playTarget();
      var same = st && st.track && (st.track.releaseId === id || st.track.releaseId === featured.id || st.track.releaseId === onAir.id);
      if (st && st.playing && same) playNow();
      else withSleeveDrop(playNow);
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
    var activeId = live && d.track ? d.track.id : "";
    plate.querySelectorAll(".hero-track").forEach(function (row) {
      var on = !!activeId && row.getAttribute("data-play-track") === activeId;
      row.classList.toggle("is-active", on);
      if (on) row.setAttribute("aria-current", "true");
      else row.removeAttribute("aria-current");
      var elapsed = row.querySelector("[data-track-elapsed]");
      var dur = Number(row.getAttribute("data-duration")) || 0;
      if (on) {
        var t = Number(d.currentTime) || 0;
        row.style.setProperty("--p", (dur ? Math.min(100, (t / dur) * 100) : 0).toFixed(2) + "%");
        if (elapsed) elapsed.textContent = fmtClock(t) + " / ";
      } else {
        row.style.removeProperty("--p");
        if (elapsed) elapsed.textContent = "";
      }
    });
    // Top line: LATEST · date becomes ON AIR · 01 · title while the lead is sounding.
    if (stateEl) {
      stateEl.textContent = live ? "On air" : stateRest;
      stateEl.classList.toggle("is-on", live);
    }
    if (dateEl) dateEl.hidden = live;
    if (nowEl) {
      nowEl.hidden = !live;
      if (live && d.track) {
        var no = Number(d.track.trackNum) || 1;
        nowEl.textContent = (no < 10 ? "0" : "") + no + " · " + (d.track.title || d.track.releaseTitle || "");
      }
    }
  });

  // Label clock: the hour in British Columbia, so the page says where it is from.
  (function () {
    var el = plate.querySelector("[data-clock-time]");
    if (!el || !window.Intl || !Intl.DateTimeFormat) return;
    var fmt;
    try {
      fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "America/Vancouver", hour: "2-digit", minute: "2-digit", hour12: false });
    } catch (err) { return; }
    function tick() {
      try { el.textContent = fmt.format(new Date()); el.setAttribute("datetime", new Date().toISOString()); } catch (err) {}
    }
    tick();
    setInterval(tick, 15000);
  })();

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
        var built = specLine(feat);
        if (built) {
          specRest = built;
          var already = window.VCRPlayer && VCRPlayer.getState && VCRPlayer.getState();
          if (specEl && !(already && already.playing)) specEl.textContent = built;
        }
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
          featured.previewTrackId = feat.previewTrackId || (feat.tracks && feat.tracks[0] && feat.tracks[0].id) || "";
          featured.digitalName = (feat.title || "Release") + " — Digital";
          featured.digitalImage = feat.cover || featured.cover;
          if (buyDigitalBtn) buyDigitalBtn.hidden = false;
        } else if (buyDigitalBtn) {
          buyDigitalBtn.hidden = true;
        }
        if (buyBtn) {
          buyBtn.hidden = !featured.sku;
          if (featured.sku) {
            buyBtn.textContent = featured.cassetteOut ? "Cassette · Sold out" : "Cassette · $" + money(featured.price);
            buyBtn.disabled = !!featured.cassetteOut;
          }
        }
        if (buyDigitalBtn && featured.digitalSku) {
          buyDigitalBtn.textContent = Number(featured.digitalPrice) === 0
            ? "Free download"
            : (featured.digitalPrice != null ? "Digital · $" + money(featured.digitalPrice) : "Digital");
        }
      }
      var dated = releases
        .filter(function (r) {
          return r.id !== FEATURED_ID && hasCue(r) && r.page && String(r.page).charAt(0) === "/";
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
            ? "Digital $" + money(featured.digitalPrice)
            : "Digital";
        setStatus(
          !featured.sku
            ? digitalBit
            : featured.cassetteOut
              ? digitalBit + " · cassette sold out"
              : featured.cassetteBackorder
                ? digitalBit + " · cassette backorder"
                : digitalBit + " · cassette $" + money(featured.price)
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
