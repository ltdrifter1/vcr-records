import {
  MFOV_EXPLORE,
  MFOV_LOOKTO_MIN,
  MFOV_MAX,
  MFOV_MIN,
  MFOV_RATIO,
  START_LOOK_U,
  START_LOOK_V,
  uToYaw,
  vToPitch,
} from '@/lib/pano';
import type { Section } from '@/app/data/sections';
import { adaptMfovToViewport, measureViewport } from './ViewportManager';
import type { Controls, LookTarget, ViewportMetrics } from './types';

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

/**
 * Explore MFOV for the live viewport — keeps design HFOV (~132°) on portrait
 * so the room doesn’t tunnel / feel compressed on phones.
 */
export function resolveExploreMfov(viewport?: ViewportMetrics): number {
  const vp = viewport ?? measureViewport();
  const aspect = Math.max(0.05, vp.aspect);
  const mfov =
    aspect >= MFOV_RATIO
      ? MFOV_EXPLORE
      : adaptMfovToViewport(MFOV_EXPLORE, aspect);
  return Math.min(MFOV_MAX, Math.max(MFOV_MIN, mfov));
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

export function snapExploreFront(controls: Controls, viewport?: ViewportMetrics) {
  controls.lookTarget.x = uToYaw(START_LOOK_U);
  controls.lookTarget.y = vToPitch(START_LOOK_V);
  controls.mfov = resolveExploreMfov(viewport);
  controls.velocity.x = 0;
  controls.velocity.y = 0;
}

/**
 * Lookto MFOV — one engine, all devices.
 *
 * Desktop / landscape: use the authored lookFov (already tuned).
 * Portrait: remap so horizontal FOV matches the design framing
 * (fixes iPhone over-zoom without hardcoded per-section mobile coords).
 */
export function resolveLookMfov(
  section: Pick<Section, 'w' | 'h' | 'lookFov'>,
  viewport: ViewportMetrics,
): number {
  const aspect = Math.max(0.05, viewport.aspect);
  const authored = section.lookFov;

  let mfov: number;
  if (aspect >= MFOV_RATIO) {
    // Landscape-ish — keep author values (desktop feel was correct).
    mfov = authored;
  } else {
    // Portrait — preserve design horizontal FOV.
    mfov = adaptMfovToViewport(authored, aspect);
  }

  return Math.min(MFOV_MAX, Math.max(MFOV_LOOKTO_MIN, mfov));
}

/** World aim for a section — same UV on every device. */
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

export function frontLookTarget(viewport?: ViewportMetrics): LookTarget {
  return {
    yaw: uToYaw(START_LOOK_U),
    pitch: vToPitch(START_LOOK_V),
    mfov: resolveExploreMfov(viewport),
  };
}
