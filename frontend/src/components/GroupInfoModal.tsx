'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  UserPlus,
  Shield,
  UserMinus,
  LogOut,
  Edit2,
  Check,
  Search
} from 'lucide-react';
import { Conversation, User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useChat } from '@/context/ChatContext';
import { api } from '@/lib/api';

interface GroupInfoModalProps {
  conversation: Conversation;
  isOpen: boolean;
  onClose: () => void;
}

export const GroupInfoModal: React.FC<GroupInfoModalProps> = ({
  conversation,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { loadConversations } = useChat();

  const [showAddMember, setShowAddMember] = useState(false);
  const [availableContacts, setAvailableContacts] = useState<User[]>([]);
  const [selectedToAdd, setSelectedToAdd] = useState<number[]>([]);
  const [memberFilterQuery, setMemberFilterQuery] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);

  // Group editing state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [groupTitle, setGroupTitle] = useState(conversation?.title || '');
  const [groupDescription, setGroupDescription] = useState(conversation?.description || '');

  // Safe members
  const members = conversation?.members || [];

  // Check if current user is admin
  const currentMembership = members.find((m) => m && m.user_id === user?.id);
  const isAdmin = currentMembership?.role === 'admin';

  // Load contacts or platform users to add
  useEffect(() => {
    if (showAddMember) {
      api.discoverUsers()
        .then((users: User[]) => {
          if (!Array.isArray(users)) return;
          const existingIds = new Set(members.map((m) => m && m.user_id));
          const notMembers = users.filter((u: User) => u && !existingIds.has(u.id));
          setAvailableContacts(notMembers);
        })
        .catch(() => {
          api.getContacts().then((contacts: any[]) => {
            if (!Array.isArray(contacts)) return;
            const existingIds = new Set(members.map((m) => m && m.user_id));
            const notMembers = contacts
              .map((c) => c?.contact_user)
              .filter((u: User) => u && !existingIds.has(u.id));
            setAvailableContacts(notMembers);
          });
        });
    }
  }, [showAddMember, members.length]);

  if (!isOpen || !conversation) return null;

  const handleAddMembers = async () => {
    if (selectedToAdd.length === 0) return;
    setLoadingAdd(true);
    try {
      await api.addGroupMembers(conversation.id, selectedToAdd);
      setSelectedToAdd([]);
      setShowAddMember(false);
      await loadConversations();
    } catch (err: any) {
      alert('Failed to add members: ' + err.message);
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleRemoveMember = async (targetUserId: number) => {
    const isSelf = targetUserId === user?.id;
    const confirmMsg = isSelf
      ? 'Are you sure you want to leave this group?'
      : 'Remove this member from the group?';

    if (!confirm(confirmMsg)) return;

    try {
      await api.removeGroupMember(conversation.id, targetUserId);
      await loadConversations();
      if (isSelf) {
        onClose();
      }
    } catch (err: any) {
      alert('Failed to remove member: ' + err.message);
    }
  };

  const handleSaveInfo = async () => {
    try {
      await api.updateGroupInfo(conversation.id, {
        title: groupTitle.trim(),
        description: groupDescription.trim(),
      });
      setIsEditingTitle(false);
      await loadConversations();
    } catch (err: any) {
      alert('Failed to update group info: ' + err.message);
    }
  };

  const filteredAvailable = availableContacts.filter((c) => {
    if (!memberFilterQuery.trim()) return true;
    const q = memberFilterQuery.toLowerCase();
    return (
      (c.display_name || '').toLowerCase().includes(q) ||
      (c.username || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#0e1726] border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Group Header Info */}
        <div className="flex flex-col items-center text-center pb-5 border-b border-slate-800/80">
          <div className="relative w-20 h-20 mb-3">
            <img
              src={
                conversation?.avatar_url ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${conversation?.title || 'group'}`
              }
              alt={conversation?.title || 'Group'}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-blue-500/40 shadow-lg"
            />
          </div>

          {isEditingTitle ? (
            <div className="w-full max-w-sm space-y-2 mt-2">
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                className="w-full bg-[#141f33] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <textarea
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={2}
                placeholder="Group description..."
                className="w-full bg-[#141f33] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
              />
              <div className="flex justify-center space-x-2">
                <button
                  onClick={handleSaveInfo}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="px-3 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white">{conversation?.title}</h3>
                {isAdmin && (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-slate-400 hover:text-white p-1"
                    title="Edit group name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {conversation?.description || 'No description provided'}
              </p>
              <span className="text-[11px] font-medium text-blue-400 mt-2 bg-blue-900/30 px-2.5 py-0.5 rounded-full border border-blue-800/40">
                {members.length} Members &bull; Signal Group
              </span>
            </>
          )}
        </div>

        {/* Member Management Section */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Members ({members.length})
            </span>
            <button
              onClick={() => setShowAddMember(!showAddMember)}
              className="flex items-center space-x-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/40 px-3 py-1.5 rounded-xl border border-blue-700/40 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </button>
          </div>

          {/* Add Member Drawer */}
          {showAddMember && (
            <div className="p-3 bg-[#131d2e] border border-slate-700/80 rounded-2xl animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white">
                  Add People to Group:
                </span>
                <span className="text-[10px] text-slate-400">
                  {filteredAvailable.length} available
                </span>
              </div>

              {/* Search filter */}
              <div className="relative mb-2">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
                <input
                  type="text"
                  value={memberFilterQuery}
                  onChange={(e) => setMemberFilterQuery(e.target.value)}
                  placeholder="Filter users by name or username..."
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-xl pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {filteredAvailable.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2 text-center">
                  No new people available to add.
                </p>
              ) : (
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {filteredAvailable.map((c) => {
                    const isChecked = selectedToAdd.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedToAdd((prev) =>
                            isChecked ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          );
                        }}
                        className={`p-2 rounded-xl flex items-center justify-between cursor-pointer text-xs transition-colors ${
                          isChecked
                            ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                            : 'hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <img
                            src={c.avatar_url}
                            alt={c.display_name}
                            className="w-6 h-6 rounded-full"
                          />
                          <div>
                            <span className="font-semibold">{c.display_name}</span>
                            <span className="text-[10px] text-slate-400 ml-1.5">@{c.username}</span>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="rounded text-blue-600 focus:ring-0"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredAvailable.length > 0 && (
                <button
                  onClick={handleAddMembers}
                  disabled={loadingAdd || selectedToAdd.length === 0}
                  className="mt-2.5 w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  {loadingAdd ? 'Adding...' : `Add Selected (${selectedToAdd.length})`}
                </button>
              )}
            </div>
          )}

          {/* Current Members List */}
          <div className="space-y-1.5">
            {members.map((m) => {
              if (!m || !m.user) return null;
              const isCurrentUser = m.user_id === user?.id;
              const canRemove = (isAdmin && !isCurrentUser) || isCurrentUser;

              return (
                <div
                  key={m.id}
                  className="p-2.5 rounded-xl bg-[#121c2e] border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        m.user.avatar_url ||
                        `https://api.dicebear.com/7.x/bottts/svg?seed=${m.user.username || 'user'}`
                      }
                      alt={m.user.display_name || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-semibold text-white">
                          {m.user.display_name}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-slate-400">(You)</span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400">@{m.user.username}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {m.role === 'admin' ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-medium text-[10px]">
                        Admin
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                        Member
                      </span>
                    )}

                    {canRemove && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isCurrentUser
                            ? 'text-rose-400 hover:bg-rose-500/10'
                            : 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                        }`}
                        title={isCurrentUser ? 'Leave Group' : 'Remove Member'}
                      >
                        {isCurrentUser ? (
                          <LogOut className="w-4 h-4" />
                        ) : (
                          <UserMinus className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Leave Group */}
        <div className="pt-3 border-t border-slate-800/80 flex justify-between items-center">
          <button
            onClick={() => handleRemoveMember(user?.id!)}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center space-x-1.5 p-2 rounded-xl hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Group</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
