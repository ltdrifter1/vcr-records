/* Club Copy — homepage Cover Flow catalogue from catalog.json */
(function () {
  var track = document.getElementById("wallGrid");
  var flowRoot = document.getElementById("albumFlow");
  var inspect = document.querySelector("[data-album-inspect]");
  if (!track) return;

  var allReleases = [];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function money(n) {
    var v = Number(n);
    if (!isFinite(v)) return "";
    return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.00$/, "");
  }

  function digitalPrice(rel) {
    var d = rel.formats && rel.formats.digital;
    return d && d.price != null ? Number(d.price) : null;
  }

  function hasPreview(rel) {
    return Array.isArray(rel.tracks) && rel.tracks.some(function (t) {
      return !!(t && t.preview);
    });
  }

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

  function renderInspect(rel) {
    if (!inspect || !rel) return;
    var thumb = rel.coverThumb || rel.cover || "";
    var full = rel.cover || thumb;
    var price = digitalPrice(rel);
    var kicker = [rel.catalogue, rel.kind, rel.year].filter(Boolean).join(" · ");
    var play = hasPreview(rel)
      ? '<button type="button" class="btn btn-chrome-on-dark" data-play-release="' + esc(rel.id) + '">Play</button>'
      : "";
    var add = (rel.formats && rel.formats.digital && rel.formats.digital.sku)
      ? (
          '<button type="button" class="btn btn-ghost-on-dark" data-add-release="' + esc(rel.id) + '"' +
            ' data-sku="' + esc(rel.formats.digital.sku) + '"' +
            ' data-name="' + esc(rel.title + " — Digital") + '"' +
            ' data-price="' + esc(rel.formats.digital.price) + '"' +
            ' data-image="' + esc(full) + '">' +
            (price != null ? "Add digital · $" + money(price) : "Add digital") +
          "</button>"
        )
      : "";
    inspect.hidden = false;
    inspect.innerHTML =
      '<figure class="album-inspect__art jewel">' +
        '<img src="' + esc(thumb) + '" alt="" width="400" height="400"/>' +
      "</figure>" +
      '<div class="album-inspect__copy">' +
        (kicker ? '<p class="album-inspect__cat">' + esc(kicker) + "</p>" : "") +
        '<h3 class="album-inspect__title"><a href="' + esc(rel.page || "#") + '">' + esc(rel.title) + "</a></h3>" +
        '<p class="album-inspect__artist">' + esc(rel.artist || "") + "</p>" +
        '<div class="album-inspect__actions">' +
          play +
          add +
          '<a class="btn btn-ghost-on-dark" href="' + esc(rel.page || "#") + '">Sleeve</a>' +
        "</div>" +
      "</div>";
    if (window.ClubCopy && ClubCopy.bindFlowPlay) ClubCopy.bindFlowPlay(inspect);
    bindAdd(inspect);
  }

  function bindAdd(root) {
    (root || document).querySelectorAll("[data-add-release]").forEach(function (el) {
      if (el.getAttribute("data-bound-add") === "1") return;
      el.setAttribute("data-bound-add", "1");
      el.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!window.VCRCart) return;
        var sku = el.getAttribute("data-sku");
        var price = Number(el.getAttribute("data-price"));
        if (!sku || !isFinite(price)) return;
        VCRCart.add({
          sku: sku,
          name: el.getAttribute("data-name") || sku,
          price: price,
          image: el.getAttribute("data-image") || "",
          qty: 1,
          id: sku
        });
        var orig = el.textContent;
        el.textContent = "Added ✓";
        clearTimeout(el._flash);
        el._flash = setTimeout(function () { el.textContent = orig; }, 1600);
      });
    });
  }

  function byId(id) {
    for (var i = 0; i < allReleases.length; i++) {
      if (allReleases[i].id === id) return allReleases[i];
    }
    return null;
  }

  if (flowRoot) {
    flowRoot.addEventListener("coverflow:change", function (e) {
      var id = e.detail && e.detail.id;
      var rel = byId(id);
      if (rel) renderInspect(rel);
    });
  }

  fetch("/data/catalog.json")
    .then(function (r) {
      if (!r.ok) throw new Error("catalog");
      return r.json();
    })
    .then(function (data) {
      allReleases = (data.releases || []).slice().sort(function (a, b) {
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
      renderInspect(allReleases[0]);
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
