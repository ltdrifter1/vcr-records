'use client';

import { useCallback, useEffect, useState } from 'react';
import { isMuted, onMuteChange, setMuted } from '@/lib/audio';

/**
 * balmingtiger mute toggle — bottom-right (mobile top-right).
 * Fades out during Videos focus instead of unmounting.
 * Starts muted until CLICK TO ENTER unmutes the bus.
 */
export default function MuteControl({
  visible,
  faded = false,
}: {
  visible: boolean;
  /** Hide during CRT video focus (0.3s opacity tween). */
  faded?: boolean;
}) {
  const [muted, setMutedState] = useState(true);

  useEffect(() => {
    setMutedState(isMuted());
    return onMuteChange(setMutedState);
  }, []);

  const toggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Rely on the bus notify() for UI state — avoids optimistic desync
    // when play() fails under autoplay policy.
    await setMuted(!isMuted());
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className={`mute-control${faded ? ' is-faded' : ''}`}
      onClick={(e) => void toggle(e)}
      onPointerDown={(e) => e.stopPropagation()}
      aria-label={muted ? 'Unmute' : 'Mute'}
      aria-pressed={!muted}
      title={muted ? 'Unmute' : 'Mute'}
      data-cursor="click"
      tabIndex={faded ? -1 : 0}
    >
      <img
        src={muted ? '/cursors/mute.svg' : '/cursors/unmute.svg'}
        alt=""
        width={28}
        height={28}
        draggable={false}
      />
    </button>
  );
}
