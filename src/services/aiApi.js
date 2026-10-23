import { getAuthToken } from './b2cApi';

const AI_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AI_API_URL)
  || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV ? '/ai-api' : 'https://ai-backend-rcvr.onrender.com');
const AI_WS_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_AI_WS_URL)
  || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV ? 'ws://localhost:5055' : 'wss://ai-backend-rcvr.onrender.com');

async function aiRequest(endpoint, options = {}) {
  const base = AI_BASE_URL.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;
  const token = getAuthToken();

  const headers = {
    ...options.headers
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      const err = new Error(data.message || response.statusText || 'AI Backend request failed');
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    const networkErr = new Error('Cannot connect to AI service on port 5055.');
    networkErr.status = 0;
    throw networkErr;
  }
}

export const aiApi = {
  // Generic HTTP helpers
  get: (endpoint, options = {}) => aiRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => aiRequest(endpoint, { ...options, method: 'POST', body }),

  // Session Lifecycle
  getConfigStatus: () => aiRequest('/api/interviews/config-status', { method: 'GET' }),
  createSession: (sessionData) => aiRequest('/api/interviews/session', { method: 'POST', body: sessionData }),
  getHistory: () => aiRequest('/api/interviews/history', { method: 'GET' }),
  getInterviewById: (id) => aiRequest(`/api/interviews/${id}`, { method: 'GET' }),

  // Curated SQL & Dev AI Tracks
  getSqlQuestions: () => aiRequest('/api/practice/ai/sql-questions', { method: 'GET' }),
  getDevQuestions: () => aiRequest('/api/practice/ai/dev-questions', { method: 'GET' }),
  generateSql: (topic, difficulty) => aiRequest('/api/practice/ai/generate-sql', { method: 'POST', body: { topic, difficulty } }),
  generateDev: (stack, topic) => aiRequest('/api/practice/ai/generate-dev', { method: 'POST', body: { stack, topic } }),

  // WebSocket Connection Factory
  createLiveWebSocket: (sessionId) => {
    const token = getAuthToken();
    const wsUrl = `${AI_WS_URL.replace(/\/+$/, '')}/ws/interview?sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token || '')}`;
    return new WebSocket(wsUrl);
  }
};
