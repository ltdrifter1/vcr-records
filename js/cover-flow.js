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
    if (!this.track) return;
    this.items = Array.prototype.slice.call(this.track.querySelectorAll("[data-coverflow-item], .news-card"));
    if (!this.items.length) return;

    this.items.forEach(function (item, i) {
      item.setAttribute("data-flow-i", String(i));
      item.classList.add("flow-item");
      ensureReflection(item);
    });

    this.root.classList.add("is-ready");
    this.root.setAttribute("tabindex", "0");
    this.measure();
    this.go(0, true);
    this.bind();
  };

  CoverFlow.prototype.measure = function () {
    var w = this.stage.clientWidth || this.root.clientWidth || 720;
    this.cover = clamp(Math.round(w * 0.34), 168, 320);
    this.stage.style.setProperty("--flow-cover", this.cover + "px");
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
  };

  CoverFlow.prototype.syncCaption = function () {
    if (!this.caption) return;
    var item = this.items[this.index];
    if (!item) return;
    var date = item.querySelector(".news-card-date");
    var type = item.querySelector(".news-type");
    var title = item.querySelector(".news-card-title");
    var dek = item.querySelector(".news-card-dek");
    var dateEl = this.caption.querySelector(".news-flow-date");
    var typeEl = this.caption.querySelector(".news-flow-type");
    var titleEl = this.caption.querySelector(".news-flow-title");
    var dekEl = this.caption.querySelector(".news-flow-dek");
    if (dateEl) dateEl.textContent = date ? date.textContent : "";
    if (typeEl) typeEl.textContent = type ? type.textContent : "";
    if (titleEl) titleEl.textContent = title ? title.textContent : "";
    if (dekEl) dekEl.textContent = dek ? dek.textContent : "";
  };

  CoverFlow.prototype.go = function (i, instant) {
    this.index = clamp(i, 0, this.items.length - 1);
    if (instant) this.root.classList.add("is-snap");
    this.layout();
    if (instant) {
      var root = this.root;
      requestAnimationFrame(function () { root.classList.remove("is-snap"); });
    }
  };

  CoverFlow.prototype.step = function (dir) {
    this.go(this.index + dir);
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

    this.items.forEach(function (item, i) {
      item.addEventListener("click", function (e) {
        if (self.didDrag) {
          e.preventDefault();
          return;
        }
        if (i === self.index) return;
        e.preventDefault();
        self.go(i);
      });
    });

    this.stage.addEventListener("pointerdown", function (e) {
      if (e.button != null && e.button !== 0) return;
      self.dragging = true;
      self.didDrag = false;
      self.dragStartX = e.clientX;
      self.dragStartIndex = self.index;
      self.pointerId = e.pointerId;
      self.root.classList.add("is-dragging");
      try { self.stage.setPointerCapture(e.pointerId); } catch (err) {}
    });

    this.stage.addEventListener("pointermove", function (e) {
      if (!self.dragging) return;
      var dx = e.clientX - self.dragStartX;
      if (Math.abs(dx) > 8) self.didDrag = true;
      var steps = Math.round(-dx / (self.cover * 0.42));
      var next = clamp(self.dragStartIndex + steps, 0, self.items.length - 1);
      if (next !== self.index) self.go(next);
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
      if (item && item.href) {
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

  function boot() {
    document.querySelectorAll("[data-coverflow]").forEach(function (el) {
      if (el._coverFlow) return;
      var flow = new CoverFlow(el);
      flow.init();
      el._coverFlow = flow;
    });
  }

  window.ClubCopy = window.ClubCopy || {};
  window.ClubCopy.CoverFlow = CoverFlow;
  window.ClubCopy.initCoverFlow = boot;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
