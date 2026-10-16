import { getAuthToken } from './b2cApi';

const PRACTICE_BASE_URL = import.meta.env.VITE_PRACTICE_API_URL || '';

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
    const networkErr = new Error('Cannot connect to Practice Hub engine on port 5050.');
    networkErr.status = 0;
    throw networkErr;
  }
}

export const practiceApi = {
  // Curriculum & Subjects
  getSubjects: () => practiceRequest('/subjects', { method: 'GET' }),
  getGlobalCatalog: () => practiceRequest('/subjects/global-catalog', { method: 'GET' }),
  getSubjectById: (id) => practiceRequest(`/subjects/${id}`, { method: 'GET' }),

  // Question Banks
  getQuestions: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return practiceRequest(`/questions${q ? `?${q}` : ''}`, { method: 'GET' });
  },
  getQuestionById: (id) => practiceRequest(`/questions/${id}`, { method: 'GET' }),
  getQuestionVersionById: (versionId) => practiceRequest(`/question-versions/${versionId}`, { method: 'GET' }),

  // Practice Sessions (MCQs)
  createAttempt: (payload) => practiceRequest('/practice/attempts', { method: 'POST', body: payload }),
  getAttemptById: (attemptId) => practiceRequest(`/practice/attempts/${attemptId}`, { method: 'GET' }),
  getAttemptQuestions: (attemptId) => practiceRequest(`/practice/attempts/${attemptId}/questions`, { method: 'GET' }),
  recordResponse: (attemptId, responseData) => practiceRequest(`/practice/attempts/${attemptId}/responses`, { method: 'POST', body: responseData }),
  submitAttempt: (attemptId) => practiceRequest(`/practice/attempts/${attemptId}/submit`, { method: 'POST' }),
  getAttemptResult: (attemptId) => practiceRequest(`/practice/attempts/${attemptId}/result`, { method: 'GET' }),
  getStreak: () => practiceRequest('/practice/streak', { method: 'GET' }),
  getHistory: () => practiceRequest('/practice/history', { method: 'GET' }),

  // Code Execution Sandbox (Judge0)
  runCode: (codePayload) => practiceRequest('/coding/execute/run', { method: 'POST', body: codePayload }),
  submitCode: (codePayload) => practiceRequest('/coding/execute/submit', { method: 'POST', body: codePayload }),
  getSubmissionById: (submissionId) => practiceRequest(`/coding/submissions/${submissionId}`, { method: 'GET' }),

  // Contests
  getAvailableContests: () => practiceRequest('/contests/available', { method: 'GET' }),
  getStudentContest: (contestId) => practiceRequest(`/contests/${contestId}/student`, { method: 'GET' }),
  startContestAttempt: (contestId) => practiceRequest(`/contests/${contestId}/attempts/start`, { method: 'POST' }),
  getContestLeaderboard: (contestId) => practiceRequest(`/contests/${contestId}/leaderboard`, { method: 'GET' })
};
