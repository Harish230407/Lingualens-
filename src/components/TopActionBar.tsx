import React, { useState, useEffect } from 'react';
import {
  Menu,
  Plus,
  Search,
  Sliders,
  Compass,
  Volume2,
  VolumeX,
  Sun,
  Moon,
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playHapticTick } from '../utils/audioHaptics';
import { LinguaLensLogo } from './LinguaLensLogo.tsx';

interface TopActionBarProps {
  onToggleDrawer: () => void;
  onOpenSearch: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  currentView: string;
  onSelectView?: (view: 'dashboard' | 'chat' | 'robustness' | 'learning' | 'settings') => void;
  onToggle3DModal?: () => void;
  activeModelName?: string;
  currentTheme?: 'dark' | 'light' | 'system';
  onToggleTheme?: () => void;
}

export const TopActionBar: React.FC<TopActionBarProps> = ({
  onToggleDrawer,
  onOpenSearch,
  onNewChat,
  onOpenSettings,
  currentView,
  onSelectView,
  onToggle3DModal,
  activeModelName = 'gemini-3.8-flash',
  currentTheme = 'dark',
  onToggleTheme,
}) => {
  const [soundOn, setSoundOn] = useState(true);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playHapticTick();
  };

  const navItems: Array<{ id: 'dashboard' | 'chat' | 'robustness' | 'learning'; label: string }> = [
    { id: 'dashboard', label: 'Overview' },
    { id: 'chat', label: 'Dialogue Bench' },
    { id: 'robustness', label: 'Robustness Lab' },
    { id: 'learning', label: 'Learning' },
  ];

  return (
    <header className="relative h-14 border-b border-white/[0.08] bg-[#0c0d12]/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4 z-30 sticky top-0">
      {/* Zone 1: Brand Wordmark (Display font, clean, no pills) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={() => {
            playHapticTick();
            onToggleDrawer();
          }}
          className="p-1.5 rounded-md text-stone-400 hover:text-stone-100 hover:bg-white/[0.05] transition-colors focus-visible:ring-1 focus-visible:ring-stone-400 cursor-pointer"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            playHapticTick();
            onSelectView?.('dashboard');
          }}
          className="flex items-center gap-2.5 group text-left cursor-pointer"
        >
          <LinguaLensLogo size={28} variant="icon" />
          <span className="font-serif text-base sm:text-lg tracking-tight font-medium text-stone-100 group-hover:text-white [html[data-theme='light']_&]:text-slate-900 transition-colors">
            LinguaLens
          </span>
        </button>
      </div>

      {/* Zone 2: Primary Nav Links - Positioned cleanly in flow without absolute positioning overlap */}
      <nav className="hidden xl:flex items-center gap-1 2xl:gap-2 text-xs h-full">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                playHapticTick();
                onSelectView?.(item.id);
              }}
              className={`relative h-full flex items-center px-2.5 2xl:px-3 font-medium transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'text-stone-100'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Actions - Responsive with no text truncation or collision */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Interactive 3D Semantic Constellation Trigger */}
        <button
          onClick={() => {
            playHapticTick();
            onToggle3DModal?.();
          }}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-md bg-gradient-to-r from-blue-500/15 via-emerald-500/15 to-purple-500/15 border border-white/10 hover:border-white/20 text-stone-200 hover:text-white text-xs transition-all shadow-xs group cursor-pointer"
          title="Open Interactive 3D Semantic Constellation"
        >
          <Compass className="w-3.5 h-3.5 text-blue-400 group-hover:rotate-45 transition-transform duration-300 shrink-0" />
          <span className="hidden sm:inline font-mono font-medium whitespace-nowrap">3D Space</span>
        </button>

        {/* Sound FX Toggle */}
        <button
          onClick={handleToggleSound}
          className={`p-1.5 rounded-md border border-white/[0.08] transition-colors cursor-pointer shrink-0 ${
            soundOn
              ? 'text-stone-300 bg-white/[0.04] hover:bg-white/[0.08]'
              : 'text-stone-600 bg-transparent hover:text-stone-400'
          }`}
          title={soundOn ? 'Sound Haptics Enabled' : 'Sound Haptics Muted'}
          aria-label="Toggle Sound Effects"
        >
          {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
        </button>

        {/* Theme Toggle Button (Dark / Light) */}
        {onToggleTheme && (
          <button
            onClick={() => {
              playHapticTick();
              onToggleTheme();
            }}
            className="p-1.5 rounded-md border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-stone-300 hover:text-stone-100 transition-colors cursor-pointer shrink-0"
            title={currentTheme === 'light' ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            aria-label="Toggle Theme"
          >
            {currentTheme === 'light' ? (
              <Sun className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-blue-400" />
            )}
          </button>
        )}

        <button
          onClick={() => {
            playHapticTick();
            onOpenSearch();
          }}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-md text-stone-400 hover:text-stone-200 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] text-xs transition-colors cursor-pointer shrink-0"
          title="Search corpus & history (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">Search</span>
          <kbd className="hidden 2xl:inline-block font-mono text-[10px] text-stone-400 bg-black/40 px-1 py-0.5 rounded border border-white/[0.06]">
            ⌘K
          </kbd>
        </button>

        <button
          onClick={() => {
            playHapticTick();
            onNewChat();
          }}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md bg-stone-100 hover:bg-white text-stone-900 text-xs font-medium transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline whitespace-nowrap">New Session</span>
        </button>

        <button
          onClick={() => {
            playHapticTick();
            onOpenSettings();
          }}
          className="p-1.5 rounded-md text-stone-400 hover:text-stone-200 hover:bg-white/[0.05] transition-colors cursor-pointer shrink-0"
          title="Engine Configuration"
          aria-label="Engine Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
