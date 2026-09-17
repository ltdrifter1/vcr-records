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

  function cardHtml(rel) {
    var thumb = rel.coverThumb || rel.cover || "";
    var full = rel.cover || thumb;
    var href = rel.page || "/library";
    var cat = rel.catalogue || "";
    var dur = fmtDur(releaseDuration(rel));
    var spec = [cat, rel.kind, dur].filter(Boolean).join("  ·  ");
    return (
      '<article class="sleeve-card rv" data-release="' + esc(rel.id) + '">' +
        '<div class="sleeve-card-art">' +
          '<a href="' + esc(href) + '" aria-label="' + esc(rel.title) + ' — view release">' +
            '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' 480w, ' + esc(full) + ' 1200w" sizes="(max-width:640px) 46vw, (max-width:1100px) 22vw, 220px" alt="' + esc(rel.title) + ' — artwork" width="1200" height="1200" loading="lazy"/>' +
          "</a>" +
          '<button type="button" class="sleeve-card-play" data-play-release="' + esc(rel.id) + '"' +
            (rel.previewTrackId ? ' data-play-track="' + esc(rel.previewTrackId) + '"' : "") +
            ' aria-label="Play ' + esc(rel.title) + '">' +
            '<svg class="sc-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            '<svg class="sc-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>' +
          "</button>" +
          '<span class="sleeve-card-air" hidden>On air</span>' +
        "</div>" +
        '<div class="sleeve-card-meta">' +
          (spec ? '<p class="sleeve-card-spec">' + esc(spec) + "</p>" : "") +
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

  fetch("/data/catalog.json")
    .then(function (r) {
      if (!r.ok) throw new Error("catalog");
      return r.json();
    })
    .then(function (data) {
      var allReleases = (data.releases || []).slice().sort(function (a, b) {
        var aDate = String(a.released || "");
        var bDate = String(b.released || "");
        if (aDate !== bDate) return bDate.localeCompare(aDate);
        return String(b.catalogue || "").localeCompare(String(a.catalogue || ""));
      });
      if (!allReleases.length) return;
      grid.innerHTML = allReleases.map(cardHtml).join("");
      grid.removeAttribute("aria-busy");
      if (window.VCRPlayer && VCRPlayer.getState) syncAir(VCRPlayer.getState());
    })
    .catch(function () {
      grid.removeAttribute("aria-busy");
      if (!grid.querySelector(".sleeve-card, .wall-item")) {
        grid.innerHTML = '<p class="sleeve-index-err">Could not load releases. <a href="/library">Open Library</a></p>';
      }
    });
})();
