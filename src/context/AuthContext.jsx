import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, setAccessToken, getAccessToken } from "../lib/api";
import { API_BASE } from "../lib/config";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getAccessToken());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applyToken = useCallback((t) => {
    setAccessToken(t);
    setToken(t);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (r.ok) {
        const { data } = await r.json();
        applyToken(data?.token || null);
        return data?.token || null;
      }
    } catch (e) {
      // swallow network/CORS errors to avoid unhandled rejection on mount
    }
    // Do not clear existing token here; caller will decide
    return null;
  }, [applyToken]);

  const fetchMe = useCallback(async (t) => {
    if (!t) {
      setUser(null);
      return null;
    }
    try {
      const res = await api.get("/api/v1/auth/me");
      const user = res.data?.data?.user || null;
      setUser(user);
      return user;
    } catch (err) {
      // Only clear user if it's a real auth error (401), not network errors
      // This prevents clearing user state during temporary network issues
      if (err.response?.status === 401) {
        setUser(null);
      }
      // For other errors (network, 500, etc.), keep existing user state
      // This prevents logout during temporary issues
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        // 1) Try current token first (keeps session on reload)
        const existing = getAccessToken();
        if (existing) {
          const u = await fetchMe(existing);
          if (u) return;
        }
        // 2) Try refresh cookie flow
        const t = await refresh();
        await fetchMe(t);
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh, fetchMe]);

  const login = useCallback(
    async (email, password) => {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        try {
          const body = await res.json();
          const msg =
            body?.message || body?.error || res.statusText || "Login failed";
          const err = new Error(msg);
          err.status = res.status;
          throw err;
        } catch (e) {
          const err = new Error(res.statusText || "Login failed");
          err.status = res.status;
          throw err;
        }
      }
      const { data } = await res.json();
      applyToken(data?.token || null);
      await fetchMe(data?.token || null);
      return data;
    },
    [applyToken, fetchMe]
  );

  const signup = useCallback(
    async (payload) => {
      const res = await fetch(`${API_BASE}/api/v1/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        try {
          const body = await res.json();
          const msg =
            body?.message || body?.error || res.statusText || "Signup failed";
          const err = new Error(msg);
          err.status = res.status;
          throw err;
        } catch (e) {
          // If parsing JSON fails, fallback to status text
          const err = new Error(res.statusText || "Signup failed");
          err.status = res.status;
          throw err;
        }
      }
      const { data } = await res.json();
      applyToken(data?.token || null);
      await fetchMe(data?.token || null);
      return data;
    },
    [applyToken, fetchMe]
  );

  const logout = useCallback(async () => {
    await fetch(`${API_BASE}/api/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    applyToken(null);
    setUser(null);
  }, [applyToken]);

  const loginWithGoogle = useCallback(
    async (idToken) => {
      const res = await fetch(`${API_BASE}/api/v1/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) throw new Error("Google login failed");
      const { data } = await res.json();
      applyToken(data?.token || null);
      await fetchMe(data?.token || null);
      return data;
    },
    [applyToken, fetchMe]
  );

  const loginWithLinkedIn = useCallback(
    async (code, redirectUri) => {
      const res = await fetch(`${API_BASE}/api/v1/auth/linkedin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, redirectUri }),
      });
      if (!res.ok) throw new Error("LinkedIn login failed");
      const { data } = await res.json();
      applyToken(data?.token || null);
      await fetchMe(data?.token || null);
      return data;
    },
    [applyToken, fetchMe]
  );

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (token) {
      await fetchMe(token);
    }
  }, [fetchMe]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      signup,
      logout,
      refresh,
      refreshUser,
      loginWithGoogle,
      loginWithLinkedIn,
    }),
    [
      token,
      user,
      loading,
      login,
      signup,
      logout,
      refresh,
      refreshUser,
      loginWithGoogle,
      loginWithLinkedIn,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
