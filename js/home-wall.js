/* Club Copy — homepage sleeve index from catalog.json */
(function () {
  var grid = document.getElementById("wallGrid");
  if (!grid) return;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtDur(sec) {
    var n = Number(sec);
    if (!isFinite(n) || n <= 0) return "";
    var m = Math.floor(n / 60);
    var s = Math.floor(n % 60);
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function releaseDuration(rel) {
    var tracks = rel.tracks || [];
    var sum = 0;
    var i;
    for (i = 0; i < tracks.length; i++) {
      var d = Number(tracks[i] && tracks[i].duration);
      if (isFinite(d)) sum += d;
    }
    return sum;
  }

  function hasCue(rel) {
    return (rel.tracks || []).some(function (t) {
      return t && (t.preview || t.bandcampTrackId || t.previewTrack);
    });
  }

  function cardHtml(rel) {
    var thumb = rel.coverThumb || rel.cover || "";
    var full = rel.cover || thumb;
    var href = rel.page || "/library";
    var dur = fmtDur(releaseDuration(rel));
    var cat = rel.catalogue || "";
    var spec = [cat, rel.kind, dur].filter(Boolean).join("  ·  ");
    var fm = rel.formats || {};
    var glyphs = [fm.digital ? "DL" : "", fm.cassette ? "CS" : "", fm.vinyl ? "LP" : ""].filter(Boolean).join(" / ");
    var cued = hasCue(rel);
    var preorder = String(rel.status || "").toLowerCase() === "pre-order";
    var play = cued
      ? (
          '<button type="button" class="sleeve-card-play" data-play-release="' + esc(rel.id) + '"' +
            (rel.previewTrackId ? ' data-play-track="' + esc(rel.previewTrackId) + '"' : "") +
            ' aria-label="Play ' + esc(rel.title) + '">' +
            '<svg class="sc-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            '<svg class="sc-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>' +
          "</button>" +
          '<span class="sleeve-card-air" hidden>On air</span>'
        )
      : (preorder ? '<span class="sleeve-card-stamp">Pre-order</span>' : "");
    return (
      '<article class="sleeve-card" data-release="' + esc(rel.id) + '">' +
        '<div class="sleeve-card-art">' +
          '<a href="' + esc(href) + '" aria-label="' + esc(rel.title) + ' — view release">' +
            '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' 480w, ' + esc(full) + ' 1200w" sizes="(max-width:640px) 46vw, (max-width:1100px) 22vw, 220px" alt="' + esc(rel.title) + ' — artwork" width="1200" height="1200" loading="lazy"/>' +
          "</a>" +
          play +
        "</div>" +
        '<div class="sleeve-card-meta">' +
          (spec ? '<p class="sleeve-card-spec">' + esc(spec) + (glyphs ? ' <span class="sleeve-card-fmt">' + esc(glyphs) + "</span>" : "") + "</p>" : "") +
          '<h3 class="sleeve-card-title"><a href="' + esc(href) + '">' + esc(rel.title) + "</a></h3>" +
          '<p class="sleeve-card-artist">' + esc(rel.artist || "") + "</p>" +
        "</div>" +
      "</article>"
    );
  }

  function syncAir(detail) {
    var d = detail || {};
    var nowId = d.track ? d.track.releaseId : null;
    var playing = !!d.playing;
    grid.querySelectorAll(".sleeve-card[data-release]").forEach(function (item) {
      var id = item.getAttribute("data-release");
      var mine = nowId && id === nowId;
      item.classList.toggle("is-now-playing", !!mine);
      item.classList.toggle("is-audible", !!(mine && playing));
      var air = item.querySelector(".sleeve-card-air");
      if (air) {
        air.hidden = !(mine && playing);
      }
      var btn = item.querySelector(".sleeve-card-play");
      if (btn) {
        btn.classList.toggle("is-playing", !!(mine && playing));
        btn.setAttribute("aria-label", (mine && playing ? "Pause " : "Play ") + (item.querySelector(".sleeve-card-title") ? item.querySelector(".sleeve-card-title").textContent : "release"));
      }
    });
  }

  window.addEventListener("vcr:player", function (e) {
    syncAir(e.detail || {});
  });

  /* Release ticker: newest first, catalogue number + title, each linking to its page. */
  function statusStrip(all, sorted) {
    var copies = document.querySelectorAll(".hero-ticker-copy");
    if (!copies.length) return;
    var items = sorted.filter(function (r) { return r.page && r.title; });
    if (!items.length) return;
    var html = items.map(function (r) {
      return '<a href="' + esc(r.page) + '">' +
        (r.catalogue ? '<b class="hero-ticker-cat">' + esc(r.catalogue) + "</b> " : "") +
        esc(String(r.title).toUpperCase()) +
        (r.artist ? ' <i class="hero-ticker-artist">' + esc(String(r.artist).toUpperCase()) + "</i>" : "") +
        "</a>" + '<span class="hero-ticker-sep" aria-hidden="true">/</span>';
    }).join("");
    copies.forEach(function (c, i) {
      c.innerHTML = html;
      if (i) c.querySelectorAll("a").forEach(function (a) { a.tabIndex = -1; });
    });
    var track = document.querySelector(".hero-ticker-track");
    if (track) track.style.animationDuration = Math.max(30, items.length * 5) + "s";
  }

  /* Roster strip: name plates, no photos. */
  function artistStrip(all) {
    var mount = document.getElementById("artistStrip");
    if (!mount) return;
    var map = {};
    all.forEach(function (r) { if (r.artist) map[r.artist] = (map[r.artist] || 0) + 1; });
    var slug = function (n) { return n.toLowerCase().replace(/\./g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };
    mount.innerHTML = Object.keys(map).sort().map(function (n, i) {
      return '<a class="artist-plate" href="/artists/' + esc(slug(n)) + '"><span class="artist-plate-n">' +
        String(i + 1).padStart(2, "0") + '</span><span class="artist-plate-name">' + esc(n) +
        '</span><span class="artist-plate-c">' + map[n] + (map[n] === 1 ? " REL" : " RELS") + "</span></a>";
    }).join("");
  }

  fetch("/data/catalog.json")
    .then(function (r) {
      if (!r.ok) throw new Error("catalog");
      return r.json();
    })
    .then(function (data) {
      var FEATURED_ID = "l-t-drifta";
      var allReleases = (data.releases || []).slice().sort(function (a, b) {
        if (a.id === FEATURED_ID) return -1;
        if (b.id === FEATURED_ID) return 1;
        var aDate = String(a.released || "");
        var bDate = String(b.released || "");
        if (aDate !== bDate) return bDate.localeCompare(aDate);
        return String(b.catalogue || "").localeCompare(String(a.catalogue || ""));
      });
      if (!allReleases.length) return;
      var WALL = 6;
      grid.innerHTML = allReleases.slice(0, WALL).map(cardHtml).join("");
      grid.removeAttribute("aria-busy");
      if (window.VCRPlayer && VCRPlayer.getState) syncAir(VCRPlayer.getState());
      statusStrip(data.releases || [], allReleases);
      artistStrip(data.releases || []);
    })
    .catch(function () {
      grid.removeAttribute("aria-busy");
      if (!grid.querySelector(".sleeve-card, .wall-item")) {
        grid.innerHTML = '<p class="sleeve-index-err">Could not load releases. <a href="/library">Open Library</a></p>';
      }
    });
})();
