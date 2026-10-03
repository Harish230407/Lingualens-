import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { isWebGLAvailable } from '../utils/webglSupport';

interface ThreeAudioVisualizerProps {
  isPlaying: boolean;
  className?: string;
  accentColor?: string;
}

export const ThreeAudioVisualizer: React.FC<ThreeAudioVisualizerProps> = ({
  isPlaying,
  className = '',
  accentColor = '#10b981',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    if (!isWebGLAvailable()) {
      setHasWebGLError(true);
      return;
    }

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 140;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 8);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
    } catch (err) {
      console.warn('ThreeAudioVisualizer WebGL context creation failed, using 2D fallback:', err);
      setHasWebGLError(true);
      return;
    }

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setHasWebGLError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    // Audio Wave Rings (Concentric 3D ribbons)
    const ringCount = 14;
    const rings: THREE.LineLoop[] = [];

    const parsedColor = new THREE.Color(accentColor);

    for (let r = 0; r < ringCount; r++) {
      const radius = 1.2 + r * 0.22;
      const pointsCount = 48;
      const points: THREE.Vector3[] = [];

      for (let i = 0; i < pointsCount; i++) {
        const theta = (i / pointsCount) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
      }

      const ringGeo = new THREE.BufferGeometry().setFromPoints(points);
      const ringMat = new THREE.LineBasicMaterial({
        color: parsedColor,
        transparent: true,
        opacity: Math.max(0.15, 1 - (r / ringCount) * 0.85),
      });

      const lineLoop = new THREE.LineLoop(ringGeo, ringMat);
      lineLoop.userData = { initialRadius: radius, ringIdx: r };
      scene.add(lineLoop);
      rings.push(lineLoop);
    }

    // Center Core Sphere
    const coreGeo = new THREE.SphereGeometry(0.7, 24, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: parsedColor,
      wireframe: true,
      transparent: true,
      opacity: 0.4,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    scene.add(coreMesh);

    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      const intensity = isPlaying ? 1.0 : 0.2;

      // Rotate scene slowly
      scene.rotation.y = t * 0.4;
      scene.rotation.x = Math.sin(t * 0.3) * 0.2;

      coreMesh.rotation.y += 0.02 * (isPlaying ? 2.5 : 0.8);
      const coreScale = 1 + (isPlaying ? Math.sin(t * 12) * 0.18 : Math.sin(t * 2) * 0.04);
      coreMesh.scale.set(coreScale, coreScale, coreScale);

      rings.forEach((ring) => {
        const rIdx = ring.userData.ringIdx;
        const geo = ring.geometry as THREE.BufferGeometry;
        const posAttr = geo.attributes.position;
        const count = posAttr.count;

        for (let i = 0; i < count; i++) {
          const theta = (i / count) * Math.PI * 2;
          const baseR = ring.userData.initialRadius;
          const wave = isPlaying
            ? Math.sin(theta * 6 + t * 8 + rIdx) * 0.25 * intensity
            : Math.sin(theta * 3 + t * 1.5 + rIdx) * 0.04;

          const currentR = baseR + wave;
          const zOffset = isPlaying ? Math.cos(theta * 4 + t * 5) * 0.35 : 0;

          posAttr.setXYZ(i, Math.cos(theta) * currentR, Math.sin(theta) * currentR, zOffset);
        }
        posAttr.needsUpdate = true;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 140;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        renderer.domElement?.removeEventListener('webglcontextlost', onContextLost);
        renderer.dispose();
      }
      scene.clear();
      if (renderer && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [isPlaying, accentColor]);

  if (hasWebGLError) {
    return (
      <div className={`w-full relative flex items-center justify-center py-4 overflow-hidden ${className}`}>
        {/* Animated 2D Audio Equalizer Bars Fallback */}
        <div className="flex items-center gap-1.5 h-14 px-4">
          {[0.4, 0.7, 0.95, 0.6, 0.85, 0.5, 0.75, 1.0, 0.45, 0.8, 0.6, 0.35].map((val, idx) => (
            <div
              key={idx}
              className="w-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: accentColor,
                height: isPlaying ? `${Math.max(14, val * 48)}px` : '8px',
                opacity: isPlaying ? 0.9 : 0.35,
                animation: isPlaying ? `pulse 1.2s ease-in-out infinite ${idx * 0.08}s` : 'none',
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      className={`w-full relative flex items-center justify-center overflow-hidden ${className}`}
    />
  );
};
