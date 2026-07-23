import gsap from 'gsap';
import type { Section } from '@/app/data/sections';
import { SECTION_BY_ID, SHOP_URL } from '@/app/data/sections';
import {
  FOLLOW_REENABLE_DELAY,
  FOLLOW_REENABLE_DUR,
  MFOV_EXPLORE,
} from '@/lib/pano';
import { playSfx } from '@/lib/audio';
import {
  animateCamera,
  interruptCameraAnimation,
} from './AnimationManager';
import {
  frontLookTarget,
  resolveLookTarget,
  writeCamera,
} from './CameraController';
import { clearFocus, setFocused } from './StateManager';
import type { Controls, NavFocusState, ViewportMetrics } from './types';
import { measureViewport } from './ViewportManager';

export type NavigationCallbacks = {
  onActiveChange: (id: string | null) => void;
  onFocusedChange: (id: string | null) => void;
  onCrtArm?: (armed: boolean) => void;
  onCrtSrcReset?: () => void;
  reduceMotion: boolean;
};

/** balmingtiger lookto(..., tween(easeinoutquart, 2), ...) */
const LOOKTO_DURATION = 2;
const REFRAME_DURATION = 0.45;

/**
 * High-level navigation — open / close / resetToFront / shop.
 * Owns focus state + camera lookto; never uses anchors or page scroll.
 *
 * Canvas model (BT parity):
 *   - open → lookto feature + open glass HUD (same continuous sphere)
 *   - soft close (BACK / Esc / nav toggle) → clear HUD only; camera stays
 *   - CRT drag-end → resetToFront (BT video Observer onDragEnd)
 *   - other sections stay focused while the user pans (one room, HUD open)
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

  /** Desktop follow-mouse lean — same timing as InteractionManager mouseup. */
  const scheduleFollowRestore = () => {
    if (cbs.reduceMotion) return;
    // Touch / coarse pointers never use follow lean.
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      return;
    }
    gsap.killTweensOf(controls, 'followFactor');
    gsap.delayedCall(FOLLOW_REENABLE_DELAY, () => {
      if (navState.focusedId || controls.lookAnimating || controls.dragging) return;
      gsap.to(controls, {
        followFactor: 1,
        duration: FOLLOW_REENABLE_DUR,
        ease: 'power1.out',
        overwrite: true,
      });
    });
  };

  /**
   * Shop / cash-register → catalog in a new tab (BT shopbag `window.open`).
   * Stays on the canvas; does not move the camera.
   */
  const goShop = () => {
    playSfx('shop');
    // Clear video/panel chrome if any, without resetting the view.
    if (navState.focusedId || navState.panelOpen) {
      interruptCameraAnimation(controls);
      clearFocus(navState);
      notifyCleared();
    }
    window.open(SHOP_URL, '_blank', 'noopener,noreferrer');
  };

  /**
   * Soft close — BT BACK / closeAllPanels.
   * Clears focus + panel + glow latch; leaves yaw / pitch / MFOV alone.
   */
  const close = (opts?: { force?: boolean; silent?: boolean }) => {
    if (!navState.panelOpen && !navState.focusedId) return;
    if (!opts?.force && Date.now() - openedAt < 280) return;

    interruptCameraAnimation(controls);
    clearFocus(navState);
    notifyCleared();
    if (!opts?.silent) playSfx('click');
    scheduleFollowRestore();
  };

  /**
   * BT `resetCamera` — lookto front explore framing + clear focus.
   * Used when the user drags away from the CRT (video) focus.
   */
  const resetToFront = (opts?: { silent?: boolean }) => {
    if (!navState.focusedId && !navState.panelOpen) {
      // Still allow an explicit home snap when already free.
    } else {
      clearFocus(navState);
      notifyCleared();
    }
    interruptCameraAnimation(controls);
    if (!opts?.silent) playSfx('click');

    const viewport = measureViewport();
    if (cbs.reduceMotion) {
      writeCamera(controls, frontLookTarget(viewport));
      controls.velocity.x = 0;
      controls.velocity.y = 0;
      scheduleFollowRestore();
      return;
    }
    animateCamera(controls, frontLookTarget(viewport), {
      duration: LOOKTO_DURATION,
      onComplete: scheduleFollowRestore,
    });
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
      readyDelayMs: 0,
    });
    cbs.onActiveChange(id);
    cbs.onFocusedChange(id);
    playSfx(section.sfx || 'focus');

    // Keep follow-mouse lean off while focused so glow stays framed.
    gsap.killTweensOf(controls, 'followFactor');
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

  /**
   * After rotate / iOS chrome resize: keep yaw/pitch, re-adapt lookto MFOV
   * so portrait↔landscape framing stays correct while focused.
   */
  const reframeFocused = (viewport?: ViewportMetrics) => {
    const id = navState.focusedId;
    if (!id || controls.lookAnimating || controls.dragging) return;
    const section = SECTION_BY_ID[id];
    if (!section) return;

    const vp = viewport ?? measureViewport();
    const target = resolveLookTarget(section, vp);
    if (Math.abs(controls.mfov - target.mfov) < 1.5) return;

    if (cbs.reduceMotion) {
      controls.mfov = target.mfov;
      return;
    }
    animateCamera(
      controls,
      {
        yaw: controls.lookTarget.x,
        pitch: controls.lookTarget.y,
        mfov: target.mfov,
      },
      { duration: REFRAME_DURATION },
    );
  };

  const interruptLook = () => {
    interruptCameraAnimation(controls);
  };

  return {
    open,
    close,
    /** @deprecated Prefer resetToFront (CRT) or close (soft). Kept for callers. */
    freeFocus: (opts?: { silent?: boolean }) => {
      // Legacy name: restore explore FOV, keep aim — used nowhere after refactor.
      if (!navState.focusedId && !navState.panelOpen) return;
      interruptCameraAnimation(controls);
      clearFocus(navState);
      notifyCleared();
      if (!opts?.silent) playSfx('click');
      if (cbs.reduceMotion) {
        controls.mfov = MFOV_EXPLORE;
        scheduleFollowRestore();
        return;
      }
      animateCamera(
        controls,
        {
          yaw: controls.lookTarget.x,
          pitch: controls.lookTarget.y,
          mfov: MFOV_EXPLORE,
        },
        { duration: 1.1, onComplete: scheduleFollowRestore },
      );
    },
    resetToFront,
    reframeFocused,
    goShop,
    interruptLook,
    setLookEnabled,
    getSection: (id: string): Section | undefined => SECTION_BY_ID[id],
  };
}

export type NavigationController = ReturnType<typeof createNavigationController>;
