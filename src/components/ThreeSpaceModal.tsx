import React from 'react';
import { X, Sparkles, Orbit, Compass, ArrowRight } from 'lucide-react';
import { ThreeSemanticGlobe } from './ThreeSemanticGlobe';
import { playHapticTick } from '../utils/audioHaptics';

interface ThreeSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export const ThreeSpaceModal: React.FC<ThreeSpaceModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#0b0c10] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0f1118]/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Orbit className="w-5 h-5 animate-spin" style={{ animationDuration: '12s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-medium text-stone-100">
                  Multilingual Semantic Vector Space
                </h2>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  3D WebGL Realtime
                </span>
              </div>
              <p className="text-xs text-stone-400 font-sans mt-0.5">
                Spatial embedding topology mapping colloquial dialect drifts, code-switch transitions, and morphosyntactic negations
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              playHapticTick();
              onClose();
            }}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-white/[0.08] transition-colors"
            title="Close 3D Space (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D WebGL Globe Viewport */}
        <div className="flex-1 min-h-0 relative p-4 flex flex-col">
          <ThreeSemanticGlobe
            className="w-full h-full flex-1"
            onSelectNodePrompt={(prompt) => {
              onSelectPrompt(prompt);
              onClose();
            }}
          />
        </div>

        {/* Quick Dialect Presets Bar */}
        <div className="px-6 py-3 border-t border-white/[0.08] bg-[#0c0d12] flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
          <div className="flex items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-wider text-stone-500">
              Dialect Vectors:
            </span>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#38bdf8]" />
              <span>English Anchor</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#34d399]" />
              <span>Tanglish</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#fbbf24]" />
              <span>Hinglish</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#a78bfa]" />
              <span>Code-Switch</span>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-[#f43f5e]" />
              <span>Negation Trap</span>
            </div>
          </div>

          <div className="font-mono text-[11px] text-stone-500">
            Rotate: Drag · Zoom: Scroll · Inspect: Click node
          </div>
        </div>
      </div>
    </div>
  );
};
