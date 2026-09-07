'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Video,
  Search,
  MoreVertical,
  Pin,
  Sparkles,
  ArrowDown,
  Info,
  Shield,
  X,
  Users,
  Ban,
  ShieldAlert,
  Palette,
  Check
} from 'lucide-react';
import { Conversation, Message, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { useCall } from '@/context/CallContext';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { api } from '@/lib/api';

interface ChatAreaProps {
  conversation: Conversation;
  onOpenGroupInfo: () => void;
  onOpenAIModal: (summaryPrompt?: string) => void;
}

export type WallpaperStyle = 'default' | 'stars' | 'grid' | 'emerald' | 'indigo' | 'doodle';

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  onOpenGroupInfo,
  onOpenAIModal,
}) => {
  const { user } = useAuth();
  const {
    messages = [],
    sendMessage,
    editMessage,
    deleteMessage,
    toggleReaction,
    togglePinMessage,
    sendTypingSignal,
    typingUsers = {},
    smartReplies = [],
  } = useChat();

  const { startCall } = useCall();

  // State
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [searchInChat, setSearchInChat] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [wallpaperModalOpen, setWallpaperModalOpen] = useState(false);
  const [wallpaper, setWallpaper] = useState<WallpaperStyle>('default');
  const [isBlocked, setIsBlocked] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Safe members array
  const members = conversation?.members || [];
  const otherMember = members.find((m) => m && m.user_id !== user?.id)?.user;
  const isOnline = !conversation?.is_group && !!otherMember?.is_online;

  // Load wallpaper preference & block status
  useEffect(() => {
    if (conversation?.id) {
      const savedWp = localStorage.getItem(`chat_wallpaper_${conversation.id}`) as WallpaperStyle;
      if (savedWp) setWallpaper(savedWp);

      // Check block status if 1-on-1
      if (!conversation.is_group && otherMember) {
        api.getBlockedUsers()
          .then((blockedIds: number[]) => {
            if (Array.isArray(blockedIds)) {
              setIsBlocked(blockedIds.includes(otherMember.id));
            }
          })
          .catch(console.error);
      }
    }
  }, [conversation?.id, otherMember?.id]);

  const handleSelectWallpaper = (wp: WallpaperStyle) => {
    setWallpaper(wp);
    if (conversation?.id) {
      localStorage.setItem(`chat_wallpaper_${conversation.id}`, wp);
    }
    setWallpaperModalOpen(false);
  };

  const handleToggleBlock = async () => {
    if (!otherMember) return;
    try {
      if (isBlocked) {
        await api.unblockUser(otherMember.id);
        setIsBlocked(false);
        alert(`Unblocked ${otherMember.display_name}`);
      } else {
        if (confirm(`Are you sure you want to block ${otherMember.display_name}? You will not receive messages or calls from them.`)) {
          await api.blockUser(otherMember.id);
          setIsBlocked(true);
        }
      }
    } catch (err: any) {
      alert('Block action failed: ' + err.message);
    }
    setMoreMenuOpen(false);
  };

  // Auto-scroll on new messages
  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    if (conversation?.id) {
      scrollToBottom(false);
    }
  }, [conversation?.id]);

  useEffect(() => {
    if (!showScrollBottom) {
      scrollToBottom(true);
    }
  }, [messages.length]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 150);
  };

  const displayedMessages = (messages || []).filter((m) => {
    if (!m) return false;
    if (!searchKeyword) return true;
    return (m.content || '').toLowerCase().includes(searchKeyword.toLowerCase());
  });

  const pinnedMessage = (messages || []).find((m) => m && m.is_pinned);

  const handleStartCall = (type: 'audio' | 'video') => {
    if (isBlocked) {
      alert('Cannot start call with a blocked contact.');
      return;
    }
    if (otherMember) {
      startCall(otherMember, type);
    } else {
      alert('Group audio/video call ringing members...');
    }
  };

  const handleSummarizeChat = async () => {
    if (!conversation?.id) return;
    try {
      const summaryRes = await api.aiSummarize(conversation.id);
      onOpenAIModal(
        `Here is the summary of this discussion:\n\n${summaryRes.summary}\n\n**Key Points:**\n${(summaryRes.key_points || [])
          .map((p: string) => `• ${p}`)
          .join('\n')}`
      );
    } catch (err: any) {
      alert('Could not generate summary: ' + err.message);
    }
  };

  const isTyping = members.some((m) => m && m.user_id !== user?.id && typingUsers[m.user_id]);

  // Wallpaper CSS styling
  const getWallpaperBackground = () => {
    switch (wallpaper) {
      case 'stars':
        return 'bg-[#070b14] bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]';
      case 'grid':
        return 'bg-[#0a101d] bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px]';
      case 'emerald':
        return 'bg-gradient-to-b from-[#061a14] via-[#09151e] to-[#0a101d]';
      case 'indigo':
        return 'bg-gradient-to-b from-[#11102e] via-[#0d1326] to-[#0a101d]';
      case 'doodle':
        return 'bg-[#0a101d] bg-[radial-gradient(#2563eb_0.8px,transparent_0.8px)] [background-size:16px_16px]';
      default:
        return 'bg-[#0a101d]';
    }
  };

  return (
    <section className="flex-1 h-full flex flex-col bg-[#0a101d] overflow-hidden select-none">
      {/* Top Chat Header */}
      <div className="h-16 px-4 bg-[#0d1524] border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div
          onClick={() => {
            if (conversation?.is_group) onOpenGroupInfo();
          }}
          className={`flex items-center space-x-3 min-w-0 ${
            conversation?.is_group ? 'cursor-pointer group' : ''
          }`}
        >
          <div className="relative shrink-0">
            <img
              src={
                conversation?.avatar_url ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${conversation?.title || 'chat'}`
              }
              alt={conversation?.title || 'Chat'}
              className="w-10 h-10 rounded-full object-cover ring-1 ring-slate-700/60"
            />
            {isOnline && !isBlocked && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0d1524]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <h2 className="font-semibold text-sm text-white truncate group-hover:text-blue-400 transition-colors">
                {conversation?.title || 'Chat'}
              </h2>
              {isBlocked && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Blocked
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1 text-xs text-slate-400 truncate">
              {conversation?.is_group ? (
                <span>{members.length} members &bull; Tap for group info</span>
              ) : isBlocked ? (
                <span className="text-rose-400">Blocked contact</span>
              ) : isOnline ? (
                <span className="text-emerald-400 font-medium">Online</span>
              ) : (
                <span>Last seen recently</span>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-1">
          {/* Signal AI Summarize Button */}
          <button
            onClick={handleSummarizeChat}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border border-purple-800/40 text-xs font-medium transition-colors shadow-sm"
            title="Summarize chat with Signal AI"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">AI Summary</span>
          </button>

          {/* Voice Call */}
          <button
            onClick={() => handleStartCall('audio')}
            disabled={isBlocked}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Video Call */}
          <button
            onClick={() => handleStartCall('video')}
            disabled={isBlocked}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-40 transition-colors"
            title="Video Call"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Search inside chat */}
          <button
            onClick={() => {
              setSearchInChat(!searchInChat);
              if (searchInChat) setSearchKeyword('');
            }}
            className={`p-2 rounded-xl transition-colors ${
              searchInChat ? 'text-blue-400 bg-blue-900/20' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Search messages"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Wallpaper Toggle */}
          <button
            onClick={() => setWallpaperModalOpen(true)}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Change Chat Wallpaper"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* 3-Dot More Menu (Block Option) */}
          <div className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {moreMenuOpen && (
              <div
                className="absolute right-0 top-11 w-48 bg-[#141f33] border border-slate-700/80 rounded-2xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setMoreMenuOpen(false)}
              >
                {conversation?.is_group ? (
                  <button
                    onClick={onOpenGroupInfo}
                    className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                  >
                    <Info className="w-4 h-4 text-slate-400" />
                    <span>Group Information</span>
                  </button>
                ) : (
                  otherMember && (
                    <button
                      onClick={handleToggleBlock}
                      className={`w-full px-4 py-2.5 text-left text-xs flex items-center space-x-2 ${
                        isBlocked
                          ? 'text-emerald-400 hover:bg-emerald-500/10'
                          : 'text-rose-400 hover:bg-rose-500/10'
                      }`}
                    >
                      <Ban className="w-4 h-4" />
                      <span>{isBlocked ? 'Unblock Contact' : 'Block Contact'}</span>
                    </button>
                  )
                )}

                <button
                  onClick={() => setWallpaperModalOpen(true)}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2"
                >
                  <Palette className="w-4 h-4 text-slate-400" />
                  <span>Chat Wallpaper</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Blocked Contact Warning Banner */}
      {isBlocked && (
        <div className="p-3 bg-rose-950/40 border-b border-rose-800/60 text-xs text-rose-300 flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>You have blocked this user. Unblock to resume messaging and calls.</span>
          </div>
          <button
            onClick={handleToggleBlock}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
          >
            Unblock
          </button>
        </div>
      )}

      {/* In-Chat Search Bar */}
      {searchInChat && (
        <div className="p-2 bg-[#0c1422] border-b border-slate-800 flex items-center space-x-2 animate-in slide-in-from-top-1 duration-150">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="Search messages in this conversation..."
            className="flex-1 bg-transparent border-0 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-0"
            autoFocus
          />
          {searchKeyword && (
            <span className="text-[11px] text-slate-400">
              {displayedMessages.length} results
            </span>
          )}
          <button
            onClick={() => {
              setSearchInChat(false);
              setSearchKeyword('');
            }}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pinned Message Banner */}
      {pinnedMessage && (
        <div
          className="px-4 py-2 bg-[#121d30]/90 border-b border-slate-800/80 flex items-center justify-between text-xs cursor-pointer hover:bg-[#15233a] transition-colors"
        >
          <div className="flex items-center space-x-2 truncate">
            <Pin className="w-3.5 h-3.5 text-blue-400 transform rotate-45 shrink-0" />
            <span className="text-slate-400 shrink-0">Pinned:</span>
            <span className="text-slate-200 truncate">{pinnedMessage.content}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePinMessage(pinnedMessage.id);
            }}
            className="text-slate-400 hover:text-slate-200 text-[11px] ml-2"
          >
            Unpin
          </button>
        </div>
      )}

      {/* Message Timeline List with Custom Wallpaper */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex-1 overflow-y-auto px-4 py-4 space-y-1 relative transition-all duration-300 ${getWallpaperBackground()}`}
      >
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400 bg-slate-900/80 border border-slate-800/80 px-4 py-2 rounded-xl text-center max-w-md shadow-sm">
            <Shield className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>
              Messages and calls are private. Stored securely with local SQLite persistence.
            </span>
          </div>
        </div>

        {displayedMessages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <p>No messages yet. Send a greeting to start the conversation!</p>
          </div>
        ) : (
          displayedMessages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              currentUser={user}
              isGroup={!!conversation?.is_group}
              onReply={(m) => setReplyingTo(m)}
              onEdit={(m) => setEditingMessage(m)}
              onDelete={deleteMessage}
              onReact={toggleReaction}
              onPin={togglePinMessage}
            />
          ))
        )}

        {isTyping && (
          <div className="flex items-center space-x-2 text-xs text-slate-400 pl-2 py-1 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-100" />
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce delay-200" />
            <span className="italic ml-1">Someone is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-6 p-2.5 rounded-full bg-[#162238] border border-slate-700 text-white shadow-xl hover:bg-blue-600 transition-all active:scale-90 z-20"
          title="Jump to latest"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Message Input Bottom Bar (Disabled when blocked) */}
      {!isBlocked ? (
        <MessageInput
          replyingTo={replyingTo}
          editingMessage={editingMessage}
          smartReplies={smartReplies}
          onCancelReply={() => setReplyingTo(null)}
          onCancelEdit={() => setEditingMessage(null)}
          onSendMessage={sendMessage}
          onSaveEdit={editMessage}
          onTyping={sendTypingSignal}
        />
      ) : (
        <div className="p-4 bg-[#0b1220] border-t border-slate-800 text-center text-xs text-slate-500 italic">
          You cannot send messages to a blocked contact.
        </div>
      )}

      {/* Wallpaper Selection Dialog */}
      {wallpaperModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none animate-in fade-in">
          <div className="w-full max-w-sm bg-[#0e1726] border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Palette className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm text-white">Chat Wallpaper</h3>
              </div>
              <button
                onClick={() => setWallpaperModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Choose a custom background for this chat:
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'default', name: 'Signal Navy', color: 'bg-[#0a101d]' },
                { id: 'stars', name: 'Cosmos Stars', color: 'bg-[#070b14] border-sky-500/40' },
                { id: 'grid', name: 'Privacy Grid', color: 'bg-[#0a101d] border-slate-700' },
                { id: 'emerald', name: 'Emerald Noir', color: 'bg-emerald-950/50 border-emerald-600/30' },
                { id: 'indigo', name: 'Midnight Violet', color: 'bg-indigo-950/50 border-indigo-600/30' },
                { id: 'doodle', name: 'Signal Dots', color: 'bg-[#0a101d] border-blue-600/30' },
              ].map((wp) => {
                const isSelected = wallpaper === wp.id;
                return (
                  <button
                    key={wp.id}
                    onClick={() => handleSelectWallpaper(wp.id as WallpaperStyle)}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-600/20 ring-1 ring-blue-500 text-white'
                        : 'border-slate-800 bg-[#121c2e] hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full ${wp.color} border border-slate-600`} />
                      <span className="text-xs font-medium">{wp.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
