'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Send, Trash2, Copy, Check, Bot } from 'lucide-react';
import { api } from '@/lib/api';

interface AIChatModalProps {
  isOpen: boolean;
  initialMessage?: string;
  onClose: () => void;
}

interface AIMessage {
  sender: 'user' | 'ai';
  text: string;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  initialMessage,
  onClose,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      sender: 'ai',
      text: "👋 Hello! I'm **Signal AI**, your embedded privacy assistant. Ask me to summarize chat discussions, draft polite or formal replies, or answer questions directly!",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (initialMessage) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: initialMessage },
      ]);
    }
  }, [initialMessage]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || loading) return;

    const userMsg: AIMessage = { sender: 'user', text: prompt };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.aiChat(prompt);
      setMessages((prev) => [...prev, { sender: 'ai', text: res.response }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Sorry, I encountered an issue: ' + err.message },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: 'Chat history cleared. How else can I assist you?',
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-xl h-[80vh] bg-[#0c1422] border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-4 bg-[#090f1a] border-b border-slate-800/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-sm text-white">Signal AI</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-900/40 text-purple-300 border border-purple-700/40">
                  Embedded Intelligence
                </span>
              </div>
              <span className="text-xs text-slate-400">Zero telemetry &bull; Privacy-first</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={clearChat}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => {
            const isAI = m.sender === 'ai';
            return (
              <div
                key={idx}
                className={`flex flex-col ${isAI ? 'items-start' : 'items-end'} group`}
              >
                <div
                  className={`relative max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                    isAI
                      ? 'bg-[#15233a] border border-slate-700/50 text-slate-200 rounded-tl-sm'
                      : 'bg-purple-600 text-white rounded-tr-sm shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap select-text">{m.text}</p>

                  {isAI && (
                    <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Bot className="w-3 h-3 text-purple-400" />
                        <span>Signal AI</span>
                      </span>
                      <button
                        onClick={() => copyText(m.text, idx)}
                        className="hover:text-white flex items-center space-x-1"
                      >
                        {copiedIndex === idx ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center space-x-2 text-xs text-purple-400 pl-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-100" />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-200" />
              <span className="italic ml-1">Signal AI is thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-[#090f1a] border-t border-slate-800 flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Signal AI something or request message draft..."
            className="flex-1 bg-[#121c2e] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl shadow-md transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
