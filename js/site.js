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

  window.ClubCopy = window.ClubCopy || {};
  window.ClubCopy.closeDrawer = closeDrawer;
  window.ClubCopy.openDrawer = openDrawer;
})();
