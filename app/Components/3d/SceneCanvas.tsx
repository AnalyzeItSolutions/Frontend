'use client';

import React, { useState, useEffect, MutableRefObject } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { SkyDome } from './SkyDome';
import { AtmosphereLayer, FOG_COLORS } from './AtmosphereLayer';
import { CentralCrystalModel } from './CentralCrystalModel';
import { CameraRig } from './CameraRig';
import { useTheme } from '../ui/ThemeProvider';

interface SceneCanvasProps {
  scrollProgressRef: MutableRefObject<number>;
  isLoaded?: boolean;
  isCanvasVisible?: boolean;
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  scrollProgressRef,
  isLoaded = true,
  isCanvasVisible = true,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isCapable, setIsCapable] = useState(true);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const clearColor = isDark ? '#121212' : '#F8F8F8';

  useEffect(() => {
    setMounted(true);

    try {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2;
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (prefersReduced || lowCores || !gl) {
        setIsCapable(false);
      }
    } catch {
      setIsCapable(true);
    }
  }, []);

  if (!mounted || !isCapable) {
    return (
      <div className="fixed inset-0 w-full h-full z-0 bg-gradient-to-b from-[#DADADA] via-[#E3E3E3] to-[#F8F8F8] dark:from-[#1F1F1F] dark:via-[#191919] dark:to-[#121212] pointer-events-none" />
    );
  }

  return (
    <div
      id="playcanvas-wrapper"
      className={`fixed inset-0 w-full h-full z-0 pointer-events-none transition-opacity duration-500 ${
        isCanvasVisible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: clearColor }}
    >
      <Canvas
        camera={{ position: [0, 2.8, 11.5], fov: 48, near: 0.1, far: 200 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={[1, 1.5]}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(new THREE.Color(clearColor), 1);
          scene.background = new THREE.Color(clearColor);
        }}
      >
        <color attach="background" args={[clearColor]} />
        <fog attach="fog" args={[isDark ? FOG_COLORS.dark : FOG_COLORS.light, 12, 42]} />

        <ambientLight intensity={isDark ? 0.32 : 1.1} color={isDark ? '#B9B9B9' : '#FFFFFF'} />
        <hemisphereLight
          intensity={isDark ? 0.28 : 0.7}
          groundColor={isDark ? '#121212' : '#DEDEDE'}
          color={isDark ? '#4A3F52' : '#D5C5E5'}
        />
        <directionalLight
          position={[12, 16, 10]}
          intensity={isDark ? 0.95 : 1.4}
          color={isDark ? '#E8C4A0' : '#F5F5F5'}
        />
        <directionalLight
          position={[-10, -6, -8]}
          intensity={isDark ? 0.25 : 0.4}
          color={isDark ? '#3A2E48' : '#C5B8D8'}
        />

        <SkyDome scrollProgressRef={scrollProgressRef} />
        <AtmosphereLayer scrollProgressRef={scrollProgressRef} />

        <Sparkles
          count={60}
          scale={[24, 12, 24]}
          position={[0, 0.5, 0]}
          size={isDark ? 3.4 : 2.9}
          speed={0.18}
          opacity={isDark ? 0.72 : 0.58}
          color={isDark ? '#F2F2F2' : '#E8C4A0'}
        />

        <CentralCrystalModel scrollProgressRef={scrollProgressRef} />
        <CameraRig scrollProgressRef={scrollProgressRef} isLoaded={isLoaded} />
      </Canvas>
    </div>
  );
};
