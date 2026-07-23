'use client';

import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

import { NAV_ORDER, SECTIONS, SHOP_URL } from '@/app/data/sections';

const NAV_ITEMS = NAV_ORDER.map((id) => SECTIONS.find((s) => s.id === id)!).filter(Boolean);

function slotCountForWidth(w: number) {
  if (w <= 570) return 3;
  if (w <= 900) return 4;
  return 5;
}

/**
 * Conveyor top nav — balmingtiger MENU CONVEYOR pattern.
 *
 * Hit zones are a CSS grid matched to the visible slide count (not a
 * space-between flex that drifted from Swiper's slide geometry). That
 * misalignment previously left dead click areas between labels.
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
  const [realIndex, setRealIndex] = useState(0);
  const [slots, setSlots] = useState(5);
  const items = NAV_ITEMS;

  useEffect(() => {
    const sync = () => setSlots(slotCountForWidth(window.innerWidth));
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  const clearTransitionLock = () => {
    transitioning.current = false;
    if (transitionTimer.current) {
      clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
  };

  const lockTransition = (ms = 900) => {
    transitioning.current = true;
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    // Failsafe — Swiper loop can skip transitionEnd; never leave clicks dead.
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

  useEffect(() => () => clearTransitionLock(), []);

  if (!visible) return null;

  const goShop = () => {
    window.location.assign(SHOP_URL);
  };

  const openSection = (section: (typeof items)[number]) => {
    if (section.id === 'cash-register') {
      goShop();
      return;
    }
    onOpen(section.id);
  };

  const openAtSlot = (slot: number) => {
    const sw = swiperRef.current;
    if (!sw) return;

    const targetReal = (sw.realIndex + slot) % items.length;
    const section = items[targetReal];
    if (!section) return;

    // Shop: navigate immediately (ignore conveyor transition lock / delay).
    if (section.id === 'cash-register') {
      goShop();
      return;
    }

    if (transitioning.current) return;

    if (slot === 0) {
      openSection(section);
      return;
    }

    lockTransition(950);
    sw.slideToLoop(targetReal, 800);
    window.setTimeout(() => {
      clearTransitionLock();
      openSection(section);
    }, 820);
  };

  return (
    <div
      className="top-nav-wrap"
      aria-label="Store sections"
      style={
        {
          ['--nav-slots' as string]: String(slots),
        } as React.CSSProperties
      }
    >
      <Swiper
        className="top-nav-swiper"
        loop
        slidesPerView={5}
        spaceBetween={16}
        speed={800}
        allowTouchMove={false}
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
          clearTransitionLock();
          setRealIndex(sw.realIndex);
          if (sw.realIndex >= items.length) {
            sw.slideToLoop(sw.realIndex % items.length, 0);
          }
        }}
      >
        {items.map((s) => {
          const open = activeId === s.id;
          return (
            <SwiperSlide key={s.id} className={`top-nav-slide${open ? ' is-open' : ''}`}>
              <div className="top-nav-item" aria-current={open ? 'true' : undefined}>
                <span className="top-nav-label">{s.nav.toUpperCase()}</span>
                <span className="top-nav-line" aria-hidden />
                {open && <span className="top-nav-close">×</span>}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Hit zones — grid aligned to visible slots */}
      <div className="top-nav-hits" role="presentation">
        {Array.from({ length: slots }, (_, slot) => {
          const targetReal = (realIndex + slot) % items.length;
          const section = items[targetReal];
          const isShop = section?.id === 'cash-register';
          const label = section
            ? isShop
              ? 'Open Shop'
              : slot === 0 && activeId === section.id
                ? `Close ${section.nav}`
                : `Open ${section.nav}`
            : `Open nav slot ${slot + 1}`;

          if (isShop) {
            return (
              <a
                key={slot}
                className="top-nav-hit"
                href={SHOP_URL}
                aria-label={label}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              />
            );
          }

          return (
            <button
              key={slot}
              type="button"
              className="top-nav-hit"
              aria-label={label}
              onClick={(e) => {
                e.stopPropagation();
                openAtSlot(slot);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            />
          );
        })}
      </div>
    </div>
  );
}
