import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setToken, getToken, registerAuthFailureHandler } from "../services/api.js";
import { connectSocket, disconnectSocket } from "../services/socket.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    disconnectSocket();
    navigate("/login", { replace: true });
  }, [navigate]);

  /* Register the global 401 handler so api.js can trigger logout */
  useEffect(() => {
    registerAuthFailureHandler(logout);
    return () => registerAuthFailureHandler(null);
  }, [logout]);

  const refreshUser = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    /* Ensure the token is in localStorage so request() picks it up */
    setToken(token);
    const me = await api.users.me();
    if (me?.error) {
      setToken(null);
      setUser(null);
      disconnectSocket();
    } else {
      setUser(me);
      connectSocket();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    const data = await api.auth.login({ email, password });
    if (data?.error || !data?.token) {
      const message = typeof data?.error === "string" ? data.error : "";
      return { ok: false, error: message || "Something went wrong" };
    }
    const { token, user: u } = data;
    setToken(token);
    setUser(u);
    connectSocket();
    return { ok: true, user: u };
  }, []);

  const register = useCallback(async (email, password, role) => {
    const data = await api.auth.register({ email, password, role });
    if (data?.error) {
      const message = typeof data.error === "string" ? data.error : "";
      return { ok: false, error: message || "Something went wrong" };
    }
    if (!data?.token) {
      const message = typeof data?.error === "string" ? data.error : "";
      return { ok: false, error: message || "Something went wrong" };
    }
    const { token, user: u } = data;
    setToken(token);
    setUser(u);
    connectSocket();
    return { ok: true, user: u };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      setUser,
    }),
    [user, loading, login, register, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
