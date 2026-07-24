'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import gsap from 'gsap';

import { SECTION_BY_ID, type SectionItem } from '@/app/data/sections';
import { attachScrollActiveItems } from '@/lib/scrollActiveItems';
import {
  onPreviewChange,
  playPreview,
  stopPreview,
} from '@/lib/audio';

function canNest(item: SectionItem) {
  return Boolean(
    item.tracks?.length || item.listenOn?.length || item.previewSrc || item.body,
  );
}

function outboundLinks(item: SectionItem) {
  return (item.listenOn ?? []).filter((l) => l.href && !l.href.startsWith('#'));
}

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Glass menu panel — balmingtiger `.menu-panel` pattern:
 * left-docked frosted glass, thumb rows + CTA pills, music/shop/lore nested detail.
 *
 * Scroll-near: one `.panel-row` nearest the scroller center gets
 * `data-scroll-active` (glow + restrained scale). Scroll is source of truth.
 */
export default function SectionPanel({
  activeId,
  onClose,
  onPlayCrt,
  reduceMotion = false,
}: {
  activeId: string | null;
  onClose: () => void;
  /** Play a local video on the in-room CRT (Videos section). */
  onPlayCrt?: (src: string) => void;
  reduceMotion?: boolean;
}) {
  const [shownId, setShownId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<SectionItem | null>(null);
  const [playingSrc, setPlayingSrc] = useState<string | null>(null);
  const level1 = useRef<HTMLDivElement>(null);
  const level2 = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const backBtn = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => onPreviewChange(setPlayingSrc), []);

  useEffect(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);

    if (activeId) {
      setShownId(activeId);
      setDetail(null);
      const raf = requestAnimationFrame(() => {
        setOpen(true);
        backBtn.current?.focus({ preventScroll: true });
      });
      return () => cancelAnimationFrame(raf);
    }

    setOpen(false);
    setDetail(null);
    stopPreview();
    closeTimer.current = setTimeout(() => setShownId(null), reduceMotion ? 0 : 420);
  }, [activeId, reduceMotion]);

  useEffect(() => {
    if (!activeId) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detail) {
          setDetail(null);
          stopPreview();
        } else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, detail, onClose]);

  // Focus trap while the glass panel is open (TopNav stays mouse-reachable).
  useEffect(() => {
    if (!open || !activeId) return;
    const panel = panelRef.current;
    if (!panel) return;

    const onTab = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !panel.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onTab, true);
    return () => window.removeEventListener('keydown', onTab, true);
  }, [open, activeId, detail]);

  // Nested detail fade (balmingtiger openSingleAlbum 0.4s power1.inOut)
  useEffect(() => {
    const a = level1.current;
    const b = level2.current;
    if (!a) return;
    const dur = reduceMotion ? 0 : 0.35;
    const dur2 = reduceMotion ? 0 : 0.4;
    if (detail) {
      gsap.to(a, { opacity: 0, duration: dur, ease: 'power1.inOut', overwrite: true });
      if (b) {
        gsap.fromTo(
          b,
          { opacity: 0 },
          { opacity: 1, duration: dur2, ease: 'power1.inOut', overwrite: true },
        );
      }
    } else {
      gsap.to(a, { opacity: 1, duration: dur, ease: 'power1.inOut', overwrite: true });
      if (b) gsap.set(b, { opacity: 0 });
    }
  }, [detail, reduceMotion]);

  // One scroll-active controller for the level-1 item list.
  useEffect(() => {
    const root = level1.current;
    if (!root || !open || !shownId || detail) return;

    return attachScrollActiveItems(root, {
      itemSelector: '.panel-row',
      horizontalSelector: '[data-scroll-list]',
      enabled: true,
      reducedMotion: reduceMotion,
      hysteresisPx: 28,
    });
  }, [open, shownId, detail, reduceMotion]);

  const section = shownId ? SECTION_BY_ID[shownId] : null;
  const nestable =
    section?.id === 'listening-booth' ||
    section?.id === 'cash-register' ||
    section?.id === 'flyer-wall' ||
    section?.id === 'back-room-door';

  const handleBack = () => {
    if (detail) {
      setDetail(null);
      stopPreview();
      return;
    }
    onClose();
  };

  const openOutbound = (href: string) => {
    if (href.startsWith('mailto:')) {
      window.location.href = href;
      return;
    }
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const openItem = (item: SectionItem) => {
    if (nestable && canNest(item)) {
      setDetail(item);
      return;
    }
    // Videos: stay in the room — swap the CRT channel.
    if (item.videoSrc && onPlayCrt) {
      onPlayCrt(item.videoSrc);
      return;
    }
    if (!item.href) return;
    // Keep browsing in-world — never eject to the legacy /shop HTML catalog.
    if (item.href.startsWith('/shop')) return;
    openOutbound(item.href);
  };

  const onRowKey = (e: KeyboardEvent<HTMLElement>, item: SectionItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openItem(item);
    }
  };

  const togglePreview = () => {
    if (!detail?.previewSrc) return;
    void playPreview(detail.previewSrc);
  };

  const previewPlaying = Boolean(detail?.previewSrc && playingSrc === detail.previewSrc);

  return (
    <div
      className={`panel-root ${open ? 'open' : ''}`}
      style={{ display: section ? 'block' : 'none' }}
      aria-hidden={!open}
    >
      {/*
        Scrim does not capture the panorama (BT: drag while panel open).
        Soft close via × / Esc / nav toggle — camera stays on the canvas.
        CRT drag-end resets to front (BT video Observer).
      */}
      <div className="panel-scrim" aria-hidden />
      <aside
        ref={panelRef}
        className={`panel${nestable && detail ? ' has-detail' : ''}`}
        style={
          section
            ? ({ ['--panel-accent' as string]: section.accent } as React.CSSProperties)
            : undefined
        }
        role="dialog"
        aria-modal="true"
        aria-label={section?.title}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          ref={backBtn}
          className="panel-back"
          onClick={handleBack}
          aria-label={detail ? 'Back' : 'Close'}
          data-cursor="click"
        >
          {detail ? 'BACK' : '×'}
        </button>

        {section && (
          <>
            <div className="panel-level panel-level-1" ref={level1}>
              <p className="panel-kicker">{section.kicker}</p>
              <h2 className="panel-title">{section.title}</h2>
              <p className="panel-intro">{section.intro}</p>

              <div className="panel-list" role="list" data-scroll-list>
                {section.items.map((it, i) => (
                  <article
                    key={i}
                    className="panel-row"
                    role="listitem"
                    tabIndex={0}
                    data-cursor="click"
                    aria-label={`${it.cta ?? 'Open'} ${it.label}`}
                    onClick={() => openItem(it)}
                    onKeyDown={(e) => onRowKey(e, it)}
                  >
                    <div
                      className={`panel-thumb${it.thumbSrc ? ' has-art' : ''}`}
                      style={
                        it.thumbSrc
                          ? undefined
                          : {
                              background: `color-mix(in srgb, ${section.accent} 55%, #1a1410)`,
                            }
                      }
                      aria-hidden
                    >
                      {it.thumbSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.thumbSrc} alt="" width={72} height={72} loading="lazy" />
                      ) : (
                        <span>{it.thumb ?? String(i + 1).padStart(2, '0')}</span>
                      )}
                    </div>
                    <div className="panel-row-body">
                      <span className="pc-label">{it.label}</span>
                      {it.meta && <span className="pc-meta">{it.meta}</span>}
                      {it.detail && <span className="pc-detail">{it.detail}</span>}
                      <div className="panel-cta-wrap">
                        {(it.cta || (nestable && canNest(it)) || it.videoSrc) && (
                          <span className="panel-cta">{it.cta ?? 'Open'}</span>
                        )}
                        {it.videoSrc && it.href && !it.href.startsWith('/shop') ? (
                          <a
                            className="panel-cta panel-cta-pill panel-cta-secondary"
                            href={it.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-cursor="click"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            Open page
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {detail && (
              <div className="panel-level panel-level-2" ref={level2}>
                <p className="panel-kicker">{section.kicker}</p>
                <h2 className="panel-title panel-title-sm">{detail.label}</h2>
                {detail.meta && (
                  <p className="panel-intro">
                    {detail.meta}
                    {detail.detail ? ` · ${detail.detail}` : ''}
                  </p>
                )}

                {detail.thumbSrc && (
                  <div className="panel-detail-art" aria-hidden>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={detail.thumbSrc} alt="" width={120} height={120} />
                  </div>
                )}

                {detail.body && <p className="panel-body">{detail.body}</p>}

                {detail.previewSrc && (
                  <button
                    type="button"
                    className={`panel-preview-btn${previewPlaying ? ' is-playing' : ''}`}
                    onClick={togglePreview}
                    data-cursor="click"
                    aria-pressed={previewPlaying}
                  >
                    {previewPlaying ? 'Stop preview' : 'Play preview'}
                  </button>
                )}

                {detail.tracks && detail.tracks.length > 0 && (
                  <ul className="panel-tracks">
                    {detail.tracks.map((t, i) => (
                      <li key={i}>
                        <span>{t.title}</span>
                        {t.duration && <span className="track-dur">{t.duration}</span>}
                      </li>
                    ))}
                  </ul>
                )}

                {outboundLinks(detail).length > 0 && (
                  <div className="panel-listen">
                    <span className="streaming-title">
                      {section.id === 'cash-register'
                        ? 'BUY / LISTEN:'
                        : section.id === 'flyer-wall' || section.id === 'back-room-door'
                          ? 'LINKS:'
                          : 'LISTEN ON:'}
                    </span>
                    <div className="panel-cta-wrap">
                      {outboundLinks(detail).map((l) => (
                        <a
                          key={l.label}
                          className="panel-cta panel-cta-pill"
                          href={l.href}
                          target={l.href.startsWith('mailto:') ? undefined : '_blank'}
                          rel={l.href.startsWith('mailto:') ? undefined : 'noreferrer'}
                          data-cursor="click"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {l.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </aside>
    </div>
  );
}
