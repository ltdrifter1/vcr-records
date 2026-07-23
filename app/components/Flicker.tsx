'use client';

import { useMemo } from 'react';
import { makeDotTexture } from '@/lib/sprites';
import { AdditiveQuad } from './LightBeams';

/**
 * Soft signage breath — neon / CRT practicals welded to equirect UVs.
 * Kept low so the cel room stays readable (BT-like life without glare).
 */
export default function Flicker() {
  const glow = useMemo(() => makeDotTexture('#ffffff'), []);

  return (
    <group>
      {/* Neon RECORDS / door practicals */}
      <AdditiveQuad u={0.12} v={0.32} w={2.4} h={1.2} tex={glow} color="#7ad7ff" base={0.22} flickerSpeed={1.4} flickerAmount={0.12} spike />
      {/* CRT cyan wash */}
      <AdditiveQuad u={0.3} v={0.42} w={2.6} h={2.2} tex={glow} color="#7ad7ff" base={0.18} flickerSpeed={0.9} flickerAmount={0.08} />
      {/* Flyer / phone wall accent */}
      <AdditiveQuad u={0.48} v={0.34} w={2.0} h={1.6} tex={glow} color="#ff8a1e" base={0.14} flickerSpeed={1.8} flickerAmount={0.1} spike />
      {/* Listening booth warm spill */}
      <AdditiveQuad u={0.2} v={0.38} w={2.2} h={2.4} tex={glow} color="#ffc070" base={0.12} flickerSpeed={0.7} flickerAmount={0.06} />
    </group>
  );
}
