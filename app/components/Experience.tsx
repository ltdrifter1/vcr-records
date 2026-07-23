'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';

import Scene from './Scene';
import LoadingGate from './LoadingGate';
import SectionPanel from './SectionPanel';
import FilmFX from './FilmFX';
import TopNav from './TopNav';
import MuteControl from './MuteControl';
import GyroButton, { createGyro } from './GyroButton';
import DragHint from './DragHint';
import { usePanControls } from './usePanControls';
import { SECTION_BY_ID, SHOP_URL } from '@/app/data/sections';
import { interruptLookTo, lookToSection, resetCamera, restoreExploreFov } from '@/lib/lookTo';
import { MFOV_EXPLORE, START_LOOK_U, START_LOOK_V, uToYaw, vToPitch } from '@/lib/pano';
import { enterWithAudio, playSfx } from '@/lib/audio';
import { CRT_DEFAULT_SRC } from './CrtScreen';

const TWO_PI = Math.PI * 2;

function yawDelta(from: number, to: number) {
  let d = (to - from) % TWO_PI;
  if (d > Math.PI) d -= TWO_PI;
  if (d < -Math.PI) d += TWO_PI;
  return d;
}

/**
 * balmingtiger focus model:
 *   lookto → glow latches (hoverOut no-op while active_scene matches)
 *   drag-away / zoom-away → free (glow out, explore FOV)
 *   explicit close → resetCamera to front
 */
