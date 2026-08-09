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
    var bits = [];
    if (rel.kind) bits.push(rel.kind);
    var formats = [];
    if (rel.formats && rel.formats.cassette) formats.push('Cassette');
    if (rel.formats && rel.formats.vinyl) formats.push('12″');
    if (rel.formats && rel.formats.digital) formats.push('Digital');
    if (formats.length) bits.push(formats.join(' · '));
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
    var hasTracks = Array.isArray(rel.tracks) && rel.tracks.length > 0;
    var playBtn = hasTracks
      ? (
          '<button type="button" class="cat-play" data-play-release="' + esc(rel.id) + '" aria-label="Play ' + esc(rel.title) + '">' +
            '<svg class="cp-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            '<svg class="cp-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>' +
          '</button>' +
          '<span class="cat-air status-chip status-chip--air" aria-hidden="true">On air</span>'
        )
      : '';
    return (
      '<div class="cat-row rv" data-release="' + esc(rel.id) + '">' +
        '<div class="cat-cover media-bezel fx-spec">' +
          '<a href="' + esc(href) + '" tabindex="-1" aria-hidden="true">' +
            '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' 480w, ' + esc(full) + ' 1200w" sizes="88px" alt="' + alt + '" width="1200" height="1200" loading="lazy"/>' +
          '</a>' +
          playBtn +
        '</div>' +
        '<span class="cat-no cat-display cat-display--md">' + esc(rel.catalogue || '') + '</span>' +
        '<span>' +
          '<a class="cat-title" href="' + esc(href) + '">' + esc(rel.title) + '</a>' +
          '<span class="cat-artist">' + esc(rel.artist) + '</span>' +
          '<span class="cat-mobile-meta broadcast-meta">' + esc(mobileMeta(rel)) + '</span>' +
        '</span>' +
        '<span class="cat-meta broadcast-meta">' + formatMeta(rel) + '</span>' +
        '<span class="cat-year broadcast-meta">' + esc(rel.year || '') + '</span>' +
        '<span class="cat-avail">' + esc(rel.status || 'Available') + '</span>' +
      '</div>'
    );
  }

  function syncAir(detail) {
    var d = detail || {};
    var nowId = d.track ? d.track.releaseId : null;
    var nextId = d.nextTrack ? d.nextTrack.releaseId : null;
    var playing = !!d.playing;
    list.querySelectorAll('.cat-row').forEach(function (rowEl) {
      var id = rowEl.getAttribute('data-release');
      var mine = nowId && id === nowId;
      var up = nextId && id === nextId && !mine;
      rowEl.classList.toggle('is-now-playing', !!mine);
      rowEl.classList.toggle('is-audible', !!(mine && playing));
      rowEl.classList.toggle('is-up-next', !!up);
      var air = rowEl.querySelector('.cat-air');
      if (air) {
        air.textContent = mine ? 'On air' : 'Standby';
        air.classList.toggle('status-chip--air', !!mine);
        air.classList.toggle('status-chip--standby', !!up && !mine);
      }
      var btn = rowEl.querySelector('.cat-play');
      if (btn) {
        var titleEl = rowEl.querySelector('.cat-title');
        var name = titleEl ? titleEl.textContent.trim() : 'release';
        btn.setAttribute('aria-label', (mine && playing ? 'Pause ' : 'Play ') + name);
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
      if (!releases.length) {
        list.innerHTML = '<p class="page-lead">No releases yet.</p>';
        return;
      }
      list.innerHTML = releases.map(row).join('');

      list.querySelectorAll('[data-play-release]').forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          e.stopPropagation();
          if (!window.VCRPlayer) return;
          var id = el.getAttribute('data-play-release');
          var cur = VCRPlayer.current && VCRPlayer.current();
          if (cur && cur.releaseId === id) {
            VCRPlayer.toggle();
          } else {
            VCRPlayer.playRelease(id, null, { autoplay: true });
          }
        });
      });

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

      if (window.VCRPlayer && typeof VCRPlayer.getState === 'function') {
        syncAir(VCRPlayer.getState());
      }
    })
    .catch(function () {
      list.innerHTML = '<p class="page-lead">Could not load the library. <a href="merch.html">Shop</a></p>';
    });
})();
