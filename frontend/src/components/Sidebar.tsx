'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Users,
  Sparkles,
  Settings as SettingsIcon,
  Pin,
  Check,
  CheckCheck,
  MoreVertical,
  LogOut,
  User as UserIcon,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { Conversation } from '@/types';

interface SidebarProps {
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenAI: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenNewChat,
  onOpenNewGroup,
  onOpenSettings,
  onOpenProfile,
  onOpenAI,
}) => {
  const { user, logout } = useAuth();
  const { conversations = [], activeConversation, selectConversation, typingUsers = {} } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'groups'>('all');
  const [menuOpen, setMenuOpen] = useState(false);

  // Filter conversations
  const filteredConversations = (conversations || []).filter((c) => {
    if (!c) return false;
    const matchSearch =
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.last_message?.content || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    if (filterTab === 'unread') return (c.unread_count || 0) > 0;
    if (filterTab === 'groups') return !!c.is_group;
    return true;
  });

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full bg-[#0d1524] border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0b1220]">
        <div
          onClick={onOpenProfile}
          className="flex items-center space-x-3 cursor-pointer group"
          title="Edit Profile"
        >
          <div className="relative">
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.username || 'user'}`}
              alt={user?.display_name || 'User'}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/30 group-hover:ring-blue-500 transition-all"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0d1524]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
              {user?.display_name || 'Signal User'}
            </span>
            <span className="text-xs text-slate-400">@{user?.username || 'user'}</span>
          </div>
        </div>

        {/* Header Action Icons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onOpenAI}
            className="p-2 rounded-xl text-purple-400 hover:text-purple-300 hover:bg-purple-900/20 transition-colors relative"
            title="Signal AI Assistant"
          >
            <Sparkles className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping" />
          </button>

          <button
            onClick={onOpenNewGroup}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Create Group"
          >
            <Users className="w-5 h-5" />
          </button>

          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="New Chat"
          >
            <Plus className="w-5 h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="More"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div
                className="absolute right-0 top-11 w-48 bg-[#141f33] border border-slate-700/80 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={() => setMenuOpen(false)}
              >
                <button
                  onClick={onOpenProfile}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2.5"
                >
                  <UserIcon className="w-4 h-4 text-slate-400" />
                  <span>Profile</span>
                </button>
                <button
                  onClick={onOpenSettings}
                  className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center space-x-2.5"
                >
                  <SettingsIcon className="w-4 h-4 text-slate-400" />
                  <span>Settings & Themes</span>
                </button>
                <div className="border-t border-slate-700/60 my-1" />
                <button
                  onClick={logout}
                  className="w-full px-4 py-2.5 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats or messages..."
            className="w-full bg-[#121c2e] border border-slate-800/90 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-1.5 mt-2.5">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterTab === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterTab('unread')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterTab === 'unread'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilterTab('groups')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              filterTab === 'groups'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
            <p>No conversations found.</p>
            <button
              onClick={onOpenNewChat}
              className="mt-3 text-blue-400 hover:underline font-medium"
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = activeConversation?.id === conv.id;
            const members = conv.members || [];
            const otherMember = members.find((m) => m && m.user_id !== user?.id)?.user;
            const isOnline = !conv.is_group && !!otherMember?.is_online;
            const isTyping = members.some((m) => m && typingUsers[m.user_id]);

            return (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`p-3 rounded-xl flex items-center space-x-3 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-600/15 border border-blue-500/30 text-white'
                    : 'hover:bg-[#131e33] text-slate-300'
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={conv.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${conv.title || 'chat'}`}
                    alt={conv.title || 'Chat'}
                    className="w-12 h-12 rounded-full object-cover ring-1 ring-slate-700/60"
                  />
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#0d1524]" />
                  )}
                  {conv.is_group && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-800 text-[10px] text-slate-300 flex items-center justify-center border border-slate-700">
                      👥
                    </span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5 min-w-0">
                      <span className="font-semibold text-sm text-white truncate">
                        {conv.title || 'Conversation'}
                      </span>
                      {conv.is_pinned && (
                        <Pin className="w-3 h-3 text-blue-400 shrink-0 transform rotate-45" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0 ml-2">
                      {formatTimestamp(conv.last_message?.created_at || conv.updated_at)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="truncate pr-2">
                      {isTyping ? (
                        <span className="text-blue-400 font-medium italic animate-pulse">
                          Typing...
                        </span>
                      ) : (
                        <span className="truncate">
                          {conv.last_message ? (
                            <>
                              {conv.last_message.sender_id === user?.id && (
                                <span className="text-slate-500 mr-1">You:</span>
                              )}
                              {conv.last_message.content}
                            </>
                          ) : (
                            <span className="italic text-slate-500">No messages yet</span>
                          )}
                        </span>
                      )}
                    </div>

                    {(conv.unread_count || 0) > 0 && (
                      <span className="shrink-0 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
