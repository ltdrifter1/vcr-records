/**
 * ─────────────────────────────────────────────────────────────────────────
 *  VCR IN-ROOM CONTENT CATALOG — edit this file to change what the store
 *  plays and sells. No other file needs touching for content updates.
 *
 *  · MUSIC_RELEASES → shelf rows in the Music (listening booth) panel.
 *      Each row opens a nest with transport, track list, and LISTEN ON pills.
 *      Level-1 shows album, artist, and track count. Drop preview MP3s in
 *      /public/audio/previews and cover art in /public/panel-thumbs.
 *  · CRT_CHANNELS   → channel-guide rows in the Videos panel. `videoSrc`
 *      plays on the in-room CRT; use `body` for the guide blurb. Rows with
 *      only `href` open outbound (e.g. YouTube).
 *  · ARTISTS        → roster rows in the Artists (record bins) panel.
 *  · SHOP_ITEMS     → shelf rows in the Shop (New Releases) panel.
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
   * In-panel prose — shelf blurb on Music/Shop level-1, and nest copy when set.
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
  ltd: '/panel-thumbs/ltd.webp',
  classic: '/panel-thumbs/classic.webp',
  future: '/panel-thumbs/future.webp',
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

/** Branded CRT loops under /public/videos (not SMPTE color bars). */
export const VIDEO = {
  station: '/videos/channel_b.mp4',
  atHome: '/videos/channel_athome.mp4',
  lions: '/videos/channel_lions.mp4',
  classic: '/videos/channel_classic.mp4',
  future: '/videos/channel_future.mp4',
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
    detail: '3 tracks',
    cta: 'Listen',
    thumbSrc: ART.atHome,
    previewSrc: PREVIEW.atHome,
    tracks: [
      { title: 'After All', duration: '2:22' },
      { title: 'Will I See You Again?', duration: '3:58' },
      { title: 'At Home', duration: '3:44' },
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
    cta: 'Listen',
    thumbSrc: ART.summer,
    previewSrc: PREVIEW.summer,
    tracks: [
      { title: 'Summer Madness', duration: '3:20' },
      { title: 'Too Far', duration: '2:55' },
      { title: 'Naima', duration: '7:54' },
      { title: 'Space and Time', duration: '2:07' },
      { title: 'Go!', duration: '3:37' },
      { title: 'Next Up', duration: '2:52' },
      { title: 'Colours of You', duration: '3:32' },
      { title: 'Nu Saigon', duration: '1:04' },
      { title: "You're My", duration: '2:51' },
      { title: 'So What', duration: '1:43' },
      { title: 'Mood Indigo', duration: '3:02' },
    ],
    listenOn: [
      { label: 'Bandcamp', href: BUY.ltdBc },
      { label: 'Buy Digital', href: BUY.summerDigital },
    ],
  },
  {
    label: "Lions' Gate",
    meta: 'Charlie Archer',
    detail: '1 track',
    cta: 'Listen',
    thumbSrc: ART.lions,
    previewSrc: PREVIEW.lions,
    tracks: [{ title: "Lions' Gate", duration: '0:35' }],
    listenOn: [{ label: 'Buy Digital', href: BUY.lionsDigital }],
  },
  {
    label: "Rack'em",
    meta: 'LT Drifta',
    detail: '6 tracks',
    cta: 'Listen',
    thumbSrc: ART.rack,
    previewSrc: PREVIEW.rack,
    tracks: [
      { title: "Rack'em", duration: '2:57' },
      { title: 'Since I Left You', duration: '6:45' },
      { title: 'Unlucky', duration: '3:19' },
      { title: 'Kiss of Life (Calm Acid Mix)', duration: '9:01' },
      { title: 'Hold On To It', duration: '3:30' },
      { title: 'Same Time', duration: '3:57' },
    ],
    listenOn: [
      { label: 'Bandcamp', href: BUY.rackBc },
      { label: 'Buy Digital', href: BUY.rackDigital },
    ],
  },
];

/* ── VIDEOS — CRT channels (branded station + release loops) ────────────── */

export const CRT_CHANNELS: SectionItem[] = [
  {
    label: 'VCR-TV',
    cta: 'Tune',
    thumbSrc: ART.vcr,
    videoSrc: VIDEO.station,
  },
];

/* ── ARTISTS — record-bin roster ───────────────────────────────────────── */

export const ARTISTS: SectionItem[] = [
  {
    label: 'Inlet Knight',
    meta: 'Cumberland, BC',
    detail: 'Artist · Producer',
    cta: 'Listen',
    thumb: 'IK',
    thumbSrc: ART.inletKnight,
    href: BUY.inletBc,
  },
];

/* ── SHOP — New Releases counter ───────────────────────────────────────── */

export const SHOP_ITEMS: SectionItem[] = [
  {
    label: 'Inlet Knight',
    meta: 'Inlet Knight',
    cta: 'Buy Now',
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
      { label: 'Listen', href: BUY.inletKnightAlbum },
      { label: 'Buy Now', href: BUY.inletKnightAlbum },
    ],
  },
  {
    label: 'At Home',
    meta: 'Inlet Knight',
    cta: 'Buy Now',
    thumb: 'IK',
    thumbSrc: ART.inletKnight,
    href: BUY.atHomeDigital,
    previewSrc: PREVIEW.atHome,
    tracks: [
      { title: 'After All', duration: '2:22' },
      { title: 'Will I See You Again?', duration: '3:58' },
      { title: 'At Home', duration: '3:44' },
    ],
    listenOn: [
      { label: 'Listen', href: BUY.inletBc },
      { label: 'Buy Now', href: BUY.atHomeDigital },
    ],
  },
];
