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
  register: (userData) => apiClient.post("/auth/register", userData),
  verify: (code) => apiClient.post("/auth/verify", { code }),
  getUser: () => apiClient.get("/auth/user"),
};

// Reports APIs
export const reportsAPI = {
  submit: (reportData) => apiClient.post("/reports/submit", reportData),
  getAll: (filters) => apiClient.get("/reports/list", { params: filters }),
  getById: (id) => apiClient.get(`/reports/${id}`),
  update: (id, data) => apiClient.put(`/reports/${id}`, data),
};

// Clustering APIs
export const clustersAPI = {
  getLatest: () => apiClient.get("/clusters/get"),
  refresh: () => apiClient.post("/clusters/refresh"),
};

// Chat APIs
export const chatAPI = {
  start: (reportId) => apiClient.post("/chats/start", { reportId }),
  send: (chatId, message) =>
    apiClient.post("/chats/send", { chatId, text: message }),
  getMessages: (chatId) => apiClient.get(`/chats/${chatId}/messages`),
  getAll: () => apiClient.get("/chats/list"),
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
};

// Heatmap APIs
export const heatmapAPI = {
  getData: () => apiClient.get("/heatmap/data"),
};

export default apiClient;
