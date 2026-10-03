import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  TrendingDown,
  Layers,
  ArrowRight,
  Compass,
  Play,
  RotateCw,
} from 'lucide-react';
import { api } from '../services/api';
import { EvaluationRun, Chat, LearningProgress } from '../types/index';
import { Interactive3DCard } from './Interactive3DCard';
import { ThreeSemanticGlobe } from './ThreeSemanticGlobe';
import { playHapticTick, playSuccessChime } from '../utils/audioHaptics';
import { LinguaLensLogo } from './LinguaLensLogo';

interface DashboardViewProps {
  chats: Chat[];
  onSelectChat: (chatId: string) => void;
  onSelectView: (view: 'dashboard' | 'chat' | 'robustness' | 'learning' | 'settings') => void;
  onOpenNewRobustnessRun: () => void;
  onSelectPromptForChat?: (prompt: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  chats,
  onSelectChat,
  onSelectView,
  onOpenNewRobustnessRun,
  onSelectPromptForChat,
}) => {
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [learningProgress, setLearningProgress] = useState<LearningProgress | null>(null);

  useEffect(() => {
    api.getEvaluationRuns()
      .then((data: EvaluationRun[]) => setRuns(data))
      .catch((err: unknown) => console.error('Failed to load runs:', err));

    api.getLearningProgress()
      .then((prog) => setLearningProgress(prog))
      .catch((err: unknown) => console.error('Failed to load learning progress:', err));
  }, []);

  const avgRobustnessScore =
    runs.length > 0
      ? Math.round(runs.reduce((acc, r) => acc + (r.overallScore || 0), 0) / runs.length)
      : 84;

  const handleTestInChat = (prompt: string) => {
    if (onSelectPromptForChat) {
      onSelectPromptForChat(prompt);
    } else {
      onSelectView('chat');
    }
    playSuccessChime();
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-8 bg-[#0b0c10]">
      {/* Editorial Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/[0.08] [html[data-theme='light']_&]:border-slate-200">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <LinguaLensLogo size="lg" variant="icon" />
            <div>
              <div className="flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-stone-400 [html[data-theme='light']_&]:text-slate-500">
                <span>Research Console</span>
                <span aria-hidden="true">·</span>
                <span>Multilingual Intelligence Lab</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-normal tracking-tight text-stone-100 [html[data-theme='light']_&]:text-slate-900 transition-colors">
                Linguistic Telemetry & Robustness
              </h1>
            </div>
          </div>
          <p className="text-sm text-stone-400 [html[data-theme='light']_&]:text-slate-600 max-w-2xl leading-relaxed">
            Diagnose degradation in commercial and local LLMs under South Asian code-switching, phonetic transliteration drift, and imperative negation inversion.
          </p>
        </div>

        {/* Research Streak & 3D Space quick jump */}
        <div className="text-left md:text-right text-xs text-stone-400 self-start md:self-auto font-mono space-y-1">
          <div className="text-stone-200 font-sans font-medium text-sm">
            {learningProgress?.streakDays || 7}-Day Research Streak
          </div>
          <div className="text-stone-400 tabular-nums">
            {learningProgress?.xp || 340} XP · {learningProgress?.level || 'Dialect Investigator'}
          </div>
        </div>
      </div>

      {/* 01. Telemetry Metrics Grid with 3D Tilt & Specular Reflection */}
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-stone-400">
          <span>01. BENCHMARK TELEMETRY</span>
          <span>TARGET: GEMINI-3.8-FLASH</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {/* Mean Robustness */}
          <Interactive3DCard maxTilt={6} scaleOnHover={1.015} className="h-full">
            <div className="rounded-xl bg-[#12141c] border border-white/[0.08] p-5 h-full flex flex-col justify-between gap-3">
              <div className="text-xs text-stone-400 font-medium flex items-center justify-between">
                <span>Mean Robustness Index</span>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-3xl font-mono tabular-nums font-semibold text-stone-100">
                  {avgRobustnessScore}
                </span>
                <span className="text-xs font-mono text-stone-400">/ 100</span>
              </div>
              <div className="text-[11px] text-stone-400 border-t border-white/[0.04] pt-2">
                Aggregated over {runs.length} benchmark executions
              </div>
            </div>
          </Interactive3DCard>

          {/* Dialectal Variant Breadth */}
          <Interactive3DCard maxTilt={6} scaleOnHover={1.015} className="h-full">
            <div className="rounded-xl bg-[#12141c] border border-white/[0.08] p-5 h-full flex flex-col justify-between gap-3">
              <div className="text-xs text-stone-400 font-medium flex items-center justify-between">
                <span>Perturbation Vectors</span>
                <Layers className="w-3.5 h-3.5 text-stone-400" />
              </div>
              <div className="flex items-baseline gap-1.5 my-1">
                <span className="text-3xl font-mono tabular-nums font-semibold text-stone-100">
                  8
                </span>
                <span className="text-xs font-mono text-stone-400">Variants</span>
              </div>
              <div className="text-[11px] text-stone-400 border-t border-white/[0.04] pt-2">
                Tanglish, Hinglish, Teluglish & script shifts
              </div>
            </div>
          </Interactive3DCard>

          {/* Primary Vulnerability */}
          <Interactive3DCard maxTilt={6} scaleOnHover={1.015} className="h-full">
            <div className="rounded-xl bg-[#12141c] border border-white/[0.08] p-5 h-full flex flex-col justify-between gap-3">
              <div className="text-xs text-stone-400 font-medium flex items-center justify-between">
                <span>Primary Vulnerability</span>
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-base font-medium text-stone-100 truncate my-1">
                Negative Suffix Inversion
              </div>
              <div className="text-[11px] text-stone-400 border-t border-white/[0.04] pt-2">
                Encountered in 78% of unprimed runs
              </div>
            </div>
          </Interactive3DCard>

          {/* Model Architecture */}
          <Interactive3DCard maxTilt={6} scaleOnHover={1.015} className="h-full">
            <div className="rounded-xl bg-[#12141c] border border-white/[0.08] p-5 h-full flex flex-col justify-between gap-3">
              <div className="text-xs text-stone-400 font-medium flex items-center justify-between">
                <span>Engine Status</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="text-sm font-mono text-stone-100 font-medium truncate my-1">
                gemini-3.8-flash
              </div>
              <div className="text-[11px] text-stone-400 border-t border-white/[0.04] pt-2">
                Pluggable local & cloud inference
              </div>
            </div>
          </Interactive3DCard>
        </div>
      </div>

      {/* 02. Interactive 3D Semantic Constellation Feature */}
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-stone-400">
          <div className="flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>02. 3D SEMANTIC TOPOLOGY & EMBEDDING MANIFOLD</span>
          </div>
          <span className="text-[11px] text-stone-500">Live WebGL Orbit Canvas</span>
        </div>

        <ThreeSemanticGlobe
          onSelectNodePrompt={handleTestInChat}
          className="shadow-xl"
        />
      </div>

      {/* 03. Action Benches with 3D Interaction */}
      <div className="max-w-6xl mx-auto space-y-3">
        <div className="text-xs font-mono text-stone-400">
          03. EXPERIMENTAL BENCHES
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Interactive3DCard maxTilt={5}>
            <button
              onClick={() => {
                playHapticTick();
                onSelectView('robustness');
              }}
              className="p-5 w-full h-full rounded-xl bg-[#12141c] hover:bg-[#181a24] border border-white/[0.08] hover:border-white/[0.16] transition-all text-left group flex flex-col justify-between"
            >
              <div className="space-y-1.5 mb-4">
                <div className="text-xs font-mono text-stone-400">BENCHMARK LAB</div>
                <div className="text-sm font-medium text-stone-100 group-hover:text-white">
                  Launch Stress-Test Suite
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Run 8 controlled linguistic perturbations on any seed intent to discover semantic failure points.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-300 font-medium group-hover:text-white">
                <span>Open Suite</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Interactive3DCard>

          <Interactive3DCard maxTilt={5}>
            <button
              onClick={() => {
                playHapticTick();
                onSelectView('chat');
              }}
              className="p-5 w-full h-full rounded-xl bg-[#12141c] hover:bg-[#181a24] border border-white/[0.08] hover:border-white/[0.16] transition-all text-left group flex flex-col justify-between"
            >
              <div className="space-y-1.5 mb-4">
                <div className="text-xs font-mono text-stone-400">INTERACTIVE DIALOGUE</div>
                <div className="text-sm font-medium text-stone-100 group-hover:text-white">
                  Dialogue Studio
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Inspect real-time token classification, transliteration probabilities, and matrix language breakdown.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-300 font-medium group-hover:text-white">
                <span>Start Session</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Interactive3DCard>

          <Interactive3DCard maxTilt={5}>
            <button
              onClick={() => {
                playHapticTick();
                onSelectView('learning');
              }}
              className="p-5 w-full h-full rounded-xl bg-[#12141c] hover:bg-[#181a24] border border-white/[0.08] hover:border-white/[0.16] transition-all text-left group flex flex-col justify-between"
            >
              <div className="space-y-1.5 mb-4">
                <div className="text-xs font-mono text-stone-400">PEDAGOGICAL ACADEMY</div>
                <div className="text-sm font-medium text-stone-100 group-hover:text-white">
                  Dialect Academy
                </div>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Deep-dive into South Asian morphology, syntactic fusion, and tokenization traps with practical drills.
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs text-stone-300 font-medium group-hover:text-white">
                <span>Resume Drills</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </Interactive3DCard>
        </div>
      </div>

      {/* 04. Recent Corpus Records */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Evaluations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span>04A. RECENT EVALUATIONS</span>
            <button
              onClick={() => {
                playHapticTick();
                onSelectView('robustness');
              }}
              className="hover:text-stone-200 transition-colors"
            >
              View all →
            </button>
          </div>

          <div className="rounded-xl bg-[#12141c] border border-white/[0.08] divide-y divide-white/[0.06]">
            {runs.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                No evaluation runs logged yet.
              </div>
            ) : (
              runs.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  onClick={() => {
                    playHapticTick();
                    onSelectView('robustness');
                  }}
                  className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <span className="font-medium text-xs text-stone-100 truncate min-w-0 flex-1">
                      {r.name}
                    </span>
                    <span className="font-mono text-xs tabular-nums text-stone-300 shrink-0">
                      Score: {r.overallScore}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <span>
                      {r.passCount} Pass · {r.failCount} Fail · {r.partialCount} Partial
                    </span>
                    <span className="shrink-0">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400">
            <span>04B. ACTIVE SESSIONS</span>
            <button
              onClick={() => {
                playHapticTick();
                onSelectView('chat');
              }}
              className="hover:text-stone-200 transition-colors"
            >
              Open workbench →
            </button>
          </div>

          <div className="rounded-xl bg-[#12141c] border border-white/[0.08] divide-y divide-white/[0.06]">
            {chats.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-400">
                No active conversations yet.
              </div>
            ) : (
              chats.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    playHapticTick();
                    onSelectChat(c.id);
                  }}
                  className="p-4 hover:bg-white/[0.02] transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between gap-3 min-w-0">
                    <span className="font-medium text-xs text-stone-100 truncate min-w-0 flex-1">
                      {c.title}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono tabular-nums shrink-0">
                      {c.messageCount} turns
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 truncate">
                    {c.lastMessageSnippet || 'Empty session'}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
