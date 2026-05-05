import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../config/firebase";
import { useNavigate } from "react-router-dom";
import { api, setToken, getToken, registerAuthFailureHandler } from "../services/api.js";
import { connectSocket, disconnectSocket } from "../services/socket.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userPosts, setUserPosts] = useState([]);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setUserPosts([]);
    disconnectSocket();
    navigate("/login", { replace: true });
  }, [navigate]);

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
    setToken(token);
    const me = await api.users.me();
    if (me?.error) {
      setToken(null);
      setUser(null);
      disconnectSocket();
    } else {
      setUser(me);
      setUserPosts(Array.isArray(me.portfolio) ? me.portfolio : []);
      connectSocket();
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email, password) => {
    try {
      const data = await api.auth.login({ email, password });
      if (data?.error || !data?.token) {
        const message = typeof data?.error === "string" ? data.error : "";
        return { ok: false, error: message || "Invalid email or password" };
      }
      const { token, user: u } = data;
      setToken(token);
      setUser(u);
      setUserPosts(Array.isArray(u.portfolio) ? u.portfolio : []);
      connectSocket();
      return { ok: true, user: u };
    } catch (err) {
      console.error("AuthContext Login Error:", err);
      return { ok: false, error: "Network error. Please try again later." };
    }
  }, []);

  const register = useCallback(async (email, password, role) => {
    const data = await api.auth.register({ email, password, role });
    if (data?.error || !data?.token) {
      const message = typeof data?.error === "string" ? data.error : "";
      return { ok: false, error: message || "Something went wrong" };
    }
    const { token, user: u } = data;
    setToken(token);
    setUser(u);
    setUserPosts([]);
    connectSocket();
    return { ok: true, user: u };
  }, []);

  const addPost = useCallback((post) => {
    setUserPosts(prev => [post, ...prev]);
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
      userPosts,
      setUserPosts,
      addPost,
    }),
    [user, loading, login, register, logout, refreshUser, userPosts, addPost]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
