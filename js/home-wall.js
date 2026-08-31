/* Club Copy — homepage Releases wall from catalog.json */
(function () {
  var grid = document.getElementById('wallGrid');
  if (!grid) return;

  /* Even rack under the hero — current album + support releases */
  var HOME_SPINE = ['any-jungle', 'bridget-in-my-room', 'ep-6', 'need-you'];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatRackMeta(rel) {
    var bits = [];
    if (rel.catalogue) bits.push(rel.catalogue);
    if (rel.kind) bits.push(rel.kind);
    if (rel.year) bits.push(String(rel.year));
    if (String(rel.status || '').toLowerCase() === 'pre-order') bits.push('Pre-Order');
    return bits.join(' · ');
  }

  function card(rel, i) {
    var thumb = rel.coverThumb || rel.cover;
    var full = rel.cover || thumb;
    var href = rel.page || '#';
    var hasPreview = Array.isArray(rel.tracks) && rel.tracks.some(function (t) {
      return !!(t && t.preview);
    });
    var playBtn = hasPreview
      ? (
          '<button type="button" class="wall-play" data-play-release="' + esc(rel.id) + '" data-play-stage aria-label="Play ' + esc(rel.title) + '">' +
            '<svg class="wp-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' +
            '<svg class="wp-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.4v14H7zM13.6 5H17v14h-3.4z"/></svg>' +
          '</button>' +
          '<div class="wall-eq" aria-hidden="true"><i></i><i></i><i></i></div>' +
          '<span class="wall-air status-chip status-chip--air" aria-hidden="true">On air</span>'
        )
      : '';
    var meta = formatRackMeta(rel);
    var sizes = '(max-width:520px) 90vw, (max-width:980px) 45vw, 260px';
    return (
      '<article class="wall-item rv" data-release="' + esc(rel.id) + '">' +
        '<div class="wall-card">' +
          '<div class="wall-art media-bezel fx-spec">' +
            '<a href="' + esc(href) + '" aria-label="' + esc(rel.title) + ' — view release">' +
              '<img src="' + esc(thumb) + '" srcset="' + esc(thumb) + ' 480w, ' + esc(full) + ' 1200w" sizes="' + sizes + '" alt="' + esc(rel.title) + ' — artwork" loading="lazy" width="1200" height="1200"/>' +
            '</a>' +
            playBtn +
          '</div>' +
          '<div class="wall-meta">' +
            '<p class="wall-num">' + String(i + 1).padStart(2, '0') + '</p>' +
            (meta ? '<p class="wall-cat">' + esc(meta) + '</p>' : '') +
            '<h3 class="wall-title"><a href="' + esc(href) + '">' + esc(rel.title) + '</a></h3>' +
            (rel.artist ? '<p class="wall-artist">' + esc(rel.artist) + '</p>' : '') +
          '</div>' +
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

  function bindPlayButtons() {
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
  }

  function observeReveal() {
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
  }

  function pickSpine(releases) {
    var byId = {};
    (releases || []).forEach(function (rel) {
      if (rel && rel.id) byId[rel.id] = rel;
    });
    var picked = [];
    HOME_SPINE.forEach(function (id) {
      if (byId[id]) picked.push(byId[id]);
    });
    if (picked.length) return picked;
    return (releases || []).slice(0, 4);
  }

  fetch('/data/catalog.json')
    .then(function (r) {
      if (!r.ok) throw new Error('catalog');
      return r.json();
    })
    .then(function (data) {
      var releases = pickSpine(data.releases || []);
      grid.innerHTML = releases.map(function (rel, i) { return card(rel, i); }).join('');
      grid.removeAttribute('aria-busy');
      bindPlayButtons();
      observeReveal();

      if (window.VCRPlayer && typeof VCRPlayer.getState === 'function') {
        syncAir(VCRPlayer.getState());
      }
    })
    .catch(function () {
      grid.removeAttribute('aria-busy');
      /* Keep statically embedded release cards for crawlability / offline. */
      if (grid.querySelector('.wall-item')) {
        bindPlayButtons();
        return;
      }
      grid.innerHTML = '<p style="color:var(--muted)">Could not load releases. <a href="/library">Open Library</a></p>';
    });
})();
