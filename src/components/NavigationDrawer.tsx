import React, { useState } from 'react';
import {
  Plus,
  Search,
  LayoutDashboard,
  ShieldCheck,
  GraduationCap,
  Sliders,
  MessageSquare,
  MoreHorizontal,
  Edit2,
  Share2,
  Archive,
  Trash2,
  X,
  Flame,
} from 'lucide-react';
import { Chat, LearningProgress } from '../types/index.ts';
import { LinguaLensLogo } from './LinguaLensLogo.tsx';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onSelectView: (view: string) => void;
  chats: Chat[];
  activeChatId?: string;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onOpenSearch: () => void;
  onRenameChat: (chatId: string, currentTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
  onArchiveChat: (chatId: string) => void;
  learningProgress?: LearningProgress;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentView,
  onSelectView,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onOpenSearch,
  onRenameChat,
  onDeleteChat,
  onArchiveChat,
  learningProgress,
}) => {
  const [activeMenuChatId, setActiveMenuChatId] = useState<string | null>(null);

  const nonArchivedChats = chats.filter((c) => !c.isArchived);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer Container */}
      <aside
        className={`fixed lg:static top-0 left-0 bottom-0 z-50 w-72 shrink-0 bg-[#0c0d12] border-r border-white/[0.08] flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-white/[0.08] [html[data-theme='light']_&]:border-slate-200">
          <div className="flex items-center gap-3">
            <LinguaLensLogo size="sm" variant="icon" />
            <div>
              <span className="font-serif text-base tracking-tight font-medium text-stone-100 [html[data-theme='light']_&]:text-slate-900 transition-colors">
                LinguaLens Lab
              </span>
              <p className="text-[11px] text-stone-400 [html[data-theme='light']_&]:text-slate-500">Linguistic Benchmarks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md text-stone-400 hover:text-stone-200 hover:bg-white/[0.05]"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="p-3 space-y-1.5">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-stone-100 hover:bg-white text-stone-900 text-xs font-medium transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Evaluation Session</span>
          </button>

          <button
            onClick={() => {
              onOpenSearch();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-md bg-white/[0.02] hover:bg-white/[0.05] text-stone-400 hover:text-stone-200 text-xs border border-white/[0.06] transition-colors"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-stone-400" />
              <span>Search sessions</span>
            </div>
            <kbd className="font-mono text-[10px] text-stone-400 bg-black/40 px-1 py-0.5 rounded border border-white/[0.06]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Workspaces / Views Navigation Links */}
        <div className="px-3 py-2 border-y border-white/[0.06] space-y-0.5">
          <button
            onClick={() => {
              onSelectView('dashboard');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
              currentView === 'dashboard'
                ? 'bg-white/[0.08] text-white font-medium'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.03]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-stone-400" />
            <span>Executive Overview</span>
          </button>

          <button
            onClick={() => {
              onSelectView('robustness');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
              currentView === 'robustness'
                ? 'bg-white/[0.08] text-white font-medium'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Robustness Lab</span>
            </div>
            <span className="text-[10px] font-mono text-stone-400">8 suites</span>
          </button>

          <button
            onClick={() => {
              onSelectView('learning');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
              currentView === 'learning'
                ? 'bg-white/[0.08] text-white font-medium'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.03]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
              <span>Language Learning</span>
            </div>
            {learningProgress && (
              <span className="text-[11px] text-stone-400 font-mono">
                {learningProgress.streakDays}d streak
              </span>
            )}
          </button>

          <button
            onClick={() => {
              onSelectView('settings');
              if (window.innerWidth < 1024) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
              currentView === 'settings'
                ? 'bg-white/[0.08] text-white font-medium'
                : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.03]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-stone-400" />
            <span>Engine Config</span>
          </button>
        </div>

        {/* Recent Evaluation Sessions List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <div className="flex items-center justify-between px-2 py-1.5 text-[11px] font-medium text-stone-400">
            <span>Sessions</span>
            <span className="font-mono text-[10px]">{nonArchivedChats.length}</span>
          </div>

          {nonArchivedChats.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-stone-400">
              No sessions yet
            </div>
          ) : (
            nonArchivedChats.map((chat) => {
              const isActive = currentView === 'chat' && activeChatId === chat.id;
              const isMenuOpen = activeMenuChatId === chat.id;

              return (
                <div
                  key={chat.id}
                  className={`group relative flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs transition-colors ${
                    isActive
                      ? 'bg-white/[0.08] text-stone-100 font-medium'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.03]'
                  }`}
                >
                  <button
                    onClick={() => {
                      onSelectChat(chat.id);
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className="flex-1 text-left flex items-center gap-2 overflow-hidden mr-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-40 group-hover:opacity-75" />
                    <span className="truncate">{chat.title}</span>
                  </button>

                  {/* Context menu trigger */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuChatId(isMenuOpen ? null : chat.id);
                      }}
                      className={`p-1 rounded hover:bg-white/[0.08] transition-opacity ${
                        isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      aria-label="Session options"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5 text-stone-400" />
                    </button>

                    {/* Popover options menu */}
                    {isMenuOpen && (
                      <div
                        className="absolute right-0 top-6 w-36 bg-[#161822] border border-white/[0.1] rounded-md shadow-2xl py-1 z-50 text-xs"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setActiveMenuChatId(null);
                            onRenameChat(chat.id, chat.title);
                          }}
                          className="w-full text-left px-3 py-1.5 text-stone-300 hover:bg-white/[0.06] flex items-center gap-2"
                        >
                          <Edit2 className="w-3 h-3 text-stone-400" />
                          <span>Rename</span>
                        </button>

                        <button
                          onClick={async () => {
                            setActiveMenuChatId(null);
                            try {
                              if (navigator.clipboard?.writeText) {
                                await navigator.clipboard.writeText(
                                  `LinguaLens Session: ${chat.title}`
                                );
                              }
                            } catch (e) {
                              console.warn('Share copy error:', e);
                            }
                          }}
                          className="w-full text-left px-3 py-1.5 text-stone-300 hover:bg-white/[0.06] flex items-center gap-2"
                        >
                          <Share2 className="w-3 h-3 text-stone-400" />
                          <span>Share</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveMenuChatId(null);
                            onArchiveChat(chat.id);
                          }}
                          className="w-full text-left px-3 py-1.5 text-stone-300 hover:bg-white/[0.06] flex items-center gap-2"
                        >
                          <Archive className="w-3 h-3 text-stone-400" />
                          <span>Archive</span>
                        </button>

                        <div className="border-t border-white/[0.06] my-1" />

                        <button
                          onClick={() => {
                            setActiveMenuChatId(null);
                            onDeleteChat(chat.id);
                          }}
                          className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-rose-950/30 flex items-center gap-2"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info: Clean unboxed text */}
        <div className="p-3 border-t border-white/[0.08] bg-black/20 text-xs text-stone-400">
          <div className="flex items-center justify-between">
            <span className="font-serif italic text-stone-300">
              {learningProgress?.level || 'Linguist Explorer'}
            </span>
            <span className="font-mono text-[11px] tabular-nums text-stone-400">
              {learningProgress?.xp || 340} XP
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
