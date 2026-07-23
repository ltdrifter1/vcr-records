/**
 * Audio bus — BGM loop + object SFX + balmingtiger-style volume tweens.
 * HTMLAudioElement only (no AudioContext). Unlocks on CLICK TO ENTER.
 */
import gsap from 'gsap';

let bgm: HTMLAudioElement | null = null;
/** Start muted until CLICK TO ENTER (browser gesture), then live like BT. */
let muted = true;
let duckTween: gsap.core.Tween | null = null;
let lifecycleBound = false;
const volume = { bgm: 0.45, sfx: 0.55, target: 0.45 };
const listeners = new Set<(muted: boolean) => void>();
/** One reusable element per SFX key — avoids stacking / leaks. */
const sfxPool = new Map<string, HTMLAudioElement>();

const SFX: Record<string, string> = {
  click: '/audio/click.mp3',
  focus: '/audio/focus.mp3',
  music: '/audio/music.mp3',
  video: '/audio/video.mp3',
  phone: '/audio/phone.mp3',
  lights: '/audio/lights.mp3',
  shop: '/audio/shop.mp3',
  archive: '/audio/archive.mp3',
  artists: '/audio/artists.mp3',
  door: '/audio/door.mp3',
  // Unique diegetic toys (balmingtiger cushion / owl / fire / globe class)
  cushion: '/audio/cushion.mp3',
  crate: '/audio/crate.mp3',
  poster: '/audio/poster.mp3',
  stool: '/audio/stool.mp3',
  owl: '/audio/owl.mp3',
  fire: '/audio/fire.mp3',
  wonder: '/audio/wonder.mp3',
};

function ensureBgm() {
  if (bgm) return bgm;
  if (typeof window === 'undefined') return null;
  bgm = new Audio('/audio/bgm.mp3');
  bgm.loop = true;
  bgm.preload = 'auto';
  bgm.volume = muted ? 0 : volume.bgm;
  bindAudioLifecycle();
  return bgm;
}

function notify() {
  for (const fn of listeners) fn(muted);
}

/** Pause when the tab hides; resume BGM when visible again if unmuted. */
function bindAudioLifecycle() {
  if (lifecycleBound || typeof document === 'undefined') return;
  lifecycleBound = true;

  const onVisibility = () => {
    const a = bgm;
    if (!a) return;
    if (document.hidden) {
      a.pause();
      return;
    }
    if (!muted) {
      a.volume = volume.target;
      void a.play().catch(() => {
        /* user can retry via mute control */
      });
    }
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', () => {
    bgm?.pause();
  });
}

export function isMuted() {
  return muted;
}

/** Subscribe to mute bus changes (MuteControl sync). */
export function onMuteChange(fn: (muted: boolean) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/**
 * balmingtiger enter: unmute + start BGM on the same user gesture as CLICK TO ENTER.
 * On autoplay failure, leave the bus muted so the UI stays honest.
 */
export async function enterWithAudio() {
  ensureBgm();
  muted = false;
  notify();
  const a = bgm;
  if (!a) return false;
  duckTween?.kill();
  volume.target = volume.bgm;
  a.volume = volume.bgm;
  try {
    await a.play();
    return true;
  } catch {
    muted = true;
    a.volume = 0;
    a.pause();
    notify();
    return false;
  }
}

export async function setMuted(next: boolean) {
  muted = next;
  notify();
  const a = ensureBgm();
  if (!a) return;
  duckTween?.kill();
  if (muted) {
    a.volume = 0;
    a.pause();
    return;
  }
  volume.target = volume.bgm;
  a.volume = volume.bgm;
  try {
    await a.play();
  } catch {
    muted = true;
    a.volume = 0;
    notify();
  }
}

export function playSfx(name: keyof typeof SFX | string) {
  if (muted || typeof window === 'undefined') return;
  const src = SFX[name] ?? SFX.focus;
  let s = sfxPool.get(src);
  if (!s) {
    s = new Audio(src);
    s.preload = 'auto';
    sfxPool.set(src, s);
  }
  try {
    s.pause();
    s.currentTime = 0;
    s.volume = volume.sfx;
    void s.play().catch(() => {});
  } catch {
    /* ignore decode / play failures */
  }
}

/**
 * balmingtiger muteBGMVolume / unmuteBGMVolume — 0.6s power1.inOut tween.
 * ducked=true → near silence; false → restore target level.
 */
export function setBgmDucked(ducked: boolean, duration = 0.6) {
  const a = ensureBgm();
  if (!a || muted) return;
  duckTween?.kill();
  const to = ducked ? 0.02 : volume.bgm;
  volume.target = to;
  const proxy = { v: a.volume };
  duckTween = gsap.to(proxy, {
    v: to,
    duration,
    ease: 'power1.inOut',
    onUpdate: () => {
      if (!muted && a) a.volume = proxy.v;
    },
  });
}
