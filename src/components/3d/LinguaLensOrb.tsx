import React, { useEffect, useRef, useState } from 'react';
import { OrbEngine, LANGUAGE_NODES } from './OrbScene.ts';
import { LinguaLensOrbProps, LanguageNodeConfig } from './OrbTypes.ts';
import { OrbFallback } from './OrbFallback.tsx';
import { playHapticTick } from '../../utils/audioHaptics.ts';
import { isWebGLAvailable } from '../../utils/webglSupport.ts';

export const LinguaLensOrb: React.FC<LinguaLensOrbProps> = ({
  state = 'IDLE',
  activeLanguages = [],
  isCodeSwitched = false,
  learningLanguage,
  size = 'responsive',
  interactive = true,
  showLanguageLabels = true,
  onClick,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<OrbEngine | null>(null);

  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<LanguageNodeConfig | null>(null);
  const [pulseCount, setPulseCount] = useState(0);

  const sizeClasses =
    size === 'sm'
      ? 'w-24 h-24'
      : size === 'md'
      ? 'w-48 h-48 sm:w-52 sm:h-52'
      : size === 'lg'
      ? 'w-64 h-64 sm:w-80 sm:h-80'
      : 'w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72';

  // Initialize Three.js Orb Engine
  useEffect(() => {
    if (!canvasRef.current || hasWebGLError) return;

    try {
      if (!isWebGLAvailable()) {
        console.warn('WebGL is not supported in this browser, using CSS fallback.');
        setHasWebGLError(true);
        return;
      }

      const engine = new OrbEngine(canvasRef.current);
      engineRef.current = engine;

      engine.onNodeHover = (node) => {
        setHoveredNode(node);
      };

      engine.onOrbClick = () => {
        playHapticTick();
        setPulseCount((c) => c + 1);
        if (onClick) onClick();
      };

      // Set initial dimensions
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          engine.resize(rect.width, rect.height);
        }
      }

      // Responsive ResizeObserver
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 0 && height > 0) {
            engine.resize(width, height);
          }
        }
      });

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }

      return () => {
        resizeObserver.disconnect();
        engine.dispose();
        engineRef.current = null;
      };
    } catch (err) {
      console.error('Failed to initialize 3D Orb engine:', err);
      setHasWebGLError(true);
    }
  }, [hasWebGLError]);

  // Synchronize state changes with OrbEngine
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setState(state);
    }
  }, [state]);

  // Synchronize active languages & code-switching reaction
  useEffect(() => {
    if (engineRef.current && activeLanguages.length > 0) {
      engineRef.current.setActiveLanguages(activeLanguages);
    }
  }, [activeLanguages, isCodeSwitched]);

  // Synchronize learning language focus
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setLearningLanguage(learningLanguage);
    }
  }, [learningLanguage]);

  const handleManualClick = () => {
    if (engineRef.current) {
      engineRef.current.triggerPulse(1.0);
    }
    playHapticTick();
    setPulseCount((c) => c + 1);
    if (onClick) onClick();
  };

  if (hasWebGLError) {
    return <OrbFallback state={state} size={size} onClick={handleManualClick} className={className} />;
  }

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center justify-center select-none ${sizeClasses} ${className}`}
    >
      {/* Background radial ambient glow for depth */}
      <div className="absolute inset-0 rounded-full bg-radial from-cyan-500/10 via-indigo-600/5 to-transparent blur-3xl pointer-events-none" />

      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className={`w-full h-full block ${interactive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
        aria-label="LinguaLens Multilingual AI 3D Orb"
      />

      {/* Interactive Node Hover Tooltip / Status Display */}
      {hoveredNode && showLanguageLabels && size !== 'sm' && (
        <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/95 border border-white/20 backdrop-blur-md shadow-xl text-xs font-mono text-stone-200 animate-in fade-in zoom-in-95 duration-200 whitespace-nowrap">
          <span
            className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
            style={{ backgroundColor: hoveredNode.color, color: hoveredNode.color }}
          />
          <span className="font-semibold text-white">{hoveredNode.name}</span>
          <span className="text-stone-400">({hoveredNode.nativeName})</span>
          <span className="text-[10px] px-1 py-0.2 rounded bg-white/10 text-stone-300">
            {hoveredNode.code.toUpperCase()}
          </span>
        </div>
      )}

      {/* State or Code-Switching Badge Pill-Free Floating Annotation for large size */}
      {size !== 'sm' && isCodeSwitched && activeLanguages.length >= 2 && (
        <div className="absolute top-2 right-2 pointer-events-none z-10 flex items-center gap-1.5 text-[11px] font-mono text-cyan-400/90 bg-slate-950/70 backdrop-blur-sm border border-cyan-500/20 px-2.5 py-1 rounded-md">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span>Code-Switch Active</span>
        </div>
      )}
    </div>
  );
};
