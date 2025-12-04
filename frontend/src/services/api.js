import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  login: (credentials) => apiClient.post("/auth/login", credentials),
  loginCitizen: (credentials) =>
    apiClient.post("/auth/login/citizen", credentials),
  loginPolice: (credentials) =>
    apiClient.post("/auth/login/police", credentials),
  loginAdmin: (credentials) => apiClient.post("/auth/login/admin", credentials),
  register: (userData) => apiClient.post("/auth/register", userData),
  registerPolice: (userData) =>
    apiClient.post("/auth/register/police", userData),
  verify: (code) => apiClient.post("/auth/verify", { code }),
  getUser: () => apiClient.get("/auth/user"),
};

// Reports APIs
export const reportsAPI = {
  submit: (reportData) => apiClient.post("/reports/submit", reportData),
  getAll: (filters) => apiClient.get("/reports/list", { params: filters }),
  getById: (id) => apiClient.get(`/reports/${id}`),
  update: (id, data) => apiClient.put(`/reports/${id}`, data),
  searchByReference: (refNum) => apiClient.get(`/reports/search/${refNum}`),
  getStats: () => apiClient.get("/reports/stats"),
  // Trust-related endpoints
  markAsFake: (id) => apiClient.post(`/reports/${id}/mark-fake`),
  verify: (id) => apiClient.post(`/reports/${id}/verify`),
  getLowTrustQueue: () => apiClient.get("/reports/queue/low-trust"),
  approveDelayed: (id) => apiClient.post(`/reports/${id}/approve-delayed`),
};

// Clustering APIs
export const clustersAPI = {
  getLatest: () => apiClient.get("/clusters/get"),
  refresh: () => apiClient.post("/clusters/refresh"),
  getParams: () => apiClient.get("/clusters/params"),
};

// Chat APIs
export const chatAPI = {
  start: (reportId) => apiClient.post("/chats/start", { reportId }),
  send: (chatId, text) => apiClient.post("/chats/send", { chatId, text }),
  getMessages: (chatId) => apiClient.get(`/chats/${chatId}/messages`),
  getAll: () => apiClient.get("/chats/list"),
  close: (chatId) => apiClient.put(`/chats/${chatId}/close`),
};

// Alerts APIs
export const alertsAPI = {
  broadcast: (alertData) => apiClient.post("/alerts/broadcast", alertData),
  getAll: () => apiClient.get("/alerts/list"),
};

// Admin APIs
export const adminAPI = {
  getUsers: (filters) =>
    apiClient.get("/admin/users/list", { params: filters }),
  getUser: (userId) => apiClient.get(`/admin/users/${userId}`),
  updateUser: (userId, data) => apiClient.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),
  getStats: () => apiClient.get("/admin/stats"),
  getPendingRoles: () => apiClient.get("/admin/users/pending-roles"),
  getConfig: () => apiClient.get("/admin/config"),
  updateConfig: (config) => apiClient.put("/admin/config", config),
  // Abuse Analytics APIs
  getAbuseAnalytics: () => apiClient.get("/admin/abuse/analytics"),
  getLowTrustDevices: (limit = 20) =>
    apiClient.get("/admin/abuse/low-trust-devices", { params: { limit } }),
  getFlaggedReports: (limit = 50) =>
    apiClient.get("/admin/abuse/flagged-reports", { params: { limit } }),
  cleanupOldData: () => apiClient.post("/admin/abuse/cleanup"),
  getDeviceTrustInfo: (fingerprintPrefix) =>
    apiClient.get(`/admin/trust/device/${fingerprintPrefix}`),
};

// Heatmap APIs
export const heatmapAPI = {
  getData: () => apiClient.get("/heatmap/data"),
};

export default apiClient;
