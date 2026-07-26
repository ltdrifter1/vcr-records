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

const T = {
  atHome: '/panel-thumbs/at-home.webp',
  inletKnight: '/panel-thumbs/inlet-knight.webp',
  summer: '/panel-thumbs/summer.webp',
  lions: '/panel-thumbs/lions.webp',
  rack: '/panel-thumbs/rack.webp',
  testpress: '/panel-thumbs/testpress.webp',
  classic: '/panel-thumbs/classic.webp',
  poetry: '/panel-thumbs/poetry.webp',
  future: '/panel-thumbs/future.webp',
  ltd: '/panel-thumbs/ltd.webp',
  vcr: '/panel-thumbs/vcr.webp',
  logo: '/panel-thumbs/logo.webp',
  email: '/panel-thumbs/email.webp',
  info: '/panel-thumbs/info.webp',
  ig: '/panel-thumbs/ig.webp',
  charlie: '/panel-thumbs/charlie.webp',
  yt: '/panel-thumbs/yt.webp',
  shop: '/panel-thumbs/shop.webp',
  about: '/panel-thumbs/about.webp',
  bc: '/panel-thumbs/bc.webp',
  cover1: '/panel-thumbs/cover1.webp',
  cover2: '/panel-thumbs/cover2.webp',
} as const;

export type Section = {
  /** stable id / route slug */
  id: string;
  /** the object in the scene that holds this hotspot */
  object: string;
  /** the destination the hotspot maps to */
  nav: string;
  /** short label shown on hover */
  hint: string;
  /** panel heading */
  title: string;
  /** panel sub heading */
  kicker: string;
  /** intro copy, written to feel like stepping into a hidden room */
  intro: string;
  /** accent colour used across the hotspot + panel */
  accent: string;
  /**
   * Normalised hotspot position on the equirectangular store
   * (public/textures/store_pano_v3.webp, 2048×1024).
   * u: around full 360° yaw after BackSide U-flip (1 − texture_u) · v: top→bottom
   */
  u: number;
  v: number;
  /** Optional lookto aim point (defaults to hotspot u/v). */
  lookU?: number;
  lookV?: number;
  /** hotspot footprint in world units on the sphere wall */
  w: number;
  h: number;
  /**
   * MFOV used by lookto when focusing this feature
   * (Music ~95 room view; Videos framed mid — not watch punch-in).
   */
  lookFov: number;
  /** Object SFX key played on focus (see lib/audio.ts). */
  sfx: string;
  /**
   * When false, glow is hover-only (no focusedId latch). CRT / shop use this.
   * Default true — glow stays while the section is focused (lookto/panel).
   */
  glowLatches?: boolean;
  /** Flip glow map on X (plane UV vs BackSide wall parity). */
  glowFlipX?: boolean;
  /**
   * balmingtiger-style outer-edge glow: loads `*_edge.webp` silhouette rim
   * (not a filled glow slab). When false, falls back to `*_glow.webp`.
   */
  goldEdge?: boolean;
  /** Hide proximity / hover Html label over the hotspot glow. */
  hideHint?: boolean;
  /** list rendered inside the panel */
  items: SectionItem[];
};

const BANDCAMP = 'https://vcrrecordings.bandcamp.com';
const INSTAGRAM = 'https://www.instagram.com/vcr_recordings';
const CONTACT_EMAIL = 'mailto:charlie@vcrrecords.com';
/** Short booth previews under /public/audio/previews. */
const PREVIEW = {
  atHome: '/audio/previews/at-home.mp3',
  summer: '/audio/previews/summer.mp3',
  lions: '/audio/previews/lions-gate.mp3',
  rack: '/audio/previews/rack-em.mp3',
} as const;

/** Stripe + Bandcamp buy destinations (checkout only — browse stays in-room). */
const BUY = {
  atHomeDigital: 'https://buy.stripe.com/cNidRa6DB7o463KdshfrW0r',
  summerDigital: 'https://buy.stripe.com/00w14o5zxdMs2Ry73TfrW0s',
  lionsDigital: 'https://buy.stripe.com/bJe7sM4vt9wc63K9c1frW0i',
  rackDigital: 'https://buy.stripe.com/bJe8wQd1ZbEk77O87XfrW0t',
  tee: 'https://buy.stripe.com/3cI00k6DB8s877O1JzfrW0o',
  hat: 'https://buy.stripe.com/6oU14o2nl23KgIoewlfrW0n',
  bikini: 'https://buy.stripe.com/eVq7sMfa70ZG77O2NDfrW0m',
  inletBc: 'https://inletknight.bandcamp.com',
  ltdBc: 'https://ltdrifta.bandcamp.com',
  driftaBc: 'https://drifta.bandcamp.com',
  rackBc: 'https://ltdrifta.bandcamp.com/album/rack-em',
} as const;

/**
 * Discoverable hotspots around the 360° store.
 * Click-and-drag to look, then click a feature to open its room.
 * Append ?debug=1 to tint hit areas while tuning (u,v).
 */
