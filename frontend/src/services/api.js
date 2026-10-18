const API_BASE = '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('gymhq_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${url}`, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  // Auth
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  googleAuth: (data) => request('/auth/google', { method: 'POST', body: JSON.stringify(data) }),
  updateGymProfile: (data) => request('/auth/gym', { method: 'PUT', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // Platform Super Admin & Access Control
  getPlatformOverview: () => request('/platform/overview'),
  getPlatformUsers: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.status) qs.set('status', params.status);
    return request(`/platform/users?${qs}`);
  },
  updateUserStatus: (id, is_active) => request(`/platform/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ is_active }) }),
  updateGymSubscription: (id, data) => request(`/platform/users/${id}/subscription`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePlatformUser: (id) => request(`/platform/users/${id}`, { method: 'DELETE' }),

  // Dashboard
  getDashboard: (month) => request(`/dashboard${month ? `?month=${month}` : ''}`),

  // Members
  getMembers: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.status) qs.set('status', params.status);
    if (params.page) qs.set('page', params.page);
    if (params.page_size) qs.set('page_size', params.page_size);
    return request(`/members?${qs}`);
  },
  getMember: (id) => request(`/members/${id}`),
  createMember: (data) => request('/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id, data) => request(`/members/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deactivateMember: (id) => request(`/members/${id}/deactivate`, { method: 'PATCH' }),
  activateMember: (id) => request(`/members/${id}/activate`, { method: 'PATCH' }),
  renewMember: (id, data) => request(`/members/${id}/renew`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Attendance
  getAttendance: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
    if (params.member_id) qs.set('member_id', params.member_id);
    if (params.page) qs.set('page', params.page);
    return request(`/attendance?${qs}`);
  },
  markAttendance: (data) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),
  getTodayAttendance: () => request('/attendance/today/count'),
  getMemberAttendance: (id, params = {}) => {
    const qs = new URLSearchParams();
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
    return request(`/attendance/member/${id}?${qs}`);
  },

  // Payments
  getPayments: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.payment_method) qs.set('payment_method', params.payment_method);
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
    if (params.fee_month) qs.set('fee_month', params.fee_month);
    if (params.member_id) qs.set('member_id', params.member_id);
    if (params.page) qs.set('page', params.page);
    return request(`/payments?${qs}`);
  },
  createPayment: (data) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),
  getCollection: (month) => request(`/payments/collection${month ? `?month=${month}` : ''}`),
  getMemberPayments: (id) => request(`/payments/member/${id}`),

  // Reports
  getMonthlyFeeReport: (month) => request(`/reports/monthly-fees?month=${month}`),
  getAttendanceReport: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
    if (params.member_id) qs.set('member_id', params.member_id);
    return request(`/reports/attendance?${qs}`);
  },
  getExpiryReport: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set('status', params.status);
    if (params.days_ahead) qs.set('days_ahead', params.days_ahead);
    return request(`/reports/expiry?${qs}`);
  },
  getCollectionReport: (month) => request(`/reports/collection?month=${month}`),
  getDuesReport: (month) => request(`/reports/dues${month ? `?month=${month}` : ''}`),

  // CSV exports (return blob URLs)
  exportMonthlyFeesCsv: (month) => `${API_BASE}/reports/export/monthly-fees?month=${month}`,
  exportAttendanceCsv: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.date_from) qs.set('date_from', params.date_from);
    if (params.date_to) qs.set('date_to', params.date_to);
    return `${API_BASE}/reports/export/attendance?${qs}`;
  },
  exportCollectionCsv: (month) => `${API_BASE}/reports/export/collection?month=${month}`,
};
