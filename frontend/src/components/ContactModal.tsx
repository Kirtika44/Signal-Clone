'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, MessageSquare, Phone, UserCheck, Users } from 'lucide-react';
import { User } from '@/types';
import { api } from '@/lib/api';
import { useChat } from '@/context/ChatContext';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { loadConversations, selectConversation } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [discoveredUsers, setDiscoveredUsers] = useState<User[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [activeTab, setActiveTab] = useState<'contacts' | 'discover'>('discover');

  useEffect(() => {
    if (isOpen) {
      // Load contacts
      api.getContacts()
        .then((data) => {
          if (Array.isArray(data)) {
            setContacts(data);
            if (data.length > 0) {
              setActiveTab('contacts');
            }
          }
        })
        .catch(console.error);

      // Discover all registered users so new accounts can immediately connect
      api.discoverUsers()
        .then((users) => {
          if (Array.isArray(users)) setDiscoveredUsers(users);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoadingSearch(true);
    try {
      const results = await api.searchUsers(searchQuery.trim());
      setSearchResults(results);
      setActiveTab('discover');
    } catch (err: any) {
      alert('Search failed: ' + err.message);
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleStartChat = async (targetUserId: number) => {
    try {
      const conv = await api.createDirectConversation(targetUserId);
      await loadConversations();
      selectConversation(conv);
      onClose();
    } catch (err: any) {
      alert('Failed to start chat: ' + err.message);
    }
  };

  const handleAddContact = async (usernameOrPhone: string) => {
    try {
      await api.addContact({ contact_username_or_phone: usernameOrPhone });
      const updated = await api.getContacts();
      setContacts(updated);
      alert('Contact added successfully!');
    } catch (err: any) {
      alert('Failed to add contact: ' + err.message);
    }
  };

  const displayList = searchResults.length > 0
    ? searchResults
    : discoveredUsers.filter((u) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          (u.display_name || '').toLowerCase().includes(q) ||
          (u.username || '').toLowerCase().includes(q)
        );
      });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-md bg-[#0e1726] border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">New Chat & People</h2>
        <p className="text-xs text-slate-400 mb-4">
          Connect with registered members or message anyone on Signal Clone
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, @username, or phone..."
            className="w-full bg-[#141f33] border border-slate-700/80 rounded-xl pl-10 pr-20 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loadingSearch}
            className="absolute right-2 top-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
          >
            {loadingSearch ? '...' : 'Search'}
          </button>
        </form>

        {/* Tabs */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-2 mb-3">
          <button
            onClick={() => setActiveTab('discover')}
            className={`text-xs font-semibold pb-1 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'discover'
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Discover People ({displayList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('contacts')}
            className={`text-xs font-semibold pb-1 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'contacts'
                ? 'text-blue-400 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>My Contacts ({contacts.length})</span>
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {activeTab === 'contacts' ? (
            contacts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-30 text-slate-400" />
                <p>No saved contacts yet.</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="mt-2 text-blue-400 hover:underline font-medium block mx-auto"
                >
                  Switch to "Discover People" to find users
                </button>
              </div>
            ) : (
              contacts.map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-xl bg-[#121c2e] border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        c.contact_user?.avatar_url ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${c.contact_user?.username}`
                      }
                      alt={c.contact_user?.display_name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-xs text-white">
                        {c.nickname || c.contact_user?.display_name}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        @{c.contact_user?.username}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartChat(c.contact_user_id)}
                    className="p-2 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition-colors"
                    title="Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              ))
            )
          ) : (
            displayList.map((u) => (
              <div
                key={u.id}
                className="p-2.5 rounded-xl bg-[#121c2e] border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      u.avatar_url ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`
                    }
                    alt={u.display_name}
                    className="w-9 h-9 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-xs text-white">{u.display_name}</h4>
                    <span className="text-[10px] text-slate-400">@{u.username}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleAddContact(u.username)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Add Contact"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleStartChat(u.id)}
                    className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                    title="Message"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
