/* Club Copy — render library from data/catalog.json */
(function () {
  var list = document.getElementById('catList');
  if (!list) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatMeta(rel) {
    var bits = [rel.kind || 'Release'];
    var formats = [];
    if (rel.formats && rel.formats.vinyl) formats.push('Vinyl');
    if (rel.formats && rel.formats.digital) formats.push('digital');
    if (formats.length) bits.push(formats.join(' &amp; '));
    if (rel.tracksCount) bits.push(rel.tracksCount + (rel.tracksCount === 1 ? ' track' : ' tracks'));
    return bits.join(' · ');
  }

  function mobileMeta(rel) {
    return [rel.kind || 'Release', (rel.tracksCount || 0) + (rel.tracksCount === 1 ? ' track' : ' tracks'), rel.year]
      .filter(Boolean)
      .join(' · ');
  }

  function coverSrc(rel) {
    return rel.coverThumb || rel.cover || '';
  }

  function row(rel) {
    var thumb = coverSrc(rel);
    var full = rel.cover || thumb;
    var href = rel.page || '#';
    var alt = esc(rel.title + ' — ' + rel.artist);
    return (
      '<a class="cat-row rv" href="' + esc(href) + '">' +
        '<div class="cat-cover"><img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' 480w, ' + esc(full) + ' 1200w" sizes="88px" alt="' + alt + '" width="1200" height="1200" loading="lazy"/></div>' +
        '<span class="cat-no">' + esc(rel.catalogue || '') + '</span>' +
        '<span>' +
          '<span class="cat-title">' + esc(rel.title) + '</span>' +
          '<span class="cat-artist">' + esc(rel.artist) + '</span>' +
          '<span class="cat-mobile-meta">' + esc(mobileMeta(rel)) + '</span>' +
        '</span>' +
        '<span class="cat-meta">' + formatMeta(rel) + '</span>' +
        '<span class="cat-year">' + esc(rel.year || '') + '</span>' +
        '<span class="cat-avail">' + esc(rel.status || 'Available') + '</span>' +
      '</a>'
    );
  }

  fetch('/data/catalog.json')
    .then(function (r) {
      if (!r.ok) throw new Error('catalog');
      return r.json();
    })
    .then(function (data) {
      var releases = (data.releases || []).slice().sort(function (a, b) {
        return String(b.catalogue || '').localeCompare(String(a.catalogue || ''));
      });
      if (!releases.length) {
        list.innerHTML = '<p class="page-lead">No releases yet.</p>';
        return;
      }
      list.innerHTML = releases.map(row).join('');
      if (window.ClubCopy && typeof window.ClubCopy.observeReveals === 'function') {
        window.ClubCopy.observeReveals(list);
      } else if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add('in');
              obs.unobserve(e.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        list.querySelectorAll('.rv').forEach(function (el) { obs.observe(el); });
      } else {
        list.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
      }
    })
    .catch(function () {
      list.innerHTML = '<p class="page-lead">Could not load the library. <a href="merch.html">Shop vinyl</a></p>';
    });
})();
