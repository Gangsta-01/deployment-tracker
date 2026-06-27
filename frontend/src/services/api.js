import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

export default api;
console.log(process.env.REACT_APP_API_URL);
// Deployments
export const getDeployments = (params) =>
  api.get("/deployments", { params }).then((r) => r.data);

export const getDeployment = (id) =>
  api.get(`/deployments/${id}`).then((r) => r.data);

export const createDeployment = (payload) =>
  api.post("/deployments", payload).then((r) => r.data);

export const updateDeployment = (id, payload) =>
  api.put(`/deployments/${id}`, payload).then((r) => r.data);

export const triggerDeployment = (id) =>
  api.post(`/deployments/${id}/trigger`).then((r) => r.data);

// Dashboard
export const getDashboardStats = () =>
  api.get("/stats/dashboard").then((r) => r.data);

export const getDeploymentHistory = (days = 7) =>
  api.get("/stats/history", { params: { days } }).then((r) => r.data);

// Environments
export const getEnvironments = () =>
  api.get("/environments").then((r) => r.data);

// Services
export const getServices = () =>
  api.get("/services").then((r) => r.data);