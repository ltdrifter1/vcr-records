import gsap from 'gsap';

import type { Controls } from '@/app/components/sceneContext';
import {
  FISHEYE_EXPLORE,
  FISHEYE_INTRO,
  INTRO_CEILING_V,
  INTRO_DELAY,
  INTRO_DUR,
  INTRO_PAN_DEG,
  MFOV_INTRO,
  START_LOOK_U,
  START_LOOK_V,
  uToYaw,
  vToPitch,
} from '@/lib/pano';
import { resolveExploreMfov } from '@/lib/navigation/CameraController';
import { measureViewport } from '@/lib/navigation/ViewportManager';

const DEG = Math.PI / 180;

export type IntroLookRefs = {
  yaw: { current: number };
  pitch: { current: number };
  fisheye: { current: number };
};

/**
 * Enter choreography inspired by balmingtiger little-planet → settle,
 * shaped to what the room reads as:
 *   1. Start looking at the ceiling
 *   2. Soft yaw pan back and forth while dropping the fisheye punch
 *   3. Settle on the open store sightline (no panel open)
 * then unlock usercontrol.
 */
export function playEnterIntro(
  controls: Controls,
  refs: IntroLookRefs,
  opts: { reduceMotion?: boolean; onComplete?: () => void } = {},
) {
  const settleYaw = uToYaw(START_LOOK_U);
  const settlePitch = vToPitch(START_LOOK_V);
  const ceilingPitch = vToPitch(INTRO_CEILING_V);
  const panAmp = INTRO_PAN_DEG * DEG;

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

  // Ceiling pose under the gate / first enter frame
  applyLook(settleYaw, ceilingPitch, MFOV_INTRO, FISHEYE_INTRO);
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
        // Ease pitch ceiling → hotspot; keep a touch of overshoot-free smoothstep
        const pitchT = t * t * (3 - 2 * t);
        const pitch = ceilingPitch + (settlePitch - ceilingPitch) * pitchT;
        // One soft back-and-forth that dies out as we settle (≈1.25 cycles)
        const pan = Math.sin(t * Math.PI * 2.5) * panAmp * (1 - t) * (1 - t);
        const yaw = settleYaw + pan;
        applyLook(yaw, pitch, proxy.mfov, proxy.fisheye);
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
