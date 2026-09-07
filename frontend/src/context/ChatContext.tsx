'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Conversation, Message, User } from '@/types';
import { api, getAuthToken, getWsBase } from '@/lib/api';
import { useAuth } from './AuthContext';
import { useCall } from './CallContext';

interface ChatContextType {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Message[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  typingUsers: { [userId: number]: boolean };
  smartReplies: string[];
  selectConversation: (conv: Conversation | null) => void;
  loadConversations: () => Promise<void>;
  sendMessage: (
    content: string,
    messageType?: string,
    replyToId?: number,
    attachments?: any[]
  ) => Promise<void>;
  editMessage: (messageId: number, content: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  toggleReaction: (messageId: number, emoji: string) => Promise<void>;
  togglePinMessage: (messageId: number) => Promise<void>;
  sendTypingSignal: (isTyping: boolean) => void;
  refreshMessages: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { receiveCall } = useCall();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [typingUsers, setTypingUsers] = useState<{ [userId: number]: boolean }>({});
  const [smartReplies, setSmartReplies] = useState<string[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeoutRef = useRef<{ [userId: number]: NodeJS.Timeout }>({});

  // 1. Fetch conversations when user is logged in
  const loadConversations = async () => {
    if (!user) return;
    try {
      setLoadingConversations(true);
      const data = await api.getConversations();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
    }
  }, [user]);

  // 2. Manage WebSocket Connection
  useEffect(() => {
    const token = getAuthToken();
    if (!user || !token) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    try {
      const wsUrl = `${getWsBase()}/ws/${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('Signal Real-time WebSocket connected');
      };

      ws.onerror = (err) => {
        console.warn('WebSocket connection notice:', err);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const { type, data } = payload;

          if (type === 'new_message') {
            const newMsg: Message = data;
            if (activeConversation && activeConversation.id === newMsg.conversation_id) {
              setMessages((prev) => {
                if (prev.some((m) => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              if (user && newMsg.sender_id !== user.id) {
                api.markMessagesRead(newMsg.conversation_id).catch(() => {});
              }
            }

            setConversations((prev) => {
              const updated = prev.map((c) => {
                if (c.id === newMsg.conversation_id) {
                  return {
                    ...c,
                    last_message: newMsg,
                    updated_at: newMsg.created_at,
                    unread_count:
                      activeConversation?.id === c.id || newMsg.sender_id === user?.id
                        ? 0
                        : c.unread_count + 1,
                  };
                }
                return c;
              });
              return updated.sort((a, b) => {
                if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
                return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
              });
            });
          } else if (type === 'message_edited') {
            const editedMsg: Message = data;
            setMessages((prev) =>
              prev.map((m) => (m.id === editedMsg.id ? editedMsg : m))
            );
          } else if (type === 'message_deleted') {
            const { message_id } = data;
            setMessages((prev) => prev.filter((m) => m.id !== message_id));
          } else if (type === 'reaction_updated' || type === 'message_pinned') {
            const updatedMsg: Message = data;
            setMessages((prev) =>
              prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m))
            );
          } else if (type === 'messages_read') {
            const { conversation_id } = data;
            setMessages((prev) =>
              prev.map((m) =>
                m.conversation_id === conversation_id ? { ...m, status: 'read' } : m
              )
            );
          } else if (type === 'user_typing') {
            const { user_id, is_typing, conversation_id } = data;
            if (activeConversation && activeConversation.id === conversation_id) {
              setTypingUsers((prev) => ({ ...prev, [user_id]: is_typing }));

              if (typingTimeoutRef.current[user_id]) {
                clearTimeout(typingTimeoutRef.current[user_id]);
              }

              if (is_typing) {
                typingTimeoutRef.current[user_id] = setTimeout(() => {
                  setTypingUsers((prev) => ({ ...prev, [user_id]: false }));
                }, 3000);
              }
            }
          } else if (type === 'group_members_updated' || type === 'group_info_updated') {
            const updatedConv: Conversation = data;
            setConversations((prev) =>
              prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
            );
            if (activeConversation?.id === updatedConv.id) {
              setActiveConversation(updatedConv);
            }
          } else if (type === 'call:initiate') {
            const { caller, call_type } = data;
            if (caller) {
              receiveCall(caller, call_type || 'video');
            }
          }
        } catch (err) {
          console.error('WebSocket message parsing error:', err);
        }
      };

      ws.onclose = () => {
        console.log('Signal Real-time WebSocket disconnected');
      };

      return () => {
        ws.close();
        wsRef.current = null;
      };
    } catch (e) {
      console.warn('Could not initialize WebSocket:', e);
    }
  }, [user, activeConversation]);

  // 3. Load messages when active conversation changes
  const refreshMessages = async () => {
    if (!activeConversation) return;
    try {
      setLoadingMessages(true);
      const data = await api.getMessages(activeConversation.id);
      setMessages(Array.isArray(data) ? data : []);

      // Fetch smart replies
      api.aiSmartReplies(activeConversation.id)
        .then((res) => {
          if (res && res.suggestions) setSmartReplies(res.suggestions);
        })
        .catch(() => {});

      // Mark messages as read
      await api.markMessagesRead(activeConversation.id);

      // Reset unread count locally
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConversation.id ? { ...c, unread_count: 0 } : c))
      );
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConversation) {
      refreshMessages();
    } else {
      setMessages([]);
      setSmartReplies([]);
    }
  }, [activeConversation?.id]);

  const selectConversation = (conv: Conversation | null) => {
    setActiveConversation(conv);
  };

  const sendMessage = async (
    content: string,
    messageType: string = 'text',
    replyToId?: number,
    attachments?: any[]
  ) => {
    if (!activeConversation) return;
    const res = await api.sendMessage({
      conversation_id: activeConversation.id,
      content,
      message_type: messageType,
      reply_to_id: replyToId,
      attachment_urls: attachments,
    });
    setMessages((prev) => {
      if (prev.some((m) => m.id === res.id)) return prev;
      return [...prev, res];
    });
  };

  const editMessage = async (messageId: number, content: string) => {
    const updated = await api.editMessage(messageId, content);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
  };

  const deleteMessage = async (messageId: number) => {
    await api.deleteMessage(messageId);
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const toggleReaction = async (messageId: number, emoji: string) => {
    const updated = await api.toggleReaction(messageId, emoji);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
  };

  const togglePinMessage = async (messageId: number) => {
    const updated = await api.togglePinMessage(messageId);
    setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)));
  };

  const sendTypingSignal = (isTyping: boolean) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && activeConversation) {
      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
          data: {
            conversation_id: activeConversation.id,
            is_typing: isTyping,
          },
        })
      );
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loadingConversations,
        loadingMessages,
        typingUsers,
        smartReplies,
        selectConversation,
        loadConversations,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        togglePinMessage,
        sendTypingSignal,
        refreshMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
