/* Counted genre and artist lanes. Home filters the release rows.
   Library uses ClubLanes.sync / ClubLanes.bind and keeps its own list. */
(function () {
  function slugify(s) {
    return String(s || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-");
  }

  function artistKey(filter) {
    var q = String(filter || "").toLowerCase();
    if (q === "rainier" || q === "inlet-knight" || q === "rosco" || q === "roscoe") return "forsberg";
    return q;
  }

  function matchesArtist(rel, filter) {
    if (!filter) return true;
    var q = artistKey(filter);
    var id = String(rel.artistId || "").toLowerCase();
    var name = String(rel.artist || "").toLowerCase();
    return id === q || name === q || slugify(name) === q;
  }

  function matchesGenre(rel, filter) {
    if (!filter) return true;
    return slugify(rel.genre) === slugify(filter);
  }

  function readFilters() {
    var genre = "";
    var artist = "";
    try {
      var p = new URLSearchParams(window.location.search || "");
      genre = String(p.get("genre") || "").trim();
      artist = String(p.get("artist") || p.get("artistId") || "").trim();
    } catch (e) {}
    if (/^(rainier|inlet-knight|rosco|roscoe)$/i.test(artist)) artist = "forsberg";
    return { genre: genre, artist: artist };
  }

  function writeUrl(filters) {
    try {
      var url = new URL(window.location.href);
      if (filters.artist) url.searchParams.set("artist", filters.artist);
      else {
        url.searchParams.delete("artist");
        url.searchParams.delete("artistId");
      }
      if (filters.genre) url.searchParams.set("genre", filters.genre);
      else url.searchParams.delete("genre");
      var next = url.pathname + (url.searchParams.toString() ? "?" + url.searchParams.toString() : "") + url.hash;
      if (next !== window.location.pathname + window.location.search + window.location.hash) {
        window.history.replaceState({}, "", next);
      }
    } catch (e) {}
  }

  function place(root) {
    if (!root) return;
    root.querySelectorAll(".seg").forEach(function (seg) {
      var plate = seg.querySelector(".plate");
      var on = seg.querySelector('[aria-checked="true"]');
      if (!plate) return;
      if (!on) {
        plate.style.width = "0px";
        return;
      }
      plate.style.width = on.offsetWidth + "px";
      plate.style.height = on.offsetHeight + "px";
      plate.style.transform = "translate(" + on.offsetLeft + "px," + on.offsetTop + "px)";
      seg.classList.add("is-ready");
    });
  }

  var watched = [];

  function sync(root, filters, countFor) {
    if (!root) return;
    ["genre", "artist"].forEach(function (kind) {
      var seg = root.querySelector('.seg[data-filter="' + kind + '"]');
      if (!seg) return;
      var active = String((filters && filters[kind]) || "");
      var buttons = seg.querySelectorAll("button");
      var matched = !active;
      for (var i = 0; i < buttons.length; i++) {
        var value = buttons[i].getAttribute("data-value") || "";
        if (active && value.toLowerCase() === active.toLowerCase()) matched = true;
        var n = buttons[i].querySelector(".n");
        if (n && countFor) {
          var count = countFor(kind, value);
          n.textContent = String(count);
          buttons[i].classList.toggle("is-empty", count === 0);
        }
      }
      for (var j = 0; j < buttons.length; j++) {
        var v = buttons[j].getAttribute("data-value") || "";
        var on = matched && (active ? v.toLowerCase() === active.toLowerCase() : v === "");
        buttons[j].setAttribute("aria-checked", on ? "true" : "false");
        buttons[j].tabIndex = on ? 0 : -1;
      }
    });
    if (watched.indexOf(root) === -1) watched.push(root);
    requestAnimationFrame(function () { place(root); });
  }

  function checkedFilters(root) {
    var out = { genre: "", artist: "" };
    ["genre", "artist"].forEach(function (kind) {
      var on = root.querySelector('.seg[data-filter="' + kind + '"] [aria-checked="true"]');
      out[kind] = on ? (on.getAttribute("data-value") || "") : "";
    });
    return out;
  }

  function bind(root, onChange) {
    if (!root || root.getAttribute("data-lanes-bound")) return;
    root.setAttribute("data-lanes-bound", "true");
    root.addEventListener("click", function (e) {
      var btn = e.target.closest ? e.target.closest(".seg button") : null;
      if (!btn || !root.contains(btn)) return;
      var seg = btn.closest("[data-filter]");
      var kind = seg && seg.getAttribute("data-filter");
      if (kind !== "genre" && kind !== "artist") return;
      var next = checkedFilters(root);
      next[kind] = btn.getAttribute("data-value") || "";
      onChange(next);
    });
    root.addEventListener("keydown", function (e) {
      var btn = e.target.closest ? e.target.closest(".seg button") : null;
      if (!btn || !root.contains(btn)) return;
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
      var buttons = [].slice.call(btn.parentElement.querySelectorAll("button"));
      var i = buttons.indexOf(btn);
      if (e.key === "ArrowRight") i = (i + 1) % buttons.length;
      else if (e.key === "ArrowLeft") i = (i - 1 + buttons.length) % buttons.length;
      else if (e.key === "Home") i = 0;
      else i = buttons.length - 1;
      e.preventDefault();
      buttons[i].click();
      buttons[i].focus();
    });
  }

  window.addEventListener("resize", function () {
    watched.forEach(place);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { watched.forEach(place); });
  }

  window.ClubLanes = {
    slugify: slugify,
    matchesGenre: matchesGenre,
    matchesArtist: matchesArtist,
    readFilters: readFilters,
    writeUrl: writeUrl,
    sync: sync,
    bind: bind,
    place: place
  };

  var rows = document.getElementById("listenRows");
  var root = rows && rows.parentElement && rows.parentElement.querySelector(".filters");
  if (!rows || !root) return;

  var countEl = document.getElementById("listenCount");
  var emptyEl = document.getElementById("listenEmpty");
  var clearBtn = document.getElementById("listenClear");
  var more = document.getElementById("listenMore");
  var filters = readFilters();

  function rowRel(row) {
    return {
      genre: row.getAttribute("data-genre") || "",
      artistId: row.getAttribute("data-artist-id") || "",
      artist: (row.querySelector(".row-artist") || {}).textContent || ""
    };
  }

  function listRows() {
    return [].slice.call(rows.querySelectorAll(".row--release"));
  }

  function countFor(kind, value) {
    var n = 0;
    listRows().forEach(function (row) {
      var rel = rowRel(row);
      if (kind === "genre") {
        if (matchesGenre(rel, value) && matchesArtist(rel, filters.artist)) n++;
      } else if (matchesArtist(rel, value) && matchesGenre(rel, filters.genre)) n++;
    });
    return n;
  }

  function apply() {
    var filtering = !!(filters.genre || filters.artist);
    var shown = 0;
    listRows().forEach(function (row) {
      var rel = rowRel(row);
      var match = matchesGenre(rel, filters.genre) && matchesArtist(rel, filters.artist);
      var visible = filtering ? match : !row.hasAttribute("data-extra");
      row.hidden = !visible;
      if (visible) shown++;
    });
    if (countEl) countEl.textContent = shown === 1 ? "1 release" : shown + " releases";
    if (emptyEl) emptyEl.hidden = shown !== 0;
    if (clearBtn) clearBtn.hidden = !filtering;
    if (more) {
      var q = [];
      if (filters.genre) q.push("genre=" + encodeURIComponent(filters.genre));
      if (filters.artist) q.push("artist=" + encodeURIComponent(filters.artist));
      more.setAttribute("href", "/library" + (q.length ? "?" + q.join("&") : ""));
    }
    writeUrl(filters);
    sync(root, filters, countFor);
  }

  bind(root, function (next) {
    filters = { genre: next.genre || "", artist: next.artist || "" };
    apply();
  });
  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      filters = { genre: "", artist: "" };
      apply();
    });
  }
  apply();
})();
