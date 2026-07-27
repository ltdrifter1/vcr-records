/**
 * ─────────────────────────────────────────────────────────────────────────
 *  VCR IN-ROOM CONTENT CATALOG — edit this file to change what the store
 *  plays and sells. No other file needs touching for content updates.
 *
 *  · MUSIC_RELEASES → rows in the Music (listening booth) panel.
 *      Each row opens a detail view with a Play-preview button, track list,
 *      and LISTEN ON pills. Drop new preview MP3s in /public/audio/previews
 *      and cover art in /public/panel-thumbs.
 *  · CRT_CHANNELS   → rows in the Videos panel. `videoSrc` plays the file
 *      on the in-room CRT (put MP4s in /public/videos); rows with only
 *      `href` open in a new tab.
 *  · SHOP_ITEMS     → rows in the Shop (New Releases) panel.
 * ─────────────────────────────────────────────────────────────────────────
 */

export type ListenLink = {
  label: string;
  href: string;
};

export type TrackItem = {
  title: string;
  duration?: string;
};

export type SectionItem = {
  label: string;
  meta?: string;
  detail?: string;
  /** Short CTA label (e.g. PLAY, BUY, EMAIL). */
  cta?: string;
  /** Outbound / mailto / hash link for the CTA. */
  href?: string;
  /** Accent letter / glyph fallback when no thumbSrc. */
  thumb?: string;
  /** Real cover / flyer art under /public/panel-thumbs. */
  thumbSrc?: string;
  /**
   * Local video URL played on the in-room CRT (Videos section).
   * When set, primary row click stays in the room instead of window.open.
   */
  videoSrc?: string;
  /**
   * Short in-room audio preview (Listening Booth / Shop).
   * Plays through the shared preview bus; ducks BGM.
   */
  previewSrc?: string;
  /** Music / Shop nest — track list shown in level-2 detail. */
  tracks?: TrackItem[];
  /** Music / Shop nest — streaming + buy pills. */
  listenOn?: ListenLink[];
  /**
   * In-panel prose for nested detail (stays in-room — no /shop eject).
   */
  body?: string;
};

/** Cover art / thumbs under /public/panel-thumbs. */
export const ART = {
  atHome: '/panel-thumbs/at-home.webp',
  inletKnight: '/panel-thumbs/inlet-knight.webp',
  inletKnightTall: '/panel-thumbs/inlet-knight-tall.webp',
  summer: '/panel-thumbs/summer.webp',
  lions: '/panel-thumbs/lions.webp',
  rack: '/panel-thumbs/rack.webp',
  vcr: '/panel-thumbs/vcr.webp',
  charlie: '/panel-thumbs/charlie.webp',
  ig: '/panel-thumbs/ig.webp',
  yt: '/panel-thumbs/yt.webp',
} as const;

/** Booth previews under /public/audio/previews. */
export const PREVIEW = {
  atHome: '/audio/previews/at-home.mp3',
  summer: '/audio/previews/summer.mp3',
  lions: '/audio/previews/lions-gate.mp3',
  rack: '/audio/previews/rack-em.mp3',
} as const;

/** Stripe + Bandcamp buy destinations (checkout only — browse stays in-room). */
export const BUY = {
  atHomeDigital: 'https://buy.stripe.com/cNidRa6DB7o463KdshfrW0r',
  summerDigital: 'https://buy.stripe.com/00w14o5zxdMs2Ry73TfrW0s',
  lionsDigital: 'https://buy.stripe.com/bJe7sM4vt9wc63K9c1frW0i',
  rackDigital: 'https://buy.stripe.com/bJe8wQd1ZbEk77O87XfrW0t',
  tee: 'https://buy.stripe.com/3cI00k6DB8s877O1JzfrW0o',
  hat: 'https://buy.stripe.com/6oU14o2nl23KgIoewlfrW0n',
  bikini: 'https://buy.stripe.com/eVq7sMfa70ZG77O2NDfrW0m',
  inletBc: 'https://inletknight.bandcamp.com',
  inletKnightAlbum: 'https://inletknight.bandcamp.com/album/inlet-knight',
  ltdBc: 'https://ltdrifta.bandcamp.com',
  driftaBc: 'https://drifta.bandcamp.com',
  rackBc: 'https://ltdrifta.bandcamp.com/album/rack-em',
} as const;

/* ── MUSIC — listening booth releases ──────────────────────────────────── */

