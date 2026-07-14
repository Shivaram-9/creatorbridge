import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "../config/firebase";
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
      if (me.error.includes("expired") || me.error.includes("unauthorized") || me.error.includes("401") || me.error === "Session expired — please sign in again") {
        setToken(null);
        setUser(null);
        disconnectSocket();
      } else {
        // Just leave the user in the loading state or fallback, but don't clear the token
        console.warn("Failed to refresh user, but keeping token:", me.error);
      }
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
    try {
      const data = await api.auth.login({ email, password });
      if (data?.error || !data?.token) {
        const message = typeof data?.error === "string" ? data.error : "";
        return { ok: false, error: message || "Invalid email or password" };
      }
      const { token, user: u } = data;
      setToken(token);
      setUser(u);
      connectSocket();
      return { ok: true, user: u };
    } catch (err) {
      console.error("AuthContext Login Error:", err);
      return { ok: false, error: "Network error. Please try again later." };
    }
  }, []);

  const register = useCallback(async (name, email, password, role) => {
    const data = await api.auth.register({ name, email, password, role });
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

  const socialSignIn = useCallback(async (providerName) => {
    try {
      let provider;
      if (providerName === "google") {
        const { GoogleAuthProvider } = await import("firebase/auth");
        provider = new GoogleAuthProvider();
      } else if (providerName === "apple") {
        const { OAuthProvider } = await import("firebase/auth");
        provider = new OAuthProvider("apple.com");
      } else {
        return { ok: false, error: "Unsupported social provider" };
      }

      const { signInWithPopup } = await import("firebase/auth");
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      if (!firebaseUser.email) {
        return { ok: false, error: "Email address not found in social account" };
      }

      const data = await api.auth.socialLogin({
        email: firebaseUser.email,
        name: firebaseUser.displayName || "",
        uid: firebaseUser.uid,
        provider: providerName
      });

      if (data?.error || !data?.token) {
        return { ok: false, error: data?.error || "Failed to complete sign-in with server" };
      }

      const { token, user: u } = data;
      setToken(token);
      setUser(u);
      connectSocket();
      return { ok: true, user: u };
    } catch (err) {
      console.error("AuthContext Social Login Error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        return { ok: false, error: "Sign-in popup closed before completion." };
      }
      if (err.code === "auth/configuration-not-found") {
        return { 
          ok: false, 
          error: "Google/Apple Sign-In is not enabled yet in your Firebase Console. Please enable Google and Apple under Authentication -> Sign-in Method in your Firebase Console (Pactogram-2e1ab)." 
        };
      }
      if (err.code === "auth/unauthorized-domain") {
        return { 
          ok: false, 
          error: `This domain is not authorized for OAuth in Firebase. Please add '${window.location.hostname}' under Authentication -> Settings -> Authorized Domains in your Firebase Console.` 
        };
      }
      return { ok: false, error: err.message || "Social sign-in failed." };
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      socialSignIn,
      logout,
      refreshUser,
      setUser,
    }),
    [user, loading, login, register, socialSignIn, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
