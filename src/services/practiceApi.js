import { getAuthToken } from './b2cApi';

function resolvePracticeBaseUrl() {
  const envUrl = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PRACTICE_API_URL;
  if (!envUrl) return '/practice-api';
  
  const trimmed = String(envUrl).trim();
  // Never connect to offline localhost:5050
  if (trimmed.includes('localhost:5050')) return '/practice-api';
  
  // Relative proxies (Vite / Vercel proxy rewrite)
  if (trimmed.startsWith('/')) return trimmed;
  
  // If protocol was omitted in env variable (e.g. "sips-practice-service.onrender.com"), prepend https://
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

const PRIMARY_BASE_URL = resolvePracticeBaseUrl();
const FALLBACK_BASE_URL = PRIMARY_BASE_URL.startsWith('http') ? '/practice-api' : 'https://sips-practice-service.onrender.com';

async function practiceRequest(endpoint, options = {}, retries = 1, useFallback = false) {
  const currentBase = useFallback ? FALLBACK_BASE_URL : PRIMARY_BASE_URL;
  const base = currentBase.replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${base}${path}`;
  const token = getAuthToken();

  const headers = {
    ...options.headers
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, { ...options, headers });
    const contentType = response.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      // If the response is HTML (e.g. SPA index.html fallback), it's not a valid API response
      if (text.includes('<!DOCTYPE') || text.includes('<html')) {
        const htmlErr = new Error('Practice Platform endpoint returned HTML instead of JSON.');
        htmlErr.status = 502;
        throw htmlErr;
      }
      data = text;
    }

    if (!response.ok) {
      const msg = (data && (data.message || data.error)) || response.statusText || 'Practice Platform request failed';
      const err = new Error(msg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    // If primary failed or returned HTML/502, try fallback (e.g. switch between /practice-api and direct domain)
    if (!useFallback && FALLBACK_BASE_URL !== PRIMARY_BASE_URL) {
      return practiceRequest(endpoint, options, retries, true);
    }
    if (err.status && err.status !== 502) throw err;
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 800));
      return practiceRequest(endpoint, options, retries - 1, useFallback);
    }
    const networkErr = new Error(err.message || 'Cannot connect to Practice Hub engine.');
    networkErr.status = err.status || 0;
    throw networkErr;
  }
}

export const practiceApi = {
  // Health Probe
  getHealth: () => practiceRequest('/health', { method: 'GET' }),

  // Curriculum & Subjects
  getSubjects: () => practiceRequest('/api/subjects', { method: 'GET' }),
  getGlobalCatalog: () => practiceRequest('/api/subjects/global-catalog', { method: 'GET' }),
  getSubjectById: (id) => practiceRequest(`/api/subjects/${id}`, { method: 'GET' }),

  // Question Banks & Topics
  getTopics: () => practiceRequest('/api/questions/topics', { method: 'GET' }),
  getQuestions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return practiceRequest(`/api/questions${q ? `?${q}` : ''}`, { method: 'GET' });
  },
  getQuestionById: (id) => practiceRequest(`/api/questions/${id}`, { method: 'GET' }),
  getQuestionVersionById: (versionId) => practiceRequest(`/api/question-versions/${versionId}`, { method: 'GET' }),

  // Student Practice Hub Questions (PostgreSQL)
  getPracticeQuestions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return practiceRequest(`/practice/questions${q ? `?${q}` : ''}`, { method: 'GET' });
  },
  verifyPracticeAnswer: (payload) => practiceRequest('/practice/verify', { method: 'POST', body: payload }),

  // Practice Sessions (MCQs)
  createAttempt: (payload) => practiceRequest('/api/practice/attempts', { method: 'POST', body: payload }),
  getAttemptById: (attemptId) => practiceRequest(`/api/practice/attempts/${attemptId}`, { method: 'GET' }),
  getAttemptQuestions: (attemptId) => practiceRequest(`/api/practice/attempts/${attemptId}/questions`, { method: 'GET' }),
  recordResponse: (attemptId, responseData) => practiceRequest(`/api/practice/attempts/${attemptId}/responses`, { method: 'POST', body: responseData }),
  submitAttempt: (attemptId, payload = {}) => practiceRequest(`/api/practice/attempts/${attemptId}/submit`, { method: 'POST', body: payload }),
  getAttemptResult: (attemptId) => practiceRequest(`/api/practice/attempts/${attemptId}/result`, { method: 'GET' }),
  getStreak: () => practiceRequest('/api/practice/streak', { method: 'GET' }),
  getHistory: () => practiceRequest('/api/practice/history', { method: 'GET' }),

  // Code Execution Sandbox (Judge0)
  runCode: (codePayload) => practiceRequest('/api/coding/execute/run', { method: 'POST', body: codePayload }),
  submitCode: (codePayload) => practiceRequest('/api/coding/execute/submit', { method: 'POST', body: codePayload }),
  getSubmissionById: (submissionId) => practiceRequest(`/api/coding/submissions/${submissionId}`, { method: 'GET' }),

  // Contests & Assessments
  getAvailableContests: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return practiceRequest(`/api/contests/available${q ? `?${q}` : ''}`, { method: 'GET' });
  },
  getMyContestAttempts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return practiceRequest(`/api/contests/my-attempts${q ? `?${q}` : ''}`, { method: 'GET' });
  },
  getStudentContest: (contestId) => practiceRequest(`/api/contests/${contestId}/student`, { method: 'GET' }),
  startContestAttempt: (contestId) => practiceRequest(`/api/contests/${contestId}/attempts/start`, { method: 'POST' }),
  getContestAttempt: (contestId, attemptId) => practiceRequest(`/api/contests/${contestId}/attempts/${attemptId}`, { method: 'GET' }),
  getContestQuestions: (contestId, attemptId) => practiceRequest(`/api/contests/${contestId}/attempts/${attemptId}/questions`, { method: 'GET' }),
  recordContestResponse: (contestId, attemptId, payload) => practiceRequest(`/api/contests/${contestId}/attempts/${attemptId}/responses`, { method: 'POST', body: payload }),
  submitContestAttempt: (contestId, attemptId) => {
    if (attemptId) {
      return practiceRequest(`/api/contests/${contestId}/attempts/${attemptId}/submit`, { method: 'POST' });
    }
    return practiceRequest(`/api/contests/${contestId}/attempts/submit`, { method: 'POST' });
  },
  finalizeContestAttempt: (contestId, attemptId) => practiceRequest(`/api/contests/${contestId}/attempts/${attemptId}/finalize`, { method: 'POST' }),
  getContestResult: (contestId, attemptId) => {
    if (contestId && attemptId) {
      return practiceRequest(`/api/contests/${contestId}/attempts/${attemptId}/result`, { method: 'GET' });
    }
    const id = attemptId || contestId;
    return practiceRequest(`/api/contests/attempts/${id}/result`, { method: 'GET' });
  },
  getContestLeaderboard: (contestId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return practiceRequest(`/api/contests/${contestId}/leaderboard${q ? `?${q}` : ''}`, { method: 'GET' });
  },
  getMyContestRank: (contestId) => practiceRequest(`/api/contests/${contestId}/leaderboard/me`, { method: 'GET' })
};

