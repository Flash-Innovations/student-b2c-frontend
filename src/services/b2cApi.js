/**
 * B2C Backend API Client
 * Interacts with student-b2c-backend (:5001) for authentication, subscriptions,
 * entitlements, resume analysis, and verified placement outcomes.
 */

const BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_B2C_API_URL)
  || (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV ? '' : 'https://student-b2c-backend.onrender.com');

export const getAuthToken = () => {
  try {
    return localStorage.getItem('flash_token');
  } catch (e) {
    return null;
  }
};

export const setAuthToken = (token) => {
  try {
    if (token) localStorage.setItem('flash_token', token);
    else localStorage.removeItem('flash_token');
  } catch (e) {}
};

async function b2cRequest(endpoint, options = {}) {
  const base = BASE_URL.replace(/\/+$/, '');
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
      const err = new Error((data && data.message) || response.statusText || 'Request failed');
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.status) throw err;
    const networkErr = new Error('Cannot connect to Flash B2C backend. Please ensure the backend is running on port 5001.');
    networkErr.status = 0;
    throw networkErr;
  }
}

export const b2cApi = {
  // Auth
  register: (userData) => b2cRequest('/api/b2c/auth/register', { method: 'POST', body: userData }),
  login: (credentials) => b2cRequest('/api/b2c/auth/login', { method: 'POST', body: credentials }),
  getProfile: () => b2cRequest('/api/b2c/auth/me', { method: 'GET' }),
  updateProfile: (profileData) => b2cRequest('/api/b2c/auth/profile', { method: 'PUT', body: profileData }),
  changePassword: (data) => b2cRequest('/api/b2c/auth/change-password', { method: 'POST', body: data }),

  // Subscriptions & Razorpay
  getPlans: () => b2cRequest('/api/b2c/subscriptions/plans', { method: 'GET' }),
  createOrder: (orderPayload) => b2cRequest('/api/b2c/subscriptions/create-order', { method: 'POST', body: orderPayload }),
  verifyPayment: (paymentData) => b2cRequest('/api/b2c/subscriptions/verify-payment', { method: 'POST', body: paymentData }),
  getMySubscription: () => b2cRequest('/api/b2c/subscriptions/my-subscription', { method: 'GET' }),
  getTransactions: () => b2cRequest('/api/b2c/subscriptions/transactions', { method: 'GET' }),

  // Quotas & Entitlements
  checkEntitlement: (query) => {
    const params = new URLSearchParams(query).toString();
    return b2cRequest(`/api/b2c/entitlements/check?${params}`, { method: 'GET' });
  },
  consumeMockMinutes: (data) => b2cRequest('/api/b2c/entitlements/consume-mock-minutes', { method: 'POST', body: data }),
  recordQuestionAttempt: (data) => b2cRequest('/api/b2c/entitlements/record-attempt', { method: 'POST', body: data }),

  // Resume ATS Optimization
  analyzeResume: (formDataOrJson) => b2cRequest('/api/b2c/resume/analyze', { method: 'POST', body: formDataOrJson }),

  // Outcomes & B2B Cohort Insights
  logPlacementOffer: (offerData) => b2cRequest('/api/b2c/outcomes/offers', { method: 'POST', body: offerData }),
  getMyOutcomes: () => b2cRequest('/api/b2c/outcomes/offers', { method: 'GET' }),
  updateConsent: (consentData) => b2cRequest('/api/b2c/outcomes/consent', { method: 'PUT', body: consentData }),
  // Group Discussion (GD) Arena
  getGdStatus: () => b2cRequest('/api/b2c/gd/status', { method: 'GET' }),
  listGdRooms: () => b2cRequest('/api/b2c/gd/rooms', { method: 'GET' }),
  createGdRoom: (data) => b2cRequest('/api/b2c/gd/create', { method: 'POST', body: data }),
  joinGdRoom: (roomId) => b2cRequest(`/api/b2c/gd/${roomId}/join`, { method: 'POST' }),
  getGdRoom: (roomId) => b2cRequest(`/api/b2c/gd/${roomId}`, { method: 'GET' }),
  leaveGdRoom: (roomId) => b2cRequest(`/api/b2c/gd/${roomId}/leave`, { method: 'POST' }),
  sendGdChat: (roomId, text) => b2cRequest(`/api/b2c/gd/${roomId}/chat`, { method: 'POST', body: { text } }),
  updateParticipantState: (roomId, state) => b2cRequest(`/api/b2c/gd/${roomId}/state`, { method: 'POST', body: state }),
  buyGdPowerUp: (quantity = 1) => b2cRequest('/api/b2c/subscriptions/create-order', { method: 'POST', body: { orderType: 'GD_POWERUP', quantity } }),

  // Health
  getHealth: () => b2cRequest('/api/health', { method: 'GET' })
};
