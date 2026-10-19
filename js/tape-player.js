/**
 * Club Copy — release archive interactions.
 * Waveform canvas, cassette parallax, scroll reveals, catalogue rail.
 * Playback itself stays on the shared VCRPlayer engine.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Scroll reveal ------------------------------------------------------ */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("is-in");
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".ra-reveal").forEach(function (el) {
    revealObs.observe(el);
  });

  /* ---- Also spinning — jewel-case catalogue rail -------------------------- */
  (function mountCatalogueRail() {
    var main = document.getElementById("main");
    if (!main || main.querySelector(".ra-more")) return;

    function esc(s) {
      return String(s == null ? "" : s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/"/g, "&quot;");
    }

    function currentId() {
      var listen = document.getElementById("listen");
      var fromListen = listen && listen.getAttribute("data-release");
      if (fromListen) return fromListen;
      var canvas = document.getElementById("raWave");
      var fromWave = canvas && canvas.getAttribute("data-release");
      if (fromWave) return fromWave;
      var path = (location.pathname || "").replace(/\/+$/, "");
      return path.split("/").pop() || "";
    }

    function pickRelated(releases, id) {
      var current = null;
      var i;
      for (i = 0; i < releases.length; i++) {
        if (releases[i].id === id) { current = releases[i]; break; }
      }
      var rest = releases.filter(function (r) { return r.id !== id; });
      var same = [];
      var other = [];
      rest.forEach(function (r) {
        if (current && r.artistId && r.artistId === current.artistId) same.push(r);
        else other.push(r);
      });
      function byCat(a, b) {
        return String(b.catalogue || "").localeCompare(String(a.catalogue || ""));
      }
      same.sort(byCat);
      other.sort(byCat);
      return same.concat(other).slice(0, 5);
    }

    function fmtDur(sec) {
      sec = Math.max(0, Math.round(Number(sec) || 0));
      var h = Math.floor(sec / 3600);
      var m = Math.floor((sec % 3600) / 60);
      var s = sec % 60;
      var ss = (s < 10 ? "0" : "") + s;
      return h ? h + ":" + (m < 10 ? "0" : "") + m + ":" + ss : m + ":" + ss;
    }

    function specLine(rel) {
      var bits = [];
      if (rel.catalogue) bits.push(rel.catalogue);
      if (rel.kind) bits.push(rel.kind);
      var total = (rel.tracks || []).reduce(function (n, t) { return n + (Number(t.duration) || 0); }, 0);
      if (total) bits.push(fmtDur(total));
      return bits.join("  \u00b7  ");
    }

    function fmtGlyphs(rel) {
      var f = rel.formats || {};
      var out = [];
      if (f.digital) out.push("DL");
      if (f.cassette) out.push("CS");
      if (f.vinyl) out.push("LP");
      return out.join(" / ");
    }

    function card(rel) {
      if (window.ClubSleeve) return ClubSleeve.card(rel);
      var img = rel.coverThumb || rel.cover || "";
      var href = rel.page || ("/" + rel.id);
      var alt = esc((rel.artist ? rel.artist + " \u2014 " : "") + (rel.title || ""));
      var glyphs = fmtGlyphs(rel);
      return (
        '<a class="ra-more-item" href="' + esc(href) + '">' +
          '<span class="ra-more-case">' +
            '<img src="' + esc(img) + '" alt="' + alt + '" width="480" height="480" loading="lazy"/>' +
          '</span>' +
          '<span class="ra-more-cc">' + esc(specLine(rel)) +
            (glyphs ? ' <span class="ra-more-fmt">' + esc(glyphs) + '</span>' : '') + '</span>' +
          '<span class="ra-more-title">' + esc(rel.title || "") + '</span>' +
          '<span class="ra-more-artist">' + esc(rel.artist || "") + '</span>' +
        '</a>'
      );
    }

    fetch("/data/catalog.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.releases || !data.releases.length) return;
        var related = pickRelated(data.releases, currentId());
        if (related.length < 2) return;
        var section = document.createElement("section");
        section.className = "ra-section ra-more";
        section.setAttribute("aria-label", "Also spinning");
        section.innerHTML =
          '<div class="ra-wrap">' +
            '<header class="ra-head ra-reveal">' +
              '<div><h2>Also spinning</h2></div>' +
              '<a class="head-note" href="/library">Full library</a>' +
            '</header>' +
            '<div class="ra-more-rail">' + related.map(card).join("") + '</div>' +
          '</div>';
        main.appendChild(section);
        if (window.ClubSleeve && window.VCRPlayer && VCRPlayer.getState) {
          ClubSleeve.sync(section, VCRPlayer.getState());
        }
        var head = section.querySelector(".ra-reveal");
        if (head) revealObs.observe(head);
      })
      .catch(function () {});
  })();

  /* ---- iTunes jewel tilt + wet-floor reflection --------------------------- */
  var stage = document.querySelector(".ra-stage, [data-tilt-stage]");
  var cassette = stage && stage.querySelector(".ra-cassette, .ra-vinyl, .ra-cover");
  if (stage && cassette) {
    stage.classList.add("has-jewel");
    if (!stage.querySelector(".ra-reflect")) {
      var reflect = document.createElement("div");
      reflect.className = "ra-reflect";
      reflect.setAttribute("aria-hidden", "true");
      var srcImg = cassette.querySelector("img");
      if (srcImg) {
        var clone = srcImg.cloneNode(true);
        clone.removeAttribute("alt");
        clone.setAttribute("alt", "");
        clone.removeAttribute("fetchpriority");
        reflect.appendChild(clone);
      } else {
        reflect.classList.add("ra-reflect--object");
      }
      stage.appendChild(reflect);
    }
  }
  if (stage && cassette && !reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    var raf = null;
    stage.addEventListener("pointermove", function (e) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = null;
        var r = stage.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        cassette.style.transform =
          "rotateX(" + (-y * 8).toFixed(2) + "deg)" +
          " rotateY(" + (x * 12).toFixed(2) + "deg)" +
          " translateY(-8px)";
      });
    });
    stage.addEventListener("pointerleave", function () {
      cassette.style.transform = "";
    });
  }

  /* ---- Waveform ------------------------------------------------------------
     Real peaks from /data/peaks/<trackId>.json. No file means a plain groove. */
  var canvas = document.getElementById("raWave");
  if (!canvas) {
    var listen = document.getElementById("listen");
    var grid = listen && listen.querySelector(".ra-player-grid, .ra-wrap");
    if (grid) {
      canvas = document.createElement("canvas");
      canvas.id = "raWave";
      canvas.className = "ra-wave";
      canvas.setAttribute("data-release", (listen && listen.getAttribute("data-release")) || "");
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", "Waveform");
      grid.insertBefore(canvas, grid.firstChild);
    }
  }
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var RELEASE_ID = canvas.getAttribute("data-release") || "j-adore";
  var bars = null;
  var loadedId = "";
  var progress = 0;
  var playing = false;
  var peakCache = {};

  function loadPeaks(trackId) {
    if (!trackId || loadedId === trackId) return;
    loadedId = trackId;
    if (peakCache[trackId]) {
      bars = peakCache[trackId];
      draw();
      return;
    }
    bars = null;
    draw();
    fetch("/data/peaks/" + encodeURIComponent(trackId) + ".json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var peaks = data && data.peaks;
        if (!Array.isArray(peaks) || !peaks.length) return;
        peakCache[trackId] = peaks;
        if (loadedId === trackId) {
          bars = peaks;
          draw();
        }
      })
      .catch(function () {});
  }

  function sizeCanvas() {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw() {
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    var mid = h / 2;
    if (!bars || !bars.length) {
      ctx.fillStyle = "rgba(26, 26, 26, 0.28)";
      ctx.fillRect(0, mid - 0.5, w, 1);
      return;
    }
    var n = bars.length;
    var bw = w / n;
    for (var i = 0; i < n; i++) {
      var frac = i / Math.max(1, n - 1);
      var amp = Number(bars[i]);
      if (!isFinite(amp)) amp = 0;
      amp = Math.max(0.04, Math.min(1, amp));
      var bh = Math.max(1, amp * (h - 4));
      ctx.globalAlpha = frac <= progress ? 1 : 0.3;
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(i * bw, mid - bh / 2, Math.max(1, bw - 0.4), bh);
    }
    ctx.globalAlpha = 1;
  }

  canvas.addEventListener("click", function (e) {
    if (!window.VCRPlayer) return;
    var st = VCRPlayer.getState && VCRPlayer.getState();
    if (!st || !st.track || st.track.releaseId !== RELEASE_ID || !st.duration) return;
    var r = canvas.getBoundingClientRect();
    VCRPlayer.seek(((e.clientX - r.left) / r.width) * st.duration);
  });

  window.addEventListener("vcr:player", function (ev) {
    var d = ev.detail || {};
    var t = d.track;
    if (!t || t.releaseId !== RELEASE_ID) {
      playing = false;
      progress = 0;
      draw();
      return;
    }
    loadPeaks(t.id);
    playing = !!d.playing;
    progress = d.duration ? Math.max(0, Math.min(1, d.currentTime / d.duration)) : 0;
    draw();
  });

  window.addEventListener("resize", function () {
    sizeCanvas();
    draw();
  });

  sizeCanvas();
  draw();

  var primed = canvas.getAttribute("data-track");
  if (primed) loadPeaks(primed);
  else {
    fetch("/data/catalog.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || loadedId) return;
        var rel = null;
        var i;
        for (i = 0; i < (data.releases || []).length; i++) {
          if (data.releases[i].id === RELEASE_ID) { rel = data.releases[i]; break; }
        }
        if (!rel || !rel.tracks || !rel.tracks.length) return;
        var first = rel.tracks[0];
        if (rel.previewTrackId) {
          for (i = 0; i < rel.tracks.length; i++) {
            if (rel.tracks[i].id === rel.previewTrackId) { first = rel.tracks[i]; break; }
          }
        }
        if (first && first.id) loadPeaks(first.id);
      })
      .catch(function () {});
  }
})();
