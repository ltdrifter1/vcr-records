'use client';

import { useEffect, useRef, useState } from 'react';
import { useProgress } from '@react-three/drei';
import gsap from 'gsap';

import { LQIP_SRC } from '@/lib/pano';

/**
 * Entry gate — PNW modern field + 90s cel glow brand mark.
 * LQIP store preview sits under the mist so load already feels like the room.
 * Fade out 0.4s then cinematic intro starts in Scene.
 * Audio unlock must run in the click gesture (not deferred to GSAP alone).
 */
export default function LoadingGate({
  onEntered,
}: {
  onEntered: () => void | Promise<void>;
}) {
  const { progress, active } = useProgress();
  const [ready, setReady] = useState(false);
  const [pct, setPct] = useState(0);
  const [entering, setEntering] = useState(false);
  const [lqipOn, setLqipOn] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const enterBtn = useRef<HTMLButtonElement>(null);
  const mounted = useRef(Date.now());

  // Progressive feel — paint the store behind the brand as soon as LQIP lands.
  useEffect(() => {
    const img = new Image();
    img.src = LQIP_SRC;
    if (img.complete) {
      setLqipOn(true);
      return;
    }
    img.onload = () => setLqipOn(true);
  }, []);

  useEffect(() => {
    const p = Math.round(progress);
    setPct((prev) => (p > prev ? p : prev));
    if (bar.current) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.to(bar.current, {
        scaleX: Math.max(0.02, progress / 100),
        duration: reduce ? 0 : 0.5,
        ease: 'power2.out',
      });
    }
  }, [progress]);

  useEffect(() => {
    const elapsed = Date.now() - mounted.current;
    if (!active && progress >= 100) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const wait = reduce ? 0 : Math.max(0, 1000 - elapsed);
      const id = setTimeout(() => setReady(true), wait);
      return () => clearTimeout(id);
    }
  }, [active, progress]);

  useEffect(() => {
    if (ready && enterBtn.current) {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      gsap.to(enterBtn.current, {
        opacity: 1,
        y: 0,
        duration: reduce ? 0 : 0.8,
        ease: 'power3.out',
      });
    }
  }, [ready]);

  const enter = async () => {
    if (!ready || entering) return;
    setEntering(true);
    // Unlock audio inside the user gesture before the fade tween.
    try {
      await onEntered();
    } catch {
      /* scene still enters even if audio fails */
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    gsap.to(root.current, {
      opacity: 0,
      duration: reduce ? 0 : 0.4,
      ease: 'power1.inOut',
      onComplete: () => {
        if (root.current) root.current.style.display = 'none';
      },
    });
  };

  return (
    <div className="gate" ref={root} role="dialog" aria-label="Enter VCR Recordings">
      <div className={`gate-lqip${lqipOn ? ' is-on' : ''}`} aria-hidden>
        <img src={LQIP_SRC} alt="" draggable={false} />
        <span className="gate-lqip-veil" />
      </div>

      <div className="gate-atmosphere" aria-hidden>
        <span className="gate-mist gate-mist-a" />
        <span className="gate-mist gate-mist-b" />
        <span className="gate-orb gate-orb-a" />
        <span className="gate-orb gate-orb-b" />
        <span className="gate-grain" />
      </div>

      <div className="gate-inner" ref={inner}>
        <h1 className="gate-mark">
          <span className="gate-mark-vcr">VCR</span>
          <span className="gate-mark-recordings">RECORDINGS</span>
        </h1>
        <p className="gate-sub">Best experienced with your device&apos;s audio enabled</p>

        <div
          className="gate-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          aria-label="Loading store"
        >
          <i ref={bar} />
        </div>
        <div className="gate-status">
          <span>{ready ? 'Ready' : 'Loading'}</span>
          <span>{pct}%</span>
        </div>

        <button
          type="button"
          className="gate-enter"
          ref={enterBtn}
          onClick={() => void enter()}
          disabled={!ready || entering}
          data-cursor="click"
        >
          {ready ? 'CLICK TO ENTER' : 'LOADING…'}
        </button>
      </div>
    </div>
  );
}
