export const getApiBase = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return 'http://127.0.0.1:8000';
};

export const getWsBase = (): string => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL.replace(/\/+$/, '');
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    const raw = process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '');
    const wsProto = raw.startsWith('https:') ? 'wss:' : 'ws:';
    const host = raw.replace(/^https?:\/\//, '');
    return `${wsProto}//${host}`;
  }
  if (typeof window !== 'undefined') {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.hostname}:8000`;
  }
  return 'ws://127.0.0.1:8000';
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('signal_token');
  }
  return null;
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('signal_token', token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('signal_token');
  }
};

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const base = getApiBase();
  const response = await fetch(`${base}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || errorDetail;
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (data: { login: string; password: string }) =>
    fetchWithAuth('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: {
    username: string;
    password: string;
    display_name: string;
    phone?: string;
    avatar_url?: string;
  }) =>
    fetchWithAuth('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => fetchWithAuth('/api/auth/me'),

  verifyOtp: (otp: string) =>
    fetchWithAuth('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp }),
    }),

  // Users
  searchUsers: (query: string) =>
    fetchWithAuth(`/api/users/search?q=${encodeURIComponent(query)}`),

  discoverUsers: () => fetchWithAuth('/api/users/discover'),

  getBlockedUsers: () => fetchWithAuth('/api/users/blocked'),

  blockUser: (userId: number) =>
    fetchWithAuth(`/api/users/${userId}/block`, {
      method: 'POST',
    }),

  unblockUser: (userId: number) =>
    fetchWithAuth(`/api/users/${userId}/unblock`, {
      method: 'POST',
    }),

  updateProfile: (data: any) =>
    fetchWithAuth('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Contacts
  getContacts: () => fetchWithAuth('/api/contacts'),

  addContact: (data: { contact_username_or_phone: string; nickname?: string }) =>
    fetchWithAuth('/api/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteContact: (contactId: number) =>
    fetchWithAuth(`/api/contacts/${contactId}`, {
      method: 'DELETE',
    }),

  // Conversations
  getConversations: () => fetchWithAuth('/api/conversations'),

  createDirectConversation: (recipient_user_id: number) =>
    fetchWithAuth('/api/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ recipient_user_id }),
    }),

  getConversation: (conversationId: number) =>
    fetchWithAuth(`/api/conversations/${conversationId}`),

  togglePinConversation: (conversationId: number) =>
    fetchWithAuth(`/api/conversations/${conversationId}/pin`, {
      method: 'POST',
    }),

  // Messages
  getMessages: (conversationId: number) =>
    fetchWithAuth(`/api/messages/${conversationId}`),

  sendMessage: (data: {
    conversation_id: number;
    content: string;
    message_type?: string;
    reply_to_id?: number;
    attachment_urls?: any[];
  }) =>
    fetchWithAuth('/api/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  editMessage: (messageId: number, content: string) =>
    fetchWithAuth(`/api/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }),

  deleteMessage: (messageId: number) =>
    fetchWithAuth(`/api/messages/${messageId}`, {
      method: 'DELETE',
    }),

  toggleReaction: (messageId: number, emoji: string) =>
    fetchWithAuth(`/api/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify({ emoji }),
    }),

  togglePinMessage: (messageId: number) =>
    fetchWithAuth(`/api/messages/${messageId}/pin`, {
      method: 'POST',
    }),

  markMessagesRead: (conversationId: number) =>
    fetchWithAuth(`/api/messages/${conversationId}/read`, {
      method: 'POST',
    }),

  // Groups
  createGroup: (data: {
    title: string;
    description?: string;
    avatar_url?: string;
    member_ids: number[];
  }) =>
    fetchWithAuth('/api/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  addGroupMembers: (groupId: number, user_ids: number[]) =>
    fetchWithAuth(`/api/groups/${groupId}/members`, {
      method: 'POST',
      body: JSON.stringify({ user_ids }),
    }),

  removeGroupMember: (groupId: number, userId: number) =>
    fetchWithAuth(`/api/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    }),

  updateGroupInfo: (groupId: number, data: any) =>
    fetchWithAuth(`/api/groups/${groupId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Signal AI
  aiChat: (prompt: string, conversation_id?: number) =>
    fetchWithAuth('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, conversation_id }),
    }),

  aiSummarize: (conversation_id: number) =>
    fetchWithAuth('/api/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ conversation_id }),
    }),

  aiSmartReplies: (conversation_id: number) =>
    fetchWithAuth('/api/ai/smart-replies', {
      method: 'POST',
      body: JSON.stringify({ conversation_id }),
    }),

  // Media upload
  uploadFile: async (file: File) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const base = getApiBase();
    const res = await fetch(`${base}/api/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      throw new Error('File upload failed');
    }
    return res.json();
  },
};
