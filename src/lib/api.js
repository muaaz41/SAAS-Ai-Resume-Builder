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
let tokenRefreshTimer = null;

// Proactive token refresh - refresh before expiration
const scheduleTokenRefresh = () => {
  // Clear existing timer
  if (tokenRefreshTimer) {
    clearTimeout(tokenRefreshTimer);
  }

  // Refresh token 2 minutes before expiration (15min - 2min = 13min)
  // This prevents expiration during long resume creation sessions
  tokenRefreshTimer = setTimeout(async () => {
    try {
      const refreshUrl = API_BASE
        ? `${API_BASE}/api/v1/auth/refresh`
        : "/api/v1/auth/refresh";

      const r = await fetch(refreshUrl, {
        method: "POST",
        credentials: "include",
      });

      if (r.ok) {
        const { data } = await r.json();
        const newToken = data?.accessToken || data?.token;
        if (newToken) {
          accessToken = newToken;
          localStorage.setItem("accessToken", newToken);
          // Schedule next refresh
          scheduleTokenRefresh();
        }
      }
    } catch (e) {
      // Silently fail - will retry on next API call
      console.warn("Proactive token refresh failed, will retry on next request");
    }
  }, 13 * 60 * 1000); // 13 minutes
};

export const setAccessToken = (t) => {
  accessToken = t;
  if (t) {
    localStorage.setItem("accessToken", t);
    // Schedule proactive refresh when token is set
    scheduleTokenRefresh();
  } else {
    localStorage.removeItem("accessToken");
    // Clear refresh timer if token is removed
    if (tokenRefreshTimer) {
      clearTimeout(tokenRefreshTimer);
      tokenRefreshTimer = null;
    }
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
let refreshFailed = false;

// Start proactive refresh if token exists
if (getAccessToken()) {
  scheduleTokenRefresh();
}

api.interceptors.response.use(
  (res) => {
    // Reset refresh failed flag on successful response
    if (res.status >= 200 && res.status < 300) {
      refreshFailed = false;
    }
    return res;
  },
  async (error) => {
    const original = error.config || {};

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !original._retry) {
      // Don't redirect if we're already in a failed state - let user continue working
      if (refreshFailed) {
        // Return error but don't redirect - let the component handle it
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Wait for refresh to complete
        await new Promise((resolve) => pendingResolves.push(resolve));
      } else {
        isRefreshing = true;
        try {
          // Try to refresh token
          const refreshUrl = API_BASE
            ? `${API_BASE}/api/v1/auth/refresh`
            : "/api/v1/auth/refresh";

          const r = await fetch(refreshUrl, {
            method: "POST",
            credentials: "include",
          });

          if (r.ok) {
            const { data } = await r.json();
            const newToken = data?.accessToken || data?.token;
            if (newToken) {
              accessToken = newToken;
              localStorage.setItem("accessToken", newToken);
              refreshFailed = false;
              // Schedule next proactive refresh
              scheduleTokenRefresh();
            } else {
              refreshFailed = true;
            }
          } else {
            // Refresh failed - but don't immediately redirect
            // Set flag so we don't keep retrying
            refreshFailed = true;
            // Only redirect if not in builder/resume creation flow
            const currentPath = window.location.pathname;
            const isInBuilder = currentPath.includes("/builder") || currentPath.includes("/resume");
            
            if (!isInBuilder) {
              // Only redirect if not actively creating resume
              setAccessToken(null);
              localStorage.removeItem("user");
              window.location.href = "/signin";
            }
            return Promise.reject(error);
          }
        } catch (refreshError) {
          // Network error or other issue - don't logout immediately
          // Set flag to prevent infinite retries
          refreshFailed = true;
          
          // Only redirect if not in builder
          const currentPath = window.location.pathname;
          const isInBuilder = currentPath.includes("/builder") || currentPath.includes("/resume");
          
          if (!isInBuilder) {
            setAccessToken(null);
            localStorage.removeItem("user");
            window.location.href = "/signin";
          }
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
          pendingResolves.forEach((fn) => fn());
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
