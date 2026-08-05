/* Club Copy — homepage Releases wall from catalog.json */
(function () {
  var grid = document.getElementById('wallGrid');
  if (!grid) return;

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function card(rel) {
    var thumb = rel.coverThumb || rel.cover;
    var full = rel.cover || thumb;
    var href = rel.page || '#';
    var note = rel.tracksCount === 1 ? 'Single' : (rel.tracksCount || 0) + ' tracks';
    return (
      '<article class="wall-item rv" data-release="' + esc(rel.id) + '">' +
        '<div class="wall-art">' +
          '<a href="' + esc(href) + '" aria-label="' + esc(rel.title) + ' — view release">' +
            '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' 480w, ' + esc(full) + ' 1200w" sizes="(max-width:520px) 90vw, (max-width:980px) 45vw, 280px" alt="' + esc(rel.title) + ' — artwork" loading="lazy" width="1200" height="1200"/>' +
          '</a>' +
          '<button type="button" class="wall-play" data-play-release="' + esc(rel.id) + '" data-play-stage aria-label="Play ' + esc(rel.title) + '">' +
            '<svg class="wp-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            '<svg class="wp-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>' +
          '</button>' +
          '<div class="wall-eq" aria-hidden="true"><i></i><i></i><i></i></div>' +
        '</div>' +
        '<div class="wall-meta">' +
          '<p class="wall-artist">' + esc(rel.artist) + (rel.catalogue ? ' · ' + esc(rel.catalogue) : '') + '</p>' +
          '<h3 class="wall-title"><a href="' + esc(href) + '">' + esc(rel.title) + '</a></h3>' +
          '<p class="wall-note">' + esc(note) + '</p>' +
        '</div>' +
      '</article>'
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
      grid.innerHTML = releases.map(card).join('');

      grid.querySelectorAll('[data-play-release]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          if (!window.VCRPlayer) return;
          var id = el.getAttribute('data-play-release');
          var cur = VCRPlayer.current && VCRPlayer.current();
          if (cur && cur.releaseId === id) {
            if (!document.body.classList.contains('listening-room-live') &&
                document.querySelector('[data-listening-room]')) {
              VCRPlayer.openRoom({ scroll: true });
            } else {
              VCRPlayer.toggle();
            }
          } else {
            VCRPlayer.playRelease(id, null, { autoplay: true, stage: true });
          }
        });
      });

      if ('IntersectionObserver' in window) {
        var obs = new IntersectionObserver(function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) {
              en.target.classList.add('in');
              obs.unobserve(en.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        grid.querySelectorAll('.rv').forEach(function (el) { obs.observe(el); });
      } else {
        grid.querySelectorAll('.rv').forEach(function (el) { el.classList.add('in'); });
      }
    })
    .catch(function () {
      grid.innerHTML = '<p style="color:var(--muted)">Could not load releases. <a href="library.html">Open Library</a></p>';
    });
})();
