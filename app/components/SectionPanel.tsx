'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
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

const MOBILE_MQ = '(max-width: 570px)';

function DetailBody({
  sectionId,
  detail,
  previewPlaying,
  onTogglePreview,
}: {
  sectionId: string;
  detail: SectionItem;
  previewPlaying: boolean;
  onTogglePreview: () => void;
}) {
  const links = outboundLinks(detail);
  const linkTitle =
    sectionId === 'cash-register'
      ? 'BUY / LISTEN:'
      : 'LISTEN ON:';

  return (
    <>
      <p className="panel-kicker">
        {SECTION_BY_ID[sectionId]?.kicker ?? 'Detail'}
      </p>
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
          onClick={onTogglePreview}
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

      {links.length > 0 && (
        <div className="panel-listen">
          <span className="streaming-title">{linkTitle}</span>
          <div className="panel-cta-wrap">
            {links.map((l) => (
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
    </>
  );
}

/**
 * Glass menu panel — balmingtiger `.menu-panel` pattern:
 * left-docked frosted glass, thumb rows + CTA pills, music/shop nested detail.
 *
 * Mobile (≤570px): nest opens as a dedicated bottom sheet (BT level-2-mobile),
 * covering the tray so tracklists / buy pills aren’t cramped.
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
  const [isMobile, setIsMobile] = useState(false);
  const level1 = useRef<HTMLDivElement>(null);
  const level2 = useRef<HTMLDivElement>(null);
  const nestSheet = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const backBtn = useRef<HTMLButtonElement>(null);
  const nestBackBtn = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => onPreviewChange(setPlayingSrc), []);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

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

  // Focus trap — desktop: panel; mobile nest: sheet; else panel.
  useEffect(() => {
    if (!open || !activeId) return;
    const root: HTMLElement | null =
      isMobile && detail ? nestSheet.current : panelRef.current;
    if (!root) return;

    const onTab = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const nodes = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else if (active === last || !root.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onTab, true);
    return () => window.removeEventListener('keydown', onTab, true);
  }, [open, activeId, detail, isMobile]);

  // Desktop: nest fades inside the panel. Mobile: sheet slides up separately.
  useEffect(() => {
    const a = level1.current;
    const b = level2.current;
    const sheet = nestSheet.current;
    const dur = reduceMotion ? 0 : 0.35;
    const dur2 = reduceMotion ? 0 : 0.4;

    if (isMobile) {
      // Keep level-1 fully visible under the sheet.
      if (a) gsap.set(a, { opacity: 1 });
      if (b) gsap.set(b, { opacity: 0 });
      if (sheet) {
        if (detail) {
          gsap.fromTo(
            sheet,
            { opacity: 0, y: reduceMotion ? 0 : 28 },
            {
              opacity: 1,
              y: 0,
              duration: dur2,
              ease: 'power2.out',
              overwrite: true,
            },
          );
          nestBackBtn.current?.focus({ preventScroll: true });
        } else {
          gsap.set(sheet, { opacity: 0, y: 16 });
          backBtn.current?.focus({ preventScroll: true });
        }
      }
      return;
    }

    if (!a) return;
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
  }, [detail, reduceMotion, isMobile]);

  // One scroll-active controller for the level-1 item list.
  useEffect(() => {
    const root = level1.current;
    if (!root || !open || !shownId) return;
    // On desktop, pause while nested; on mobile the tray stays usable under the sheet.
    if (detail && !isMobile) return;

    return attachScrollActiveItems(root, {
      itemSelector: '.panel-row',
      horizontalSelector: '[data-scroll-list]',
      enabled: true,
      reducedMotion: reduceMotion,
      hysteresisPx: 28,
    });
  }, [open, shownId, detail, reduceMotion, isMobile]);

  const section = shownId ? SECTION_BY_ID[shownId] : null;
  const nestable = section?.id === 'cash-register';
  const artistPanel = section?.id === 'record-bins';
  const heroKicker = section?.id === 'record-bins';

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
    if (item.videoSrc && onPlayCrt) {
      onPlayCrt(item.videoSrc);
      return;
    }
    if (!item.href) return;
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
  const desktopNest = Boolean(detail && !isMobile);
  const mobileNest = Boolean(detail && isMobile);

  let nestDetail: ReactNode = null;
  if (detail && section) {
    nestDetail = (
      <DetailBody
        sectionId={section.id}
        detail={detail}
        previewPlaying={previewPlaying}
        onTogglePreview={togglePreview}
      />
    );
  }

  return (
    <div
      className={`panel-root ${open ? 'open' : ''}${mobileNest ? ' has-mobile-nest' : ''}`}
      style={{ display: section ? 'block' : 'none' }}
      aria-hidden={!open}
    >
      <div className="panel-scrim" aria-hidden />
      <aside
        ref={panelRef}
        className={`panel${desktopNest ? ' has-detail' : ''}${mobileNest ? ' is-nesting' : ''}`}
        style={
          section
            ? ({ ['--panel-accent' as string]: section.accent } as React.CSSProperties)
            : undefined
        }
        role="dialog"
        aria-modal="true"
        aria-label={section?.title || section?.kicker || section?.nav}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          ref={backBtn}
          className="panel-back"
          onClick={handleBack}
          aria-label={detail && !isMobile ? 'Back' : 'Close'}
          data-cursor="click"
        >
          {detail && !isMobile ? 'Back' : '×'}
        </button>

        {section && (
          <>
            <div className="panel-level panel-level-1" ref={level1}>
              <p className={`panel-kicker${heroKicker ? ' is-hero' : ''}`}>
                {section.kicker}
              </p>
              {section.title ? (
                <h2 className="panel-title">{section.title}</h2>
              ) : null}
              {section.intro ? (
                <p className="panel-intro">{section.intro}</p>
              ) : null}

              {section.items.length === 0 ? (
                <p className="panel-intro panel-coming-soon">Coming soon.</p>
              ) : (
                <div
                  className={`panel-list${artistPanel ? ' panel-list--artist' : ''}`}
                  role="list"
                  data-scroll-list
                >
                  {section.items.map((it, i) => (
                    <article
                      key={i}
                      className={`panel-row${artistPanel ? ' panel-row--artist' : ''}${detail === it ? ' is-selected' : ''}`}
                      role="listitem"
                      tabIndex={0}
                      data-cursor="click"
                      aria-label={`${it.cta ?? 'Open'} ${it.label}`}
                      aria-current={detail === it ? 'true' : undefined}
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
                        {it.meta && (
                          <span className={`pc-meta${artistPanel ? ' pc-location' : ''}`}>
                            {it.meta}
                          </span>
                        )}
                        {artistPanel && it.href && it.detail ? (
                          <a
                            className="pc-outbound"
                            href={it.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-cursor="click"
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            {it.detail}
                          </a>
                        ) : (
                          it.detail && <span className="pc-detail">{it.detail}</span>
                        )}
                        {!artistPanel && (
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
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop nest — stays inside the left glass panel */}
            <div className="panel-level panel-level-2" ref={level2} aria-hidden={!desktopNest}>
              {desktopNest ? nestDetail : null}
            </div>
          </>
        )}
      </aside>

      {/* Mobile nest sheet — BT level-2-mobile principle, VCR styling */}
      {mobileNest && section && detail && (
        <div
          ref={nestSheet}
          className="panel-nest-sheet"
          style={{ ['--panel-accent' as string]: section.accent } as React.CSSProperties}
          role="dialog"
          aria-modal="true"
          aria-label={detail.label}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            ref={nestBackBtn}
            type="button"
            className="panel-back panel-nest-back"
            onClick={handleBack}
            aria-label="Back"
            data-cursor="click"
          >
            Back
          </button>
          <div className="panel-nest-inner">{nestDetail}</div>
        </div>
      )}
    </div>
  );
}
