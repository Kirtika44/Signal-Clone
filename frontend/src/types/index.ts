export interface User {
  id: number;
  username: string;
  display_name: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  theme?: string;
  is_online: boolean;
  last_seen?: string;
  created_at: string;
}

export interface Contact {
  id: number;
  user_id: number;
  contact_user_id: number;
  nickname?: string;
  contact_user: User;
}

export interface Reaction {
  id: number;
  user_id: number;
  emoji: string;
  created_at: string;
  username?: string;
}

export interface Attachment {
  id: number;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name?: string;
  sender_avatar?: string;
  content: string;
  message_type: 'text' | 'image' | 'audio' | 'file' | 'system';
  reply_to_id?: number;
  reply_to_content?: string;
  reply_to_sender?: string;
  is_edited: boolean;
  is_pinned: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  created_at: string;
  updated_at: string;
  reactions: Reaction[];
  attachments: Attachment[];
}

export interface ConversationMember {
  id: number;
  user_id: number;
  role: 'admin' | 'member';
  is_pinned: boolean;
  joined_at: string;
  user: User;
}

export interface Conversation {
  id: number;
  is_group: boolean;
  title?: string;
  description?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  unread_count: number;
  is_pinned: boolean;
  members: ConversationMember[];
}

export interface CallState {
  isActive: boolean;
  callType: 'audio' | 'video';
  status: 'idle' | 'outgoing' | 'incoming' | 'connected' | 'ended';
  peerUser?: User;
  isMuted: boolean;
  isCameraOff: boolean;
  durationSeconds: number;
}
