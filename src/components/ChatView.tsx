import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Plus,
  Mic,
  MicOff,
  Volume2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Share2,
  MoreHorizontal,
  Sparkles,
  Paperclip,
  Image as ImageIcon,
  Video,
  FileText,
  Database,
  Radio,
  Loader2,
  Check,
  AlertCircle,
  ShieldAlert,
  AudioLines,
} from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Chat, Message, LanguageAnalysisResult } from '../types/index.ts';
import { api } from '../services/api.ts';
import { Interactive3DCard } from './Interactive3DCard';
import { playHapticTick, playSuccessChime } from '../utils/audioHaptics';
import { LinguaLensOrb } from './3d/LinguaLensOrb.tsx';
import { LinguaLensLogo } from './LinguaLensLogo.tsx';
import { OrbState } from './3d/OrbTypes.ts';

interface ChatViewProps {
  chat?: Chat;
  messages: Message[];
  loadingMessages: boolean;
  onSendMessage: (content: string, attachments?: any[]) => Promise<void>;
  onRunRobustnessTest: (seedText: string) => void;
  onSelectView: (view: string) => void;
  onTriggerVoiceNarration: (mediaData: { url: string; mimeType: string; filename: string }) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  chat,
  messages,
  loadingMessages,
  onSendMessage,
  onRunRobustnessTest,
  onSelectView,
  onTriggerVoiceNarration,
}) => {
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [sharedMessageId, setSharedMessageId] = useState<string | null>(null);
  const [localFeedback, setLocalFeedback] = useState<Record<string, 'positive' | 'negative' | null>>({});
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micNotice, setMicNotice] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<any[]>([]);

  // 3D Multilingual AI Orb State Machine
  const [orbState, setOrbState] = useState<OrbState>('IDLE');
  const [detectedLangs, setDetectedLangs] = useState<Array<{ language: string; code?: string; confidence?: number }>>([]);
  const [isCodeSwitched, setIsCodeSwitched] = useState(false);

  // Synchronize Orb state with processing and messages
  useEffect(() => {
    if (sending) {
      setOrbState('PROCESSING');
      return;
    }

    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.metadata?.detectedLanguages && lastMsg.metadata.detectedLanguages.length > 0) {
        setDetectedLangs(
          lastMsg.metadata.detectedLanguages.map((l) => ({
            language: l.language,
            code: l.code,
            confidence: (l.percentage || 100) / 100,
          }))
        );
        const codeSwitched = !!lastMsg.metadata.isCodeSwitched || lastMsg.metadata.detectedLanguages.length > 1;
        setIsCodeSwitched(codeSwitched);
        setOrbState('LANGUAGE_DETECTED');
        const timer = setTimeout(() => {
          setOrbState('IDLE');
        }, 3200);
        return () => clearTimeout(timer);
      }
    }
    setOrbState('IDLE');
  }, [sending, messages]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  // Clean up recording timers and streams on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Speech-to-text recognition setup
  useEffect(() => {
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-IN'; // Indian English / Indic conversational default

        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((r: any) => (r as any)[0]?.transcript)
            .join('');
          if (transcript) {
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
          }
        };

        recognition.onend = () => {
          stopRecording();
        };

        recognition.onerror = (e: any) => {
          console.warn('SpeechRecognition error:', e);
          stopRecording();
        };

        recognitionRef.current = recognition;
      }
    } catch (e) {
      console.warn('SpeechRecognition initialization error:', e);
    }
  }, []);

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // ignore
      }
    }
  };

  const startMediaRecorder = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });

        if (audioBlob.size > 0) {
          setIsTranscribing(true);
          try {
            const reader = new FileReader();
            reader.onloadend = async () => {
              const base64Audio = reader.result as string;
              try {
                const res = await api.transcribeAudio({
                  audioBase64: base64Audio,
                  mimeType: audioBlob.type,
                });
                if (res && res.text) {
                  setInput((prev) => (prev ? `${prev} ${res.text}` : res.text));
                  playSuccessChime();
                }
              } catch (err) {
                console.warn('Transcription error:', err);
              } finally {
                setIsTranscribing(false);
              }
            };
            reader.readAsDataURL(audioBlob);
          } catch {
            setIsTranscribing(false);
          }
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      setMicNotice(null);
      playHapticTick();

      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('MediaRecorder error or permission denied:', err);
      setIsRecording(false);
      const isDenied =
        err.name === 'NotAllowedError' ||
        err.name === 'SecurityError' ||
        err.message?.includes('Permission');
      setMicNotice(
        isDenied
          ? 'Microphone permission blocked in this browser preview. Use the test prompts below or allow mic permissions in your browser bar.'
          : 'Microphone hardware unavailable in this session. You can tap quick voice prompts below:'
      );
    }
  };

  const handleToggleRecord = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    setMicNotice(null);

    // 1. Try native Web Speech API if supported
    if (recognitionRef.current) {
      try {
        setIsRecording(true);
        setRecordSeconds(0);
        playHapticTick();
        recognitionRef.current.start();
        timerRef.current = setInterval(() => {
          setRecordSeconds((s) => s + 1);
        }, 1000);
        return;
      } catch (err) {
        console.warn('SpeechRecognition start failed, falling back to MediaRecorder:', err);
      }
    }

    // 2. Try MediaRecorder + Gemini Server-side transcription
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === 'function') {
      await startMediaRecorder();
    } else {
      setMicNotice('Speech recognition and MediaRecorder are not supported in this browser. Tap any test prompt below:');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = input.trim();
    if ((!content && pendingAttachments.length === 0) || sending) return;

    setSending(true);
    setInput('');
    const attachToSend = [...pendingAttachments];
    setPendingAttachments([]);

    try {
      await onSendMessage(content, attachToSend);
    } catch (err: any) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.warn('Failed to copy text:', err);
    }
  };

  const handleShare = async (id: string, text: string) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'LinguaLens AI Analysis',
          text,
        });
        setSharedMessageId(id);
        setTimeout(() => setSharedMessageId(null), 2000);
      } else {
        await handleCopy(id, text);
        setSharedMessageId(id);
        setTimeout(() => setSharedMessageId(null), 2000);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('Share error, falling back to copy:', err);
        handleCopy(id, text);
        setSharedMessageId(id);
        setTimeout(() => setSharedMessageId(null), 2000);
      }
    }
  };

  const handleFeedback = async (msgId: string, feedback: 'positive' | 'negative') => {
    const current = localFeedback[msgId] ?? messages.find((m) => m.id === msgId)?.feedback ?? null;
    const newFeedback = current === feedback ? null : feedback;
    setLocalFeedback((prev) => ({ ...prev, [msgId]: newFeedback }));
    playHapticTick();
    try {
      await api.setMessageFeedback(msgId, newFeedback);
    } catch (err) {
      console.error('Failed to store message feedback:', err);
    }
  };

  const handleReadAloud = async (msgId: string, text: string) => {
    setPlayingAudioId(msgId);
    try {
      // 1. Try backend TTS synthesis endpoint
      const result = await api.synthesizeVoice({ text });
      if (result.audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${result.audioBase64}`);
        audio.onended = () => setPlayingAudioId(null);
        audio.onerror = () => {
          fallbackSpeech(text, msgId);
        };
        audio.play().catch(() => {
          fallbackSpeech(text, msgId);
        });
        return;
      }
    } catch {
      // Seamlessly fall back to browser speech synthesis
    }
    fallbackSpeech(text, msgId);
  };

  const fallbackSpeech = (text: string, msgId: string) => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.onend = () => setPlayingAudioId(null);
        utterance.onerror = () => setPlayingAudioId(null);
        window.speechSynthesis.speak(utterance);
      } else {
        setPlayingAudioId(null);
      }
    } catch (err) {
      console.warn('Speech synthesis error:', err);
      setPlayingAudioId(null);
    }
  };

  // File Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      const newAttachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        base64Data,
        previewUrl: base64Data,
      };

      setPendingAttachments((prev) => [...prev, newAttachment]);
      setShowAttachMenu(false);

      // Auto-trigger voice narration preview if image or video
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        onTriggerVoiceNarration({
          url: base64Data,
          mimeType: file.type,
          filename: file.name,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Ambient background glow at the bottom, matching Gemini UI in the screenshot */}
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-blue-900/15 via-indigo-950/10 to-transparent pointer-events-none" />

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-8 space-y-6 relative z-10">
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          /* Editorial Linguistic Workbench State with 3D Multilingual AI Orb Centerpiece */
          <div className="max-w-3xl mx-auto h-full flex flex-col justify-center py-6 px-4">
            {/* 3D Multilingual AI Orb Centerpiece */}
            <div className="flex flex-col items-center justify-center mb-6">
              <LinguaLensOrb
                state={orbState}
                size="responsive"
                activeLanguages={detectedLangs}
                isCodeSwitched={isCodeSwitched}
                interactive={true}
                showLanguageLabels={true}
                onClick={() => {
                  playSuccessChime();
                  confetti({
                    particleCount: 28,
                    spread: 60,
                    origin: { y: 0.6 },
                    colors: ['#38bdf8', '#34d399', '#fbbf24', '#a78bfa'],
                  });
                }}
              />

              <div className="text-center space-y-2 mt-6 mb-6 max-w-xl px-2">
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-100 tracking-tight leading-tight">
                  Hi Harish, what's on your mind?
                </h1>
                <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto leading-relaxed">
                  Ask in English, Tamil, Hindi, or mixed languages.
                </p>
                <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-cyan-400/80 pt-1">
                  <span>Multilingual Intelligence Orb</span>
                  <span aria-hidden="true">·</span>
                  <span>Click to pulse or drag to inspect nodes</span>
                </div>
              </div>
            </div>

            {/* Curated Prompt Benchmarks with 3D Tilt Interaction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                {
                  category: 'Tanglish Inversion & Negation',
                  prompt: 'Naalaiku ticket confirm aagala na, refund automatic-ah varuma illai apply pannanuma?',
                  description: 'Tests conditional particle and suffix negation comprehension',
                },
                {
                  category: 'Hinglish Morphosyntax',
                  prompt: 'Bhai kal subah flight reschedule ho sakti hai kya, cancel mat karna please.',
                  description: 'Tests imperative negation trap ("cancel mat karna")',
                },
                {
                  category: 'Mixed Script Boundary',
                  prompt: 'Emergency hai, कृपया verify panna mudiyuma status?',
                  description: 'Tests simultaneous Latin, Devanagari, and Tamil phonology',
                },
                {
                  category: 'Phonetic Slang Drift',
                  prompt: 'Bro scene off aayiduchu, booking cancel pannidu da.',
                  description: 'Tests informal vernacular slang and colloquial discourse markers',
                },
              ].map((sample, sIdx) => (
                <Interactive3DCard
                  key={sIdx}
                  maxTilt={6}
                  onClick={() => {
                    setInput(sample.prompt);
                    playHapticTick();
                    confetti({
                      particleCount: 28,
                      spread: 60,
                      origin: { y: 0.8 },
                      colors: ['#38bdf8', '#34d399', '#fbbf24', '#a78bfa'],
                    });
                  }}
                >
                  <div className="text-left p-3.5 h-full rounded-lg bg-[#12141c] hover:bg-[#181a24] border border-white/[0.06] hover:border-white/[0.12] transition-colors group">
                    <div className="text-[11px] font-mono text-stone-400 group-hover:text-stone-300 mb-1">
                      {sample.category}
                    </div>
                    <div className="text-xs font-medium text-stone-200 group-hover:text-white mb-1.5 leading-snug">
                      "{sample.prompt}"
                    </div>
                    <div className="text-[11px] text-stone-400 leading-normal">
                      {sample.description}
                    </div>
                  </div>
                </Interactive3DCard>
              ))}
            </div>

            <div className="text-center text-xs text-stone-400">
              Select a benchmark prompt above or type below to initiate real-time token decomposition.
            </div>
          </div>
        ) : (
          <>
            {/* Active Chat: Compact Live Companion Header */}
            <div className="sticky top-0 z-20 mb-4 px-3 sm:px-4 py-2 bg-slate-950/95 backdrop-blur-md border border-white/[0.08] [html[data-theme='light']_&]:bg-white/95 [html[data-theme='light']_&]:border-slate-200 flex items-center justify-between rounded-xl shadow-lg gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500/30 via-blue-500/20 to-indigo-600/30 p-0.5 border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center justify-center overflow-hidden">
                    <LinguaLensLogo size={36} variant="icon" shape="circle" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950 [html[data-theme='light']_&]:border-white animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-stone-200 shrink-0">
                      Multilingual Neural Engine
                    </span>
                    {sending ? (
                      <span className="text-[10px] font-mono text-cyan-400 animate-pulse truncate">
                        Processing tokens...
                      </span>
                    ) : isCodeSwitched ? (
                      <span className="text-[10px] font-mono text-emerald-400 truncate">
                        Code-switch active: {detectedLangs.map((l) => l.language).join(' ↔ ')}
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-stone-400 truncate">
                        Monitoring cross-lingual tokens
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-stone-400 truncate">
                    Real-time dialectal perturbation & invariant tracking
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setOrbState('LANGUAGE_DETECTED');
                    setDetectedLangs([
                      { language: 'Tamil', code: 'ta', confidence: 0.96 },
                      { language: 'English', code: 'en', confidence: 0.89 },
                    ]);
                    setIsCodeSwitched(true);
                    playHapticTick();
                  }}
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-stone-300 transition-colors cursor-pointer shrink-0"
                  title="Test Tamil ↔ English code-switching pulse"
                >
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>Ta ↔ En Pulse</span>
                </button>
              </div>
            </div>

            {messages.map((msg, msgIdx) => {
            const isUser = msg.role === 'user';
            const meta = msg.metadata;
            const uniqueMessageKey = msg.id ? `${msg.id}-${msgIdx}` : `msg-${msgIdx}`;

            return (
              <motion.div
                key={uniqueMessageKey}
                initial={{ opacity: 0, y: 14, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className={`w-full flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-3xl mx-auto`}
              >
                {/* Code-Switching Indicators for User Input (Zero-Pill Discipline) */}
                {isUser && meta?.detectedLanguages && meta.detectedLanguages.length > 0 && (
                  <div className="flex flex-wrap items-center justify-end gap-1.5 mb-1.5 text-xs text-stone-400 font-mono">
                    {meta.detectedLanguages.map((l, lIdx) => (
                      <span key={`${l.code || l.language || 'lang'}-${lIdx}`} className="flex items-center">
                        <span className="text-stone-300 font-medium">{l.language}</span>
                        <span className="ml-1 text-stone-400 tabular-nums">({l.percentage}%)</span>
                        {lIdx < meta.detectedLanguages!.length - 1 && (
                          <span className="mx-1 text-stone-500" aria-hidden="true">·</span>
                        )}
                      </span>
                    ))}
                    {meta.isCodeSwitched && (
                      <>
                        <span className="text-stone-500" aria-hidden="true">·</span>
                        <span className="text-blue-400 font-medium">
                          {meta.codeSwitchPoints || 1} switch boundaries
                        </span>
                      </>
                    )}
                    {meta.transliterationProbability && meta.transliterationProbability > 0.4 ? (
                      <>
                        <span className="text-stone-500" aria-hidden="true">·</span>
                        <span className="text-amber-400/90">
                          Transliterated ({Math.round(meta.transliterationProbability * 100)}%)
                        </span>
                      </>
                    ) : null}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative group rounded-xl px-4 py-3 text-sm max-w-2xl leading-relaxed break-words overflow-hidden ${
                    isUser
                      ? 'bg-[#181a24] border border-white/[0.08] text-stone-100 shadow-sm'
                      : 'bg-[#12141c] border border-white/[0.06] text-stone-200'
                  }`}
                >
                  {/* Attachments preview */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mb-2 space-y-2">
                      {msg.attachments.map((att, attIdx) => (
                        <div
                          key={att.id || `att-${attIdx}-${att.filename || 'file'}`}
                          className="rounded-lg overflow-hidden border border-white/[0.08] bg-black/40 p-2"
                        >
                          {att.mimeType.startsWith('image/') ? (
                            <img
                              src={att.url || (att as any).base64Data}
                              alt={att.filename}
                              className="max-h-60 rounded object-cover mx-auto"
                            />
                          ) : att.mimeType.startsWith('video/') ? (
                            <video
                              src={att.url || (att as any).base64Data}
                              controls
                              className="max-h-60 rounded mx-auto"
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-stone-300">
                              <FileText className="w-4 h-4 text-blue-400" />
                              <span>{att.filename}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Text Content */}
                  <div className="whitespace-pre-wrap font-sans break-words [overflow-wrap:anywhere]">{msg.content}</div>

                  {/* Robustness Suite Suggestion Banner */}
                  {!isUser && meta?.suggestedRobustnessRun && (
                    <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/[0.08] flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-stone-300">
                        <ShieldAlert className="w-4 h-4 shrink-0 text-blue-400" />
                        <span>Code-switching detected. Evaluate model robustness across variants?</span>
                      </div>
                      <button
                        onClick={() => {
                          const prevUserMsg = messages[messages.indexOf(msg) - 1];
                          onRunRobustnessTest(prevUserMsg ? prevUserMsg.content : msg.content);
                        }}
                        className="px-2.5 py-1 rounded bg-stone-100 hover:bg-white text-stone-900 font-medium text-xs shrink-0 transition-colors cursor-pointer"
                      >
                        Run Benchmark
                      </button>
                    </div>
                  )}
                </div>

                {/* Assistant Message Actions Toolbar */}
                {!isUser && (
                  <div className="flex flex-wrap items-center gap-1 mt-1.5 text-slate-400 text-xs">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1.5 rounded hover:text-slate-200 hover:bg-slate-800 transition-colors"
                      title="Copy complete message"
                    >
                      {copiedMessageId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {(() => {
                      const effectiveFeedback = localFeedback[msg.id] !== undefined ? localFeedback[msg.id] : msg.feedback;
                      return (
                        <>
                          <button
                            onClick={() => handleFeedback(msg.id, 'positive')}
                            className={`p-1.5 rounded hover:text-emerald-400 hover:bg-slate-800 transition-colors ${
                              effectiveFeedback === 'positive' ? 'text-emerald-400 bg-slate-800' : ''
                            }`}
                            title="Good response"
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleFeedback(msg.id, 'negative')}
                            className={`p-1.5 rounded hover:text-rose-400 hover:bg-slate-800 transition-colors ${
                              effectiveFeedback === 'negative' ? 'text-rose-400 bg-slate-800' : ''
                            }`}
                            title="Bad response"
                          >
                            <ThumbsDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      );
                    })()}

                    <button
                      onClick={() => handleReadAloud(msg.id, msg.content)}
                      className={`p-1.5 rounded hover:text-cyan-400 hover:bg-slate-800 transition-colors ${
                        playingAudioId === msg.id ? 'text-cyan-400 animate-pulse' : ''
                      }`}
                      title="Read Aloud with Voice TTS"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleShare(msg.id, msg.content)}
                      className="p-1.5 rounded hover:text-sky-400 hover:bg-slate-800 transition-colors"
                      title="Share message"
                    >
                      {sharedMessageId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {meta?.latencyMs && (
                      <span className="text-[10px] text-slate-500 font-mono ml-2">
                        {meta.latencyMs}ms • {meta.modelUsed || 'AI'}
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
          </>
        )}

        {sending && (
          <div className="flex items-center gap-2 max-w-3xl mx-auto text-xs text-slate-400 py-2">
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
            <span>LinguaLens is parsing code-switching tokens and evaluating intent...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Pending Attachments Banner */}
      {pendingAttachments.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2 overflow-x-auto">
          {pendingAttachments.map((att, idx) => (
            <div
              key={(att as any).id || `pending-${idx}-${att.filename}`}
              className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 shrink-0"
            >
              <Paperclip className="w-3 h-3 text-cyan-400" />
              <span className="max-w-[150px] truncate">{att.filename}</span>
              <button
                onClick={() => setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-rose-400"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <div className="p-3 md:p-5 relative z-20 border-t border-white/[0.06] [html[data-theme='light']_&]:border-slate-200 bg-[#0c0d12] [html[data-theme='light']_&]:bg-white">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Active Audio Recording Feedback Banner */}
          {isRecording && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 [html[data-theme='light']_&]:bg-rose-50 border border-rose-500/40 [html[data-theme='light']_&]:border-rose-300 backdrop-blur-md flex items-center justify-between gap-3 text-xs animate-in fade-in duration-200 shadow-lg">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                <AudioLines className="w-4 h-4 text-rose-400 [html[data-theme='light']_&]:text-rose-600 animate-pulse shrink-0" />
                <span className="font-mono font-semibold text-rose-200 [html[data-theme='light']_&]:text-rose-900">
                  Listening ({Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, '0')})
                </span>
                <span className="text-[11px] text-rose-300/80 [html[data-theme='light']_&]:text-rose-700 hidden sm:inline">
                  Speak in English, Tanglish, Hinglish, or any regional dialect...
                </span>
              </div>
              <button
                type="button"
                onClick={stopRecording}
                className="px-3 py-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                Stop & Transcribe
              </button>
            </div>
          )}

          {/* Transcribing Audio with Gemini Indicator */}
          {isTranscribing && (
            <div className="p-2.5 rounded-xl bg-cyan-950/80 [html[data-theme='light']_&]:bg-sky-50 border border-cyan-500/40 [html[data-theme='light']_&]:border-sky-300 backdrop-blur-md flex items-center gap-2.5 text-xs text-cyan-200 [html[data-theme='light']_&]:text-sky-900 animate-in fade-in duration-200 shadow-lg">
              <Loader2 className="w-4 h-4 text-cyan-400 [html[data-theme='light']_&]:text-sky-600 animate-spin shrink-0" />
              <span className="font-mono font-medium">Transcribing speech with Gemini Neural Voice Engine...</span>
            </div>
          )}

          {/* Mic Restricted / Sandbox Helper Banner */}
          {micNotice && (
            <div className="p-3 rounded-xl bg-[#141622] [html[data-theme='light']_&]:bg-slate-100 border border-white/10 [html[data-theme='light']_&]:border-slate-300 text-xs space-y-2 animate-in fade-in duration-200 shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 text-amber-400 [html[data-theme='light']_&]:text-amber-700 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{micNotice}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setMicNotice(null)}
                  className="text-stone-400 hover:text-stone-200 [html[data-theme='light']_&]:text-slate-600 text-xs px-1 cursor-pointer"
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: 'Tanglish', text: 'Train ticket cancel pannanum, refund eppo varum?' },
                  { label: 'Hinglish', text: 'Mera train ticket cancel kardo aur refund check karo' },
                  { label: 'English', text: 'I want to cancel my ticket and check refund status.' },
                  { label: 'Teluglish', text: 'Naa train ticket cancel cheyandi, refund eppudu vasthundi?' },
                ].map((sample) => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => {
                      setInput(sample.text);
                      setMicNotice(null);
                      playHapticTick();
                    }}
                    className="px-2.5 py-1 rounded-md bg-white/[0.04] [html[data-theme='light']_&]:bg-white hover:bg-white/[0.08] [html[data-theme='light']_&]:hover:bg-slate-200 border border-white/[0.08] [html[data-theme='light']_&]:border-slate-300 text-[11px] text-stone-300 [html[data-theme='light']_&]:text-slate-800 transition-colors cursor-pointer text-left"
                  >
                    <span className="font-semibold text-cyan-400 [html[data-theme='light']_&]:text-blue-600 mr-1.5">[{sample.label}]</span>
                    "{sample.text}"
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-xl bg-[#12141c] [html[data-theme='light']_&]:bg-white border border-white/[0.1] [html[data-theme='light']_&]:border-slate-300 px-3 py-2 focus-within:border-blue-500/60 transition-all flex items-center gap-2 shadow-xs"
          >
            {/* Add Media Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttachMenu(!showAttachMenu)}
                className="w-8 h-8 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-100 [html[data-theme='light']_&]:text-slate-500 [html[data-theme='light']_&]:hover:text-slate-900 hover:bg-white/[0.05] [html[data-theme='light']_&]:hover:bg-slate-100 transition-colors cursor-pointer"
                title="Attach media or dataset"
              >
                <Plus className="w-4 h-4" />
              </button>

              {/* Attach Dropdown Menu */}
              {showAttachMenu && (
                <div className="absolute bottom-12 left-0 w-52 bg-[#161822] [html[data-theme='light']_&]:bg-white border border-white/[0.1] [html[data-theme='light']_&]:border-slate-200 rounded-lg shadow-2xl py-1.5 z-50 text-xs">
                  <label className="flex items-center gap-2.5 px-3 py-2 text-stone-300 [html[data-theme='light']_&]:text-slate-700 hover:bg-white/[0.06] [html[data-theme='light']_&]:hover:bg-slate-100 cursor-pointer">
                    <ImageIcon className="w-4 h-4 text-stone-400 [html[data-theme='light']_&]:text-slate-500" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'image')}
                    />
                  </label>

                  <label className="flex items-center gap-2.5 px-3 py-2 text-stone-300 [html[data-theme='light']_&]:text-slate-700 hover:bg-white/[0.06] [html[data-theme='light']_&]:hover:bg-slate-100 cursor-pointer">
                    <Video className="w-4 h-4 text-stone-400 [html[data-theme='light']_&]:text-slate-500" />
                    <span>Upload Video</span>
                    <input
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'video')}
                    />
                  </label>

                  <label className="flex items-center gap-2.5 px-3 py-2 text-stone-300 [html[data-theme='light']_&]:text-slate-700 hover:bg-white/[0.06] [html[data-theme='light']_&]:hover:bg-slate-100 cursor-pointer">
                    <Radio className="w-4 h-4 text-stone-400 [html[data-theme='light']_&]:text-slate-500" />
                    <span>Upload Audio</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'audio')}
                    />
                  </label>

                  <label className="flex items-center gap-2.5 px-3 py-2 text-stone-300 [html[data-theme='light']_&]:text-slate-700 hover:bg-white/[0.06] [html[data-theme='light']_&]:hover:bg-slate-100 cursor-pointer">
                    <Database className="w-4 h-4 text-stone-400 [html[data-theme='light']_&]:text-slate-500" />
                    <span>Attach Test Dataset</span>
                    <input
                      type="file"
                      accept=".json,.csv"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'dataset')}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Auto-expanding text input */}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type in English, Tanglish, Hinglish, or South Asian dialect..."
              rows={1}
              className="flex-1 bg-transparent text-sm text-stone-100 [html[data-theme='light']_&]:text-slate-900 placeholder-stone-400 [html[data-theme='light']_&]:placeholder-slate-400 resize-none max-h-32 focus:outline-none py-1.5 px-2 leading-relaxed"
            />

            {/* Speech to text microphone */}
            <button
              type="button"
              onClick={handleToggleRecord}
              disabled={isTranscribing}
              className={`w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                isRecording
                  ? 'text-rose-400 bg-rose-950/70 ring-1 ring-rose-500 animate-pulse'
                  : isTranscribing
                  ? 'text-cyan-400 bg-cyan-950/40 animate-pulse'
                  : 'text-stone-400 hover:text-stone-100 [html[data-theme=\'light\']_&]:text-slate-500 [html[data-theme=\'light\']_&]:hover:text-slate-900 hover:bg-white/[0.05] [html[data-theme=\'light\']_&]:hover:bg-slate-100'
              }`}
              title={isRecording ? 'Click to stop listening' : isTranscribing ? 'Transcribing...' : 'Voice Input (Speech-to-Text)'}
            >
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-4 h-4 text-rose-400" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Action button */}
            <button
              type="submit"
              disabled={sending || (!input.trim() && pendingAttachments.length === 0)}
              className="px-3 py-1.5 rounded-md bg-stone-100 hover:bg-white [html[data-theme='light']_&]:bg-slate-900 [html[data-theme='light']_&]:hover:bg-slate-800 [html[data-theme='light']_&]:text-white disabled:opacity-30 disabled:hover:bg-stone-100 text-stone-900 text-xs font-medium transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
              title="Send prompt for evaluation"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Evaluate</span>
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-stone-400 mt-2 font-mono">
          LinguaLens evaluates linguistic robustness and semantic invariant preservation.
        </p>
      </div>
    </div>
  );
};
