import {
  MFOV_EXPLORE,
  MFOV_LOOKTO_MIN,
  MFOV_MAX,
  SPHERE_RADIUS,
  START_LOOK_U,
  START_LOOK_V,
  uToYaw,
  vToPitch,
} from '@/lib/pano';
import type { Section } from '@/app/data/sections';
import {
  adaptMfovToViewport,
  horizontalFovToMfov,
  measureViewport,
  verticalFovToMfov,
} from './ViewportManager';
import type { Controls, LookTarget, ViewportMetrics } from './types';

// re-export measure for callers that import CameraController
export { measureViewport };

/**
 * Create the shared mutable Controls object (one per Experience mount).
 */
export function createControls(initial?: Partial<Controls>): Controls {
  return {
    lookTarget: { x: uToYaw(START_LOOK_U), y: vToPitch(START_LOOK_V) },
    velocity: { x: 0, y: 0 },
    dragging: false,
    dragged: false,
    mfov: MFOV_EXPLORE,
    fisheye: 0.3,
    pointer: { x: 0, y: 0 },
    followFactor: 0,
    userControl: false,
    lookAnimating: false,
    ...initial,
  };
}

export function readCamera(controls: Controls): LookTarget {
  return {
    yaw: controls.lookTarget.x,
    pitch: controls.lookTarget.y,
    mfov: controls.mfov,
  };
}

export function writeCamera(controls: Controls, cam: Partial<LookTarget>) {
  if (cam.yaw != null) controls.lookTarget.x = cam.yaw;
  if (cam.pitch != null) controls.lookTarget.y = cam.pitch;
  if (cam.mfov != null) controls.mfov = cam.mfov;
}

export function snapExploreFront(controls: Controls) {
  controls.lookTarget.x = uToYaw(START_LOOK_U);
  controls.lookTarget.y = vToPitch(START_LOOK_V);
  controls.mfov = MFOV_EXPLORE;
  controls.velocity.x = 0;
  controls.velocity.y = 0;
}

/**
 * Derive lookto MFOV from world hotspot size + current viewport.
 *
 * One engine for every device:
 *   1. Angular size of the hotspot on the sphere wall
 *   2. Safe margins from ViewportManager (nav / panel / iOS insets)
 *   3. Authored lookFov adapted to current aspect (never raw on portrait)
 *
 * Result = max(fit, adapted) clamped — never over-zoom, never clip the target.
 */
export function resolveLookMfov(
  section: Pick<Section, 'w' | 'h' | 'lookFov'>,
  viewport: ViewportMetrics,
): number {
  const aspect = Math.max(0.05, viewport.aspect);
  const dist = SPHERE_RADIUS - 0.5;
  const angW = 2 * Math.atan((section.w * 0.5) / dist);
  const angH = 2 * Math.atan((section.h * 0.5) / dist);

  const fillX = Math.min(0.78, Math.max(0.42, 1 - 2 * viewport.safeMarginX));
  const fillY = Math.min(0.7, Math.max(0.36, 1 - 2 * viewport.safeMarginY));

  const needH = (angW / fillX) * (180 / Math.PI);
  const needV = (angH / fillY) * (180 / Math.PI);

  const fromH = horizontalFovToMfov(needH, aspect);
  const fromV = verticalFovToMfov(needV, aspect);
  const fit = Math.max(fromH, fromV);

  // Aspect-adapted author FOV — stops portrait punch-ins from crushing the frame
  const adapted = adaptMfovToViewport(section.lookFov, aspect);

  // Wider (larger MFOV) wins → no clipping, no mobile over-zoom
  const mfov = Math.max(fit, adapted);
  return Math.min(MFOV_MAX, Math.max(MFOV_LOOKTO_MIN, mfov));
}

/** World aim for a section — same UV on every device (no mobile look offsets). */
export function resolveLookTarget(
  section: Pick<Section, 'u' | 'v' | 'lookU' | 'lookV' | 'w' | 'h' | 'lookFov'>,
  viewport?: ViewportMetrics,
): LookTarget {
  const vp = viewport ?? measureViewport();
  return {
    yaw: uToYaw(section.lookU ?? section.u),
    pitch: vToPitch(section.lookV ?? section.v),
    mfov: resolveLookMfov(section, vp),
  };
}

export function frontLookTarget(_viewport?: ViewportMetrics): LookTarget {
  return {
    yaw: uToYaw(START_LOOK_U),
    pitch: vToPitch(START_LOOK_V),
    // Explore FOV stays authored — only lookto punch-ins adapt to aspect.
    mfov: MFOV_EXPLORE,
  };
}
