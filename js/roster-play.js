(function () {
  var buttons = Array.prototype.slice.call(document.querySelectorAll("[data-play-release]"));
  if (!buttons.length) return;
  var activeId = null;
  var bound = false;
  function sync() {
    var st = window.VCRPlayer && window.VCRPlayer.getState ? window.VCRPlayer.getState() : null;
    var playing = !!(st && st.playing && st.track);
    buttons.forEach(function (b) {
      var on = playing && st.track.releaseId === b.getAttribute("data-play-release");
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.querySelector(".roster-play-label").textContent = on ? "Pause" : "Play";
    });
  }
  function bind() {
    if (bound || !window.VCRPlayer || !window.VCRPlayer.getAudio) return;
    var a = window.VCRPlayer.getAudio();
    if (!a) return;
    bound = true;
    ["play", "pause", "ended", "emptied"].forEach(function (ev) { a.addEventListener(ev, sync); });
  }
  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      var P = window.VCRPlayer;
      if (!P) return;
      var id = b.getAttribute("data-play-release");
      var st = P.getState();
      if (st.track && st.track.releaseId === id) {
        P.toggle();
      } else {
        P.playRelease(id);
        activeId = id;
      }
      bind();
      setTimeout(sync, 150);
    });
  });
})();
