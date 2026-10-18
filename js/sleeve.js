/* Shared catalogue sleeve: art, play key, CC0xx · format, title, artist, dur · BPM.
   BPM renders only when catalog.json has a real bpm. */
(function (global) {
  "use strict";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function asset(src) {
    if (!src) return "";
    if (/^(https?:|\/)/.test(src)) return src;
    return "/" + src;
  }

  function fmtDur(sec) {
    var n = Number(sec);
    if (!isFinite(n) || n <= 0) return "";
    n = Math.round(n);
    var m = Math.floor(n / 60);
    var s = n % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function releaseDuration(rel) {
    var tracks = (rel && rel.tracks) || [];
    var sum = 0;
    var any = false;
    for (var i = 0; i < tracks.length; i++) {
      var d = Number(tracks[i] && tracks[i].duration);
      if (isFinite(d) && d > 0) {
        sum += d;
        any = true;
      }
    }
    return any ? sum : 0;
  }

  function glyphs(rel) {
    var fm = (rel && rel.formats) || {};
    return [fm.digital ? "DL" : "", fm.cassette ? "CS" : "", fm.vinyl ? "LP" : ""].filter(Boolean).join(" / ");
  }

  function spec(rel) {
    var bits = [];
    if (rel && rel.catalogue) bits.push(rel.catalogue);
    if (rel && rel.kind) bits.push(rel.kind);
    var g = glyphs(rel);
    if (g) bits.push(g);
    return bits.join(" · ");
  }

  function knownBpm(rel) {
    var tracks = (rel && rel.tracks) || [];
    var pick = null;
    var i;
    if (rel && rel.previewTrackId) {
      for (i = 0; i < tracks.length; i++) {
        if (tracks[i] && tracks[i].id === rel.previewTrackId) pick = tracks[i];
      }
    }
    if (!pick) pick = tracks[0] || null;
    if (!pick || pick.bpm == null || pick.bpm === "") return null;
    var n = Number(pick.bpm);
    if (!isFinite(n) || n <= 0) return null;
    return Math.round(n);
  }

  function durBpm(rel) {
    var dur = fmtDur(releaseDuration(rel));
    var bpm = knownBpm(rel);
    if (dur && bpm) return dur + " · " + bpm + " BPM";
    if (dur) return dur;
    if (bpm) return bpm + " BPM";
    return "";
  }

  function hasCue(rel) {
    return ((rel && rel.tracks) || []).some(function (t) {
      return t && (t.preview || t.bandcampTrackId || t.previewTrack || t.soundcloud);
    });
  }

  function catNum(rel) {
    var m = String((rel && rel.catalogue) || "").match(/(\d+)/);
    return m ? parseInt(m[1], 10) : -1;
  }

  function newest(releases) {
    var best = null;
    (releases || []).forEach(function (rel) {
      if (!rel || !rel.page || String(rel.page).charAt(0) !== "/") return;
      if (!/^CC\d+/i.test(String(rel.catalogue || ""))) return;
      if (!best || catNum(rel) > catNum(best)) best = rel;
    });
    return best;
  }

  function playBtn(rel) {
    if (!hasCue(rel)) {
      if (String(rel.status || "").toLowerCase() === "pre-order") {
        return '<span class="sleeve-stamp sleeve-card-stamp">Pre-order</span>';
      }
      return "";
    }
    return (
      '<button type="button" class="sleeve-play sleeve-card-play cat-play" data-play-release="' + esc(rel.id) + '"' +
        (rel.previewTrackId ? ' data-play-track="' + esc(rel.previewTrackId) + '"' : "") +
        ' aria-label="Play ' + esc(rel.title) + '">' +
        '<svg class="sc-play cp-play" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>' +
        '<svg class="sc-pause cp-pause" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>' +
      "</button>" +
      '<span class="sleeve-card-air" hidden>On air</span>'
    );
  }

  function art(rel, opts) {
    opts = opts || {};
    var thumb = asset(rel.coverThumb || rel.cover || "");
    var full = asset(rel.cover || rel.coverThumb || "");
    var href = rel.page || "/library";
    var linkAttr = opts.row
      ? ' tabindex="-1" aria-hidden="true"'
      : ' aria-label="' + esc(rel.title || "Release") + ' — view release"';
    return (
      '<div class="sleeve-art sleeve-card-art cat-cover">' +
        '<a href="' + esc(href) + '"' + linkAttr + ">" +
          '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + " 480w, " + esc(full) + ' 1200w" sizes="(max-width:699px) 64vw, 210px" alt="' + esc((rel.title || "Release") + " — artwork") + '" width="1200" height="1200" loading="lazy"/>' +
        "</a>" +
        playBtn(rel) +
      "</div>"
    );
  }

  function copy(rel) {
    var href = rel.page || "/library";
    var line = spec(rel);
    var meta = durBpm(rel);
    return (
      '<div class="sleeve-copy cat-main sleeve-card-meta">' +
        (line ? '<p class="sleeve-spec"><span class="sleeve-card-id">' + esc(line) + "</span></p>" : "") +
        '<h3 class="sleeve-title sleeve-card-title"><a href="' + esc(href) + '">' + esc(rel.title || "") + "</a></h3>" +
        '<p class="sleeve-by sleeve-card-artist"><span class="sleeve-card-by">' + esc(rel.artist || "") + "</span></p>" +
        (meta ? '<p class="sleeve-meta">' + esc(meta) + "</p>" : "") +
      "</div>"
    );
  }

  function card(rel) {
    return (
      '<article class="sleeve sleeve--card sleeve-card" data-release="' + esc(rel.id) + '">' +
        art(rel) +
        copy(rel) +
      "</article>"
    );
  }

  function row(rel, opts) {
    opts = opts || {};
    var tag = opts.tag || "article";
    var cls = "sleeve sleeve--row";
    if (opts.keepCat !== false) cls += " cat-row";
    if (opts.extraClass) cls += " " + opts.extraClass;
    var side = opts.sideHtml ? '<div class="sleeve-side cat-side">' + opts.sideHtml + "</div>" : "";
    return (
      "<" + tag + ' class="' + cls + '" data-release="' + esc(rel.id) + '"' + (opts.attrs || "") + ">" +
        art(rel, { row: true }) +
        copy(rel) +
        side +
      "</" + tag + ">"
    );
  }

  function sync(root, detail) {
    var scope = root && root.querySelectorAll ? root : document;
    var d = detail || {};
    var nowId = d.track ? d.track.releaseId : null;
    var playing = !!d.playing;
    scope.querySelectorAll(".sleeve[data-release], .sleeve-card[data-release]").forEach(function (item) {
      var id = item.getAttribute("data-release");
      var mine = !!(nowId && id === nowId);
      item.classList.toggle("is-now-playing", mine);
      item.classList.toggle("is-audible", mine && playing);
      var air = item.querySelector(".sleeve-card-air");
      if (air) air.hidden = !(mine && playing);
      var btn = item.querySelector(".sleeve-play, .sleeve-card-play");
      if (btn) {
        btn.classList.toggle("is-playing", mine && playing);
        var title = item.querySelector(".sleeve-title, .sleeve-card-title");
        btn.setAttribute("aria-label", (mine && playing ? "Pause " : "Play ") + (title ? title.textContent.trim() : "release"));
      }
    });
  }

  function mountLists(releases) {
    document.querySelectorAll("[data-sleeve-artist], [data-sleeve-ids]").forEach(function (list) {
      var ids = (list.getAttribute("data-sleeve-ids") || "")
        .split(",")
        .map(function (s) { return s.trim(); })
        .filter(Boolean);
      var artist = list.getAttribute("data-sleeve-artist") || "";
      var picked = (releases || []).filter(function (rel) {
        if (!rel || !rel.page || String(rel.page).charAt(0) !== "/") return false;
        if (ids.length) return ids.indexOf(rel.id) !== -1;
        return artist && rel.artistId === artist;
      });
      if (ids.length) {
        picked.sort(function (a, b) { return ids.indexOf(a.id) - ids.indexOf(b.id); });
      } else {
        picked.sort(function (a, b) { return catNum(b) - catNum(a); });
      }
      if (!picked.length) return;
      list.innerHTML = picked.map(function (rel) {
        return row(rel, { tag: "li", keepCat: false });
      }).join("");
    });
  }

  function boot() {
    if (!document.querySelector("[data-sleeve-artist], [data-sleeve-ids]")) return;
    fetch("/data/catalog.json")
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        mountLists((data && data.releases) || []);
        if (global.VCRPlayer && VCRPlayer.getState) sync(document, VCRPlayer.getState());
      })
      .catch(function () {});
  }

  global.addEventListener("vcr:player", function (e) {
    sync(document, (e && e.detail) || {});
  });

  global.ClubSleeve = {
    esc: esc,
    asset: asset,
    spec: spec,
    durBpm: durBpm,
    glyphs: glyphs,
    hasCue: hasCue,
    newest: newest,
    card: card,
    row: row,
    sync: sync,
    mountLists: mountLists
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})(window);
