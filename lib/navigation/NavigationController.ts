import type { Section } from '@/app/data/sections';
import { SECTION_BY_ID, SHOP_URL } from '@/app/data/sections';
import { MFOV_EXPLORE } from '@/lib/pano';
import { playSfx } from '@/lib/audio';
import {
  animateCamera,
  interruptCameraAnimation,
  yawDelta,
} from './AnimationManager';
import {
  frontLookTarget,
  resolveLookTarget,
  snapExploreFront,
  writeCamera,
} from './CameraController';
import { clearFocus, isFocusReady, setFocused } from './StateManager';
import type { Controls, NavFocusState, ViewportMetrics } from './types';
import { measureViewport } from './ViewportManager';

export type NavigationCallbacks = {
  onActiveChange: (id: string | null) => void;
  onFocusedChange: (id: string | null) => void;
  onCrtArm?: (armed: boolean) => void;
  onCrtSrcReset?: () => void;
  reduceMotion: boolean;
};

const FREE_FOCUS_ANGLE = 0.48; // ≈ 27°
const FREE_FOCUS_FOV_SLACK = 28;
const LOOKTO_DURATION = 1.55;
const RESTORE_FOV_DURATION = 1.1;

/**
 * High-level navigation — open / close / freeFocus / shop.
 * Owns focus state + camera lookto; never uses anchors or page scroll.
 */
export function createNavigationController(
  controls: Controls,
  navState: NavFocusState,
  cbs: NavigationCallbacks,
) {
  let openedAt = 0;
  let lookEnabled = false;

  const setLookEnabled = (v: boolean) => {
    lookEnabled = v;
  };

  const notifyCleared = () => {
    cbs.onActiveChange(null);
    cbs.onFocusedChange(null);
    cbs.onCrtArm?.(false);
    cbs.onCrtSrcReset?.();
  };

  const goShop = () => {
    interruptCameraAnimation(controls);
    playSfx('shop');
    clearFocus(navState);
    notifyCleared();
    window.location.assign(SHOP_URL);
  };

  const close = (opts?: { force?: boolean; silent?: boolean }) => {
    if (!navState.panelOpen && !navState.focusedId) return;
    if (!opts?.force && Date.now() - openedAt < 280) return;

    interruptCameraAnimation(controls);
    clearFocus(navState);
    notifyCleared();
    if (!opts?.silent) playSfx('click');

    const viewport = measureViewport();
    if (cbs.reduceMotion) {
      snapExploreFront(controls);
      return;
    }
    animateCamera(controls, frontLookTarget(viewport), {
      duration: LOOKTO_DURATION,
    });
  };

  const freeFocus = (opts?: { silent?: boolean }) => {
    if (!navState.focusedId && !navState.panelOpen) return;
    interruptCameraAnimation(controls);
    clearFocus(navState);
    notifyCleared();
    if (!opts?.silent) playSfx('click');

    if (cbs.reduceMotion) {
      controls.mfov = MFOV_EXPLORE;
      return;
    }
    animateCamera(
      controls,
      {
        yaw: controls.lookTarget.x,
        pitch: controls.lookTarget.y,
        mfov: MFOV_EXPLORE,
      },
      { duration: RESTORE_FOV_DURATION },
    );
  };

  const open = (id: string, viewport?: ViewportMetrics) => {
    // Gate on the shared controls flag the intro sets — avoids a stale
    // closed-over `lookEnabled` boolean after controller recreation.
    if (!controls.userControl && !lookEnabled) return;
    lookEnabled = true;
    const section = SECTION_BY_ID[id];
    if (!section) return;

    // Shop / cash-register → catalog (balmingtiger shopbag)
    if (id === 'cash-register') {
      goShop();
      return;
    }

    // Toggle off if same focused feature re-clicked via nav
    if (navState.focusedId === id && navState.activeId === id) {
      close({ force: true });
      return;
    }

    openedAt = Date.now();
    cbs.onCrtArm?.(false);
    if (id !== 'crt-tv') cbs.onCrtSrcReset?.();

    const vp = viewport ?? measureViewport();
    const target = resolveLookTarget(section, vp);

    setFocused(navState, id, {
      panel: true,
      readyDelayMs: cbs.reduceMotion ? 0 : 1600,
    });
    cbs.onActiveChange(id);
    cbs.onFocusedChange(id);
    playSfx(section.sfx || 'focus');

    // Keep follow-mouse lean off while focused so glow stays framed.
    controls.followFactor = 0;

    if (cbs.reduceMotion) {
      interruptCameraAnimation(controls);
      writeCamera(controls, target);
      if (id === 'crt-tv') cbs.onCrtArm?.(true);
      return;
    }

    animateCamera(controls, target, {
      duration: LOOKTO_DURATION,
      onComplete: () => {
        if (id === 'crt-tv') cbs.onCrtArm?.(true);
      },
    });
  };

  /** Zoom / pan away while locked → free (rAF poll from Experience). */
  const tickFreeFocus = () => {
    if (!controls.userControl || controls.lookAnimating || !isFocusReady(navState)) return;
    const id = navState.focusedId;
    if (!id) return;
    const section = SECTION_BY_ID[id];
    if (!section) return;

    const target = resolveLookTarget(section, measureViewport());
    const ang = Math.hypot(
      yawDelta(controls.lookTarget.x, target.yaw),
      controls.lookTarget.y - target.pitch,
    );
    const zoomedOut = controls.mfov > target.mfov + FREE_FOCUS_FOV_SLACK;
    const pannedAway = ang > FREE_FOCUS_ANGLE;
    if (zoomedOut || pannedAway) {
      freeFocus({ silent: true });
    }
  };

  const interruptLook = () => {
    interruptCameraAnimation(controls);
    navState.focusReadyAt = 0;
  };

  return {
    open,
    close,
    freeFocus,
    goShop,
    tickFreeFocus,
    interruptLook,
    setLookEnabled,
    getSection: (id: string): Section | undefined => SECTION_BY_ID[id],
  };
}

export type NavigationController = ReturnType<typeof createNavigationController>;
