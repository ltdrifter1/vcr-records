/**
 * ─────────────────────────────────────────────────────────────────────────
 *  VCR IN-ROOM CONTENT CATALOG — edit this file to change what the store
 *  plays and sells. No other file needs touching for content updates.
 *
 *  · MUSIC_RELEASES → shelf rows in the Music (listening booth) panel.
 *      Each row opens a nest with transport, track list, and LISTEN ON pills.
 *      Use `body` for the short shelf blurb. Drop preview MP3s in
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
    detail: '3 tracks · digital + cassette',
    cta: 'Listen',
    thumbSrc: ART.atHome,
    previewSrc: PREVIEW.atHome,
    body: 'Soft late-night songs from Cumberland — headphones first.',
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
    detail: '11 tracks · 34:57',
    cta: 'Listen',
    thumbSrc: ART.summer,
    previewSrc: PREVIEW.summer,
    body: 'Heat-haze edits and long fades — the booth’s deep cut.',
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
    detail: 'Digital single',
    cta: 'Listen',
    thumbSrc: ART.lions,
    previewSrc: PREVIEW.lions,
    body: 'A short gate into the room — one take, full presence.',
    tracks: [{ title: "Lions' Gate", duration: '0:35' }],
    listenOn: [{ label: 'Buy Digital', href: BUY.lionsDigital }],
  },
  {
    label: "Rack'em",
    meta: 'LT Drifta',
    detail: '6 tracks · 29:29',
    cta: 'Listen',
    thumbSrc: ART.rack,
    previewSrc: PREVIEW.rack,
    body: 'Low-end swing for the counter — keep the needle down.',
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
    meta: 'Station ID',
    detail: 'House loop',
    cta: 'Tune',
    thumbSrc: ART.vcr,
    videoSrc: VIDEO.station,
    body: 'The in-store station — logo glitch on the tube.',
  },
  {
    label: 'At Home',
    meta: 'Inlet Knight',
    detail: 'Release loop',
    cta: 'Tune',
    thumbSrc: ART.atHome,
    videoSrc: VIDEO.atHome,
    body: 'Late-night sleeve art cycling on the glass.',
  },
  {
    label: "Lions' Gate",
    meta: 'Charlie Archer',
    detail: 'Release loop',
    cta: 'Tune',
    thumbSrc: ART.lions,
    videoSrc: VIDEO.lions,
    body: 'A short gate — keep the CRT warm.',
  },
  {
    label: 'Classic',
    meta: 'VCR Recordings',
    detail: 'Archive loop',
    cta: 'Tune',
    thumbSrc: ART.classic,
    videoSrc: VIDEO.classic,
    body: 'Deep catalog static — vinyl-label haze.',
  },
  {
    label: 'Future',
    meta: 'VCR Recordings',
    detail: 'Archive loop',
    cta: 'Tune',
    thumbSrc: ART.future,
    videoSrc: VIDEO.future,
    body: 'What’s next on the shelf, broadcast soft.',
  },
  {
    label: 'Inlet Knight',
    meta: 'On YouTube',
    detail: 'Music video',
    cta: 'Open',
    thumbSrc: ART.yt,
    href: 'https://www.youtube.com/watch?v=AUAqGMaGjk4',
    body: 'Step out for the full clip — then come back to the room.',
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
  {
    label: 'Charlie Archer',
    meta: 'Cumberland, BC',
    detail: 'Producer',
    cta: 'Buy',
    thumb: 'CA',
    thumbSrc: ART.charlie,
    href: BUY.lionsDigital,
  },
  {
    label: 'L.T. Drifta',
    meta: 'Vancouver Island',
    detail: 'Artist',
    cta: 'Listen',
    thumb: 'LT',
    thumbSrc: ART.ltd,
    href: BUY.ltdBc,
  },
];

/* ── SHOP — New Releases counter ───────────────────────────────────────── */

export const SHOP_ITEMS: SectionItem[] = [
  {
    label: 'Inlet Knight',
    meta: 'Self-titled album',
    detail: '16 tracks · from $9 CAD',
    cta: 'Open',
    thumb: 'IK',
    thumbSrc: ART.inletKnightTall,
    href: BUY.inletKnightAlbum,
    body: 'The full Island record — sixteen cuts for the long listen.',
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
    label: 'At Home',
    meta: 'Inlet Knight',
    detail: 'From $3 · digital + cassette',
    cta: 'Open',
    thumb: 'IK',
    thumbSrc: ART.inletKnight,
    href: BUY.atHomeDigital,
    previewSrc: PREVIEW.atHome,
    body: 'Three songs you can take home — preview in the booth, buy at the counter.',
    tracks: [
      { title: 'After All', duration: '2:22' },
      { title: 'Will I See You Again?', duration: '3:58' },
      { title: 'At Home', duration: '3:44' },
    ],
    listenOn: [
      { label: 'Buy Digital', href: BUY.atHomeDigital },
      { label: 'Bandcamp', href: BUY.inletBc },
    ],
  },
];
