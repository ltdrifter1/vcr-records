/* Resolve release media URLs from data/media.json + release fields */
(function () {
  'use strict';

  let mediaConfig = null;

  async function loadMediaConfig() {
    if (mediaConfig) return mediaConfig;
    try {
      const res = await fetch('data/media.json', { cache: 'no-store' });
      mediaConfig = await res.json();
    } catch {
      mediaConfig = { baseUrl: '' };
    }
    return mediaConfig;
  }

  function joinUrl(base, ...parts) {
    const clean = parts
      .filter(Boolean)
      .map((p, i) => {
        const s = String(p).replace(/^\/+|\/+$/g, '');
        return s;
      })
      .filter(Boolean);
    if (!base) return clean.join('/');
    return String(base).replace(/\/+$/, '') + '/' + clean.join('/');
  }

  function isAbsolute(url) {
    return /^https?:\/\//i.test(url || '') || String(url || '').startsWith('//');
  }

  function folderFor(release, config) {
    if (release.mediaFolder) return release.mediaFolder;
    const tpl = (config && config.folderTemplate) || '{id}';
    return tpl.replace('{id}', release.id || '').replace('{slug}', (release.slug || '').replace(/\.html$/, ''));
  }

  /** Resolve a release-relative media path against baseUrl + mediaFolder */
  function resolveMedia(release, file, config) {
    if (!file) return '';
    if (isAbsolute(file)) return file;
    // Already a local site path (legacy mp3 in repo root / img)
    if (!config?.baseUrl && (file.includes('/') || /\.(mp3|wav|flac|zip|m4a)$/i.test(file))) {
      return file.replace(/^\//, '');
    }
    const base = (config && config.baseUrl) || '';
    if (!base) return file.replace(/^\//, '');
    return joinUrl(base, folderFor(release, config), file);
  }

  function previewUrl(release, config) {
    return resolveMedia(release, release.preview || release.download || '', config);
  }

  function downloadUrl(release, config) {
    const dl = release.download || '';
    // Without a public baseUrl, zip packs are not in the repo — use preview audio instead
    if (!config?.baseUrl && dl && /\.zip$/i.test(dl)) {
      return resolveMedia(release, release.preview || dl, config);
    }
    return resolveMedia(release, dl || release.preview || '', config);
  }

  function trackUrl(release, track, config) {
    const file = track && (track.file || track.src || track.preview);
    if (file) return resolveMedia(release, file, config);
    // fall back to album preview
    return previewUrl(release, config);
  }

  window.VCRMedia = {
    loadMediaConfig,
    resolveMedia,
    previewUrl,
    downloadUrl,
    trackUrl,
    folderFor,
    joinUrl,
  };
})();
