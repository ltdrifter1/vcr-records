'use client';

import { useLayoutEffect, useRef } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

import { SPHERE_RADIUS, uvToSpherical } from '@/lib/pano';
import { playSfx } from '@/lib/audio';
import { useSceneEnv, type Controls } from './sceneContext';

type AmbientHit = {
  id: string;
  u: number;
  v: number;
  w: number;
  h: number;
  sfx: string;
};

/**
 * Non-nav diegetic toys — balmingtiger cushion / globe class.
 * Invisible click meshes that only fire SFX (room rewards poking).
 */
const HITS: AmbientHit[] = [
  // Purple stool under the listening booth
  { id: 'stool', u: 0.19, v: 0.58, w: 3.2, h: 2.4, sfx: 'stool' },
  // Floor vinyl crate / smiley sleeve near the bins
  { id: 'crate', u: 0.46, v: 0.72, w: 4.5, h: 3.2, sfx: 'crate' },
  // High poster edge on the flyer wall
  { id: 'poster', u: 0.5, v: 0.28, w: 3.5, h: 3.5, sfx: 'poster' },
  // Soft seat / cushion feel near the counter front
  { id: 'cushion', u: 0.62, v: 0.68, w: 3.8, h: 2.6, sfx: 'cushion' },
];

const origin = new THREE.Vector3(0, 0, 0);

function AmbientMesh({
  hit,
  controls,
  debug,
}: {
  hit: AmbientHit;
  controls: Controls;
  debug?: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const env = useSceneEnv();
  const [x, y, z] = uvToSpherical(hit.u, hit.v, SPHERE_RADIUS - 0.55);

  useLayoutEffect(() => {
    mesh.current?.lookAt(origin);
  }, [x, y, z]);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!env.live.value || controls.dragged || controls.lookAnimating) return;
    playSfx(hit.sfx);
  };

  return (
    <mesh
      ref={mesh}
      position={[x, y, z]}
      renderOrder={1}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!env.live.value) return;
        document.documentElement.classList.add('cursor-hot');
      }}
      onPointerOut={() => {
        document.documentElement.classList.remove('cursor-hot');
      }}
      userData={{ ambientId: hit.id }}
    >
      <planeGeometry args={[hit.w, hit.h]} />
      <meshBasicMaterial
        transparent
        opacity={debug ? 0.22 : 0}
        color={debug ? '#7dffb3' : '#ffffff'}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

export default function AmbientHits({
  controls,
  debug = false,
}: {
  controls: Controls;
  debug?: boolean;
}) {
  return (
    <group>
      {HITS.map((hit) => (
        <AmbientMesh key={hit.id} hit={hit} controls={controls} debug={debug} />
      ))}
    </group>
  );
}
