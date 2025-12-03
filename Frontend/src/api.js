// Centralized API configuration for Admin Portal
// This will connect to Employee Portal in the future

const API_BASE = import.meta.env.VITE_API_URL || '';

// API helper with error handling
async function apiCall(endpoint, options = {}) {
  const token = localStorage.getItem('app_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

// Auth API
export const auth = {
  login: (email, password) => apiCall('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => apiCall('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => apiCall('/api/auth/logout', { method: 'POST' }),
  getProfile: () => apiCall('/api/auth/profile'),
};

// Trips API
export const trips = {
  getAll: () => apiCall('/api/trips'),
  getById: (id) => apiCall(`/api/trips/${id}`),
  create: (data) => apiCall('/api/trips', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/api/trips/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id, status) => apiCall(`/api/trips/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  delete: (id) => apiCall(`/api/trips/${id}`, { method: 'DELETE' }),
};

// Expenses API
export const expenses = {
  getAll: () => apiCall('/api/expenses'),
  create: (data) => apiCall('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/api/expenses/${id}`, { method: 'DELETE' }),
};

// Documents API
export const documents = {
  getAll: () => apiCall('/api/documents'),
  create: (data) => apiCall('/api/documents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/api/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/api/documents/${id}`, { method: 'DELETE' }),
};

// Policies API
export const policies = {
  getAll: () => apiCall('/api/policy'),
  create: (data) => apiCall('/api/policy', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => apiCall(`/api/policy/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => apiCall(`/api/policy/${id}`, { method: 'DELETE' }),
};

// Risk API
export const risk = {
  getAdvisories: () => apiCall('/api/risk/advisories'),
  createAdvisory: (data) => apiCall('/api/risk/advisories', { method: 'POST', body: JSON.stringify(data) }),
  getTravelers: () => apiCall('/api/risk/travelers'),
};

// Dashboard & KPI API
export const dashboard = {
  getSummary: () => apiCall('/api/dashboard'),
  getKpis: (range = '30d') => apiCall(`/api/kpi?range=${range}`),
  getAnalytics: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiCall(`/api/analytics${query ? '?' + query : ''}`);
  },
};

// Real-time notifications (for future Employee Portal integration)
export const notifications = {
  getAll: () => apiCall('/api/notifications'),
  markRead: (id) => apiCall(`/api/notifications/${id}/read`, { method: 'POST' }),
};

export default { auth, trips, expenses, documents, policies, risk, dashboard, notifications };
