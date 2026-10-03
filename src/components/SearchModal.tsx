import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MessageSquare, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { SearchResult } from '../types/index.ts';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, onSelectChat }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search query
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.searchChats(query);
        setResults(data.results || []);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Global keydown handler for Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-[#12141c] border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-white/[0.08] flex items-center gap-3 bg-[#0c0d12]">
          <Search className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search dialogue corpus, Tanglish, Hinglish, transliteration tokens..."
            className="w-full bg-transparent text-xs text-stone-100 placeholder-stone-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-3.5 h-3.5 text-stone-400 animate-spin shrink-0" />}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-stone-400 hover:text-stone-200 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/[0.04]">
          {query.trim() === '' ? (
            <div className="p-8 text-center text-xs text-stone-400">
              <p className="mb-3">Filter conversations by lexical tokens or code-switching phenomena.</p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {['Tanglish', 'Hinglish', 'Teluglish', 'Cancel Ticket', 'Refund', 'Negation'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-2 py-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-[11px] text-stone-300 border border-white/[0.06] transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <div className="p-8 text-center text-xs text-stone-400">
              No matching records for <span className="text-stone-200">"{query}"</span>
            </div>
          ) : (
            results.map((res, idx) => (
              <button
                key={`${res.chat_id}-${idx}`}
                onClick={() => {
                  onSelectChat(res.chat_id);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-lg hover:bg-white/[0.03] transition-colors flex items-start justify-between gap-3 group"
              >
                <div className="space-y-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="text-xs font-medium text-stone-100 group-hover:text-white truncate">
                      {res.title}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      · matched in {res.matched_in}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 line-clamp-2 font-mono text-[11px] pl-5">
                    {res.snippet}
                  </p>
                  <div className="text-[10px] text-stone-400 font-mono pl-5">
                    {new Date(res.updated_at).toLocaleDateString()}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-200 shrink-0 mt-1" />
              </button>
            ))
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-3.5 py-2 bg-[#0c0d12] border-t border-white/[0.08] flex items-center justify-between text-[11px] text-stone-400 font-mono">
          <span>Search backed by persistent linguistic index</span>
          <kbd className="bg-black/40 border border-white/[0.08] px-1.5 py-0.5 rounded text-stone-400 text-[10px]">
            Esc to dismiss
          </kbd>
        </div>
      </div>
    </div>
  );
};
