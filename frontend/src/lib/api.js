/**
 * API helper — centralized fetch wrapper for the ITL AutoPilot backend.
 * Handles auth headers, JSON parsing, and error states.
 */

// In development: uses http://localhost:3000/api
// In production: uses https://auto-refer.onrender.com/api (set via VITE_API_URL)
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('itl_token');
}

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  };

  // Don't stringify if body is already a string or FormData
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err) {
    if (err.message === 'Failed to fetch') {
      throw new Error('Network error. Is the backend running on port 3000?');
    }
    throw err;
  }
}

// Convenience methods
export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body }),
  put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body }),
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
};

// ─── Typed API calls ───

// Auth
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password, role) => api.post('/auth/register', { name, email, password, role }),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (currentPassword, newPassword) => api.put('/auth/password', { currentPassword, newPassword }),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

// Campaigns
export const campaignsApi = {
  list: (params) => api.get(`/campaigns${params ? '?' + new URLSearchParams(params) : ''}`),
  get: (id) => api.get(`/campaigns/${id}`),
  create: (data) => api.post('/campaigns', data),
  update: (id, data) => api.put(`/campaigns/${id}`, data),
  delete: (id) => api.delete(`/campaigns/${id}`),
};

// QR Codes
export const qrCodesApi = {
  list: (params) => api.get(`/qr-codes${params ? '?' + new URLSearchParams(params) : ''}`),
  create: (campaignId) => api.post('/qr-codes', { campaignId }),
  toggle: (id) => api.put(`/qr-codes/${id}/toggle`),
  delete: (id) => api.delete(`/qr-codes/${id}`),
};

// Review Intents
export const reviewIntentsApi = {
  list: (params) => api.get(`/review-intents${params ? '?' + new URLSearchParams(params) : ''}`),
  get: (id) => api.get(`/review-intents/${id}`),
  create: (data) => api.post('/review-intents', data),
  complete: (id, data) => api.put(`/review-intents/${id}/complete`, data),
};

// Referral Programs
export const referralProgramsApi = {
  list: (params) => api.get(`/referral-programs${params ? '?' + new URLSearchParams(params) : ''}`),
  get: (id) => api.get(`/referral-programs/${id}`),
  create: (data) => api.post('/referral-programs', data),
  update: (id, data) => api.put(`/referral-programs/${id}`, data),
  delete: (id) => api.delete(`/referral-programs/${id}`),
};

// Referral Links
export const referralLinksApi = {
  list: (params) => api.get(`/referral-links${params ? '?' + new URLSearchParams(params) : ''}`),
  create: (data) => api.post('/referral-links', data),
  update: (id, data) => api.put(`/referral-links/${id}`, data),
  delete: (id) => api.delete(`/referral-links/${id}`),
  events: (id) => api.get(`/referral-links/${id}/events`),
};

// Referral Events
export const referralEventsApi = {
  list: (params) => api.get(`/referral-events${params ? '?' + new URLSearchParams(params) : ''}`),
  create: (data) => api.post('/referral-events', data),
};

// Wallets
export const walletsApi = {
  list: () => api.get('/wallets'),
  get: (id) => api.get(`/wallets/${id}`),
  freeze: (id) => api.post(`/wallets/${id}/freeze`),
};

// Payouts
export const payoutsApi = {
  list: (params) => api.get(`/payouts${params ? '?' + new URLSearchParams(params) : ''}`),
  request: (data) => api.post('/payouts', data),
  approve: (id) => api.put(`/payouts/${id}/approve`),
  reject: (id, reason) => api.put(`/payouts/${id}/reject`, { reason }),
  markPaid: (id) => api.put(`/payouts/${id}/mark-paid`),
};

// Fraud Queue
export const fraudQueueApi = {
  list: (params) => api.get(`/fraud-queue${params ? '?' + new URLSearchParams(params) : ''}`),
  resolve: (id, data) => api.put(`/fraud-queue/${id}/resolve`, data),
};

// Audit Logs
export const auditLogsApi = {
  list: (params) => api.get(`/audit-logs${params ? '?' + new URLSearchParams(params) : ''}`),
};

// Public Endpoints (No Auth)
export const publicApi = {
  resolveQr: (code) => api.get(`/public/qr/${code}`),
  capture: (data) => api.post('/public/capture', data),
};

// Chat API
export const chatApi = {
  send: (messages) => api.post('/chat', { messages }),
};

// Voice Thank-You API (Step 6)
export const voiceThanksApi = {
  list:    (params) => api.get(`/voice-thanks${params ? '?' + new URLSearchParams(params) : ''}`),
  call:    (phoneNumber, campaignId) => api.post('/voice-thanks/call', { phoneNumber, campaignId }),
  scripts: () => api.get('/voice-thanks/scripts'),
};

// Incentives API (Step 7)
export const incentivesApi = {
  list:   (params) => api.get(`/incentives${params ? '?' + new URLSearchParams(params) : ''}`),
  create: (data)   => api.post('/incentives', data),
  send:   (id, sendMethod) => api.put(`/incentives/${id}/send`, { sendMethod }),
  redeem: (id)     => api.put(`/incentives/${id}/redeem`, {}),
  expire: (id)     => api.put(`/incentives/${id}/expire`, {}),
  delete: (id)     => api.delete(`/incentives/${id}`),
};

// Referral Rewards API (Step 8)
export const referralRewardsApi = {
  list:           (params) => api.get(`/referral-events/rewards${params ? '?' + new URLSearchParams(params) : ''}`),
  processReward:  (eventId) => api.post('/referral-events/process-reward', { eventId }),
};

// Settings API
export const settingsApi = {
  get:                  () => api.get('/settings'),
  update:               (data) => api.put('/settings', data),
  freezeWallets:        () => api.post('/settings/freeze-wallets'),
  purgeExpiredIntents:  () => api.post('/settings/purge-expired-intents'),
};

// AI Engine API
export const aiEngineApi = {
  generate:     (prompt) => api.post('/ai-engine/generate', { prompt }),
  suggestions:  () => api.get('/ai-engine/suggestions'),
  enhance:      (prompt) => api.post('/ai-engine/enhance', { prompt }),
};

export default api;
