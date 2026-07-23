/**
 * Backward-compatible lookto API — delegates to the unified navigation engine.
 * Prefer importing from `@/lib/navigation` in new code.
 */
import type { Controls } from '@/lib/navigation/types';
import type { Section } from '@/app/data/sections';
import {
  animateCamera,
  frontLookTarget,
  interruptCameraAnimation,
  measureViewport,
  resolveLookTarget,
} from '@/lib/navigation';
import { MFOV_EXPLORE } from '@/lib/pano';

export function interruptLookTo(controls: Controls) {
  return interruptCameraAnimation(controls);
}

export function lookToSection(
  controls: Controls,
  section: Section,
  opts: { duration?: number; onComplete?: () => void } = {},
) {
  const viewport = measureViewport();
  const target = resolveLookTarget(section, viewport);
  return animateCamera(controls, target, {
    duration: opts.duration ?? 1.55,
    onComplete: opts.onComplete,
  });
}

export function restoreExploreFov(controls: Controls, duration = 1.1) {
  return animateCamera(
    controls,
    {
      yaw: controls.lookTarget.x,
      pitch: controls.lookTarget.y,
      mfov: MFOV_EXPLORE,
    },
    { duration },
  );
}

export function resetCamera(controls: Controls, duration = 1.55) {
  return animateCamera(controls, frontLookTarget(measureViewport()), {
    duration,
  });
}