export default function Experience() {
  const stageRef = useRef<HTMLDivElement>(null);
  const enteredRef = useRef({ value: false });
  const lookEnabledRef = useRef(false);
  const liveRef = useRef({ value: false });
  const panelOpenRef = useRef({ value: false });
  const gyroRef = useRef(createGyro());
  const onDragEndRef = useRef<(() => void) | null>(null);
  const onInterruptLookRef = useRef<(() => void) | null>(null);
  const activeRef = useRef<string | null>(null);
  const focusedRef = useRef<string | null>(null);
  /** Ignore zoom-away until lookto has landed (or been interrupted). */
  const focusReadyAt = useRef(0);

  const [active, setActive] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [crtArmed, setCrtArmed] = useState(false);
  const [crtSrc, setCrtSrc] = useState(CRT_DEFAULT_SRC);
  const [entered, setEntered] = useState(false);
  const [canLook, setCanLook] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [maxDpr, setMaxDpr] = useState(2);
  const [debug, setDebug] = useState(false);
  const [lightsOn, setLightsOn] = useState(true);

  const controls = usePanControls(
    stageRef,
    lookEnabledRef,
    onDragEndRef,
    onInterruptLookRef,
  );

  useEffect(() => {
    activeRef.current = active;
  }, [active]);
  useEffect(() => {
    focusedRef.current = focusedId;
  }, [focusedId]);

  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).has('debug'));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener('change', onChange);

    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    setMaxDpr(isTouch ? 1.6 : 2);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const handleEntered = useCallback(async () => {
    lookEnabledRef.current = false;
    liveRef.current.value = false;
    enteredRef.current.value = true;
    setEntered(true);
    setCanLook(false);
    await enterWithAudio();
  }, []);

  const handleIntroComplete = useCallback(() => {
    lookEnabledRef.current = true;
    liveRef.current.value = true;
    setCanLook(true);
  }, []);

  const openedAt = useRef(0);

  const snapFront = useCallback(() => {
    controls.lookTarget.x = uToYaw(START_LOOK_U);
    controls.lookTarget.y = vToPitch(START_LOOK_V);
    controls.mfov = MFOV_EXPLORE;
    controls.velocity.x = 0;
    controls.velocity.y = 0;
  }, [controls]);

  /** Explicit close (Esc / panel back / nav toggle) — BT resetCamera to front. */
  const close = useCallback(
    (opts?: { force?: boolean; silent?: boolean }) => {
      if (!panelOpenRef.current.value && !focusedRef.current) return;
      if (!opts?.force && Date.now() - openedAt.current < 280) return;
      interruptLookTo(controls);
      panelOpenRef.current.value = false;
      setActive(null);
      setFocusedId(null);
      focusedRef.current = null;
      setCrtArmed(false);
      setCrtSrc(CRT_DEFAULT_SRC);
      if (!opts?.silent) playSfx('click');
      if (!reduceMotion) resetCamera(controls, 1.55);
      else snapFront();
    },
    [controls, reduceMotion, snapFront],
  );

  /**
   * Free focus after the user zooms / pans away from the locked hotspot.
   * Keeps current look; restores explore FOV; clears glow latch.
   */
  const freeFocus = useCallback(
    (opts?: { silent?: boolean }) => {
      if (!focusedRef.current && !panelOpenRef.current.value) return;
      interruptLookTo(controls);
      panelOpenRef.current.value = false;
      setActive(null);
      setFocusedId(null);
      focusedRef.current = null;
      setCrtArmed(false);
      setCrtSrc(CRT_DEFAULT_SRC);
      if (!opts?.silent) playSfx('click');
      if (!reduceMotion) restoreExploreFov(controls, 1.1);
      else controls.mfov = MFOV_EXPLORE;
    },
    [controls, reduceMotion],
  );

  /** Swap the in-room CRT channel (Videos panel Play). */
  const playCrt = useCallback((src: string) => {
    setCrtSrc(src || CRT_DEFAULT_SRC);
    if (focusedRef.current === 'crt-tv' || activeRef.current === 'crt-tv') {
      setCrtArmed(true);
    }
  }, []);

  // Zoom / pan away while locked → free
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const id = focusedRef.current;
      if (
        id &&
        lookEnabledRef.current &&
        !controls.lookAnimating &&
        Date.now() > focusReadyAt.current
      ) {
        const section = SECTION_BY_ID[id];
        if (section) {
          const targetYaw = uToYaw(section.lookU ?? section.u);
          const targetPitch = vToPitch(section.lookV ?? section.v);
          const ang = Math.hypot(
            yawDelta(controls.lookTarget.x, targetYaw),
            controls.lookTarget.y - targetPitch,
          );
          const zoomedOut = controls.mfov > section.lookFov + 28;
          const pannedAway = ang > 0.48; // ≈ 27°
          if (zoomedOut || pannedAway) {
            freeFocus({ silent: true });
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [controls, freeFocus]);

  // Drag / wheel interrupts lookto; drag-end frees focus (BT video + panels)
  useEffect(() => {
    onInterruptLookRef.current = () => {
      interruptLookTo(controls);
      // Allow free-focus checks immediately after user takes over.
      focusReadyAt.current = 0;
    };
    onDragEndRef.current = () => {
      if (focusedRef.current || panelOpenRef.current.value) {
        freeFocus({ silent: true });
      }
    };
    return () => {
      onInterruptLookRef.current = null;
      onDragEndRef.current = null;
    };
  }, [controls, freeFocus]);

  const open = useCallback(
    (id: string) => {
      if (!lookEnabledRef.current) return;

      const section = SECTION_BY_ID[id];
      if (!section) return;

      // —— Shop / cash register = balmingtiger shopbag ——
      // No lookto, no glow latch. Click → SFX + window.open after 500ms.
      if (id === 'cash-register') {
        interruptLookTo(controls);
        playSfx('shop');
        panelOpenRef.current.value = false;
        setActive(null);
        setFocusedId(null);
        focusedRef.current = null;
        window.setTimeout(() => {
          window.open(SHOP_URL, '_blank', 'noopener,noreferrer');
        }, 500);
        return;
      }

      // Toggle off if same focused feature re-clicked via nav
      if (focusedRef.current === id && active === id) {
        close({ force: true });
        return;
      }

      openedAt.current = Date.now();
      setCrtArmed(false);
      if (id !== 'crt-tv') setCrtSrc(CRT_DEFAULT_SRC);

      // —— lookto + glow latch + panel ——
      panelOpenRef.current.value = true;
      setActive(id);
      setFocusedId(id);
      focusedRef.current = id;
      focusReadyAt.current = Date.now() + (reduceMotion ? 0 : 1600);
      playSfx(section.sfx || 'focus');

      if (reduceMotion) {
        interruptLookTo(controls);
        controls.lookTarget.x = uToYaw(section.lookU ?? section.u);
        controls.lookTarget.y = vToPitch(section.lookV ?? section.v);
        controls.mfov = section.lookFov;
        if (id === 'crt-tv') setCrtArmed(true);
        return;
      }
      lookToSection(controls, section, {
        duration: 1.55,
        onComplete: () => {
          if (id === 'crt-tv') setCrtArmed(true);
        },
      });
    },
    [active, close, controls, reduceMotion],
  );

  const toggleLights = useCallback(() => {
    setLightsOn((v) => !v);
    playSfx('lights');
  }, []);

  const videoFocused = active === 'crt-tv';

  return (
    <div className={`stage${canLook ? ' can-look' : ''}`} ref={stageRef}>
      <Canvas
        dpr={[1, maxDpr]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        camera={{ fov: 100, position: [0, 0, 0], near: 0.1, far: 200 }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor('#000000', 1);
          camera.rotation.order = 'YXZ';
        }}
      >
        <Suspense fallback={null}>
          <Scene
            controls={controls}
            reduceMotion={reduceMotion}
            enteredRef={enteredRef.current}
            liveRef={liveRef.current}
            panelOpenRef={panelOpenRef.current}
            onOpen={open}
            onIntroComplete={handleIntroComplete}
            debug={debug}
            lightsOn={lightsOn}
            onToggleLights={toggleLights}
            activeId={active}
            focusedId={focusedId}
            crtArmed={crtArmed}
            crtSrc={crtSrc}
            gyroRef={gyroRef}
          />
        </Suspense>
      </Canvas>

      <FilmFX reduceMotion={reduceMotion} />
      <MuteControl visible={entered} faded={videoFocused} />
      <GyroButton visible={canLook} gyroRef={gyroRef} />
      <TopNav visible={canLook} activeId={active} onOpen={open} />
      <DragHint active={canLook} controls={controls} reduceMotion={reduceMotion} />

      <SectionPanel
        activeId={active}
        onClose={() => close()}
        onPlayCrt={playCrt}
      />
      <LoadingGate onEntered={handleEntered} />
    </div>
  );
}
