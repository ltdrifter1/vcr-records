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

    function card(rel) {
      var img = rel.coverThumb || rel.cover || "";
      var href = rel.page || ("/" + rel.id);
      var alt = esc((rel.artist ? rel.artist + " — " : "") + (rel.title || ""));
      return (
        '<a class="ra-more-item" href="' + esc(href) + '">' +
          '<span class="ra-more-case">' +
            '<img src="' + esc(img) + '" alt="' + alt + '" width="480" height="480" loading="lazy"/>' +
          '</span>' +
          '<span class="ra-more-cc">' + esc(rel.catalogue || "") + '</span>' +
          '<span class="ra-more-artist">' + esc(rel.artist || "") + '</span>' +
          '<span class="ra-more-title">' + esc(rel.title || "") + '</span>' +
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
              '<div><p class="eyebrow">Catalogue</p><h2>Also spinning</h2></div>' +
              '<a class="head-note" href="/library">Full library</a>' +
            '</header>' +
            '<div class="ra-more-rail">' + related.map(card).join("") + '</div>' +
          '</div>';
        main.appendChild(section);
        var head = section.querySelector(".ra-reveal");
        if (head) revealObs.observe(head);
      })
      .catch(function () {});
  })();

  /* ---- Cassette parallax tilt --------------------------------------------- */
  var stage = document.querySelector(".ra-stage");
  var cassette = stage && stage.querySelector(".ra-cassette, .ra-vinyl, .ra-cover");
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
          "rotateX(" + (-y * 9).toFixed(2) + "deg)" +
          " rotateY(" + (x * 11).toFixed(2) + "deg)" +
          " translateY(-6px)";
      });
    });
    stage.addEventListener("pointerleave", function () {
      cassette.style.transform = "";
    });
  }

  /* ---- Waveform ------------------------------------------------------------
     Deterministic pseudo-waveform per track (no source analysis available for
     streaming previews); progress driven by the shared player's events. */
  var canvas = document.getElementById("raWave");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var RELEASE_ID = canvas.getAttribute("data-release") || "together";
  var BARS = 96;
  var seedIdx = 0;
  var bars = buildBars(seedIdx);
  var progress = 0;
  var playing = false;

  function buildBars(seed) {
    var out = [];
    var s = (seed + 1) * 9973;
    for (var i = 0; i < BARS; i++) {
      s = (s * 16807) % 2147483647;
      var n = (s / 2147483647);
      var envelope = 0.35 + 0.65 * Math.sin((i / BARS) * Math.PI);
      out.push(Math.max(0.08, Math.min(1, (0.3 + n * 0.7) * envelope)));
    }
    return out;
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
    var gap = 2;
    var bw = (w - gap * (BARS - 1)) / BARS;
    var mid = h / 2;
    for (var i = 0; i < BARS; i++) {
      var frac = i / (BARS - 1);
      var amp = bars[i];
      if (playing && frac <= progress) {
        // gentle shimmer on the live edge
        var d = Math.abs(frac - progress);
        if (d < 0.04) amp = Math.min(1, amp + (0.04 - d) * 3);
      }
      var bh = Math.max(2, amp * (h - 6));
      ctx.fillStyle = frac <= progress
        ? "rgba(126, 246, 255, 0.95)"
        : "rgba(126, 246, 255, 0.22)";
      ctx.fillRect(i * (bw + gap), mid - bh / 2, bw, bh);
    }
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
    var idx = 0;
    var m = /(\d+)$/.exec(t.id || "");
    if (m) idx = parseInt(m[1], 10) - 1;
    if (idx !== seedIdx) {
      seedIdx = idx;
      bars = buildBars(seedIdx);
    }
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
})();
