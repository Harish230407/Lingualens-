import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Play,
  RotateCw,
  Download,
  ArrowRight,
  Sliders,
  Layers,
  Check,
  AlertCircle,
  X,
  Compass,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EvaluationRun, EvaluationTestCase, EvaluationResult } from '../types/index.ts';
import { api } from '../services/api.ts';
import { Interactive3DCard } from './Interactive3DCard';
import { playHapticTick, playSuccessChime } from '../utils/audioHaptics';

interface RobustnessStudioProps {
  initialSeedPrompt?: string;
  onNavigateToChat: (prompt: string) => void;
}

export const RobustnessStudio: React.FC<RobustnessStudioProps> = ({
  initialSeedPrompt = 'I want to cancel my train ticket.',
  onNavigateToChat,
}) => {
  const [seedText, setSeedText] = useState(initialSeedPrompt);
  const [seedIntent, setSeedIntent] = useState('cancel_ticket');
  const [modelProvider, setModelProvider] = useState('gemini');
  const [modelName, setModelName] = useState('gemini-3.8-flash');

  const [activeRun, setActiveRun] = useState<EvaluationRun | null>(null);
  const [testCases, setTestCases] = useState<EvaluationTestCase[]>([]);
  const [results, setResults] = useState<EvaluationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [allRuns, setAllRuns] = useState<EvaluationRun[]>([]);

  // Load previous runs on mount
  useEffect(() => {
    loadAllRuns();
  }, []);

  const loadAllRuns = async () => {
    try {
      const runs = await api.getEvaluationRuns();
      setAllRuns(runs);
      if (runs.length > 0 && !activeRun) {
        loadRunDetails(runs[0].id);
      }
    } catch (err) {
      console.error('Failed to load runs:', err);
    }
  };

  const loadRunDetails = async (runId: string) => {
    try {
      const data = await api.getEvaluationResults(runId);
      setActiveRun(data.run);
      setTestCases(data.testCases || []);
      setResults(data.results || []);
    } catch (err) {
      console.error('Failed to load run details:', err);
    }
  };

  // Polling for active run progress
  useEffect(() => {
    if (!activeRun || activeRun.status === 'completed' || activeRun.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const updated = await api.getEvaluationRun(activeRun.id);
        setActiveRun(updated);
        if (updated.status === 'completed' || updated.status === 'failed') {
          clearInterval(interval);
          loadRunDetails(updated.id);
          loadAllRuns();
          if (updated.status === 'completed') {
            playSuccessChime();
            confetti({
              particleCount: 70,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#38bdf8', '#34d399', '#fbbf24', '#f43f5e'],
            });
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 800);

    return () => clearInterval(interval);
  }, [activeRun]);

  const handleStartBenchmark = async () => {
    if (!seedText.trim() || loading) return;

    playHapticTick();
    setLoading(true);
    try {
      const resp = await api.startEvaluationRun({
        name: `Robustness Benchmark: ${seedText.slice(0, 32)}...`,
        sourceText: seedText,
        sourceIntent: seedIntent,
        modelProvider,
        modelName,
      });

      setActiveRun(resp.run);
    } catch (err: any) {
      console.error('Benchmark start failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!activeRun) return;
    const a = document.createElement('a');
    a.href = `/api/evaluation/runs/${activeRun.id}/report`;
    a.download = `robustness_report_${activeRun.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b0c10] p-6 md:p-10 space-y-10">
      {/* Header */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-baseline justify-between gap-6 border-b border-white/[0.08] pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <span>Evaluation Laboratory</span>
            <span aria-hidden="true">·</span>
            <span>Multilingual Perturbation Matrix</span>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-normal tracking-tight text-stone-100">
            Linguistic Robustness Studio
          </h1>
          <p className="text-sm text-stone-400 max-w-2xl leading-relaxed">
            Generate controlled dialectal transformations across Tanglish, Hinglish, Teluglish, and mixed Devanagari/Tamil scripts to audit model degradation.
          </p>
        </div>

        {activeRun && activeRun.status === 'completed' && (
          <button
            onClick={handleDownloadReport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] text-stone-200 border border-white/[0.1] text-xs font-mono transition-colors shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-stone-400" />
            <span>Export Report (JSON)</span>
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Benchmark Configuration & Presets */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl bg-[#12141c] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center gap-2 font-mono text-xs text-stone-300 border-b border-white/[0.06] pb-3">
              <Sliders className="w-3.5 h-3.5 text-stone-400" />
              <span>CONFIGURE PERTURBATION RUN</span>
            </div>

            {/* Seed Query Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">
                Baseline Statement (Canonical English)
              </label>
              <textarea
                value={seedText}
                onChange={(e) => setSeedText(e.target.value)}
                rows={3}
                placeholder="Enter clean canonical statement..."
                className="w-full rounded-lg bg-[#0b0c10] border border-white/[0.08] p-2.5 text-xs text-stone-100 placeholder-stone-400 focus:outline-none focus:border-white/[0.25]"
              />
            </div>

            {/* Curated Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-stone-400">Canonical Templates</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Cancel Ticket', text: 'I want to cancel my train ticket.', intent: 'cancel_ticket' },
                  { label: 'Refund Status', text: 'Where is my refund for the transaction?', intent: 'refund_enquiry' },
                  { label: 'Reschedule', text: 'Please reschedule my flight to tomorrow morning.', intent: 'reschedule_flight' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setSeedText(item.text);
                      setSeedIntent(item.intent);
                    }}
                    className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-stone-300 border border-white/[0.06] transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Model Provider Selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Inference Provider</label>
              <select
                value={modelProvider}
                onChange={(e) => {
                  const p = e.target.value;
                  setModelProvider(p);
                  if (p === 'gemini') setModelName('gemini-3.8-flash');
                  else if (p === 'lmstudio') setModelName('local-lm-studio');
                  else if (p === 'mock') setModelName('LinguaLens-Deterministic-Mock');
                }}
                className="w-full rounded-lg bg-[#0b0c10] border border-white/[0.08] p-2 text-xs text-stone-200 focus:outline-none focus:border-white/[0.25]"
              >
                <option value="gemini">Google Gemini (gemini-3.8-flash)</option>
                <option value="mock">Deterministic Test Mock (No Quota Needed)</option>
                <option value="lmstudio">Local LM Studio (localhost:1234/v1)</option>
                <option value="openai">OpenAI Compatible Custom Proxy</option>
              </select>
            </div>

            {/* Model Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-300">Model Name</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full rounded-lg bg-[#0b0c10] border border-white/[0.08] p-2 text-xs text-stone-200 font-mono focus:outline-none"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={handleStartBenchmark}
              disabled={loading || !seedText.trim()}
              className="w-full py-2 rounded-lg bg-stone-100 hover:bg-white disabled:opacity-30 disabled:hover:bg-stone-100 text-stone-900 font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
            >
              {loading ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing Variants...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-stone-900" />
                  <span>Run Robustness Benchmark</span>
                </>
              )}
            </button>
          </div>

          {/* Previous Evaluation Runs */}
          <div className="rounded-xl bg-[#12141c] border border-white/[0.08] p-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-stone-400 border-b border-white/[0.06] pb-2">
              <span>BENCHMARK HISTORY</span>
              <span className="tabular-nums">{allRuns.length} runs</span>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {allRuns.map((r) => (
                <button
                  key={r.id}
                  onClick={() => loadRunDetails(r.id)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-colors ${
                    activeRun?.id === r.id
                      ? 'bg-white/[0.08] border-white/[0.2] text-white'
                      : 'bg-[#0b0c10] border-white/[0.06] text-stone-400 hover:text-stone-200 hover:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between font-medium mb-1">
                    <span className="truncate max-w-[150px]">{r.name}</span>
                    <span className="font-mono tabular-nums text-stone-200">
                      {r.overallScore}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                    <span>{r.modelName}</span>
                    <span>{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Run Dashboard, Scores, Metrics, and Variant Results */}
        <div className="lg:col-span-2 space-y-6">
          {activeRun ? (
            <>
              {/* Score Header Card */}
              <div className="rounded-xl bg-[#12141c] border border-white/[0.08] p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[11px] font-mono text-stone-400">
                      BENCHMARK #{activeRun.id.slice(0, 10)}
                    </div>
                    <h2 className="font-serif text-xl text-stone-100">{activeRun.name}</h2>
                    <div className="text-xs text-stone-400 font-mono">
                      Target Engine: {activeRun.modelProvider} · {activeRun.modelName}
                    </div>
                  </div>

                  {/* Benchmark Robustness Score Gauge */}
                  <div className="text-left sm:text-right">
                    <div className="text-[11px] font-mono text-stone-400">
                      ROBUSTNESS SCORE
                    </div>
                    <div className="text-3xl font-mono tabular-nums font-semibold text-stone-100">
                      {activeRun.overallScore}
                      <span className="text-sm text-stone-400 font-normal"> / 100</span>
                    </div>
                  </div>
                </div>

                {/* Live Progress Bar (if still executing) */}
                {activeRun.status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                      <span>{activeRun.currentStep}</span>
                      <span>{activeRun.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${activeRun.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Transparent Metrics Breakdown Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-white/[0.06]">
                  <div className="p-3 rounded-lg bg-[#0b0c10] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-stone-400 font-mono block">
                      Intent Accuracy (40%)
                    </span>
                    <span className="text-lg font-mono tabular-nums font-semibold text-stone-100">
                      {activeRun.metrics.intentAccuracy}%
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0b0c10] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-stone-400 font-mono block">
                      Semantics (25%)
                    </span>
                    <span className="text-lg font-mono tabular-nums font-semibold text-stone-100">
                      {activeRun.metrics.semanticConsistency}%
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0b0c10] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-stone-400 font-mono block">
                      Code-Switch (15%)
                    </span>
                    <span className="text-lg font-mono tabular-nums font-semibold text-stone-100">
                      {activeRun.metrics.codeSwitchRobustness}%
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0b0c10] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-stone-400 font-mono block">
                      Transliteration (10%)
                    </span>
                    <span className="text-lg font-mono tabular-nums font-semibold text-stone-100">
                      {activeRun.metrics.transliterationRobustness}%
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0b0c10] border border-white/[0.06] space-y-1">
                    <span className="text-[10px] text-stone-400 font-mono block">
                      Script Shift (10%)
                    </span>
                    <span className="text-lg font-mono tabular-nums font-semibold text-stone-100">
                      {activeRun.metrics.scriptRobustness}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Contributing Vulnerability Factors */}
              {activeRun.failureBreakdown && Object.keys(activeRun.failureBreakdown).length > 0 && (
                <div className="rounded-xl bg-[#12141c] border border-white/[0.08] p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono text-stone-300">
                    <AlertCircle className="w-3.5 h-3.5 text-stone-400" />
                    <span>DIAGNOSTIC FAILURE ATTRIBUTIONS</span>
                  </div>
                  <p className="text-xs text-stone-400 leading-relaxed">
                    Identifies where grammatical ambiguity or colloquial markers induced model misclassification:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {Object.entries(activeRun.failureBreakdown).map(([factor, count]) => (
                      <div
                        key={factor}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b0c10] border border-white/[0.06] text-xs"
                      >
                        <span className="text-stone-300">{factor}</span>
                        <span className="font-mono tabular-nums text-stone-400">
                          {count} {count === 1 ? 'instance' : 'instances'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Variant Inspector */}
              <div className="rounded-xl bg-[#12141c] border border-white/[0.08] p-5 space-y-4">
                <div className="flex items-center justify-between text-xs font-mono text-stone-300 border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-stone-400" />
                    <span>LINGUISTIC VARIANT AUDIT</span>
                  </div>
                  <div className="flex items-center gap-3 text-stone-400">
                    <span>{activeRun.passCount} Pass</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeRun.partialCount} Partial</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeRun.failCount} Fail</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {results.map((res, idx) => {
                    const tc = testCases.find((t) => t.id === res.testCaseId);

                    return (
                      <Interactive3DCard key={res.id || idx} maxTilt={3} scaleOnHover={1.008}>
                        <div className="rounded-lg bg-[#0b0c10] border border-white/[0.06] p-4 space-y-3 hover:border-white/[0.12] transition-colors h-full">
                          {/* Variant Header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-xs font-medium text-stone-300 capitalize flex-wrap">
                              <span>{res.transformationType.replace(/_/g, ' ')}</span>
                              {tc?.isCodeSwitched && (
                                <span className="text-stone-400 font-mono text-[11px]">
                                  · Code-Switched
                                </span>
                              )}
                              {tc?.script === 'mixed' && (
                                <span className="text-stone-400 font-mono text-[11px]">
                                  · Mixed Script
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-mono text-stone-100 bg-[#14161f] px-2.5 py-1.5 rounded border border-white/[0.06] break-words">
                              "{res.variantText}"
                            </p>
                          </div>

                          {/* Clean Status Marker */}
                          <div className="shrink-0 text-xs font-mono font-medium">
                            {res.status === 'PASS' ? (
                              <span className="flex items-center gap-1 text-emerald-400">
                                <Check className="w-3.5 h-3.5" /> Pass
                              </span>
                            ) : res.status === 'PARTIAL' ? (
                              <span className="flex items-center gap-1 text-amber-400">
                                <AlertCircle className="w-3.5 h-3.5" /> Partial
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-rose-400">
                                <X className="w-3.5 h-3.5" /> Fail
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Model Response & Intent */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1 border-t border-white/[0.04]">
                          <div className="space-y-1 min-w-0">
                            <span className="text-[11px] text-stone-400 font-mono block">
                              INTENDED GROUND TRUTH
                            </span>
                            <p className="text-stone-300 text-xs italic break-words">
                              "{tc?.intendedMeaning || res.variantText}"
                            </p>
                            <div className="text-[11px] font-mono text-stone-400 truncate">
                              Expected Intent: <span className="text-stone-200">{tc?.intent}</span>
                            </div>
                          </div>

                          <div className="space-y-1 min-w-0">
                            <span className="text-[11px] text-stone-400 font-mono block">
                              TARGET ENGINE PREDICTION
                            </span>
                            <p className="text-stone-200 text-xs line-clamp-2 break-words">
                              "{res.modelResponse}"
                            </p>
                            <div className="text-[11px] font-mono text-stone-400 truncate">
                              Predicted: <span className="text-stone-200">{res.predictedIntent}</span> · Sim: {Math.round(res.semanticSimilarity * 100)}%
                            </div>
                          </div>
                        </div>

                        {/* Linguistic Rationale */}
                        <div className="border-t border-white/[0.04] pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-400">
                          <span className="line-clamp-2 flex-1 min-w-0">
                            <strong className="text-stone-300 font-normal">Observation:</strong>{' '}
                            {res.detailedRationale}
                          </span>

                          <button
                            onClick={() => onNavigateToChat(res.variantText)}
                            className="text-stone-300 hover:text-white font-medium shrink-0 flex items-center gap-1 text-xs transition-colors self-end sm:self-auto cursor-pointer"
                          >
                            <span>Test in Workbench</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </Interactive3DCard>
                  );
                })}
                </div>
              </div>
            </>
          ) : (
            <div className="h-96 rounded-xl bg-[#12141c] border border-white/[0.08] flex flex-col items-center justify-center p-8 text-center">
              <ShieldCheck className="w-8 h-8 text-stone-500 mb-3" />
              <h3 className="font-serif text-lg text-stone-200">No Benchmark Selected</h3>
              <p className="text-xs text-stone-400 max-w-sm mt-1">
                Configure a canonical seed prompt on the left or select a previous run from the history to inspect the 8-variant test suite.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
