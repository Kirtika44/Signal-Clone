'use client';

import React, { useState, useEffect } from 'react';
import { X, Users, Check, ArrowRight, Search, UserCheck } from 'lucide-react';
import { User } from '@/types';
import { api } from '@/lib/api';
import { useChat } from '@/context/ChatContext';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { loadConversations, selectConversation } = useChat();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingUsers(true);
      // Discover all registered users on the system
      api.discoverUsers()
        .then((users: User[]) => {
          if (Array.isArray(users)) {
            setAvailableUsers(users);
          }
        })
        .catch((err) => {
          console.error('Failed to discover users, falling back to contacts:', err);
          api.getContacts()
            .then((data: any[]) => {
              if (Array.isArray(data)) {
                setAvailableUsers(data.map((c) => c.contact_user).filter(Boolean));
              }
            })
            .catch(console.error);
        })
        .finally(() => setLoadingUsers(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleMember = (userId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredUsers = availableUsers.filter((u) => {
    if (!searchMemberQuery.trim()) return true;
    const q = searchMemberQuery.toLowerCase();
    return (
      (u.display_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a group name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newGroup = await api.createGroup({
        title: title.trim(),
        description: description.trim() || undefined,
        member_ids: selectedMembers,
      });

      await loadConversations();
      selectConversation(newGroup);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-md bg-[#0e1726] border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/15 border border-blue-500/20 text-blue-400 mx-auto flex items-center justify-center mb-2">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Create Group</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Add members, collaborate, share files, and hold group calls
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4 flex-1 flex flex-col min-h-0">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Team, College Friends"
              required
              className="w-full bg-[#141f33] border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Group description or purpose..."
              className="w-full bg-[#141f33] border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Member Picker with Search & Discover */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Select Members ({selectedMembers.length} selected)
              </label>
              <span className="text-[10px] text-blue-400 font-medium">
                {availableUsers.length} people available
              </span>
            </div>

            {/* Member search filter */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                placeholder="Search by name or @username..."
                className="w-full bg-[#121c2e] border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-1 border border-slate-800 rounded-xl p-2 bg-[#10192a] space-y-1 max-h-40">
              {loadingUsers ? (
                <p className="text-xs text-slate-400 p-3 text-center">Loading people...</p>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-xs">
                  <UserCheck className="w-6 h-6 mx-auto mb-1 opacity-30 text-slate-400" />
                  <p>No matching users found.</p>
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isChecked = selectedMembers.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => handleToggleMember(u.id)}
                      className={`p-2 rounded-xl flex items-center justify-between cursor-pointer text-xs transition-colors ${
                        isChecked
                          ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={
                            u.avatar_url ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`
                          }
                          alt={u.display_name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-white">{u.display_name}</p>
                          <span className="text-[10px] text-slate-400">@{u.username}</span>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isChecked
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'border-slate-600 bg-slate-900'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Create Button */}
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 transition-all active:scale-98 text-xs shrink-0"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Group ({selectedMembers.length} Members)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
