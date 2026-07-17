/* VCR release page — shared player, variants, cart */
(function () {
  'use strict';

  function money(n) {
    return '$' + Number(n).toFixed(2);
  }

  async function loadRelease(id) {
    const res = await fetch('data/releases.json', { cache: 'no-store' });
    const data = await res.json();
    return (data.releases || []).find((r) => r.id === id || r.slug === id);
  }

  function render(release) {
    const root = document.getElementById('releaseRoot');
    if (!root || !release) return;

    document.title = `${release.title} — ${release.artist} | VCR Recordings`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = `${release.title} by ${release.artist} — ${release.formats.join(' + ')}. VCR Recordings.`;

    const artistHref = release.artistId === 'lt-drifta' ? 'artist-lt-drifta.html' : 'artists.html';
    const variants = release.variants || [];
    const active = variants[0] || { id: 'digital', label: 'Digital', price: 0, note: '' };

    root.innerHTML = `
      <div class="crumbs">
        <a href="index.html">Home</a><span>/</span>
        <a href="index.html#releases">Releases</a><span>/</span>
        ${release.title}
      </div>

      <div class="release-layout" itemscope itemtype="https://schema.org/MusicAlbum">
        <meta itemprop="name" content="${release.title}"/>
        <div itemprop="byArtist" itemscope itemtype="https://schema.org/MusicGroup">
          <meta itemprop="name" content="${release.artist}"/>
        </div>

        <div class="release-art-col rv">
          <button type="button" class="release-art crt-frame" id="artZoom" aria-label="Zoom artwork">
            <img src="${release.artwork}" alt="${release.title} artwork" itemprop="image"/>
            <span class="release-badge">${release.formats.join(' + ')}</span>
          </button>
          <div class="release-player glass-panel">
            <div class="rp-head">
              <span class="eyebrow">Preview</span>
              <span id="rpTrack">${(release.tracks[0] && release.tracks[0].title) || release.title}</span>
            </div>
            <div class="rp-controls">
              <button type="button" class="rp-play" id="rpPlay" aria-label="Play preview">
                <svg class="i-play" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <svg class="i-pause" viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
              </button>
              <div class="rp-seek">
                <input type="range" id="rpSeek" min="0" max="100" value="0" step="0.1" aria-label="Seek"/>
                <div class="rp-times"><span id="rpEl">0:00</span><span id="rpRem">-0:00</span></div>
              </div>
            </div>
            <audio id="rpAudio" preload="metadata" src="${release.preview || ''}"></audio>
          </div>
        </div>

        <div class="release-info-col rv d1">
          <div class="release-block">
            <a class="release-artist" href="${artistHref}">${release.artist}</a>
            <h1 class="release-title">${release.title}</h1>
            <div class="release-meta-row">
              <div>
                <div class="release-price" id="priceDisplay">${money(active.price)}</div>
                <div class="release-price-note">USD · ${release.year}</div>
              </div>
              <div class="tag">In stock</div>
            </div>
            <div class="feat-tags" style="margin-top:14px">
              ${(release.tags || []).map((t) => `<span class="tag">${t}</span>`).join('')}
            </div>
          </div>

          <div class="release-block">
            <div class="opt-label">Format</div>
            <div class="merch-opts" id="variantOpts">
              ${variants.map((v, i) => `
                <button type="button" class="opt ${i === 0 ? 'selected' : ''}"
                  data-variant="${v.id}" data-price="${v.price}" data-label="${v.label}"
                  data-stripe="${v.stripe || ''}" data-note="${v.note || ''}"
                  aria-pressed="${i === 0 ? 'true' : 'false'}">${v.label} · ${money(v.price)}</button>
              `).join('')}
            </div>
            <div class="opt-label" style="margin-top:16px">Qty</div>
            <div class="qty-wrap">
              <button type="button" class="qty-btn" id="qtyMinus" aria-label="Decrease">−</button>
              <input class="qty-input" id="qtyInput" type="number" min="1" value="1" inputmode="numeric" aria-label="Quantity"/>
              <button type="button" class="qty-btn" id="qtyPlus" aria-label="Increase">+</button>
            </div>
            <div class="buy-stack" style="margin-top:18px">
              <button type="button" class="btn btn-primary btn-block" id="addCart">Add to cart — ${money(active.price)}</button>
              <a class="btn btn-ghost btn-block" href="${release.bandcamp}" target="_blank" rel="noopener">Bandcamp</a>
            </div>
            <p class="small-note" id="buyNote">${active.note || ''}</p>
          </div>

          <div class="release-block">
            <div class="tab-bar" role="tablist">
              <button class="tab-btn on" type="button" data-tab="tracks" aria-selected="true">Tracklist</button>
              <button class="tab-btn" type="button" data-tab="details" aria-selected="false">Details</button>
            </div>
            <div class="tab-panel on" id="tab-tracks">
              <div class="release-tracks">
                ${(release.tracks || []).map((t, i) => `
                  <div class="rtrack">
                    <span class="rtrack-n">${String(i + 1).padStart(2, '0')}</span>
                    <span class="rtrack-t">${t.title}</span>
                    <span class="rtrack-d">${t.duration || '—'}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="tab-panel" id="tab-details">
              <p class="bio-text" style="font-size:1rem">${release.details || ''}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="zoom" id="zoom" hidden>
        <button type="button" class="zoom-close" aria-label="Close">×</button>
        <img src="${release.artwork}" alt=""/>
      </div>
    `;

    wire(release, active);
  }

  function fmt(t) {
    if (!isFinite(t) || t < 0) return '0:00';
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return m + ':' + String(s).padStart(2, '0');
  }

  function wire(release, active) {
    let current = active;
    const audio = document.getElementById('rpAudio');
    const play = document.getElementById('rpPlay');
    const seek = document.getElementById('rpSeek');
    const el = document.getElementById('rpEl');
    const rem = document.getElementById('rpRem');
    const qty = document.getElementById('qtyInput');
    const priceEl = document.getElementById('priceDisplay');
    const addBtn = document.getElementById('addCart');
    const note = document.getElementById('buyNote');

    function syncBuy() {
      const q = Math.max(1, parseInt(qty.value || '1', 10));
      qty.value = String(q);
      priceEl.textContent = money(current.price);
      addBtn.textContent = `Add to cart — ${money(current.price * q)}`;
      note.textContent = current.note || '';
    }

    document.getElementById('variantOpts').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-variant]');
      if (!btn) return;
      document.querySelectorAll('#variantOpts .opt').forEach((b) => {
        b.classList.remove('selected');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('selected');
      btn.setAttribute('aria-pressed', 'true');
      current = {
        id: btn.dataset.variant,
        label: btn.dataset.label,
        price: parseFloat(btn.dataset.price),
        stripe: btn.dataset.stripe,
        note: btn.dataset.note,
      };
      syncBuy();
    });

    document.getElementById('qtyMinus').onclick = () => { qty.value = Math.max(1, (+qty.value || 1) - 1); syncBuy(); };
    document.getElementById('qtyPlus').onclick = () => { qty.value = (+qty.value || 1) + 1; syncBuy(); };
    qty.addEventListener('change', syncBuy);

    addBtn.addEventListener('click', () => {
      const q = Math.max(1, parseInt(qty.value || '1', 10));
      window.VCR.addToCart({
        id: `${release.id}-${current.id}`,
        title: `${release.artist} — ${release.title}`,
        price: current.price,
        color: current.label,
        size: null,
        image: release.artwork,
        stripe: current.stripe || null,
        qty: q,
      });
      addBtn.textContent = 'Added';
      setTimeout(syncBuy, 900);
    });

    play.addEventListener('click', () => {
      if (!audio.src) return;
      if (audio.paused) audio.play().catch(() => {});
      else audio.pause();
    });
    audio.addEventListener('play', () => play.classList.add('on'));
    audio.addEventListener('pause', () => play.classList.remove('on'));
    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return;
      seek.value = String((audio.currentTime / audio.duration) * 100);
      el.textContent = fmt(audio.currentTime);
      rem.textContent = '-' + fmt(audio.duration - audio.currentTime);
    });
    seek.addEventListener('input', () => {
      if (!audio.duration) return;
      audio.currentTime = (parseFloat(seek.value) / 100) * audio.duration;
    });

    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach((b) => {
          b.classList.remove('on');
          b.setAttribute('aria-selected', 'false');
        });
        document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('on'));
        btn.classList.add('on');
        btn.setAttribute('aria-selected', 'true');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('on');
      });
    });

    const zoom = document.getElementById('zoom');
    document.getElementById('artZoom').onclick = () => { zoom.hidden = false; };
    zoom.querySelector('.zoom-close').onclick = () => { zoom.hidden = true; };
    zoom.onclick = (e) => { if (e.target === zoom) zoom.hidden = true; };

    syncBuy();
    if (window.VCR && window.VCR.updateCartBadge) window.VCR.updateCartBadge();
    document.querySelectorAll('.rv').forEach((el) => el.classList.add('in'));
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const id = document.body.dataset.release;
    if (!id) return;
    try {
      const release = await loadRelease(id);
      if (!release) {
        document.getElementById('releaseRoot').innerHTML = '<p class="section-desc">Release not found.</p>';
        return;
      }
      render(release);
    } catch (err) {
      console.error(err);
      document.getElementById('releaseRoot').innerHTML = '<p class="section-desc">Unable to load release.</p>';
    }
  });
})();
