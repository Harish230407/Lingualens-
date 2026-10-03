import React, { useState } from 'react';
import logoImg from '../assets/images/lingualens_logo_1790964617179.jpg';

export interface LinguaLensLogoProps {
  variant?: 'icon' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  showText?: boolean;
  subtitle?: string;
  useImage?: boolean;
  shape?: 'circle' | 'rounded';
}

export const LinguaLensLogo: React.FC<LinguaLensLogoProps> = ({
  variant = 'icon',
  size = 'md',
  className = '',
  showText = false,
  subtitle,
  useImage = true,
  shape = 'circle',
}) => {
  const [imgError, setImgError] = useState(false);

  // Determine pixel size
  const iconPx =
    typeof size === 'number'
      ? size
      : size === 'xs'
      ? 20
      : size === 'sm'
      ? 26
      : size === 'md'
      ? 34
      : size === 'lg'
      ? 44
      : 56; // xl

  const shouldRenderText = variant === 'full' || showText;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Brand Icon: Official User Artwork with Fallback */}
      {useImage && !imgError ? (
        <div
          className={`relative shrink-0 overflow-hidden ${
            shape === 'circle' ? 'rounded-full ring-1 ring-white/10 dark:ring-white/10' : 'rounded-lg sm:rounded-xl border border-white/10'
          } shadow-xs [html[data-theme='light']_&]:ring-slate-200 transition-transform duration-200 hover:scale-105 bg-slate-900 flex items-center justify-center`}
          style={{ width: iconPx, height: iconPx }}
        >
          <img
            src={logoImg}
            alt="LinguaLens Logo"
            className="w-full h-full object-cover rounded-inherit"
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        /* Precision SVG Fallback Graphic */
        <svg
          width={iconPx}
          height={iconPx}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 transition-transform duration-300 hover:scale-105"
          aria-label="LinguaLens Logo"
        >
          <defs>
            <linearGradient id="ll-bubble-grad" x1="15" y1="15" x2="95" y2="105" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="35%" stopColor="#2563eb" />
              <stop offset="70%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>

            <linearGradient id="ll-ring-grad" x1="10" y1="45" x2="110" y2="75" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#00e5ff" />
              <stop offset="35%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#c084fc" />
              <stop offset="85%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#f97316" />
            </linearGradient>

            <radialGradient id="ll-lens-iris" cx="50" cy="50" r="28" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="25%" stopColor="#0284c7" />
              <stop offset="70%" stopColor="#1e3a8a" />
              <stop offset="100%" stopColor="#0f172a" />
            </radialGradient>

            <linearGradient id="ll-bezel-grad" x1="30" y1="30" x2="85" y2="85" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            <linearGradient id="ll-tag-blue" x1="68" y1="12" x2="88" y2="38" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            <linearGradient id="ll-tag-orange" x1="82" y1="16" x2="102" y2="42" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#ea580c" />
            </linearGradient>

            <filter id="ll-shadow" x="-10%" y="-10%" width="130%" height="130%" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0f172a" floodOpacity="0.28" />
            </filter>

            <filter id="ll-ring-glow" x="-20%" y="-20%" width="140%" height="140%" filterUnits="userSpaceOnUse">
              <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#00e5ff" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* 1. Main Chat Bubble Motif */}
          <g filter="url(#ll-shadow)">
            <path
              d="M58 20 C36 20, 20 36, 20 57 C20 68, 25 78, 33 85 L28 100 L44 94 C48 96, 53 97, 58 97 C80 97, 96 81, 96 57 C96 36, 80 20, 58 20 Z"
              fill="url(#ll-bubble-grad)"
            />
          </g>

          {/* 2. Planetary Orbit Ring (Back segment) */}
          <path
            d="M16 66 C18 54, 40 46, 68 47 C92 48, 108 55, 108 64"
            stroke="url(#ll-ring-grad)"
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* 3. Outer Lens Metallic Bezel / Ring */}
          <circle cx="58" cy="58" r="28" fill="url(#ll-bezel-grad)" filter="url(#ll-shadow)" />
          <circle cx="58" cy="58" r="24.5" fill="#0f172a" />

          {/* 4. Deep Optical Glass Lens Pupil */}
          <circle cx="58" cy="58" r="22.5" fill="url(#ll-lens-iris)" />

          {/* 5. Lens Iris Highlights */}
          <path
            d="M48 44 C53 41, 60 41, 65 44 C67 45, 66 48, 64 47 C60 45, 54 45, 50 48 C48 49, 46 46, 48 44 Z"
            fill="#ffffff"
            opacity="0.9"
          />
          <ellipse cx="52" cy="50" rx="5.5" ry="8" transform="rotate(-30 52 50)" fill="#ffffff" opacity="0.85" />
          <circle cx="66" cy="65" r="2.5" fill="#ffffff" opacity="0.75" />

          {/* 6. Planetary Orbit Ring (Front segment crossing with 3D wrap) */}
          <path
            d="M106 63 C104 74, 82 82, 54 81 C30 80, 16 73, 16 64"
            stroke="url(#ll-ring-grad)"
            strokeWidth="6.5"
            strokeLinecap="round"
            filter="url(#ll-ring-glow)"
          />

          {/* 7. Language Badges */}
          <g transform="translate(80, 14) rotate(6)">
            <path
              d="M3 5 C3 2.5, 5 0.5, 7.5 0.5 L24 0.5 C26.5 0.5, 28.5 2.5, 28.5 5 L28.5 19 C28.5 21.5, 26.5 23.5, 24 23.5 L12 23.5 L5 29 L6.5 23.5 L3 23.5 C0.5 23.5, 0.5 21.5, 0.5 19 Z"
              fill="url(#ll-tag-orange)"
              filter="url(#ll-shadow)"
            />
            <text x="14" y="17" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="bold" fill="#ffffff" textAnchor="middle">
              अ
            </text>
          </g>

          <g transform="translate(64, 10) rotate(-6)">
            <path
              d="M3 5 C3 2.5, 5 0.5, 7.5 0.5 L24 0.5 C26.5 0.5, 28.5 2.5, 28.5 5 L28.5 19 C28.5 21.5, 26.5 23.5, 24 23.5 L10 23.5 L4 29 L5.5 23.5 L3 23.5 C0.5 23.5, 0.5 21.5, 0.5 19 Z"
              fill="url(#ll-tag-blue)"
              filter="url(#ll-shadow)"
            />
            <text x="14.5" y="17" fontFamily="Arial, sans-serif" fontSize="15" fontWeight="900" fill="#ffffff" textAnchor="middle">
              A
            </text>
          </g>
        </svg>
      )}

      {/* Stylized Brand Wordmark */}
      {shouldRenderText && (
        <div className="flex flex-col leading-tight">
          <div className="font-serif font-medium tracking-tight text-base sm:text-lg flex items-baseline gap-0.5">
            <span className="text-stone-100 dark:text-stone-100 [html[data-theme='light']_&]:text-slate-900 transition-colors">
              LinguaLens
            </span>
            <span className="text-blue-500 font-sans font-bold text-xs tracking-wide uppercase px-1 py-0.2 rounded bg-blue-500/10 text-blue-400 [html[data-theme='light']_&]:text-blue-600 [html[data-theme='light']_&]:bg-blue-50 ml-1">
              Lab
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] text-stone-400 dark:text-stone-400 [html[data-theme='light']_&]:text-slate-500 font-mono">
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
