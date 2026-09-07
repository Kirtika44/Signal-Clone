'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { AuthModal } from '@/components/AuthModal';
import { Sidebar } from '@/components/Sidebar';
import { ChatArea } from '@/components/ChatArea';
import { GroupInfoModal } from '@/components/GroupInfoModal';
import { CreateGroupModal } from '@/components/CreateGroupModal';
import { ContactModal } from '@/components/ContactModal';
import { CallModal } from '@/components/CallModal';
import { AIChatModal } from '@/components/AIChatModal';
import { SettingsModal } from '@/components/SettingsModal';
import { ProfileModal } from '@/components/ProfileModal';
import { MessageSquare, Shield, Sparkles, Lock } from 'lucide-react';

export default function Home() {
  const { user, loading, login } = useAuth();
  const { activeConversation, selectConversation } = useChat();

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [groupInfoOpen, setGroupInfoOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Quick demo login
  const handleQuickDemo = async (username: string) => {
    try {
      await login(username, 'password123');
    } catch (err: any) {
      alert(`Demo login failed: ${err.message}`);
    }
  };

  // Loading Screen
  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#080e18] text-white select-none">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/40 mb-4 animate-signal-pulse">
          <MessageSquare className="w-8 h-8 text-white" />
        </div>
        <div className="flex items-center space-x-2 text-sm font-semibold tracking-wide text-slate-300">
          <span>Signal Clone</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
            V1.0
          </span>
        </div>
        <span className="text-xs text-slate-500 mt-2">Initializing secure environment...</span>
      </div>
    );
  }

  // Not logged in -> Show Welcome / Landing Screen
  if (!user) {
    return (
      <>
        <WelcomeScreen
          onGetStarted={() => {
            setAuthMode('register');
            setAuthModalOpen(true);
          }}
          onLogin={() => {
            setAuthMode('login');
            setAuthModalOpen(true);
          }}
          onQuickDemoLogin={handleQuickDemo}
        />

        <AuthModal
          isOpen={authModalOpen}
          initialMode={authMode}
          onClose={() => setAuthModalOpen(false)}
        />
      </>
    );
  }

  // Main Chat Application Interface
  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0a101d] text-slate-100">
      {/* Left Sidebar */}
      <div
        className={`${
          activeConversation ? 'hidden md:flex' : 'flex'
        } w-full md:w-auto h-full shrink-0`}
      >
        <Sidebar
          onOpenNewChat={() => setContactModalOpen(true)}
          onOpenNewGroup={() => setCreateGroupOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenProfile={() => setProfileOpen(true)}
          onOpenAI={() => {
            setAiInitialPrompt(undefined);
            setAiModalOpen(true);
          }}
        />
      </div>

      {/* Main Chat Pane */}
      <div
        className={`${
          !activeConversation ? 'hidden md:flex' : 'flex'
        } flex-1 h-full flex-col relative`}
      >
        {activeConversation ? (
          <>
            {/* Back button on mobile */}
            <div className="md:hidden p-2 bg-[#0d1524] border-b border-slate-800 flex items-center">
              <button
                onClick={() => selectConversation(null)}
                className="text-xs text-blue-400 font-medium px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                &larr; All Chats
              </button>
            </div>

            <ChatArea
              conversation={activeConversation}
              onOpenGroupInfo={() => setGroupInfoOpen(true)}
              onOpenAIModal={(prompt) => {
                setAiInitialPrompt(prompt);
                setAiModalOpen(true);
              }}
            />
          </>
        ) : (
          /* Empty State View */
          <div className="flex-1 h-full flex flex-col items-center justify-center p-6 text-center select-none bg-[#0a101d]">
            <div className="w-20 h-20 rounded-3xl bg-[#111c30] border border-slate-800 flex items-center justify-center text-blue-400 shadow-2xl mb-4">
              <MessageSquare className="w-10 h-10" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Signal Clone Desktop</h2>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
              Select a conversation from the sidebar to chat, or launch Signal AI for instant intelligence and drafting.
            </p>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setContactModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all active:scale-95"
              >
                New Conversation
              </button>

              <button
                onClick={() => {
                  setAiInitialPrompt(undefined);
                  setAiModalOpen(true);
                }}
                className="px-4 py-2 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 text-xs font-semibold flex items-center space-x-1.5 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open Signal AI</span>
              </button>
            </div>

            <div className="mt-12 flex items-center space-x-2 text-[11px] text-slate-500">
              <Lock className="w-3.5 h-3.5" />
              <span>SQLite relational storage &bull; Real-time WebSockets &bull; WebRTC</span>
            </div>
          </div>
        )}
      </div>

      {/* Global Modals */}
      <GroupInfoModal
        isOpen={groupInfoOpen && !!activeConversation && activeConversation.is_group}
        conversation={activeConversation!}
        onClose={() => setGroupInfoOpen(false)}
      />

      <CreateGroupModal
        isOpen={createGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
      />

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
      />

      <CallModal />

      <AIChatModal
        isOpen={aiModalOpen}
        initialMessage={aiInitialPrompt}
        onClose={() => setAiModalOpen(false)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}