export const SECTIONS: Section[] = [
  {
    id: 'listening-booth',
    object: 'Listening Booth',
    nav: 'Music',
    hint: '',
    title: '',
    kicker: 'Music',
    intro: '',
    accent: '#ffb347',
    // v5 pano: curtained LISTEN booth doorway (file x 295–455 of 1536).
    u: 0.756,
    v: 0.474,
    lookU: 0.756,
    lookV: 0.47,
    w: 32.2,
    h: 48.9,
    lookFov: 88,
    sfx: 'music',
    goldEdge: true,
    hideHint: true,
    // Coming soon — no release rows / no glow labels.
    items: [],
  },
  {
    id: 'crt-tv',
    object: 'CRT Television',
    nav: 'Videos',
    hint: '',
    title: 'The CRT',
    kicker: 'Videos',
    intro: '',
    accent: '#7ad7ff',
    // v5 pano: gray CRT on the wooden cabinet (file x 112–246 of 1536).
    u: 0.884,
    v: 0.487,
    // Frame the set in the room — not watch-mode punch-in (was fov 22 / too close).
    lookU: 0.884,
    lookV: 0.487,
    w: 26.7,
    h: 19.8,
    lookFov: 52,
    sfx: 'video',
    // Coming soon: keep warm gold aura latched while focused (no watch overlay).
    glowLatches: true,
    goldEdge: true,
    hideHint: true,
    // Channels cleared — blank tube + panel copy only.
    items: [],
  },
  {
    id: 'record-bins',
    object: 'Record Bins',
    nav: 'Artists',
    hint: '',
    title: '',
    kicker: 'Artists',
    intro: '',
    accent: '#ff7a9c',
    // v5 pano: central record-bin island (file x 725–855 of 1536).
    u: 0.486,
    v: 0.564,
    // Zoomed out over the whole bins aisle
    lookU: 0.5,
    lookV: 0.53,
    w: 25.9,
    h: 23,
    lookFov: 105,
    sfx: 'artists',
    goldEdge: true,
    hideHint: true,
    items: [
      {
        label: 'Inlet Knight',
        meta: 'At Home',
        detail: 'Bandcamp',
        cta: 'Listen',
        thumb: 'IK',
        thumbSrc: T.inletKnight,
        href: 'https://inletknight.bandcamp.com',
      },
    ],
  },
  {
    id: 'cash-register',
    object: 'Cash Register',
    nav: 'Shop',
    hint: '',
    title: '',
    kicker: 'Shop',
    intro: '',
    accent: '#9dff8a',
    // v5 pano: register on the purple VCR RECORD SHOP counter (file x 958–1085).
    // Spherical u = 1 − file_u after BackSide flip.
    u: 0.335,
    v: 0.503,
    lookU: 0.31,
    lookV: 0.53,
    w: 25.3,
    h: 15.6,
    lookFov: 70,
    sfx: 'shop',
    goldEdge: true,
    hideHint: true,
    items: [
      {
        label: 'Inlet Knight',
        meta: 'At Home',
        detail: 'From $3',
        cta: 'Open',
        thumb: 'IK',
        thumbSrc: T.inletKnight,
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
    ],
  },
  {
    id: 'phone-booth',
    object: 'Rotary Phone',
    nav: 'Contact',
    hint: '',
    title: '',
    kicker: 'Contact',
    intro: '',
    accent: '#e8c07a',
    // v5 pano: black rotary phone on the counter (file x 1108–1222 of 1536).
    u: 0.242,
    v: 0.524,
    lookU: 0.25,
    lookV: 0.51,
    w: 22.6,
    h: 11.4,
    lookFov: 55,
    sfx: 'phone',
    goldEdge: true,
    hideHint: true,
    items: [
      {
        label: 'Charlie',
        meta: 'charlie@vcrrecords.com',
        detail: 'Email',
        cta: 'Email',
        thumb: 'CH',
        thumbSrc: T.charlie,
        href: CONTACT_EMAIL,
      },
      {
        label: '@vcr_recordings',
        meta: 'Instagram',
        detail: 'Follow',
        cta: 'Follow',
        thumb: '@',
        thumbSrc: T.ig,
        href: INSTAGRAM,
      },
    ],
  },
];

export const SECTION_BY_ID = Object.fromEntries(
  SECTIONS.map((s) => [s.id, s]),
) as Record<string, Section>;

/**
 * Legacy static catalog — kept for deep links / SEO, but Shop nav stays in-room.
 */
export const SHOP_URL = '/shop/index.html';

/** Primary conveyor nav order. */
export const NAV_ORDER = [
  'listening-booth',
  'crt-tv',
  'record-bins',
  'cash-register',
  'phone-booth',
] as const;

/**
 * URL hash slugs ↔ section ids (shareable deep links).
 * Example: https://vcrrecords.com/#shop
 */
export const HASH_BY_SECTION_ID: Record<string, string> = {
  'listening-booth': 'music',
  'crt-tv': 'videos',
  'record-bins': 'artists',
  'cash-register': 'shop',
  'phone-booth': 'contact',
};

export const SECTION_ID_BY_HASH: Record<string, string> = Object.fromEntries(
  Object.entries(HASH_BY_SECTION_ID).map(([id, hash]) => [hash, id]),
);
