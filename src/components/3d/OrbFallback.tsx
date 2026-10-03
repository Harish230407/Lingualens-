import React from 'react';
import { OrbState } from './OrbTypes.ts';
import { LinguaLensLogo } from '../LinguaLensLogo.tsx';

interface OrbFallbackProps {
  state?: OrbState;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'responsive';
}

export const OrbFallback: React.FC<OrbFallbackProps> = ({
  state = 'IDLE',
  onClick,
  className = '',
  size = 'responsive',
}) => {
  const isProcessing = state === 'PROCESSING';

  const sizeClasses =
    size === 'sm'
      ? 'w-20 h-20'
      : size === 'md'
      ? 'w-48 h-48'
      : size === 'lg'
      ? 'w-72 h-72 sm:w-80 sm:h-80'
      : 'w-56 h-56 sm:w-72 sm:h-72 md:w-84 md:h-84';

  const logoPx = size === 'sm' ? 38 : size === 'md' ? 56 : 72;

  return (
    <div
      onClick={onClick}
      role="img"
      aria-label="LinguaLens Multilingual AI Orb Fallback"
      className={`relative flex items-center justify-center select-none cursor-pointer group ${sizeClasses} ${className}`}
    >
      {/* Outer Glow Halo */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/15 via-indigo-500/10 to-teal-400/15 blur-2xl animate-pulse" />

      {/* Outer Orbital Ring 1 */}
      <div
        className={`absolute inset-2 rounded-full border border-cyan-400/25 border-dashed ${
          isProcessing ? 'animate-[spin_4s_linear_infinite]' : 'animate-[spin_18s_linear_infinite]'
        }`}
      />

      {/* Outer Orbital Ring 2 (Counter-rotation) */}
      <div
        className={`absolute inset-6 rounded-full border border-indigo-400/25 ${
          isProcessing ? 'animate-[spin_6s_linear_infinite_reverse]' : 'animate-[spin_24s_linear_infinite_reverse]'
        }`}
      />

      {/* Floating Language Node Badges (only on medium/large sizes) */}
      {size !== 'sm' && (
        <>
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-[10px] font-mono text-cyan-300">
            En / A
          </div>
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-400/40 text-[10px] font-mono text-emerald-300">
            Ta / அ
          </div>
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 px-1.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-400/40 text-[10px] font-mono text-amber-300">
            Hi / अ
          </div>
          <div className="absolute top-1/2 -right-2 -translate-y-1/2 px-1.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-400/40 text-[10px] font-mono text-purple-300">
            Te / తె
          </div>
        </>
      )}

      {/* Core Glowing Orb with Official Logo Artwork */}
      <div
        className={`relative rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 p-0.5 shadow-[0_0_30px_rgba(14,165,233,0.4)] group-hover:scale-105 transition-transform duration-500 ${
          size === 'sm' ? 'w-14 h-14' : 'w-24 h-24 sm:w-28 sm:h-28'
        }`}
      >
        <div className="w-full h-full rounded-full bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-1.5 overflow-hidden">
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-cyan-500/20 to-indigo-500/30 flex items-center justify-center overflow-hidden">
            <LinguaLensLogo size={logoPx} variant="icon" shape="circle" />
          </div>
        </div>
      </div>
    </div>
  );
};
