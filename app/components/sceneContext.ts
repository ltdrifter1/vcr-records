'use client';

import { createContext, useContext } from 'react';
import type { Controls, Vec2 } from '@/lib/navigation/types';

export type { Controls, Vec2 };

export type SceneEnv = {
  look: Vec2;
  time: number;
  /** Hotspots / hints live only after intro unlocks look. */
  live: { value: boolean };
  panelOpen: { value: boolean };
  reduceMotion: boolean;
  /** Glow latch id — follow-mouse lean stays off while set. */
  focusedId: { value: string | null };
};

export const SceneContext = createContext<SceneEnv | null>(null);

export function useSceneEnv(): SceneEnv {
  const ctx = useContext(SceneContext);
  if (!ctx) throw new Error('useSceneEnv must be used within SceneContext');
  return ctx;
}
