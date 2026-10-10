/**
 * services/api.js
 * Centralized Axios client.
 * All API modules import this instance — base URL and token injection
 * happen in one place.
 *
 * Install axios first:  npm install axios  (inside client/)
 * TODO: install axios before implementing feature code.
 */

// Placeholder export so the module graph is valid before axios is installed.
// Replace with the real implementation below once axios is added.

/*
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global 401 handler — clear stale token and redirect to /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
*/

// Temporary stub
const api = {};
export default api;
