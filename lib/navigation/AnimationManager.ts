import type { Controls, LookTarget } from './types';

const TWO_PI = Math.PI * 2;

/** Shortest-path yaw delta into (−π, π]. */
export function yawDelta(from: number, to: number) {
  let d = (to - from) % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return d;
}

/** ≈ krpano / GSAP easeinoutquart */
export function easeInOutQuart(t: number) {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

type AnimHandle = {
  kill: () => void;
};

let active: {
  id: number;
  raf: number;
  onInterrupt?: () => void;
} | null = null;

/**
 * Kill any in-flight camera tween and unlock lookAnimating.
 * Returns true if something was interrupted.
 */
export function interruptCameraAnimation(controls: Controls) {
  if (!active && !controls.lookAnimating) return false;
  if (active) {
    cancelAnimationFrame(active.raf);
    active.onInterrupt?.();
    active = null;
  }
  controls.lookAnimating = false;
  controls.velocity.x = 0;
  controls.velocity.y = 0;
  return true;
}

/**
 * Animate cameraX / cameraY / cameraScale (yaw / pitch / mfov) on rAF.
 * Never uses browser scroll or anchor jumps — pure transform interpolation.
 */
export function animateCamera(
  controls: Controls,
  to: LookTarget,
  opts: {
    duration?: number;
    ease?: (t: number) => number;
    onComplete?: () => void;
    onUpdate?: () => void;
  } = {},
): AnimHandle {
  const duration = Math.max(0.01, opts.duration ?? 1.55) * 1000;
  const ease = opts.ease ?? easeInOutQuart;

  interruptCameraAnimation(controls);
  controls.velocity.x = 0;
  controls.velocity.y = 0;
  controls.lookAnimating = true;
  controls.followFactor = 0;

  const startYaw = controls.lookTarget.x;
  const startPitch = controls.lookTarget.y;
  const startMfov = controls.mfov;
  const delta = yawDelta(startYaw, to.yaw);
  const id = Date.now() + Math.random();
  const t0 = performance.now();

  const tick = (now: number) => {
    if (!active || active.id !== id) return;
    const u = Math.min(1, (now - t0) / duration);
    const e = ease(u);
    controls.lookTarget.x = startYaw + delta * e;
    controls.lookTarget.y = startPitch + (to.pitch - startPitch) * e;
    controls.mfov = startMfov + (to.mfov - startMfov) * e;
    opts.onUpdate?.();

    if (u < 1) {
      active.raf = requestAnimationFrame(tick);
      return;
    }

    controls.lookTarget.x = to.yaw;
    controls.lookTarget.y = to.pitch;
    controls.mfov = to.mfov;
    controls.lookAnimating = false;
    active = null;
    opts.onComplete?.();
  };

  active = {
    id,
    raf: requestAnimationFrame(tick),
    onInterrupt: () => {
      controls.lookAnimating = false;
    },
  };

  return {
    kill: () => interruptCameraAnimation(controls),
  };
}
