'use client';

import React, { useState } from 'react';
import {
  Check,
  CheckCheck,
  Reply,
  Smile,
  MoreHorizontal,
  Edit2,
  Trash2,
  Pin,
  Copy,
  FileText,
  Download
} from 'lucide-react';
import { Message, User } from '@/types';
import { getApiBase } from '@/lib/api';

interface MessageBubbleProps {
  message: Message;
  currentUser: User | null;
  isGroup: boolean;
  onReply: (msg: Message) => void;
  onEdit: (msg: Message) => void;
  onDelete: (msgId: number) => void;
  onReact: (msgId: number, emoji: string) => void;
  onPin: (msgId: number) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  currentUser,
  isGroup,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onPin,
}) => {
  const [showToolbar, setShowToolbar] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);

  if (!message) return null;

  const isOutgoing = message.sender_id === currentUser?.id;
  const isSystem = message.message_type === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="text-[11px] font-medium text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/50 backdrop-blur-sm shadow-sm">
          {message.content}
        </span>
      </div>
    );
  }

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const copyToClipboard = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
    }
    setShowToolbar(false);
  };

  // Safe reaction grouping
  const reactionsList = message.reactions || [];
  const groupedReactions: { [emoji: string]: number } = {};
  reactionsList.forEach((r) => {
    if (r && r.emoji) {
      groupedReactions[r.emoji] = (groupedReactions[r.emoji] || 0) + 1;
    }
  });

  const popularEmojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div
      className={`group flex flex-col my-1 relative ${isOutgoing ? 'items-end' : 'items-start'}`}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => {
        setShowToolbar(false);
        setShowEmojiBar(false);
      }}
    >
      {/* Sender Name in Groups for incoming messages */}
      {!isOutgoing && isGroup && (
        <span className="text-[11px] font-semibold text-blue-400 ml-3 mb-1">
          {message.sender_name || 'Member'}
        </span>
      )}

      <div className="relative flex items-center max-w-[85%] sm:max-w-[70%]">
        {/* Floating Quick Action Toolbar */}
        {showToolbar && (
          <div
            className={`absolute -top-7 ${
              isOutgoing ? 'right-2' : 'left-2'
            } flex items-center space-x-1 bg-[#101929] border border-slate-700/90 rounded-xl px-2 py-1 shadow-xl z-20 animate-in fade-in duration-100`}
          >
            <button
              onClick={() => setShowEmojiBar(!showEmojiBar)}
              className="p-1 rounded-md text-slate-400 hover:text-yellow-400 hover:bg-slate-800 transition-colors"
              title="React"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onReply(message)}
              className="p-1 rounded-md text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
              title="Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={copyToClipboard}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Copy"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onPin(message.id)}
              className="p-1 rounded-md text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition-colors"
              title={message.is_pinned ? 'Unpin' : 'Pin'}
            >
              <Pin className={`w-3.5 h-3.5 ${message.is_pinned ? 'text-blue-400' : ''}`} />
            </button>

            {isOutgoing && (
              <button
                onClick={() => onEdit(message)}
                className="p-1 rounded-md text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                title="Edit"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => onDelete(message.id)}
              className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Emoji Bar Picker */}
        {showEmojiBar && (
          <div
            className={`absolute -top-14 ${
              isOutgoing ? 'right-0' : 'left-0'
            } flex items-center space-x-1.5 bg-[#0f172a] border border-slate-700 rounded-2xl px-2.5 py-1.5 shadow-2xl z-30 animate-in fade-in zoom-in-90 duration-150`}
          >
            {popularEmojis.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact(message.id, emoji);
                  setShowEmojiBar(false);
                }}
                className="hover:scale-125 transition-transform text-base p-0.5"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Message Bubble Body */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl shadow-md ${
            isOutgoing
              ? 'bg-blue-600 text-white rounded-br-xs'
              : 'bg-[#15233a] text-slate-100 rounded-bl-xs border border-slate-700/50'
          }`}
        >
          {message.is_pinned && (
            <div className="flex items-center space-x-1 text-[10px] text-blue-300 font-medium mb-1 border-b border-white/10 pb-0.5">
              <Pin className="w-3 h-3 transform rotate-45" />
              <span>Pinned message</span>
            </div>
          )}

          {message.reply_to_content && (
            <div
              className={`mb-2 p-2 rounded-lg border-l-2 text-xs backdrop-blur-sm ${
                isOutgoing
                  ? 'bg-blue-700/60 border-white/80 text-white/90'
                  : 'bg-slate-800/80 border-blue-400 text-slate-300'
              }`}
            >
              <span className="font-semibold block text-[11px]">
                {message.reply_to_sender || 'Replying to message'}
              </span>
              <p className="truncate text-xs opacity-90">{message.reply_to_content}</p>
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {message.attachments.map((att) => {
                const resolvedUrl = att.file_url?.startsWith('http') || att.file_url?.startsWith('blob') || att.file_url?.startsWith('data')
                  ? att.file_url
                  : `${getApiBase()}${att.file_url?.startsWith('/') ? '' : '/'}${att.file_url || ''}`;

                const isImage =
                  att.mime_type?.startsWith('image/') ||
                  (att.file_url && att.file_url.match(/\.(jpeg|jpg|png|gif|webp)$/i));

                if (isImage) {
                  return (
                    <div key={att.id} className="rounded-xl overflow-hidden max-h-60">
                      <img
                        src={resolvedUrl}
                        alt={att.file_name}
                        className="w-full h-auto object-cover rounded-lg"
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={att.id}
                    className="flex items-center space-x-2 p-2 rounded-xl bg-black/20 border border-white/10 text-xs"
                  >
                    <FileText className="w-5 h-5 shrink-0 text-blue-300" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{att.file_name}</p>
                      <span className="text-[10px] opacity-75">
                        {((att.file_size || 0) / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <a
                      href={resolvedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 rounded-md hover:bg-white/10"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* Message Text Content */}
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words select-text">
            {message.content}
          </p>

          {/* Timestamp, Edited, and Status Icons */}
          <div className="flex items-center justify-end space-x-1 mt-1 select-none">
            {message.is_edited && (
              <span className="text-[10px] opacity-70 italic mr-1">(edited)</span>
            )}

            <span className="text-[10px] opacity-75">{formatTime(message.created_at)}</span>

            {isOutgoing && (
              <span className="ml-1 flex items-center">
                {message.status === 'sending' && (
                  <span className="w-2.5 h-2.5 rounded-full border border-white/60 border-t-white animate-spin" />
                )}
                {message.status === 'sent' && <Check className="w-3.5 h-3.5 text-white/80" />}
                {message.status === 'delivered' && (
                  <CheckCheck className="w-3.5 h-3.5 text-white/80" />
                )}
                {message.status === 'read' && (
                  <CheckCheck className="w-3.5 h-3.5 text-sky-200" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reaction Badges */}
      {Object.keys(groupedReactions).length > 0 && (
        <div
          className={`flex items-center space-x-1 mt-1 ${
            isOutgoing ? 'mr-1' : 'ml-1'
          }`}
        >
          {Object.entries(groupedReactions).map(([emoji, count]) => (
            <button
              key={emoji}
              onClick={() => onReact(message.id, emoji)}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#121b2d] border border-slate-700/80 text-xs text-slate-200 hover:border-blue-500 shadow-sm transition-colors"
            >
              <span>{emoji}</span>
              <span className="text-[11px] font-medium text-slate-400">{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
