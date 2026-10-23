'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from './Navbar';
import { InspectDrawer, DrawerDetail } from './InspectDrawer';
import { LandingProgressContext } from './LandingProgressContext';
import { CrystalBackdrop } from './CrystalBackdrop';

const SceneCanvas = dynamic(
  () => import('../3d/SceneCanvas').then((mod) => mod.SceneCanvas),
  { ssr: false }
);

type BackdropTier = 'pending' | 'webgl' | 'css';

/**
 * The 3D scene needs a real GPU. Software rasterizers (SwiftShader, llvmpipe) draw every frame on the CPU and
 * freeze the page, and Reduce Motion asks for stillness; both get the CSS crystal, which never downloads three.js.
 */
function pickBackdropTier(): BackdropTier {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'css';
    if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2) return 'css';
    const canvas = document.createElement('canvas');
    // failIfMajorPerformanceCaveat refuses software-only contexts.
    const gl = (canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true }) ||
      canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true })) as WebGLRenderingContext | null;
    if (!gl) return 'css';
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /swiftshader|llvmpipe|software|basic render/i.test(renderer) ? 'css' : 'webgl';
  } catch {
    return 'css';
  }
}

export function LandingExperience({ children }: { children: React.ReactNode }) {
  const [showSkip, setShowSkip] = useState(true);
  const [isCanvasVisible, setIsCanvasVisible] = useState(true);
  const [tier, setTier] = useState<BackdropTier>('pending');
  useEffect(() => setTier(pickBackdropTier()), []);
  const [inspectedDetail, setInspectedDetail] = useState<DrawerDetail | null>(null);
  const scrollProgressRef = useRef(0);

  useEffect(() => {
    let ticking = false;
    let lastSkip = true;
    let lastVisible = true;

    const compute = () => {
      const scrollY = window.scrollY;
      const totalScroll = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        1
      );
      const descentEl = document.getElementById('descent');
      const capabilitiesEl = document.getElementById('capabilities');

      if (descentEl) {
        const rect = descentEl.getBoundingClientRect();
        const travel = Math.max(descentEl.offsetHeight - window.innerHeight, 1);
        scrollProgressRef.current = Math.min(Math.max(-rect.top / travel, 0), 1);
      } else {
        scrollProgressRef.current = 0;
      }

      const nextSkip = scrollProgressRef.current < 0.98;
      if (nextSkip !== lastSkip) {
        lastSkip = nextSkip;
        setShowSkip(nextSkip);
      }

      const isPastDescent = capabilitiesEl
        ? capabilitiesEl.getBoundingClientRect().top < window.innerHeight * 0.15
        : false;
      const isAtClosing = scrollY > totalScroll - window.innerHeight * 1.5;
      const nextVisible = !isPastDescent || isAtClosing;
      if (nextVisible !== lastVisible) {
        lastVisible = nextVisible;
        setIsCanvasVisible(nextVisible);
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        compute();
        ticking = false;
      });
    };

    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const contextValue = useMemo(
    () => ({ setInspectedDetail }),
    []
  );

  return (
    <div
      id="main-content"
      className="relative min-h-screen bg-transparent text-ink selection:bg-coral/30 selection:text-ink overflow-x-hidden"
      style={{ ['--nav-h' as string]: '96px' }}
    >
      {showSkip && (
        <a
          href="#capabilities"
          className="fixed bottom-5 right-5 z-30 hidden md:inline-flex min-h-11 px-4 rounded-full bg-[var(--text-primary)] text-[var(--bg)] text-sm font-medium shadow-lg pointer-events-auto items-center xl:right-8"
          onClick={(e) => {
            e.preventDefault();
            const el = document.getElementById('capabilities');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
        >
          Skip animation
        </a>
      )}

      <InspectDrawer detail={inspectedDetail} onClose={() => setInspectedDetail(null)} />
      {tier === 'css' ? (
        <CrystalBackdrop scrollProgressRef={scrollProgressRef} isVisible={isCanvasVisible} />
      ) : (
        <div className="fixed inset-0 z-0 pointer-events-none bg-gradient-to-b from-[#DADADA] via-[#E3E3E3] to-[#F8F8F8] dark:from-[#1F1F1F] dark:via-[#1B1B1B] dark:to-[#1B1B1B]" />
      )}
      {tier === 'webgl' && (
        <SceneCanvas scrollProgressRef={scrollProgressRef} isLoaded isCanvasVisible={isCanvasVisible} />
      )}
      <Navbar />

      <LandingProgressContext.Provider value={contextValue}>
        {children}
      </LandingProgressContext.Provider>
    </div>
  );
}
