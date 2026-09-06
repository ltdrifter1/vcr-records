/**
 * Club Copy — iTunes Cover Flow (Y2K, modern).
 * Centers one sleeve, fans the rest in 3D with a wet-floor reflection.
 * Keyboard, drag, swipe, and click. Vertical page scroll stays untouched.
 */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function CoverFlow(root) {
    this.root = root;
    this.stage = root.querySelector("[data-coverflow-stage]") || root;
    this.track = root.querySelector("[data-coverflow-track]") || root.querySelector(".news-flow-track");
    this.caption = root.querySelector("[data-coverflow-caption]");
    this.prevBtn = root.querySelector("[data-coverflow-prev]");
    this.nextBtn = root.querySelector("[data-coverflow-next]");
    this.items = [];
    this.index = 0;
    this.cover = 280;
    this.dragging = false;
    this.didDrag = false;
    this.dragStartX = 0;
    this.dragStartIndex = 0;
    this.pointerId = null;
    this.bound = false;
    this._onResize = this.measure.bind(this);
    this._onKey = this.onKey.bind(this);
  }

  CoverFlow.prototype.init = function () {
    this.refresh();
  };

  CoverFlow.prototype.refresh = function () {
    this.stage = this.root.querySelector("[data-coverflow-stage]") || this.stage || this.root;
    this.track = this.root.querySelector("[data-coverflow-track]") || this.root.querySelector(".news-flow-track") || this.track;
    this.caption = this.root.querySelector("[data-coverflow-caption]") || this.caption;
    this.prevBtn = this.root.querySelector("[data-coverflow-prev]") || this.prevBtn;
    this.nextBtn = this.root.querySelector("[data-coverflow-next]") || this.nextBtn;
    if (!this.track) return;

    this.items = Array.prototype.slice.call(
      this.track.querySelectorAll("[data-coverflow-item], .news-card")
    );
    if (!this.items.length) {
      this.root.classList.remove("is-ready");
      return;
    }

    this.items.forEach(function (item, i) {
      item.setAttribute("data-flow-i", String(i));
      item.classList.add("flow-item", "in");
      ensureReflection(item);
    });

    this.root.classList.add("is-ready");
    this.root.setAttribute("tabindex", "0");
    this.index = clamp(this.index, 0, this.items.length - 1);
    this.measure();
    this.bind();
  };

  CoverFlow.prototype.measure = function () {
    var w = (this.stage && this.stage.clientWidth) || this.root.clientWidth || 720;
    var lg = this.root.getAttribute("data-coverflow-size") === "lg";
    var max = lg ? 340 : 300;
    var ratio = w < 700 ? (lg ? 0.52 : 0.46) : (lg ? 0.36 : 0.32);
    this.cover = clamp(Math.round(w * ratio), 148, max);
    if (this.stage) this.stage.style.setProperty("--flow-cover", this.cover + "px");
    this.root.style.setProperty("--flow-cover", this.cover + "px");
    this.layout();
  };

  CoverFlow.prototype.layout = function () {
    var self = this;
    var n = this.items.length;
    var cover = this.cover;
    var angle = reduceMotion ? 0 : 62;
    var sideGap = cover * (reduceMotion ? 0.72 : 0.42);
    var centerGap = cover * (reduceMotion ? 0.82 : 0.58);
    var depth = reduceMotion ? 0 : 168;

    this.items.forEach(function (item, i) {
      var offset = i - self.index;
      var abs = Math.abs(offset);
      var sign = offset < 0 ? -1 : offset > 0 ? 1 : 0;
      var x = sign === 0 ? 0 : sign * (centerGap + (abs - 1) * sideGap);
      var rot = sign * -angle;
      var z = sign === 0 ? 80 : -depth - abs * 8;
      var scale = sign === 0 ? 1 : reduceMotion ? 0.86 : 0.9;
      var opacity = abs > 5 ? 0 : abs > 3 ? 0.42 : 1;

      item.style.setProperty("--fx", x.toFixed(2) + "px");
      item.style.setProperty("--fy", "0px");
      item.style.setProperty("--fz", z.toFixed(2) + "px");
      item.style.setProperty("--fr", rot.toFixed(2) + "deg");
      item.style.setProperty("--fs", scale.toFixed(3));
      item.style.opacity = String(opacity);
      item.style.zIndex = String(100 - abs);
      item.classList.toggle("is-center", i === self.index);
      item.classList.toggle("is-side", i !== self.index);
      item.setAttribute("aria-hidden", i === self.index ? "false" : "true");
      item.tabIndex = i === self.index ? 0 : -1;
    });

    this.syncCaption();
    if (this.prevBtn) this.prevBtn.disabled = this.index <= 0;
    if (this.nextBtn) this.nextBtn.disabled = this.index >= n - 1;
    this.emit();
  };

  CoverFlow.prototype.currentItem = function () {
    return this.items[this.index] || null;
  };

  CoverFlow.prototype.emit = function () {
    var item = this.currentItem();
    var ev;
    try {
      ev = new CustomEvent("coverflow:change", {
        bubbles: true,
        detail: {
          index: this.index,
          item: item,
          id: item ? item.getAttribute("data-release") : null
        }
      });
    } catch (err) {
      ev = document.createEvent("CustomEvent");
      ev.initCustomEvent("coverflow:change", true, true, {
        index: this.index,
        item: item,
        id: item ? item.getAttribute("data-release") : null
      });
    }
    this.root.dispatchEvent(ev);
  };

  CoverFlow.prototype.syncCaption = function () {
    if (!this.caption) return;
    var item = this.items[this.index];
    if (!item) return;
    var date = item.querySelector(".news-card-date");
    var type = item.querySelector(".news-type");
    var title = item.querySelector(".news-card-title, .flow-title");
    var dek = item.querySelector(".news-card-dek, .flow-dek");
    var dateEl = this.caption.querySelector(".news-flow-date, .coverflow-kicker");
    var typeEl = this.caption.querySelector(".news-flow-type");
    var titleEl = this.caption.querySelector(".news-flow-title, .coverflow-title");
    var dekEl = this.caption.querySelector(".news-flow-dek, .coverflow-artist");
    var kicker = item.getAttribute("data-flow-kicker") || (date ? date.textContent : "");
    var kind = item.getAttribute("data-flow-kind") || (type ? type.textContent : "");
    var name = item.getAttribute("data-flow-title") || (title ? title.textContent : "");
    var sub = item.getAttribute("data-flow-artist") || (dek ? dek.textContent : "");
    if (dateEl) dateEl.textContent = kicker || kind || "";
    if (typeEl) typeEl.textContent = kind;
    if (titleEl) titleEl.textContent = name;
    if (dekEl) dekEl.textContent = sub;
  };

  CoverFlow.prototype.go = function (i, instant) {
    this.index = clamp(i, 0, Math.max(0, this.items.length - 1));
    if (instant) this.root.classList.add("is-snap");
    this.layout();
    if (instant) {
      var root = this.root;
      requestAnimationFrame(function () { root.classList.remove("is-snap"); });
    }
  };

  CoverFlow.prototype.goToRelease = function (id) {
    if (!id) return;
    for (var i = 0; i < this.items.length; i++) {
      if (this.items[i].getAttribute("data-release") === id) {
        if (i !== this.index) this.go(i);
        return;
      }
    }
  };

  CoverFlow.prototype.step = function (dir) {
    this.go(this.index + dir);
  };

  /**
   * Resolve which sleeve/card sits under a viewport point by its actual
   * rendered (post-3D-transform) box. Some browsers mis-attribute the
   * native click target to the track container instead of a rotated,
   * translateZ'd side card, so `e.target.closest(...)` can silently miss —
   * this geometry-based fallback makes clicking a side card reliable.
   */
  CoverFlow.prototype.hitTest = function (x, y) {
    var hit = null;
    var hitAbs = Infinity;
    for (var i = 0; i < this.items.length; i++) {
      var item = this.items[i];
      var r = item.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        var abs = Math.abs(i - this.index);
        if (abs < hitAbs) {
          hit = item;
          hitAbs = abs;
        }
      }
    }
    return hit;
  };

  CoverFlow.prototype.bind = function () {
    if (this.bound) return;
    this.bound = true;
    var self = this;

    if (this.prevBtn) {
      this.prevBtn.addEventListener("click", function (e) {
        e.preventDefault();
        self.step(-1);
      });
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener("click", function (e) {
        e.preventDefault();
        self.step(1);
      });
    }

    this.track.addEventListener("click", function (e) {
      if (e.target.closest("button, input, [data-act]")) return;
      if (self.didDrag) {
        e.preventDefault();
        return;
      }
      var item = e.target.closest("[data-coverflow-item], .news-card") || self.hitTest(e.clientX, e.clientY);
      if (!item || self.items.indexOf(item) < 0) return;
      var i = self.items.indexOf(item);
      e.preventDefault();
      if (i !== self.index) {
        self.go(i);
        return;
      }
      if (item.href) window.location.href = item.href;
    });

    this.stage.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      if (e.target.closest("button, input")) return;
      self.dragging = true;
      self.didDrag = false;
      self.dragStartX = e.clientX;
      self.dragStartIndex = self.index;
      self.pointerId = e.pointerId;
    });

    this.stage.addEventListener("pointermove", function (e) {
      if (!self.dragging) return;
      var dx = e.clientX - self.dragStartX;
      if (Math.abs(dx) > 10) {
        if (!self.didDrag) {
          self.didDrag = true;
          self.root.classList.add("is-dragging");
          try { self.stage.setPointerCapture(e.pointerId); } catch (err) {}
        }
        var steps = Math.round(-dx / (self.cover * 0.42));
        var next = clamp(self.dragStartIndex + steps, 0, self.items.length - 1);
        if (next !== self.index) self.go(next);
      }
    });

    function endDrag(e) {
      if (!self.dragging) return;
      self.dragging = false;
      self.root.classList.remove("is-dragging");
      if (e && self.pointerId != null) {
        try { self.stage.releasePointerCapture(self.pointerId); } catch (err) {}
      }
      self.pointerId = null;
    }
    this.stage.addEventListener("pointerup", endDrag);
    this.stage.addEventListener("pointercancel", endDrag);

    this.root.addEventListener("keydown", this._onKey);
    window.addEventListener("resize", this._onResize, { passive: true });

    this.stage.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if (e.deltaX > 8) self.step(1);
      else if (e.deltaX < -8) self.step(-1);
    }, { passive: false });
  };

  CoverFlow.prototype.onKey = function (e) {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      this.step(-1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      this.step(1);
    } else if (e.key === "Home") {
      e.preventDefault();
      this.go(0);
    } else if (e.key === "End") {
      e.preventDefault();
      this.go(this.items.length - 1);
    } else if (e.key === "Enter" || e.key === " ") {
      var item = this.items[this.index];
      if (!item) return;
      var playId = item.getAttribute("data-play-release") || item.getAttribute("data-release");
      var playBtn = item.querySelector("[data-play-release]");
      if ((e.key === " ") && playId && window.VCRPlayer) {
        e.preventDefault();
        if (playBtn) playBtn.click();
        else VCRPlayer.playRelease(playId, null, { autoplay: true });
        return;
      }
      if (item.href) {
        e.preventDefault();
        window.location.href = item.href;
      }
    }
  };

  function ensureReflection(item) {
    if (item.querySelector(".flow-reflect")) return;
    var art = item.querySelector(".news-card-art, .flow-art");
    if (!art) return;
    var img = art.querySelector("img");
    if (!img) return;
    var reflect = document.createElement("div");
    reflect.className = "flow-reflect";
    reflect.setAttribute("aria-hidden", "true");
    var clone = img.cloneNode(true);
    clone.removeAttribute("alt");
    clone.setAttribute("alt", "");
    clone.loading = "lazy";
    reflect.appendChild(clone);
    art.appendChild(reflect);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function hasPreview(rel) {
    return Array.isArray(rel.tracks) && rel.tracks.some(function (t) {
      return !!(t && t.preview);
    });
  }

  function sleeveHtml(rel) {
    var thumb = rel.coverThumb || rel.cover || "";
    var full = rel.cover || thumb;
    var href = rel.page || "#";
    var kicker = [rel.catalogue, rel.kind, rel.year].filter(Boolean).join(" · ");
    var play = hasPreview(rel)
      ? (
          '<button type="button" class="flow-play" data-play-release="' + esc(rel.id) + '" aria-label="Play ' + esc(rel.title) + '">' +
            '<svg class="fp-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            '<svg class="fp-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>' +
          "</button>" +
          '<span class="flow-air status-chip status-chip--air" aria-hidden="true">On air</span>'
        )
      : "";
    return (
      '<a class="flow-sleeve" href="' + esc(href) + '" data-coverflow-item data-release="' + esc(rel.id) + '"' +
        ' data-flow-title="' + esc(rel.title) + '"' +
        ' data-flow-artist="' + esc(rel.artist || "") + '"' +
        ' data-flow-kicker="' + esc(kicker) + '"' +
        ' data-flow-kind="' + esc(rel.kind || "") + '">' +
        '<div class="flow-art jewel">' +
          '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' 480w, ' + esc(full) + ' 1200w" sizes="(max-width:700px) 52vw, 340px" alt="' + esc(rel.title) + ' — artwork" width="1200" height="1200" loading="lazy"/>' +
          play +
        "</div>" +
      "</a>"
    );
  }

  function bindPlayButtons(root) {
    (root || document).querySelectorAll("[data-play-release]").forEach(function (el) {
      if (el.getAttribute("data-bound-play") === "1") return;
      el.setAttribute("data-bound-play", "1");
      el.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (!window.VCRPlayer) return;
        var id = el.getAttribute("data-play-release");
        var trackId = el.getAttribute("data-play-track");
        var cur = VCRPlayer.current && VCRPlayer.current();
        if (cur && cur.releaseId === id && (!trackId || cur.id === trackId)) {
          VCRPlayer.toggle();
        } else {
          VCRPlayer.playRelease(id, trackId || null, { autoplay: true });
        }
      });
    });
  }

  function syncAir(root, detail) {
    var d = detail || {};
    var nowId = d.track ? d.track.releaseId : null;
    var nextId = d.nextTrack ? d.nextTrack.releaseId : null;
    var playing = !!d.playing;
    (root || document).querySelectorAll(".flow-sleeve[data-release]").forEach(function (item) {
      var id = item.getAttribute("data-release");
      var mine = nowId && id === nowId;
      var up = nextId && id === nextId && !mine;
      item.classList.toggle("is-now-playing", !!mine);
      item.classList.toggle("is-audible", !!(mine && playing));
      item.classList.toggle("is-up-next", !!up);
      var air = item.querySelector(".flow-air");
      if (air) {
        air.textContent = mine ? "On air" : "Standby";
        air.classList.toggle("status-chip--air", !!mine);
        air.classList.toggle("status-chip--standby", !!up && !mine);
      }
      var btn = item.querySelector(".flow-play");
      if (btn) {
        btn.setAttribute("aria-label", (mine && playing ? "Pause " : "Play ") + (item.getAttribute("data-flow-title") || "release"));
      }
    });
  }

  function boot() {
    document.querySelectorAll("[data-coverflow]").forEach(function (el) {
      if (el._coverFlow) {
        el._coverFlow.refresh();
        return;
      }
      var flow = new CoverFlow(el);
      flow.init();
      el._coverFlow = flow;
    });
  }

  var lastCentered = "";
  window.addEventListener("vcr:player", function (e) {
    var d = e.detail || {};
    var id = d.track ? d.track.releaseId : null;
    document.querySelectorAll('[data-coverflow-kind="albums"]').forEach(function (el) {
      syncAir(el, d);
      if (id && id !== lastCentered && el._coverFlow && !el._coverFlow.dragging) {
        el._coverFlow.goToRelease(id);
      }
    });
    if (id) lastCentered = id;
  });

  window.ClubCopy = window.ClubCopy || {};
  window.ClubCopy.CoverFlow = CoverFlow;
  window.ClubCopy.initCoverFlow = boot;
  window.ClubCopy.flowSleeveHtml = sleeveHtml;
  window.ClubCopy.bindFlowPlay = bindPlayButtons;
  window.ClubCopy.syncFlowAir = syncAir;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
