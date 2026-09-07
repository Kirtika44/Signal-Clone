'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  X,
  Sparkles,
  Image as ImageIcon,
  Check
} from 'lucide-react';
import { Message } from '@/types';
import { api } from '@/lib/api';

interface MessageInputProps {
  replyingTo: Message | null;
  editingMessage: Message | null;
  smartReplies: string[];
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onSendMessage: (
    content: string,
    messageType?: string,
    replyToId?: number,
    attachments?: any[]
  ) => Promise<void>;
  onSaveEdit: (messageId: number, content: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  replyingTo,
  editingMessage,
  smartReplies,
  onCancelReply,
  onCancelEdit,
  onSendMessage,
  onSaveEdit,
  onTyping,
}) => {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // When editingMessage changes, populate input
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      inputRef.current?.focus();
    }
  }, [editingMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    // Typing debounce
    onTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    const text = content.trim();
    if (!text && attachments.length === 0) return;

    if (editingMessage) {
      await onSaveEdit(editingMessage.id, text);
      setContent('');
      onCancelEdit();
      return;
    }

    const type = attachments.length > 0 ? (attachments[0].type?.startsWith('image/') ? 'image' : 'file') : 'text';
    await onSendMessage(
      text,
      type,
      replyingTo?.id,
      attachments.length > 0 ? attachments : undefined
    );

    setContent('');
    setAttachments([]);
    onCancelReply();
    setShowEmojiPicker(false);
    onTyping(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const file = files[0];
      const res = await api.uploadFile(file);
      setAttachments((prev) => [...prev, res]);
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const addEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const emojiList = [
    '😊', '😂', '👍', '❤️', '🔥', '🎉', '🙏', '😍', '✨', '🤔',
    '👋', '🚀', '💯', '👌', '😎', '💡', '✅', '🥳', '🙌', '👀'
  ];

  return (
    <div className="p-3 bg-[#0b1220] border-t border-slate-800 relative select-none">
      {/* Smart Reply Chips from Signal AI */}
      {smartReplies.length > 0 && !replyingTo && !editingMessage && (
        <div className="mb-2 flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="flex items-center space-x-1 text-purple-400 shrink-0 font-medium pl-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Suggestions:</span>
          </span>
          {smartReplies.map((reply, i) => (
            <button
              key={i}
              onClick={() => {
                setContent(reply);
                inputRef.current?.focus();
              }}
              className="px-3 py-1 rounded-full bg-[#152238] hover:bg-blue-600 hover:text-white border border-slate-700 text-slate-300 transition-colors shrink-0 shadow-sm"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Replying Banner */}
      {replyingTo && (
        <div className="mb-2 p-2 rounded-xl bg-[#121c2e] border-l-4 border-blue-500 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[11px] font-semibold text-blue-400 block">
              Replying to {replyingTo.sender_name || 'User'}
            </span>
            <p className="text-xs text-slate-300 truncate">{replyingTo.content}</p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Editing Banner */}
      {editingMessage && (
        <div className="mb-2 p-2 rounded-xl bg-[#121c2e] border-l-4 border-emerald-500 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-150">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[11px] font-semibold text-emerald-400 block">
              Editing Message
            </span>
            <p className="text-xs text-slate-300 truncate">{editingMessage.content}</p>
          </div>
          <button
            onClick={onCancelEdit}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Attachment Preview Chips */}
      {attachments.length > 0 && (
        <div className="mb-2 flex items-center space-x-2 overflow-x-auto">
          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-2 bg-[#142036] border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs text-slate-200"
            >
              <Paperclip className="w-3.5 h-3.5 text-blue-400" />
              <span className="truncate max-w-[150px]">{att.name}</span>
              <button
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="text-slate-400 hover:text-rose-400 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="absolute bottom-16 left-4 bg-[#111a2c] border border-slate-700 rounded-2xl p-3 shadow-2xl z-30 grid grid-cols-5 gap-2 max-w-[260px] animate-in fade-in zoom-in-95 duration-150">
          {emojiList.map((e) => (
            <button
              key={e}
              onClick={() => addEmoji(e)}
              className="text-xl p-1.5 hover:scale-125 transition-transform rounded-lg hover:bg-slate-800 text-center"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* Input Control Container */}
      <div className="flex items-end space-x-2 bg-[#121c2e] border border-slate-700/80 rounded-2xl px-3 py-2 shadow-inner focus-within:border-blue-500/80 transition-colors">
        {/* Attachment Button */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors mb-0.5 shrink-0"
          title="Attach file or image"
        >
          {uploading ? (
            <span className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <Paperclip className="w-4 h-4" />
          )}
        </button>

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1.5 text-slate-400 hover:text-yellow-400 hover:bg-slate-800 rounded-xl transition-colors mb-0.5 shrink-0"
          title="Emojis"
        >
          <Smile className="w-4 h-4" />
        </button>

        {/* Main Text Area */}
        <textarea
          ref={inputRef}
          rows={1}
          value={content}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="New message... (Enter to send)"
          className="flex-1 bg-transparent border-0 resize-none max-h-32 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-0 px-2 py-1 leading-normal"
        />

        {/* Voice Note / Recording Button */}
        <button
          type="button"
          onClick={() => {
            setIsRecording(!isRecording);
            if (!isRecording) {
              setContent('[Voice Message 0:05]');
            }
          }}
          className={`p-1.5 rounded-xl transition-colors mb-0.5 shrink-0 ${
            isRecording
              ? 'text-rose-400 bg-rose-500/20 animate-pulse'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="Voice message"
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Send / Save Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim() && attachments.length === 0}
          className="p-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white rounded-xl shadow-md shadow-blue-600/30 transition-all mb-0.5 shrink-0 active:scale-95"
          title="Send"
        >
          {editingMessage ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
