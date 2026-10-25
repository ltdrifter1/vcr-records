/* Club Copy — on-air state for generated pages. Rows with data-release get
   .is-air and keys with data-play-release get .is-playing while their
   release is sounding. Clicks are handled by player.js. */
(function () {
  "use strict";
  function state() {
    return window.VCRPlayer && VCRPlayer.getState ? VCRPlayer.getState() : null;
  }
  function paint(detail) {
    var d = detail || state() || {};
    var track = d.track || null;
    var playing = !!(d.playing && track);
    var rel = track ? track.releaseId : "";
    var nodes = document.querySelectorAll("[data-release]");
    for (var i = 0; i < nodes.length; i++) {
      var on = playing && nodes[i].getAttribute("data-release") === rel;
      nodes[i].classList.toggle("is-air", on);
    }
    var keys = document.querySelectorAll("[data-play-release]");
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var mine = playing && key.getAttribute("data-play-release") === rel;
      var t = key.getAttribute("data-play-track");
      if (mine && t && track.id && key.classList.contains("hero-track")) mine = t === track.id;
      key.classList.toggle("is-playing", mine);
      if (key.hasAttribute("aria-pressed")) key.setAttribute("aria-pressed", mine ? "true" : "false");
      var label = key.querySelector(".roster-play-label");
      if (label) label.textContent = mine ? "Pause" : "Play";
    }
    document.body.classList.toggle("is-air", playing);
    // Release page track rows: a progress line and elapsed time on the sounding row.
    var rows = document.querySelectorAll(".track-row[data-duration]");
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var mineRow = playing && row.classList.contains("is-active");
      var elapsed = row.querySelector("[data-track-elapsed]");
      if (mineRow) {
        var dur = Number(row.getAttribute("data-duration")) || 0;
        var t = Number(d.currentTime) || 0;
        row.style.setProperty("--p", (dur ? Math.min(100, (t / dur) * 100) : 0).toFixed(2) + "%");
        if (elapsed) elapsed.textContent = fmtClock(t) + " / ";
      } else {
        row.style.removeProperty("--p");
        if (elapsed) elapsed.textContent = "";
      }
    }
  }
  function fmtClock(sec) {
    sec = Math.max(0, Math.floor(Number(sec) || 0));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  // Clicks on [data-play-release] are handled by player.js (document-level).
  window.addEventListener("vcr:player", function (e) { paint(e.detail); });
  paint();
})();

/* Add-to-cart keys on generated rows ([data-add-release]). library.js binds
   its own rows and stops propagation, so this only runs where it does not. */
(function () {
  "use strict";
  document.addEventListener("click", function (e) {
    var btn = e.target.closest("[data-add-release]");
    if (!btn || btn.getAttribute("data-bound-add") === "1" || !window.VCRCart) return;
    e.preventDefault();
    var sku = btn.getAttribute("data-sku");
    var price = Number(btn.getAttribute("data-price"));
    if (!sku || !isFinite(price)) return;
    VCRCart.add({ sku: sku, name: btn.getAttribute("data-name") || sku, price: price, image: btn.getAttribute("data-image") || "", qty: 1, id: sku });
    var label = btn.getAttribute("data-label") || btn.textContent;
    btn.setAttribute("data-label", label);
    btn.textContent = "Added";
    btn.classList.add("is-added");
    clearTimeout(btn._t);
    btn._t = setTimeout(function () { btn.textContent = label; btn.classList.remove("is-added"); }, 2000);
  });
})();

/* Video feed: a click on a video row swaps its thumbnail for the YouTube embed
   (privacy-enhanced domain) and pauses the site player if it is sounding. */
(function () {
  "use strict";
  document.addEventListener("click", function (e) {
    var hit = e.target.closest("[data-video-embed]");
    if (!hit) return;
    var id = hit.getAttribute("data-video-embed");
    var row = hit.closest("[data-video]");
    var art = row && row.querySelector(".video-art");
    if (!id || !art) return;
    e.preventDefault();
    if (art.querySelector("iframe")) return;
    try { var st = window.VCRPlayer && VCRPlayer.getState && VCRPlayer.getState(); if (st && st.playing && VCRPlayer.pause) VCRPlayer.pause(); } catch (err) {}
    var frame = document.createElement("iframe");
    frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
    frame.title = hit.getAttribute("aria-label") || "Video";
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.allowFullscreen = true;
    frame.setAttribute("loading", "eager");
    var box = document.createElement("div");
    box.className = "row-art row-art--wide video-art is-playing";
    box.appendChild(frame);
    art.replaceWith(box);
    row.classList.add("is-playing");
    var key = row.querySelector(".video-key");
    if (key) { key.classList.add("is-playing"); key.setAttribute("aria-label", "Playing"); }
  });
})();
