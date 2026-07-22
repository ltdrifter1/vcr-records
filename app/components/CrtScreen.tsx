'use client';

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';

import { SPHERE_RADIUS, uvToSpherical } from '@/lib/pano';
import { SECTION_BY_ID } from '@/app/data/sections';
import { setBgmDucked } from '@/lib/audio';

const origin = new THREE.Vector3(0, 0, 0);
const crt = SECTION_BY_ID['crt-tv'];
export const CRT_DEFAULT_SRC = '/videos/crt_loop.mp4';

/**
 * CRT video plane — balmingtiger TV videoplayer pattern:
 * alpha 0 until Videos is focused; fade in 0.4s; unmute + BGM duck
 * only after lookto completes (`armed`). Panel picks swap `src` in-place
 * (stay in the room — no window.open for primary Watch).
 */
export default function CrtScreen({
  activeId,
  armed = false,
  src = CRT_DEFAULT_SRC,
}: {
  activeId: string | null;
  /** True after lookto finishes on the CRT (or reduce-motion instant open). */
  armed?: boolean;
  /** Channel / clip URL played on the tube. */
  src?: string;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const opacity = useRef({ a: 0 });
  const revealed = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const texRef = useRef<THREE.VideoTexture | null>(null);
  const playing = activeId === 'crt-tv' && armed;
  const [x, y, z] = useMemo(
    () => uvToSpherical(crt.u, crt.v, SPHERE_RADIUS - 0.8),
    [],
  );

  // Own the <video> so we can swap channels without remounting the mesh.
  useLayoutEffect(() => {
    const video = document.createElement('video');
    video.src = src;
    video.crossOrigin = 'anonymous';
    video.loop = true;
    video.playsInline = true;
    video.muted = true;
    video.preload = 'auto';
    videoRef.current = video;

    const tex = new THREE.VideoTexture(video);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    texRef.current = tex;
    if (mat.current) {
      mat.current.map = tex;
      mat.current.needsUpdate = true;
    }

    return () => {
      video.pause();
      video.removeAttribute('src');
      video.load();
      tex.dispose();
      videoRef.current = null;
      texRef.current = null;
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const next = src || CRT_DEFAULT_SRC;
    const current = video.getAttribute('src') || '';
    if (current === next) return;
    const wasPlaying = !video.paused;
    video.src = next;
    video.setAttribute('src', next);
    video.load();
    if (wasPlaying || playing) {
      void video.play().catch(() => {});
    }
  }, [src, playing]);

  useEffect(() => {
    if (mat.current && texRef.current && mat.current.map !== texRef.current) {
      mat.current.map = texRef.current;
      mat.current.needsUpdate = true;
    }
  }, [playing, src]);

  useLayoutEffect(() => {
    mesh.current?.lookAt(origin);
  }, [x, y, z]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setBgmDucked(playing);

    if (playing) {
      if (!revealed.current) {
        revealed.current = true;
        gsap.fromTo(
          opacity.current,
          { a: 0 },
          { a: 1, duration: 0.4, ease: 'power1.inOut', overwrite: true },
        );
      } else {
        gsap.to(opacity.current, {
          a: 1,
          duration: 0.4,
          ease: 'power1.inOut',
          overwrite: true,
        });
      }
      video.muted = false;
      video.volume = 0;
      const vol = { v: 0 };
      gsap.to(vol, {
        v: 0.55,
        duration: 0.6,
        ease: 'power1.inOut',
        onUpdate: () => {
          video.volume = vol.v;
        },
      });
      void video.play().catch(() => {
        video.muted = true;
        void video.play().catch(() => {});
      });
    } else {
      gsap.to(opacity.current, {
        a: 0,
        duration: 0.35,
        ease: 'power1.inOut',
        overwrite: true,
      });
      video.muted = true;
      video.volume = 0;
      video.pause();
    }

    return () => setBgmDucked(false);
  }, [playing]);

  useFrame(() => {
    if (mat.current) mat.current.opacity = opacity.current.a;
    if (texRef.current) texRef.current.needsUpdate = true;
  });

  return (
    <mesh ref={mesh} position={[x, y, z]} renderOrder={2}>
      <planeGeometry args={[crt.w * 0.55, crt.h * 0.48]} />
      <meshBasicMaterial
        ref={mat}
        toneMapped={false}
        side={THREE.DoubleSide}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}
