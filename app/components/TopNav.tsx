'use client';

import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

import { NAV_ORDER, SECTIONS, SHOP_URL } from '@/app/data/sections';

const NAV_ITEMS = NAV_ORDER.map((id) => SECTIONS.find((s) => s.id === id)!).filter(Boolean);

/**
 * Conveyor top nav — balmingtiger MENU CONVEYOR pattern.
 *
 * Click path uses Swiper's `clickedRealIndex` (loop-safe). Invisible hit
 * overlays were desynced from labels (especially with slidesPerView 3.2),
 * so PC clicks missed / opened the wrong section while Shop `<a>` still
 * worked on iOS.
 */
export default function TopNav({
  visible,
  activeId,
  onOpen,
}: {
  visible: boolean;
  activeId: string | null;
  onOpen: (id: string) => void;
}) {
  const swiperRef = useRef<SwiperType | null>(null);
  const transitioning = useRef(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivateAt = useRef(0);
  const [realIndex, setRealIndex] = useState(0);
  const items = NAV_ITEMS;

  const clearTimers = () => {
    transitioning.current = false;
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  };

  const lockTransition = (ms = 900) => {
    transitioning.current = true;
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(() => {
      transitioning.current = false;
      transitionTimer.current = null;
    }, ms);
  };

  // Sync conveyor when a hotspot / panel opens a section.
  useEffect(() => {
    const sw = swiperRef.current;
    if (!sw || !activeId) return;
    const idx = items.findIndex((s) => s.id === activeId);
    if (idx < 0) return;
    if (sw.realIndex === idx) return;
    lockTransition(900);
    sw.slideToLoop(idx, 800);
  }, [activeId, items]);

  useEffect(() => () => clearTimers(), []);

  if (!visible) return null;

  const goShop = () => {
    // BT shopbag — leave the canvas, open catalog in a new tab.
    window.open(SHOP_URL, '_blank', 'noopener,noreferrer');
  };

  const openSection = (section: (typeof items)[number]) => {
    if (section.id === 'cash-register') {
      goShop();
      return;
    }
    onOpen(section.id);
  };

  /** Activate a nav item by real index (loop-safe). */
  const activateIndex = (idx: number) => {
    const now = performance.now();
    // React slide onClick + Swiper onClick can both fire — take one.
    if (now - lastActivateAt.current < 450) return;
    lastActivateAt.current = now;

    const section = items[((idx % items.length) + items.length) % items.length];
    if (!section) return;

    if (section.id === 'cash-register') {
      goShop();
      return;
    }

    const sw = swiperRef.current;
    if (!sw) {
      openSection(section);
      return;
    }

    // Already the active (left) slot — open / toggle immediately.
    if (sw.realIndex === idx) {
      openSection(section);
      return;
    }

    if (transitioning.current) return;

    lockTransition(950);
    sw.slideToLoop(idx, 800);
    if (openTimer.current) clearTimeout(openTimer.current);
    openTimer.current = setTimeout(() => {
      clearTimers();
      openSection(section);
    }, 820);
  };

  return (
    <div
      className="top-nav-wrap"
      aria-label="Store sections"
      // Keep stage pan from starting when interacting with the conveyor.
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Swiper
        className="top-nav-swiper"
        loop
        slidesPerView={5}
        spaceBetween={16}
        speed={800}
        allowTouchMove
        slideToClickedSlide={false}
        watchSlidesProgress
        breakpoints={{
          0: { slidesPerView: 3.2, spaceBetween: 10 },
          570: { slidesPerView: 4, spaceBetween: 12 },
          900: { slidesPerView: 5, spaceBetween: 16 },
        }}
        onSwiper={(sw) => {
          swiperRef.current = sw;
          setRealIndex(sw.realIndex);
        }}
        onSlideChange={(sw) => {
          setRealIndex(sw.realIndex);
        }}
        onSlideChangeTransitionEnd={(sw) => {
          transitioning.current = false;
          if (transitionTimer.current) {
            clearTimeout(transitionTimer.current);
            transitionTimer.current = null;
          }
          setRealIndex(sw.realIndex);
          if (sw.realIndex >= items.length) {
            sw.slideToLoop(sw.realIndex % items.length, 0);
          }
        }}
        onClick={(sw) => {
          // Loop clones are outside React — Swiper's clickedRealIndex is authoritative.
          const raw = (sw as SwiperType & { clickedRealIndex?: number }).clickedRealIndex;
          const idx = typeof raw === 'number' ? raw : -1;
          if (idx < 0) return;
          activateIndex(idx);
        }}
      >
        {items.map((s, i) => {
          const open = activeId === s.id;
          const isActiveSlot = realIndex === i;
          const isShop = s.id === 'cash-register';

          return (
            <SwiperSlide key={s.id} className={`top-nav-slide${open ? ' is-open' : ''}`}>
              {isShop ? (
                <a
                  className={`top-nav-item${isActiveSlot ? ' is-active-slot' : ''}`}
                  href={SHOP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open Shop"
                  aria-current={open ? 'true' : undefined}
                  onClick={(e) => {
                    // Hard nav — don't also run Swiper onClick open path.
                    e.stopPropagation();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <span className="top-nav-label">{s.nav.toUpperCase()}</span>
                  <span className="top-nav-line" aria-hidden />
                </a>
              ) : (
                <button
                  type="button"
                  className={`top-nav-item${isActiveSlot ? ' is-active-slot' : ''}`}
                  aria-label={open && isActiveSlot ? `Close ${s.nav}` : `Open ${s.nav}`}
                  aria-current={open ? 'true' : undefined}
                  onClick={(e) => {
                    e.stopPropagation();
                    activateIndex(i);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <span className="top-nav-label">{s.nav.toUpperCase()}</span>
                  <span className="top-nav-line" aria-hidden />
                  {open && <span className="top-nav-close">×</span>}
                </button>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}
