import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  X,
  Loader2,
  Play,
  RotateCw,
  Languages,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { ThreeAudioVisualizer } from './ThreeAudioVisualizer';
import { playHapticTick } from '../utils/audioHaptics';

interface MediaVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaData: {
    url: string;
    mimeType: string;
    filename: string;
  } | null;
  defaultVoice?: string;
}

export const MediaVoiceModal: React.FC<MediaVoiceModalProps> = ({
  isOpen,
  onClose,
  mediaData,
  defaultVoice = 'Kore',
}) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [targetLanguage, setTargetLanguage] = useState('English');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen && mediaData) {
      handleAnalyzeMedia();
    } else {
      setAnalysisResult(null);
      if (audioEl) {
        audioEl.pause();
      }
      setIsPlayingAudio(false);
    }
  }, [isOpen, mediaData, targetLanguage]);

  const handleAnalyzeMedia = async () => {
    if (!mediaData) return;
    setAnalyzing(true);
    try {
      const data = await api.analyzeMedia({
        base64Data: mediaData.url,
        mimeType: mediaData.mimeType,
        filename: mediaData.filename,
        targetLanguage,
      });
      setAnalysisResult(data);

      // Auto-play voice narration
      if (data.audioBase64) {
        playAudio(data.audioBase64);
      } else if (data.voiceNarrationText) {
        playTTS(data.voiceNarrationText);
      }
    } catch (err) {
      console.error('Media voice narration failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const playAudio = (base64Audio: string) => {
    if (audioEl) audioEl.pause();
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    setAudioEl(audio);
    setIsPlayingAudio(true);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => {
      setIsPlayingAudio(false);
      if (analysisResult?.voiceNarrationText) {
        playTTS(analysisResult.voiceNarrationText);
      }
    };
    audio.play().catch(() => {
      setIsPlayingAudio(false);
    });
  };

  const playTTS = async (text: string) => {
    try {
      const resp = await api.synthesizeVoice({ text, voiceName: defaultVoice });
      if (resp.audioBase64) {
        playAudio(resp.audioBase64);
        return;
      }
    } catch {
      // Clean fallback
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(u);
    }
  };

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      if (audioEl) audioEl.pause();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else if (analysisResult?.voiceNarrationText) {
      playTTS(analysisResult.voiceNarrationText);
    }
  };

  if (!isOpen || !mediaData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-[#12141c] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#0c0d12]">
          <div className="flex items-center gap-2 text-xs">
            <Volume2 className="w-4 h-4 text-stone-400" />
            <div>
              <span className="font-medium text-stone-100">
                Visual Scene Analysis & Voice Synthesis
              </span>
              <p className="text-[11px] text-stone-400 font-mono">{mediaData.filename}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-stone-400 hover:text-stone-200 hover:bg-white/[0.05]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Media Preview Box */}
          <div className="rounded-lg overflow-hidden bg-black/60 border border-white/[0.08] flex items-center justify-center p-2 max-h-60">
            {mediaData.mimeType.startsWith('image/') ? (
              <img
                src={mediaData.url}
                alt={mediaData.filename}
                className="max-h-52 object-contain rounded"
              />
            ) : mediaData.mimeType.startsWith('video/') ? (
              <video src={mediaData.url} controls className="max-h-52 rounded" />
            ) : (
              <div className="p-8 text-center text-xs text-stone-400">
                Media document ready for inspection
              </div>
            )}
          </div>

          {/* Analysis & Spoken Narration Box */}
          {analyzing ? (
            <div className="p-6 rounded-lg bg-[#0b0c10] border border-white/[0.08] flex flex-col items-center justify-center text-center space-y-2">
              <Loader2 className="w-5 h-5 text-stone-400 animate-spin" />
              <p className="text-xs text-stone-300">
                Evaluating visual tokens and synthesizing vocal narration...
              </p>
            </div>
          ) : analysisResult ? (
            <div className="space-y-4">
              {/* Spoken Voice Script Card */}
              <div className="p-4 rounded-lg bg-[#0b0c10] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono text-stone-300">
                    SYNTHESIZED NARRATION
                  </div>
                  <button
                    onClick={() => {
                      playHapticTick();
                      handleToggleAudio();
                    }}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors border ${
                      isPlayingAudio
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] text-stone-200 border-white/[0.08]'
                    }`}
                  >
                    {isPlayingAudio ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>Mute Audio</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play Voice Narration</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 3D WebGL Audio Wave Visualizer */}
                <div className="h-28 w-full bg-[#0b0c10] rounded-lg border border-white/[0.06] overflow-hidden relative">
                  <ThreeAudioVisualizer
                    isPlaying={isPlayingAudio}
                    accentColor="#34d399"
                    className="h-full"
                  />
                  <div className="absolute bottom-1.5 right-2 text-[9px] font-mono text-stone-500 pointer-events-none">
                    3D Waveform Ribbon
                  </div>
                </div>

                <p className="font-serif text-sm text-stone-200 leading-relaxed italic bg-[#141620] p-3 rounded border border-white/[0.06]">
                  "{analysisResult.voiceNarrationText}"
                </p>
              </div>

              {/* Scene & Linguistic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[#0b0c10] border border-white/[0.08] space-y-1">
                  <span className="text-[10px] font-mono text-stone-400 block">
                    SCENE UNDERSTANDING
                  </span>
                  <p className="text-stone-300 text-xs leading-relaxed">
                    {analysisResult.description}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-[#0b0c10] border border-white/[0.08] space-y-1">
                  <span className="text-[10px] font-mono text-stone-400 block">
                    LINGUISTIC PHENOMENA
                  </span>
                  <p className="text-stone-300 text-xs leading-relaxed">
                    {analysisResult.codeSwitchObservations || 'Detected visual text & token patterns.'}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0c0d12] flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <Languages className="w-3.5 h-3.5 text-stone-400" />
            <span>Target Dialect:</span>
            <select
              value={targetLanguage}
              onChange={(e) => setTargetLanguage(e.target.value)}
              className="rounded bg-[#12141c] border border-white/[0.1] px-2 py-1 text-stone-200 text-xs focus:outline-none"
            >
              <option value="English">English</option>
              <option value="Tamil">Tamil</option>
              <option value="Hindi">Hindi</option>
              <option value="Telugu">Telugu</option>
            </select>
          </div>

          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-stone-100 hover:bg-white text-stone-900 font-medium text-xs transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
