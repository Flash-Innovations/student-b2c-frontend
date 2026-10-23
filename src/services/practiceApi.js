import { getAuthToken } from './b2cApi';

const PRACTICE_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PRACTICE_API_URL)
  || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV ? '/practice-api' : 'https://sips-practice-service.onrender.com');

async function practiceRequest(endpoint, options = {}, retries = 1) {
  const base = PRACTICE_BASE_URL.replace(/\/+$/, '');
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
    const contentType = response.headers.get('content-type');
    let data = null;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
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
    if (err.status) throw err;
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 800));
      return practiceRequest(endpoint, options, retries - 1);
    }
    const networkErr = new Error('Cannot connect to Practice Hub engine.');
    networkErr.status = 0;
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

  // Question Banks
  getQuestions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return practiceRequest(`/api/questions${q ? `?${q}` : ''}`, { method: 'GET' });
  },
  getQuestionById: (id) => practiceRequest(`/api/questions/${id}`, { method: 'GET' }),
  getQuestionVersionById: (versionId) => practiceRequest(`/api/question-versions/${versionId}`, { method: 'GET' }),

  // Practice Sessions (MCQs)
  createAttempt: (payload) => practiceRequest('/api/practice/attempts', { method: 'POST', body: payload }),
  getAttemptById: (attemptId) => practiceRequest(`/api/practice/attempts/${attemptId}`, { method: 'GET' }),
  getAttemptQuestions: (attemptId) => practiceRequest(`/api/practice/attempts/${attemptId}/questions`, { method: 'GET' }),
  recordResponse: (attemptId, responseData) => practiceRequest(`/api/practice/attempts/${attemptId}/responses`, { method: 'POST', body: responseData }),
  submitAttempt: (attemptId) => practiceRequest(`/api/practice/attempts/${attemptId}/submit`, { method: 'POST' }),
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
  getStudentContest: (contestId) => practiceRequest(`/api/contests/${contestId}/student`, { method: 'GET' }),
  startContestAttempt: (contestId) => practiceRequest(`/api/contests/${contestId}/attempts/start`, { method: 'POST' }),
  getContestAttempt: (contestId, attemptId) => practiceRequest(`/api/contests/${contestId}/attempts/${attemptId}`, { method: 'GET' }),
  getContestQuestions: (contestId, attemptId) => practiceRequest(`/api/contests/${contestId}/attempts/${attemptId}/questions`, { method: 'GET' }),
  recordContestResponse: (contestId, attemptId, payload) => practiceRequest(`/api/contests/${contestId}/attempts/${attemptId}/responses`, { method: 'POST', body: payload }),
  submitContestAttempt: (contestId, attemptId) => practiceRequest(`/api/contests/${contestId}/attempts/${attemptId}/submit`, { method: 'POST' }),
  finalizeContestAttempt: (contestId, attemptId) => practiceRequest(`/api/contests/${contestId}/attempts/${attemptId}/finalize`, { method: 'POST' }),
  getContestResult: (contestId, attemptId) => practiceRequest(`/api/contests/${contestId}/attempts/${attemptId}/result`, { method: 'GET' }),
  getContestLeaderboard: (contestId, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return practiceRequest(`/api/contests/${contestId}/leaderboard${q ? `?${q}` : ''}`, { method: 'GET' });
  },
  getMyContestRank: (contestId) => practiceRequest(`/api/contests/${contestId}/leaderboard/me`, { method: 'GET' })
};

