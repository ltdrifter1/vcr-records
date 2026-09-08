/* Club Copy — homepage Cover Flow catalogue from catalog.json */
(function () {
  var track = document.getElementById("wallGrid");
  var flowRoot = document.getElementById("albumFlow");
  if (!track) return;

  function mountFlow() {
    if (!flowRoot) return;
    if (flowRoot._coverFlow) flowRoot._coverFlow.refresh();
    else if (window.ClubCopy && typeof ClubCopy.initCoverFlow === "function") {
      ClubCopy.initCoverFlow();
    }
    if (window.ClubCopy && ClubCopy.bindFlowPlay) ClubCopy.bindFlowPlay(flowRoot);
    if (window.VCRPlayer && VCRPlayer.getState && window.ClubCopy && ClubCopy.syncFlowAir) {
      ClubCopy.syncFlowAir(flowRoot, VCRPlayer.getState());
    }
  }

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
      if (window.ClubCopy && ClubCopy.flowSleeveHtml) {
        track.innerHTML = allReleases.map(ClubCopy.flowSleeveHtml).join("");
      }
      track.removeAttribute("aria-busy");
      mountFlow();
    })
    .catch(function () {
      track.removeAttribute("aria-busy");
      if (track.querySelector(".wall-item, .flow-sleeve")) {
        mountFlow();
        return;
      }
      track.innerHTML = '<p style="color:rgba(255,255,255,.55);padding:24px">Could not load releases. <a href="/library">Open Library</a></p>';
    });
})();
