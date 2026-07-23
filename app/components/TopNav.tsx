'use client';

import { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

import { NAV_ORDER, SECTIONS, SHOP_URL } from '@/app/data/sections';

const NAV_ITEMS = NAV_ORDER.map((id) => SECTIONS.find((s) => s.id === id)!).filter(Boolean);

/**
 * Conveyor top nav — balmingtiger MENU CONVEYOR pattern:
 * Swiper loop, ~5 visible labels, click slides chosen item into the
 * active (left) slot then opens that section.
 *
 * Shop is special (BT menu-shop): go straight to /shop/index.html — no lookto,
 * no conveyor delay. Uses a real <a> hit so navigation always works.
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
  const [realIndex, setRealIndex] = useState(0);
  const items = NAV_ITEMS;

  // Sync conveyor when a hotspot / panel opens a section.
  useEffect(() => {
    const sw = swiperRef.current;
    if (!sw || !activeId || transitioning.current) return;
    const idx = items.findIndex((s) => s.id === activeId);
    if (idx < 0) return;
    if (sw.realIndex === idx) return;
    transitioning.current = true;
    sw.slideToLoop(idx, 800);
  }, [activeId, items]);

  if (!visible) return null;

  const goShop = () => {
    // Hard navigate — same tab, catalog index. Do not wait on conveyor.
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

    // Clicking the already-active left slot toggles close via onOpen.
    if (slot === 0 && activeId === section.id) {
      openSection(section);
      return;
    }

    if (slot === 0) {
      openSection(section);
      return;
    }

    transitioning.current = true;
    sw.slideToLoop(targetReal, 800);
    window.setTimeout(() => {
      transitioning.current = false;
      openSection(section);
    }, 820);
  };

  return (
    <div className="top-nav-wrap" aria-label="Store sections">
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
          transitioning.current = false;
          setRealIndex(sw.realIndex);
          // Keep realIndex in the base set after loop jumps
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

      {/* Invisible hit zones over visible slots (balmingtiger .hit-b) */}
      <div className="top-nav-hits">
        {[0, 1, 2, 3, 4].map((slot) => {
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

          // Real anchor for Shop — works even if JS handlers are blocked mid-transition.
          if (isShop) {
            return (
              <a
                key={slot}
                className="top-nav-hit"
                href={SHOP_URL}
                aria-label={label}
                onClick={(e) => {
                  e.stopPropagation();
                  // Same-tab hard nav (default <a> behavior). Prevent double-handling.
                }}
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
