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
    var note = rel.genre || '';
    var isPreorder = String(rel.status || '').toLowerCase() === 'pre-order';
    var hasTracks = Array.isArray(rel.tracks) && rel.tracks.length > 0;
    var playBtn = hasTracks
      ? (
          '<button type="button" class="wall-play" data-play-release="' + esc(rel.id) + '" data-play-stage aria-label="Play ' + esc(rel.title) + '">' +
            '<svg class="wp-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            '<svg class="wp-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>' +
          '</button>' +
          '<div class="wall-eq" aria-hidden="true"><i></i><i></i><i></i></div>' +
          '<span class="wall-air status-chip status-chip--air" aria-hidden="true">On air</span>'
        )
      : '';
    var badge = isPreorder
      ? '<span class="wall-badge">Pre-Order</span>'
      : '';
    return (
      '<article class="wall-item rv" data-release="' + esc(rel.id) + '">' +
        '<div class="wall-art media-bezel fx-spec">' +
          '<a href="' + esc(href) + '" aria-label="' + esc(rel.title) + ' — view release">' +
            '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' 480w, ' + esc(full) + ' 1200w" sizes="(max-width:520px) 90vw, (max-width:980px) 45vw, 280px" alt="' + esc(rel.title) + ' — artwork" loading="lazy" width="1200" height="1200"/>' +
          '</a>' +
          badge +
          playBtn +
        '</div>' +
        '<div class="wall-meta">' +
          (rel.catalogue ? '<p class="wall-cat cat-display cat-display--sm">' + esc(rel.catalogue) + '</p>' : '') +
          '<p class="wall-artist">' + esc(rel.artist) + '</p>' +
          '<h3 class="wall-title"><a href="' + esc(href) + '">' + esc(rel.title) + '</a></h3>' +
          (note ? '<p class="wall-note broadcast-meta">' + esc(note) + '</p>' : '') +
        '</div>' +
      '</article>'
    );
  }

  function syncAir(detail) {
    var d = detail || {};
    var nowId = d.track ? d.track.releaseId : null;
    var nextId = d.nextTrack ? d.nextTrack.releaseId : null;
    var playing = !!d.playing;

    grid.querySelectorAll('.wall-item').forEach(function (item) {
      var id = item.getAttribute('data-release');
      var mine = nowId && id === nowId;
      var up = nextId && id === nextId && !mine;
      item.classList.toggle('is-now-playing', !!mine);
      item.classList.toggle('is-audible', !!(mine && playing));
      item.classList.toggle('is-up-next', !!up);
      var air = item.querySelector('.wall-air');
      if (air) {
        air.textContent = mine ? 'On air' : 'Standby';
        air.classList.toggle('status-chip--air', !!mine);
        air.classList.toggle('status-chip--standby', !!up && !mine);
        air.hidden = !(mine || up);
      }
      var btn = item.querySelector('.wall-play');
      if (btn) {
        var name = item.querySelector('.wall-title');
        var releaseName = name ? name.textContent.trim() : 'release';
        btn.setAttribute('aria-label', (mine && playing ? 'Pause ' : 'Play ') + releaseName);
      }
    });
  }

  window.addEventListener('vcr:player', function (e) {
    syncAir(e.detail);
  });

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
      grid.removeAttribute('aria-busy');

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

      if (window.VCRPlayer && typeof VCRPlayer.getState === 'function') {
        syncAir(VCRPlayer.getState());
      }
    })
    .catch(function () {
      grid.removeAttribute('aria-busy');
      grid.innerHTML = '<p style="color:var(--muted)">Could not load releases. <a href="library.html">Open Library</a></p>';
    });
})();
