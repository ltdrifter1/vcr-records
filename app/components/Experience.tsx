'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';

import Scene from './Scene';
import LoadingGate from './LoadingGate';
import SectionPanel from './SectionPanel';
import FilmFX from './FilmFX';
import TopNav from './TopNav';
import MuteControl from './MuteControl';
import GyroButton, { createGyro } from './GyroButton';
import DragHint from './DragHint';
import CustomCursor from './CustomCursor';
import {
  createNavState,
  createNavigationController,
  measureViewport,
  syncViewportCssVars,
  useInteractionManager,
} from '@/lib/navigation';
import { enterWithAudio, playSfx } from '@/lib/audio';
import { CRT_DEFAULT_SRC } from './CrtScreen';

/**
 * Root experience — virtual spherical camera, not page scroll.
 * Navigation animates yaw / pitch / MFOV via AnimationManager (rAF).
 *
 * Canvas model (balmingtiger):
 *   one continuous room; panels are HUD; drag-end only resets CRT focus.
 */
export default function Experience() {
  const stageRef = useRef<HTMLDivElement>(null);
  const enteredRef = useRef({ value: false });
  const lookEnabledRef = useRef(false);
  const liveRef = useRef({ value: false });
  const panelOpenRef = useRef({ value: false });
  const focusedIdRef = useRef<{ value: string | null }>({ value: null });
  const gyroRef = useRef(createGyro());
  const onDragEndRef = useRef<(() => void) | null>(null);
  const onInterruptLookRef = useRef<(() => void) | null>(null);

  const navState = useMemo(() => createNavState(), []);

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

  const controls = useInteractionManager(
    stageRef,
    lookEnabledRef,
    onDragEndRef,
    onInterruptLookRef,
    focusedIdRef,
  );

  const lookEnabledHold = useRef(false);

  const nav = useMemo(
    () => {
      const controller = createNavigationController(controls, navState, {
        onActiveChange: (id) => {
          setActive(id);
          panelOpenRef.current.value = !!id;
        },
        onFocusedChange: (id) => {
          setFocusedId(id);
          focusedIdRef.current.value = id;
        },
        onCrtArm: setCrtArmed,
        onCrtSrcReset: () => setCrtSrc(CRT_DEFAULT_SRC),
        reduceMotion,
      });
      controller.setLookEnabled(lookEnabledHold.current);
      return controller;
    },
    [controls, navState, reduceMotion],
  );

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

  // Keep FX / vignette locked to visualViewport (iOS Safari chrome).
  // While focused, re-adapt lookto MFOV for the new aspect (rotate / URL bar).
  useEffect(() => {
    const publish = () => {
      const m = measureViewport(stageRef.current);
      syncViewportCssVars(m);
      nav.reframeFocused(m);
    };
    publish();
    const vv = window.visualViewport;
    window.addEventListener('resize', publish);
    vv?.addEventListener('resize', publish);
    vv?.addEventListener('scroll', publish);
    return () => {
      window.removeEventListener('resize', publish);
      vv?.removeEventListener('resize', publish);
      vv?.removeEventListener('scroll', publish);
    };
  }, [nav]);

  const handleEntered = useCallback(async () => {
    lookEnabledRef.current = false;
    lookEnabledHold.current = false;
    nav.setLookEnabled(false);
    liveRef.current.value = false;
    enteredRef.current.value = true;
    setEntered(true);
    setCanLook(false);
    await enterWithAudio();
  }, [nav]);

  const handleIntroComplete = useCallback(() => {
    lookEnabledRef.current = true;
    lookEnabledHold.current = true;
    nav.setLookEnabled(true);
    liveRef.current.value = true;
    setCanLook(true);
  }, [nav]);

  // Drag interrupts lookto; CRT drag-end resets like BT video Observer.
  // Other sections keep the HUD open while roaming the same canvas.
  useEffect(() => {
    onInterruptLookRef.current = () => nav.interruptLook();
    onDragEndRef.current = () => {
      if (navState.focusedId === 'crt-tv') {
        nav.resetToFront({ silent: true });
      }
    };
    return () => {
      onInterruptLookRef.current = null;
      onDragEndRef.current = null;
    };
  }, [nav, navState]);

  // Keep controller look-enabled in sync with the intro unlock flag.
  useEffect(() => {
    nav.setLookEnabled(lookEnabledHold.current || canLook);
  }, [nav, canLook]);

  const open = useCallback(
    (id: string) => {
      // Belt-and-suspenders: intro sets controls.userControl; also force-enable.
      if (canLook) nav.setLookEnabled(true);
      nav.open(id, measureViewport(stageRef.current));
    },
    [nav, canLook],
  );

  const close = useCallback(() => nav.close(), [nav]);

  const playCrt = useCallback((src: string) => {
    setCrtSrc(src || CRT_DEFAULT_SRC);
    if (navState.focusedId === 'crt-tv' || navState.activeId === 'crt-tv') {
      setCrtArmed(true);
    }
  }, [navState]);

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
            focusedIdRef={focusedIdRef.current}
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
      <CustomCursor active={entered} />
      <MuteControl visible={entered} faded={videoFocused} />
      <GyroButton visible={canLook} gyroRef={gyroRef} />
      <TopNav visible={canLook} activeId={active} onOpen={open} />
      <DragHint active={canLook} controls={controls} reduceMotion={reduceMotion} />

      <SectionPanel activeId={active} onClose={close} onPlayCrt={playCrt} />
      <LoadingGate onEntered={handleEntered} />
    </div>
  );
}
