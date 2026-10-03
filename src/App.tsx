/**
 * LinguaLens — Multilingual AI Robustness Testing & Intelligence Platform
 * @license Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { TopActionBar } from './components/TopActionBar.tsx';
import { NavigationDrawer } from './components/NavigationDrawer.tsx';
import { SearchModal } from './components/SearchModal.tsx';
import { ChatView } from './components/ChatView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { RobustnessStudio } from './components/RobustnessStudio.tsx';
import { LearningView } from './components/LearningView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { MediaVoiceModal } from './components/MediaVoiceModal.tsx';
import { ThreeSpaceModal } from './components/ThreeSpaceModal.tsx';
import { Chat, Message, UserSettings, LearningProgress } from './types/index.ts';
import { api } from './services/api.ts';
import { applyTheme, getStoredTheme, ThemeOption } from './utils/theme.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'chat' | 'robustness' | 'learning' | 'settings'>('dashboard');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [is3DSpaceOpen, setIs3DSpaceOpen] = useState(false);

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(undefined);
  const [activeMessages, setActiveMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [learningProgress, setLearningProgress] = useState<LearningProgress | undefined>(undefined);

  // Pre-filled seed prompt for Robustness Studio
  const [robustnessSeedPrompt, setRobustnessSeedPrompt] = useState('I want to cancel my train ticket.');

  // Media voice narration modal data
  const [mediaVoiceData, setMediaVoiceData] = useState<{
    url: string;
    mimeType: string;
    filename: string;
  } | null>(null);

  // Load initial app data
  useEffect(() => {
    // Immediately apply cached theme for instant zero-flicker display
    const cached = getStoredTheme();
    applyTheme(cached);
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [chatsData, settingsData, progressData] = await Promise.all([
        api.getChats(),
        api.getSettings(),
        api.getLearningProgress(),
      ]);

      setChats(chatsData);
      setSettings(settingsData);
      setLearningProgress(progressData);

      if (settingsData?.theme) {
        applyTheme(settingsData.theme);
      }

      if (chatsData.length > 0) {
        setActiveChatId(chatsData[0].id);
        loadChatMessages(chatsData[0].id);
      }
    } catch (err) {
      console.error('Initialization failed:', err);
    }
  };

  const loadChatMessages = async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const chatDetails = await api.getChat(chatId);
      setActiveMessages(chatDetails.messages || []);
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId);
    setCurrentView('chat');
    await loadChatMessages(chatId);
  };

  const handleNewChat = async () => {
    try {
      const newChat = await api.createChat('New Linguistic Evaluation');
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setActiveMessages([]);
      setCurrentView('chat');
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  const handleSendMessage = async (content: string, attachments?: any[]) => {
    let targetChatId = activeChatId;

    if (!targetChatId) {
      const newChat = await api.createChat(content.slice(0, 36) || 'New Conversation');
      setChats((prev) => [newChat, ...prev]);
      targetChatId = newChat.id;
      setActiveChatId(targetChatId);
    }

    try {
      const response = await api.sendMessage(targetChatId, content, attachments);

      setActiveMessages((prev) => [...prev, response.userMessage, response.assistantMessage]);

      // Refresh chat list to update timestamps and snippets
      const updatedChats = await api.getChats();
      setChats(updatedChats);
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  const handleRenameChat = async (chatId: string, currentTitle: string) => {
    try {
      const cleanTitle = currentTitle.replace(/\s*\(Edited\)$/, '');
      const newTitle = `${cleanTitle} (Edited)`;
      await api.updateChat(chatId, { title: newTitle });
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
      );
    } catch (err) {
      console.error('Rename failed:', err);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await api.deleteChat(chatId);
      setChats((prev) => prev.filter((c) => c.id !== chatId));

      if (activeChatId === chatId) {
        const remaining = chats.filter((c) => c.id !== chatId);
        if (remaining.length > 0) {
          handleSelectChat(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleArchiveChat = async (chatId: string) => {
    try {
      await api.updateChat(chatId, { isArchived: true });
      setChats((prev) =>
        prev.map((c) => (c.id === chatId ? { ...c, isArchived: true } : c))
      );
    } catch (err) {
      console.error('Archive failed:', err);
    }
  };

  // Triggers Robustness Studio from a prompt
  const handleRunRobustnessTest = (seedText: string) => {
    setRobustnessSeedPrompt(seedText);
    setCurrentView('robustness');
  };

  // Triggers Chat from a learning exercise or variant test
  const handleNavigateToChat = async (prompt: string) => {
    setCurrentView('chat');
    handleSendMessage(prompt);
  };

  const handleSetTheme = async (nextTheme: ThemeOption) => {
    applyTheme(nextTheme);
    if (settings) {
      setSettings({ ...settings, theme: nextTheme });
    }
    try {
      await api.updateSettings({ theme: nextTheme });
    } catch (e) {
      console.warn('Failed to persist theme preference:', e);
    }
  };

  const handleToggleTheme = async () => {
    const current = settings?.theme || getStoredTheme();
    const nextTheme: ThemeOption = current === 'light' ? 'dark' : 'light';
    await handleSetTheme(nextTheme);
  };

  const activeChat = chats.find((c) => c.id === activeChatId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Responsive Left Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentView={currentView}
        onSelectView={(v) => setCurrentView(v as any)}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onOpenSearch={() => setIsSearchOpen(true)}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onArchiveChat={handleArchiveChat}
        learningProgress={learningProgress}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Action Bar */}
        <TopActionBar
          onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNewChat={handleNewChat}
          onOpenSettings={() => setCurrentView('settings')}
          currentView={currentView}
          onSelectView={(v) => setCurrentView(v as any)}
          onToggle3DModal={() => setIs3DSpaceOpen(true)}
          activeModelName={settings?.defaultModel || 'gemini-3.8-flash'}
          currentTheme={settings?.theme || getStoredTheme()}
          onToggleTheme={handleToggleTheme}
        />

        {/* Dynamic View Display */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {currentView === 'dashboard' && (
            <DashboardView
              chats={chats}
              onSelectChat={handleSelectChat}
              onSelectView={(v) => setCurrentView(v as any)}
              onOpenNewRobustnessRun={() => setCurrentView('robustness')}
              onSelectPromptForChat={handleNavigateToChat}
            />
          )}

          {currentView === 'chat' && (
            <ChatView
              chat={activeChat}
              messages={activeMessages}
              loadingMessages={loadingMessages}
              onSendMessage={handleSendMessage}
              onRunRobustnessTest={handleRunRobustnessTest}
              onSelectView={(v) => setCurrentView(v as any)}
              onTriggerVoiceNarration={(data) => setMediaVoiceData(data)}
            />
          )}

          {currentView === 'robustness' && (
            <RobustnessStudio
              initialSeedPrompt={robustnessSeedPrompt}
              onNavigateToChat={handleNavigateToChat}
            />
          )}

          {currentView === 'learning' && (
            <LearningView onNavigateToChat={handleNavigateToChat} />
          )}

          {currentView === 'settings' && (
            <SettingsView
              currentTheme={settings?.theme || getStoredTheme()}
              onThemeChange={handleSetTheme}
              onSettingsSaved={async () => {
                const [s, c] = await Promise.all([api.getSettings(), api.getChats()]);
                setSettings(s);
                if (s?.theme) {
                  applyTheme(s.theme);
                }
                setChats(c);
                if (c.length === 0) {
                  setActiveChatId(undefined);
                  setActiveMessages([]);
                } else if (!c.some((item) => item.id === activeChatId)) {
                  setActiveChatId(c[0].id);
                  loadChatMessages(c[0].id);
                }
              }}
            />
          )}
        </main>
      </div>

      {/* Interactive 3D Multilingual Semantic Constellation Modal */}
      <ThreeSpaceModal
        isOpen={is3DSpaceOpen}
        onClose={() => setIs3DSpaceOpen(false)}
        onSelectPrompt={handleNavigateToChat}
      />

      {/* Instant Search Modal (Cmd+K / Ctrl+K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectChat={handleSelectChat}
      />

      {/* Media Scene Analysis & Spoken Voice Narration Modal */}
      <MediaVoiceModal
        isOpen={mediaVoiceData !== null}
        onClose={() => setMediaVoiceData(null)}
        mediaData={mediaVoiceData}
        defaultVoice={settings?.defaultVoice || 'Kore'}
      />
    </div>
  );
}
