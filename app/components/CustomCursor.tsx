'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Desktop custom cursor — chunky 90s cartoon hand.
 * Follow + light tilt (mouseX → ±28°) + click/hover press state.
 * ease_xy = ease_rot = 1 (instant).
 *
 * Hover sources:
 *   1) DOM targets (buttons, panel rows, …)
 *   2) 3D hotspots / ambient toys via `document.documentElement.cursor-hot`
 */
export default function CustomCursor({ enabled }: { enabled: boolean }) {
  const el = useRef<HTMLDivElement>(null);
  const [clicking, setClicking] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [ok, setOk] = useState(false);
  const pos = useRef({ x: -100, y: -100, rot: 0 });
  const raf = useRef(0);
  const domHot = useRef(false);
  const sceneHot = useRef(false);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    setOk(fine && enabled);
  }, [enabled]);

  useEffect(() => {
    if (!ok) return;
    document.documentElement.classList.add('has-custom-cursor');

    const syncHover = () => {
      const next = domHot.current || sceneHot.current;
      setHovering((prev) => (prev === next ? prev : next));
    };

    const tick = () => {
      const p = pos.current;
      const node = el.current;
      if (node) {
        node.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) translate(-10px, -4px) rotateZ(${p.rot * 28}deg)`;
      }
      const hot = document.documentElement.classList.contains('cursor-hot');
      if (hot !== sceneHot.current) {
        sceneHot.current = hot;
        syncHover();
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    const move = (e: PointerEvent) => {
      pos.current.x = e.clientX;
      pos.current.y = e.clientY;
      pos.current.rot = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
    };
    const down = () => setClicking(true);
    const up = () => setClicking(false);
    const over = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      const hit = !!t.closest(
        'button, a, [data-cursor="click"], .top-nav-hit, .panel-back, .panel-row',
      );
      if (hit !== domHot.current) {
        domHot.current = hit;
        syncHover();
      }
    };

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('mouseover', over);
    return () => {
      cancelAnimationFrame(raf.current);
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('mouseover', over);
    };
  }, [ok]);

  if (!ok) return null;

  const src = clicking || hovering ? '/cursors/click.svg' : '/cursors/default.svg';

  return (
    <div className={`custom-cursor${clicking ? ' is-down' : ''}`} ref={el} aria-hidden>
      <img src={src} alt="" width={56} height={56} draggable={false} />
    </div>
  );
}
