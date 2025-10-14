import axios from "axios";
import { API_BASE } from "./config.js";

// Create axios instance with proper configuration
export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Important for cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Token management
let accessToken = null;
export const setAccessToken = (t) => {
  accessToken = t;
  if (t) {
    localStorage.setItem("accessToken", t);
  } else {
    localStorage.removeItem("accessToken");
  }
};

export const getAccessToken = () => {
  if (!accessToken) {
    accessToken = localStorage.getItem("accessToken");
  }
  return accessToken;
};

// Initialize token from localStorage on load
accessToken = localStorage.getItem("accessToken");

// Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token refresh on 401 errors
let isRefreshing = false;
let pendingResolves = [];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        // Wait for refresh to complete
        await new Promise((resolve) => pendingResolves.push(resolve));
      } else {
        isRefreshing = true;
        try {
          // Try to refresh token
          const refreshUrl = API_BASE
            ? `${API_BASE}/auth/refresh`
            : "/api/v1/auth/refresh";

          const r = await fetch(refreshUrl, {
            method: "POST",
            credentials: "include",
          });

          if (r.ok) {
            const { data } = await r.json();
            const newToken = data?.accessToken || data?.token;
            setAccessToken(newToken);

            // Resolve all pending requests
            pendingResolves.forEach((fn) => fn());
          } else {
            // Refresh failed, logout user
            setAccessToken(null);
            localStorage.removeItem("user");
            window.location.href = "/signin";
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // Refresh failed, logout user
          setAccessToken(null);
          localStorage.removeItem("user");
          window.location.href = "/signin";
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
          pendingResolves = [];
        }
      }

      // Retry original request with new token
      original._retry = true;
      const token = getAccessToken();
      if (token) {
        original.headers = {
          ...(original.headers || {}),
          Authorization: `Bearer ${token}`,
        };
      }
      return api(original);
    }

    return Promise.reject(error);
  }
);
