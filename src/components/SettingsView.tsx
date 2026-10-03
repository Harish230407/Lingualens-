import React, { useState, useEffect } from 'react';
import {
  Volume2,
  Trash2,
  Check,
  RotateCw,
  Play,
  Save,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { UserSettings } from '../types/index.ts';
import { api } from '../services/api.ts';
import { applyTheme, ThemeOption } from '../utils/theme.ts';
import { LinguaLensLogo } from './LinguaLensLogo.tsx';

interface SettingsViewProps {
  currentTheme?: ThemeOption;
  onThemeChange?: (theme: ThemeOption) => void;
  onSettingsSaved?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentTheme,
  onThemeChange,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [voices, setVoices] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [playingVoice, setPlayingVoice] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // Keep settings.theme in sync if currentTheme changes from external toggle (e.g. TopActionBar)
  useEffect(() => {
    if (currentTheme && settings && settings.theme !== currentTheme) {
      setSettings((prev) => (prev ? { ...prev, theme: currentTheme } : prev));
    }
  }, [currentTheme]);

  const loadSettings = async () => {
    try {
      const [setData, voiceData] = await Promise.all([
        api.getSettings(),
        api.getVoices(),
      ]);

      // If parent has a currentTheme preference, honor it
      if (currentTheme && setData.theme !== currentTheme) {
        setData.theme = currentTheme;
      }

      setSettings(setData);
      setVoices(voiceData.voices || []);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const handleSelectTheme = (newTheme: ThemeOption) => {
    if (settings) {
      setSettings({ ...settings, theme: newTheme });
    }
    applyTheme(newTheme);
    onThemeChange?.(newTheme);

    // Proactively persist theme preference so it never reverts
    api.updateSettings({ theme: newTheme }).catch((err) => {
      console.warn('Failed to auto-persist theme:', err);
    });
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await api.updateSettings(settings);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
      onSettingsSaved?.();
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestVoice = async () => {
    if (!settings || playingVoice) return;
    setPlayingVoice(true);
    try {
      const res = await api.synthesizeVoice({
        text: 'Hello, this is LinguaLens synthesized audio testing speech clarity and pitch.',
        voiceName: settings.defaultVoice,
      });

      if (res.audioBase64) {
        const audio = new Audio(`data:audio/mp3;base64,${res.audioBase64}`);
        audio.onended = () => setPlayingVoice(false);
        audio.onerror = () => fallbackSpeech();
        audio.play().catch(() => fallbackSpeech());
        return;
      }
    } catch {
      fallbackSpeech();
    }
  };

  const fallbackSpeech = () => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance('Hello, this is LinguaLens speech preview.');
        u.onend = () => setPlayingVoice(false);
        u.onerror = () => setPlayingVoice(false);
        window.speechSynthesis.speak(u);
      } else {
        setPlayingVoice(false);
      }
    } catch {
      setPlayingVoice(false);
    }
  };

  const handleDeleteHistory = async () => {
    try {
      await api.deleteHistory();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to delete history:', err);
    }
  };

  if (!settings) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0c10] [html[data-theme='light']_&]:bg-slate-50">
        <RotateCw className="w-6 h-6 text-stone-400 [html[data-theme='light']_&]:text-slate-500 animate-spin" />
      </div>
    );
  }

  const activeTheme = settings.theme || currentTheme || 'dark';

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b0c10] [html[data-theme='light']_&]:bg-slate-50 p-6 md:p-10 space-y-10 transition-colors">
      {/* Header with LinguaLens Official Brand Logo */}
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-baseline justify-between gap-6 border-b border-white/[0.08] [html[data-theme='light']_&]:border-slate-200 pb-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <LinguaLensLogo size="md" variant="icon" />
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-stone-400 [html[data-theme='light']_&]:text-slate-500">
                <span>Control Panel</span>
                <span aria-hidden="true">·</span>
                <span>Inference & Corpus Configuration</span>
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-normal tracking-tight text-stone-100 [html[data-theme='light']_&]:text-slate-900 transition-colors">
                Engine & Linguistic Settings
              </h1>
            </div>
          </div>
          <p className="text-sm text-stone-400 [html[data-theme='light']_&]:text-slate-600 max-w-xl leading-relaxed">
            Configure baseline languages, theme appearance, text-to-speech personas, neural model providers, and persistent storage retention.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-stone-100 hover:bg-white text-stone-900 [html[data-theme='light']_&]:bg-slate-900 [html[data-theme='light']_&]:hover:bg-slate-800 [html[data-theme='light']_&]:text-white font-medium text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
        >
          {saving ? (
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
          ) : savedSuccess ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 [html[data-theme='light']_&]:text-emerald-300" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>{savedSuccess ? 'Settings Saved' : 'Save Changes'}</span>
        </button>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Section 1: General Preferences & Theme Aesthetic */}
        <div className="rounded-xl bg-[#12141c] [html[data-theme='light']_&]:bg-white border border-white/[0.08] [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:shadow-xs p-6 space-y-5 transition-colors">
          <div className="text-xs font-mono font-semibold text-stone-300 [html[data-theme='light']_&]:text-slate-700 border-b border-white/[0.06] [html[data-theme='light']_&]:border-slate-200 pb-3">
            01. WORKSPACE PREFERENCES & APPEARANCE
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-stone-300 [html[data-theme='light']_&]:text-slate-800 font-medium text-xs block">
                Theme Aesthetic Mode
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'dark' as const,
                    label: 'Obsidian Dark',
                    desc: 'Deep architectural night mode',
                    icon: Moon,
                  },
                  {
                    id: 'light' as const,
                    label: 'Editorial Light',
                    desc: 'Crisp high-contrast day palette',
                    icon: Sun,
                  },
                  {
                    id: 'system' as const,
                    label: 'System Sync',
                    desc: 'Match OS appearance preference',
                    icon: Monitor,
                  },
                ].map((th) => {
                  const Icon = th.icon;
                  const isSelected = activeTheme === th.id;
                  return (
                    <button
                      key={th.id}
                      type="button"
                      onClick={() => handleSelectTheme(th.id)}
                      className={`p-3.5 rounded-lg border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/15 [html[data-theme=\'light\']_&]:border-blue-600 [html[data-theme=\'light\']_&]:bg-blue-50/80 shadow-xs ring-1 ring-blue-500/30'
                          : 'border-white/[0.08] [html[data-theme=\'light\']_&]:border-slate-200 bg-[#0b0c10] [html[data-theme=\'light\']_&]:bg-slate-50/80 text-stone-400 [html[data-theme=\'light\']_&]:text-slate-600 hover:text-stone-200 [html[data-theme=\'light\']_&]:hover:text-slate-900 hover:bg-white/[0.03] [html[data-theme=\'light\']_&]:hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400 [html[data-theme=\'light\']_&]:text-blue-600' : 'text-stone-400 [html[data-theme=\'light\']_&]:text-slate-500'}`} />
                          <span className={`font-semibold text-xs ${isSelected ? 'text-stone-100 [html[data-theme=\'light\']_&]:text-blue-950' : 'text-stone-300 [html[data-theme=\'light\']_&]:text-slate-700'}`}>
                            {th.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 [html[data-theme=\'light\']_&]:bg-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        )}
                      </div>
                      <p className={`text-[11px] leading-tight ${isSelected ? 'text-stone-300 [html[data-theme=\'light\']_&]:text-slate-700' : 'text-stone-400 [html[data-theme=\'light\']_&]:text-slate-500'}`}>
                        {th.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-1">
              <div className="space-y-1.5">
                <label className="text-stone-300 [html[data-theme='light']_&]:text-slate-700 font-medium">
                  Theme Selection Dropdown
                </label>
                <select
                  value={activeTheme}
                  onChange={(e) => handleSelectTheme(e.target.value as ThemeOption)}
                  className="w-full rounded-lg bg-[#0b0c10] [html[data-theme='light']_&]:bg-white border border-white/[0.08] [html[data-theme='light']_&]:border-slate-300 p-2.5 text-stone-200 [html[data-theme='light']_&]:text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="dark">Architectural Obsidian Dark (Default)</option>
                  <option value="light">Editorial Light (Day Mode)</option>
                  <option value="system">Follow System Preferences</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-stone-300 [html[data-theme='light']_&]:text-slate-700 font-medium">
                  Default Prompt Language
                </label>
                <select
                  value={settings.defaultLanguage}
                  onChange={(e) => setSettings({ ...settings, defaultLanguage: e.target.value })}
                  className="w-full rounded-lg bg-[#0b0c10] [html[data-theme='light']_&]:bg-white border border-white/[0.08] [html[data-theme='light']_&]:border-slate-300 p-2.5 text-stone-200 [html[data-theme='light']_&]:text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="English">English</option>
                  <option value="Tamil">Tamil</option>
                  <option value="Hindi">Hindi</option>
                  <option value="Telugu">Telugu</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="autoPlayVoice"
                checked={settings.autoPlayVoice}
                onChange={(e) => setSettings({ ...settings, autoPlayVoice: e.target.checked })}
                className="rounded bg-[#0b0c10] [html[data-theme='light']_&]:bg-white border-white/[0.1] [html[data-theme='light']_&]:border-slate-300 text-blue-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="autoPlayVoice" className="text-xs text-stone-300 [html[data-theme='light']_&]:text-slate-700 cursor-pointer select-none">
                Auto-synthesize voice narration when media is uploaded to dialogue workbench
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Regional Dialects */}
        <div className="rounded-xl bg-[#12141c] [html[data-theme='light']_&]:bg-white border border-white/[0.08] [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:shadow-xs p-6 space-y-4 transition-colors">
          <div className="text-xs font-mono font-semibold text-stone-300 [html[data-theme='light']_&]:text-slate-700 border-b border-white/[0.06] [html[data-theme='light']_&]:border-slate-200 pb-3">
            02. CODE-SWITCHING & DIALECT DETECTION SCOPE
          </div>

          <p className="text-xs text-stone-400 [html[data-theme='light']_&]:text-slate-600">
            Select the languages to monitor for code-switch detection, script parsing, and transliteration tests:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              'English',
              'Tamil (Tanglish)',
              'Hindi (Hinglish)',
              'Telugu (Teluglish)',
              'Malayalam',
              'Kannada',
              'Marathi',
              'Bengali',
            ].map((lang) => {
              const root = lang.split(' ')[0];
              const checked = settings.preferredLanguages.includes(root);
              return (
                <label
                  key={lang}
                  className={`p-2.5 rounded-lg border flex items-center gap-2 cursor-pointer transition-colors select-none ${
                    checked
                      ? 'bg-blue-500/15 [html[data-theme=\'light\']_&]:bg-blue-50 border-blue-500/30 [html[data-theme=\'light\']_&]:border-blue-300 text-stone-100 [html[data-theme=\'light\']_&]:text-blue-950 font-medium'
                      : 'bg-[#0b0c10] [html[data-theme=\'light\']_&]:bg-slate-50/80 border-white/[0.06] [html[data-theme=\'light\']_&]:border-slate-200 text-stone-400 [html[data-theme=\'light\']_&]:text-slate-600 hover:text-stone-200 [html[data-theme=\'light\']_&]:hover:text-slate-900'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...settings.preferredLanguages, root]
                        : settings.preferredLanguages.filter((l) => l !== root);
                      setSettings({ ...settings, preferredLanguages: updated });
                    }}
                    className="rounded bg-black/40 [html[data-theme='light']_&]:bg-white border-white/[0.1] [html[data-theme='light']_&]:border-slate-300 text-blue-500"
                  />
                  <span>{lang}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Section 3: TTS Voice */}
        <div className="rounded-xl bg-[#12141c] [html[data-theme='light']_&]:bg-white border border-white/[0.08] [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:shadow-xs p-6 space-y-4 transition-colors">
          <div className="text-xs font-mono font-semibold text-stone-300 [html[data-theme='light']_&]:text-slate-700 border-b border-white/[0.06] [html[data-theme='light']_&]:border-slate-200 pb-3">
            03. SPEECH & VOICE PERSONA
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-stone-300 [html[data-theme='light']_&]:text-slate-700 font-medium">Default Voice Persona</label>
              <select
                value={settings.defaultVoice}
                onChange={(e) => setSettings({ ...settings, defaultVoice: e.target.value })}
                className="w-full rounded-lg bg-[#0b0c10] [html[data-theme='light']_&]:bg-white border border-white/[0.08] [html[data-theme='light']_&]:border-slate-300 p-2.5 text-stone-200 [html[data-theme='light']_&]:text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end pb-0.5">
              <button
                type="button"
                onClick={handleTestVoice}
                disabled={playingVoice}
                className="px-3.5 py-2.5 rounded-lg bg-white/[0.04] [html[data-theme='light']_&]:bg-slate-100 hover:bg-white/[0.08] [html[data-theme='light']_&]:hover:bg-slate-200 text-stone-200 [html[data-theme='light']_&]:text-slate-800 border border-white/[0.08] [html[data-theme='light']_&]:border-slate-300 text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
              >
                {playingVoice ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Audition Voice Persona</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 4: AI Model Provider */}
        <div className="rounded-xl bg-[#12141c] [html[data-theme='light']_&]:bg-white border border-white/[0.08] [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:shadow-xs p-6 space-y-4 transition-colors">
          <div className="text-xs font-mono font-semibold text-stone-300 [html[data-theme='light']_&]:text-slate-700 border-b border-white/[0.06] [html[data-theme='light']_&]:border-slate-200 pb-3">
            04. INFERENCE PROVIDER ARCHITECTURE
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-stone-300 [html[data-theme='light']_&]:text-slate-700 font-medium">Active Engine</label>
              <select
                value={settings.provider}
                onChange={(e) => setSettings({ ...settings, provider: e.target.value as any })}
                className="w-full rounded-lg bg-[#0b0c10] [html[data-theme='light']_&]:bg-white border border-white/[0.08] [html[data-theme='light']_&]:border-slate-300 p-2.5 text-stone-200 [html[data-theme='light']_&]:text-slate-900 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="gemini">Google Gemini (Server-Side)</option>
                <option value="mock">Deterministic Test Mock (Offline / Quota-Free)</option>
                <option value="lmstudio">Local LM Studio (Self-Hosted)</option>
                <option value="openai">OpenAI Compatible Gateway</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-300 [html[data-theme='light']_&]:text-slate-700 font-medium">Model Identifier</label>
              <input
                type="text"
                value={settings.defaultModel}
                onChange={(e) => setSettings({ ...settings, defaultModel: e.target.value })}
                className="w-full rounded-lg bg-[#0b0c10] [html[data-theme='light']_&]:bg-white border border-white/[0.08] [html[data-theme='light']_&]:border-slate-300 p-2.5 text-stone-200 [html[data-theme='light']_&]:text-slate-900 font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-300 [html[data-theme='light']_&]:text-slate-700 font-medium">Local Endpoint</label>
              <input
                type="text"
                value={settings.lmStudioEndpoint}
                onChange={(e) => setSettings({ ...settings, lmStudioEndpoint: e.target.value })}
                className="w-full rounded-lg bg-[#0b0c10] [html[data-theme='light']_&]:bg-white border border-white/[0.08] [html[data-theme='light']_&]:border-slate-300 p-2.5 text-stone-200 [html[data-theme='light']_&]:text-slate-900 font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-stone-300 [html[data-theme='light']_&]:text-slate-700 font-medium">Sampling Temperature</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={settings.temperature}
                onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                className="w-full rounded-lg bg-[#0b0c10] [html[data-theme='light']_&]:bg-white border border-white/[0.08] [html[data-theme='light']_&]:border-slate-300 p-2.5 text-stone-200 [html[data-theme='light']_&]:text-slate-900 font-mono focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Data Retention */}
        <div className="rounded-xl bg-[#12141c] [html[data-theme='light']_&]:bg-white border border-white/[0.08] [html[data-theme='light']_&]:border-slate-200 [html[data-theme='light']_&]:shadow-xs p-6 space-y-4 transition-colors">
          <div className="text-xs font-mono font-semibold text-stone-300 [html[data-theme='light']_&]:text-slate-700 border-b border-white/[0.06] [html[data-theme='light']_&]:border-slate-200 pb-3">
            05. CORPUS & CACHE STORAGE
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <p className="font-medium text-stone-200 [html[data-theme='light']_&]:text-slate-900">Purge Corpus Database</p>
              <p className="text-stone-400 [html[data-theme='light']_&]:text-slate-600 text-xs mt-0.5 leading-relaxed">
                Permanently purge all persistent sessions, evaluation benchmarks, and transliteration indices.
              </p>
            </div>
            <button
              onClick={handleDeleteHistory}
              className="px-3.5 py-2 rounded-md bg-rose-950/40 [html[data-theme='light']_&]:bg-rose-50 hover:bg-rose-900/60 [html[data-theme='light']_&]:hover:bg-rose-100 text-rose-300 [html[data-theme='light']_&]:text-rose-700 border border-rose-900/50 [html[data-theme='light']_&]:border-rose-200 text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge Corpus History</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
