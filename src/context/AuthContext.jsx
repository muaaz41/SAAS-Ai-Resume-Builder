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
    applyToken(null);
    return null;
  }, [applyToken]);

  const fetchMe = useCallback(async (t) => {
    if (!t) {
      setUser(null);
      return null;
    }
    try {
      const res = await api.get("/api/v1/auth/me");
      setUser(res.data?.data?.user || null);
      return res.data?.data?.user || null;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
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
      if (!res.ok) throw new Error("Login failed");
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
      if (!res.ok) throw new Error("Signup failed");
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

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      signup,
      logout,
      refresh,
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
