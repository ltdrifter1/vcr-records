import gsap from 'gsap';

import type { Controls } from '@/app/components/sceneContext';
import {
  FISHEYE_EXPLORE,
  FISHEYE_INTRO,
  INTRO_DELAY,
  INTRO_DROP_V,
  INTRO_DUR,
  MFOV_INTRO,
  START_LOOK_U,
  START_LOOK_V,
  uToYaw,
  vToPitch,
} from '@/lib/pano';
import { resolveExploreMfov } from '@/lib/navigation/CameraController';
import { measureViewport } from '@/lib/navigation/ViewportManager';

export type IntroLookRefs = {
  yaw: { current: number };
  pitch: { current: number };
  fisheye: { current: number };
};

/**
 * Enter choreography — balmingtiger drop pattern:
 *   1. Pre-enter pose looks almost straight down at the floor in the
 *      MIDDLE of the room (little-planet swirl under fisheye 1 / fov 160)
 *   2. One clean tilt UP to the level base view on the room's central
 *      axis while fisheye 1→0.3 and fov 160→explore — no yaw scanning
 * then unlock usercontrol at the base point.
 */
export function playEnterIntro(
  controls: Controls,
  refs: IntroLookRefs,
  opts: { reduceMotion?: boolean; onComplete?: () => void } = {},
) {
  const settleYaw = uToYaw(START_LOOK_U);
  const settlePitch = vToPitch(START_LOOK_V);
  const dropPitch = vToPitch(INTRO_DROP_V);

  const applyLook = (yaw: number, pitch: number, mfov: number, fisheye: number) => {
    controls.lookTarget.x = yaw;
    controls.lookTarget.y = pitch;
    controls.mfov = mfov;
    controls.fisheye = fisheye;
    refs.yaw.current = yaw;
    refs.pitch.current = pitch;
    refs.fisheye.current = fisheye;
    controls.velocity.x = 0;
    controls.velocity.y = 0;
  };

  const exploreMfov = resolveExploreMfov(measureViewport());

  // Drop pose under the gate / first enter frame — floor swirl at room center
  applyLook(settleYaw, dropPitch, MFOV_INTRO, FISHEYE_INTRO);
  controls.userControl = false;
  controls.followFactor = 0;
  controls.lookAnimating = true;

  if (opts.reduceMotion) {
    applyLook(settleYaw, settlePitch, exploreMfov, FISHEYE_EXPLORE);
    controls.lookAnimating = false;
    controls.userControl = true;
    if (typeof window !== 'undefined' && !window.matchMedia('(pointer: coarse)').matches) {
      controls.followFactor = 1;
    }
    opts.onComplete?.();
    return null;
  }

  const proxy = { t: 0, mfov: MFOV_INTRO, fisheye: FISHEYE_INTRO };

  const tween = gsap.fromTo(
    proxy,
    { t: 0, mfov: MFOV_INTRO, fisheye: FISHEYE_INTRO },
    {
      t: 1,
      mfov: exploreMfov,
      fisheye: FISHEYE_EXPLORE,
      duration: INTRO_DUR,
      delay: INTRO_DELAY,
      ease: 'power3.inOut',
      onUpdate: () => {
        const t = proxy.t;
        // Pure tilt-up: floor center → level base view (no yaw scanning).
        const pitchT = t * t * (3 - 2 * t);
        const pitch = dropPitch + (settlePitch - dropPitch) * pitchT;
        applyLook(settleYaw, pitch, proxy.mfov, proxy.fisheye);
      },
      onComplete: () => {
        applyLook(settleYaw, settlePitch, exploreMfov, FISHEYE_EXPLORE);
        controls.lookAnimating = false;
        controls.userControl = true;
        if (typeof window !== 'undefined' && !window.matchMedia('(pointer: coarse)').matches) {
          controls.followFactor = 1;
        }
        opts.onComplete?.();
      },
    },
  );

  return tween;
}
