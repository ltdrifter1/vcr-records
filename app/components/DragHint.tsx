'use client';

import { useEffect, useRef, useState } from 'react';
import type { Controls } from './sceneContext';

const STORAGE_KEY = 'vcr-drag-hint-seen';
const FADE_MS = 500;
const AUTO_HIDE_MS = 3800;

type Props = {
  /** True once the intro unlocks look-around. */
  active: boolean;
  controls: Controls;
  reduceMotion?: boolean;
};

/**
 * First-visit onboarding cue — small “Drag to explore” with a minimal
 * drag glyph. Never blocks the scene. Fades after a few seconds or on
 * the first real drag. Shown once per browser via localStorage.
 */
export default function DragHint({ active, controls, reduceMotion = false }: Props) {
  const [mounted, setMounted] = useState(false);
  const [opaque, setOpaque] = useState(false);
  const dismissed = useRef(false);
  const fadeTimer = useRef(0);

  useEffect(() => {
    if (!active || dismissed.current) return;
    try {
      if (window.localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* private mode — still show once this session */
    }
    setMounted(true);
    const id = window.setTimeout(() => setOpaque(true), reduceMotion ? 0 : 40);
    return () => window.clearTimeout(id);
  }, [active, reduceMotion]);

  useEffect(() => {
    if (!mounted || dismissed.current) return;

    const markSeen = () => {
      try {
        window.localStorage.setItem(STORAGE_KEY, '1');
      } catch {
        /* ignore */
      }
    };

    const dismiss = () => {
      if (dismissed.current) return;
      dismissed.current = true;
      setOpaque(false);
      markSeen();
      window.clearTimeout(fadeTimer.current);
      fadeTimer.current = window.setTimeout(
        () => setMounted(false),
        reduceMotion ? 0 : FADE_MS,
      );
    };

    const auto = window.setTimeout(dismiss, reduceMotion ? 0 : AUTO_HIDE_MS);

    let raf = 0;
    const tick = () => {
      if (controls.dragged) {
        dismiss();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(auto);
      window.clearTimeout(fadeTimer.current);
      cancelAnimationFrame(raf);
    };
  }, [mounted, controls, reduceMotion]);

  if (!mounted) return null;

  return (
    <div
      className={`drag-hint${opaque ? ' is-on' : ''}`}
      role="status"
      aria-live="polite"
      aria-hidden={!opaque}
    >
      <span className="drag-hint-glyph" aria-hidden>
        <svg width="28" height="14" viewBox="0 0 28 14" fill="none">
          <path
            d="M6.5 7H21.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M9.5 4L6 7l3.5 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M18.5 4L22 7l-3.5 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="14" cy="7" r="1.6" fill="currentColor" />
        </svg>
      </span>
      <span className="drag-hint-label">Drag to explore</span>
    </div>
  );
}
