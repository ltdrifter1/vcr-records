/* Club Copy — shared chrome (nav, drawer, reveals) */
(function () {
  var nav = document.getElementById('nav');
  var ham = document.getElementById('navHam');
  var drawer = document.getElementById('navDrawer');
  var scrim = document.getElementById('navScrim');

  function ensureScrim() {
    if (scrim) return scrim;
    scrim = document.createElement('div');
    scrim.id = 'navScrim';
    scrim.className = 'nav-scrim';
    scrim.setAttribute('aria-hidden', 'true');
    document.body.appendChild(scrim);
    scrim.addEventListener('click', closeDrawer);
    return scrim;
  }

  function openDrawer() {
    if (!drawer || !ham) return;
    ensureScrim();
    drawer.classList.add('on');
    ham.classList.add('on');
    if (scrim) scrim.classList.add('on');
    ham.setAttribute('aria-expanded', 'true');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.classList.add('nav-open');
  }

  function closeDrawer() {
    if (!drawer || !ham) return;
    drawer.classList.remove('on');
    ham.classList.remove('on');
    if (scrim) scrim.classList.remove('on');
    ham.setAttribute('aria-expanded', 'false');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('nav-open');
  }

  function toggleDrawer() {
    if (drawer && drawer.classList.contains('on')) closeDrawer();
    else openDrawer();
  }

  if (ham && drawer) {
    ensureScrim();
    ham.addEventListener('click', toggleDrawer);
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeDrawer);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeDrawer();
    });
  }

  if (nav) {
    var ticking = false;
    function syncNav() {
      nav.classList.toggle('scrolled', window.scrollY > 24);
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(syncNav);
    }, { passive: true });
    syncNav();
  }

  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.rv').forEach(function (el) { obs.observe(el); });
  } else {
    document.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
  }

  /* Homepage news rail — wheel + drag scroll on the picture row */
  document.querySelectorAll('.news-rail').forEach(function (rail) {
    rail.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      if (rail.scrollWidth <= rail.clientWidth + 1) return;
      var max = rail.scrollWidth - rail.clientWidth;
      var next = Math.min(max, Math.max(0, rail.scrollLeft + e.deltaY));
      if (next === rail.scrollLeft) return;
      e.preventDefault();
      rail.scrollLeft = next;
    }, { passive: false });

    var drag = null;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      if (rail.scrollWidth <= rail.clientWidth + 1) return;
      drag = {
        id: e.pointerId,
        x: e.clientX,
        left: rail.scrollLeft,
        moved: false
      };
      rail.setPointerCapture(e.pointerId);
    });
    rail.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 6) return;
      if (!drag.moved) {
        drag.moved = true;
        rail.classList.add('is-dragging');
      }
      rail.scrollLeft = drag.left - dx;
    });
    function endDrag(e) {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      var moved = drag.moved;
      drag = null;
      rail.classList.remove('is-dragging');
      if (moved) {
        // Swallow the click that would fire after a drag
        var block = function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          rail.removeEventListener('click', block, true);
        };
        rail.addEventListener('click', block, true);
      }
    }
    rail.addEventListener('pointerup', endDrag);
    rail.addEventListener('pointercancel', endDrag);
  });

  window.ClubCopy = window.ClubCopy || {};
  window.ClubCopy.closeDrawer = closeDrawer;
  window.ClubCopy.openDrawer = openDrawer;
})();
