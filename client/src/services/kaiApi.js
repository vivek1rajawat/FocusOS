import api from './api';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const getConversations = () => api.get('/kai/conversations').then((r) => r.data.conversations);
export const getConversation = (id) => api.get(`/kai/conversations/${id}`).then((r) => r.data.conversation);
export const deleteConversation = (id) => api.delete(`/kai/conversations/${id}`).then((r) => r.data);

// Streams KAI's answer via chunked transfer encoding. Calls onToken(text) as chunks arrive,
// then onDone(conversationId) once the stream ends.
export const streamChat = async ({ conversationId, message }, { onToken, onDone, onError }) => {
  try {
    const token = localStorage.getItem('focusos_token');
    const response = await fetch(`${API_BASE}/kai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ conversationId, message }),
    });

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || `Request failed (${response.status})`);
    }

    const returnedConversationId = response.headers.get('X-Conversation-Id') || conversationId;
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let reading = true;
    while (reading) {
      const { value, done } = await reader.read();
      if (done) {
        reading = false;
        break;
      }
      onToken(decoder.decode(value, { stream: true }));
    }

    onDone?.(returnedConversationId);
  } catch (err) {
    onError?.(err);
  }
};