export const MUSIC_RELEASES: SectionItem[] = [
  {
    label: 'At Home',
    meta: 'Inlet Knight',
    detail: 'Digital + cassette',
    cta: 'Play',
    thumbSrc: ART.atHome,
    previewSrc: PREVIEW.atHome,
    tracks: [
      { title: 'Booth preview', duration: '' },
      { title: 'Digital download + limited cassette (VCR026D8)', duration: '' },
    ],
    listenOn: [
      { label: 'Bandcamp', href: BUY.inletBc },
      { label: 'Buy Digital', href: BUY.atHomeDigital },
    ],
  },
  {
    label: 'Summer Madness',
    meta: 'LT Drifta',
    detail: '11 tracks',
    cta: 'Play',
    thumbSrc: ART.summer,
    previewSrc: PREVIEW.summer,
    tracks: [
      { title: 'Booth preview', duration: '' },
      { title: '11 tracks · 34:57 · digital + limited cassette', duration: '' },
    ],
    listenOn: [
      { label: 'Bandcamp', href: BUY.ltdBc },
      { label: 'Buy Digital', href: BUY.summerDigital },
    ],
  },
  {
    label: "Lions' Gate",
    meta: 'Charlie Archer',
    detail: 'Digital single',
    cta: 'Play',
    thumbSrc: ART.lions,
    previewSrc: PREVIEW.lions,
    tracks: [{ title: 'Booth preview', duration: '' }],
    listenOn: [{ label: 'Buy Digital', href: BUY.lionsDigital }],
  },
  {
    label: "Rack'em",
    meta: 'LT Drifta',
    detail: '6 tracks · 29:29',
    cta: 'Play',
    thumbSrc: ART.rack,
    previewSrc: PREVIEW.rack,
    tracks: [
      { title: 'Booth preview', duration: '' },
      { title: '6 tracks · 29:29 · MP3, FLAC and more', duration: '' },
    ],
    listenOn: [
      { label: 'Bandcamp', href: BUY.rackBc },
      { label: 'Buy Digital', href: BUY.rackDigital },
    ],
  },
];

/* ── VIDEOS — CRT channels ─────────────────────────────────────────────── */

export const CRT_CHANNELS: SectionItem[] = [
  {
    label: 'VCR-TV',
    meta: 'Station loop',
    detail: 'Now playing in-store',
    cta: 'Watch',
    thumbSrc: ART.vcr,
    videoSrc: '/videos/crt_loop.mp4',
  },
  {
    label: 'Inlet Knight',
    meta: 'On YouTube',
    detail: 'Music video',
    cta: 'Open',
    thumbSrc: ART.yt,
    href: 'https://www.youtube.com/watch?v=AUAqGMaGjk4',
  },
];

/* ── SHOP — New Releases counter ───────────────────────────────────────── */

export const SHOP_ITEMS: SectionItem[] = [
  {
    label: 'Inlet Knight',
    meta: 'Self-titled album · 16 tracks',
    detail: '$9 CAD or more',
    cta: 'Open',
    thumb: 'IK',
    thumbSrc: ART.inletKnightTall,
    href: BUY.inletKnightAlbum,
    tracks: [
      { title: 'Revive Him', duration: '02:27' },
      { title: 'Whatever', duration: '03:27' },
      { title: 'Mad About You', duration: '03:58' },
      { title: 'All Falls Down', duration: '04:42' },
      { title: 'Les Miserables', duration: '02:16' },
      { title: 'Heartbreaker', duration: '03:52' },
      { title: "Movin'", duration: '03:26' },
      { title: 'Sunday Afternoon', duration: '02:55' },
      { title: 'Hard to Ignore', duration: '04:09' },
      { title: 'The Get Down', duration: '01:37' },
      { title: '3AM', duration: '02:59' },
      { title: 'Another Day', duration: '04:58' },
      { title: 'Is It Cool?', duration: '04:02' },
      { title: 'You Wanted Me', duration: '02:49' },
      { title: 'Next Year', duration: '04:07' },
      { title: 'Art of Losing', duration: '02:06' },
    ],
    listenOn: [
      { label: 'Listen on Bandcamp', href: BUY.inletKnightAlbum },
      { label: 'Buy album', href: BUY.inletKnightAlbum },
    ],
  },
  {
    label: 'Inlet Knight',
    meta: 'At Home',
    detail: 'From $3',
    cta: 'Open',
    thumb: 'IK',
    thumbSrc: ART.inletKnight,
    href: BUY.atHomeDigital,
    previewSrc: PREVIEW.atHome,
    tracks: [
      { title: 'Digital MP3 — $3 CAD', duration: '' },
      { title: 'Cassette available via Stripe', duration: '' },
    ],
    listenOn: [
      { label: 'Buy Digital', href: BUY.atHomeDigital },
      { label: 'Bandcamp', href: BUY.inletBc },
      { label: 'Preview', href: '#preview' },
    ],
  },
];
