'use client';

import React from 'react';
import { Shield, Sparkles, Database, Lock, ArrowRight, UserCheck, MessageSquare } from 'lucide-react';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onQuickDemoLogin: (username: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onLogin,
  onQuickDemoLogin,
}) => {
  return (
    <div className="min-h-screen bg-[#080e18] flex flex-col justify-between text-slate-100 relative overflow-hidden font-sans select-none">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="w-full max-w-6xl mx-auto px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg text-white tracking-wide">Signal</span>
            <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Clone V1.0
            </span>
          </div>
        </div>

        <button
          onClick={onLogin}
          className="text-sm font-medium text-slate-300 hover:text-white px-4 py-2 rounded-lg hover:bg-slate-800/50 transition-colors"
        >
          Sign In
        </button>
      </header>

      {/* Main Hero Section */}
      <main className="w-full max-w-4xl mx-auto px-6 py-8 flex flex-col items-center text-center z-10 my-auto">
        {/* Version Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs font-medium text-slate-300 mb-8 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-time WebSockets &bull; SQLite Persistence &bull; Signal AI</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
          Signal Clone
        </h1>

        {/* Hero Subtitle */}
        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Fast, secure, private messaging with integrated Signal AI intelligence. Experience real-time chat, group management, and WebRTC voice & video calls.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-12">
          <button
            onClick={onGetStarted}
            className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all transform active:scale-95"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onLogin}
            className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 bg-slate-900/90 hover:bg-slate-800/80 text-slate-200 border border-slate-700/70 font-semibold px-6 py-3.5 rounded-xl transition-all active:scale-95"
          >
            <span>I already have an account</span>
          </button>
        </div>

        {/* Quick Demo Login Shortcut */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 max-w-lg w-full mb-12 text-xs text-slate-400 flex items-center justify-between">
          <span className="flex items-center space-x-1.5">
            <UserCheck className="w-4 h-4 text-blue-400" />
            <span>Quick Demo Users:</span>
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onQuickDemoLogin('john')}
              className="px-2.5 py-1 rounded-md bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 font-medium border border-blue-700/50 transition-colors"
            >
              John Doe
            </button>
            <button
              onClick={() => onQuickDemoLogin('sarah')}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700 transition-colors"
            >
              Sarah Connor
            </button>
            <button
              onClick={() => onQuickDemoLogin('alex')}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium border border-slate-700 transition-colors"
            >
              Alex
            </button>
          </div>
        </div>

        {/* Feature Cards Grid (SQLite & Signal AI) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl text-left">
          {/* Card 1: SQLite Database */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#111c30] to-[#0c1524] border border-slate-800/90 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">SQLite Database</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Local, persistent, and relational data architecture powered by SQLAlchemy. Conversations, contacts, message history, reactions, and attachments stay safely persisted.
            </p>
            <div className="flex items-center space-x-2 text-xs text-blue-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Full relational schema with foreign keys</span>
            </div>
          </div>

          {/* Card 2: Signal AI */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#111c30] to-[#0c1524] border border-slate-800/90 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Signal AI Assistant</h3>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              Embedded chat intelligence for smart replies, conversation summarization, and message drafting. Privacy-focused without exposing your discussions to external trackers.
            </p>
            <div className="flex items-center space-x-2 text-xs text-purple-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>1-click chat summaries & smart suggestion chips</span>
            </div>
          </div>
        </div>
      </main>

      {/* Security & Privacy Footer */}
      <footer className="w-full max-w-6xl mx-auto px-6 py-6 border-t border-slate-800/70 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 z-10 gap-2">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-slate-400" />
          <span>Signal-inspired privacy interface &bull; Minimal metadata &bull; No advertising</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1">
            <Lock className="w-3.5 h-3.5" />
            <span>FastAPI + SQLite + WebSockets</span>
          </span>
          <span>&copy; {new Date().getFullYear()} Signal Clone</span>
        </div>
      </footer>
    </div>
  );
};
