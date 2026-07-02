import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import toast from "react-hot-toast";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, socialSignIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!email || !password) {
      toast.error("Please fill in all fields");
      setLoading(false);
      return;
    }
    try {
      const result = await login(email, password);
      if (result.ok) {
        toast.success("Welcome back!");
        navigate("/home");
      } else {
        const errorMsg = result.error || "Invalid email or password";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = "Something went wrong. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider) => {
    setLoading(true);
    setError("");
    try {
      const result = await socialSignIn(provider);
      if (result.ok) {
        navigate("/home");
      } else {
        setError(result.error || "Social sign-in failed");
      }
    } catch (err) {
      setError("An unexpected error occurred during social sign-in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-stabilized-wrapper">
      {/* 3D Floating Bubbles & Characters Background */}
      <div className="auth-3d-bg">
        <div className="bubble bubble-1">P</div>
        <div className="bubble bubble-2">✨</div>
        <div className="bubble bubble-3">🚀</div>
        <div className="bubble bubble-4">C</div>
        <div className="bubble bubble-5">🎯</div>
        <div className="bubble bubble-6">B</div>
        <div className="bubble bubble-7">💡</div>
        <div className="bubble bubble-8">⭐</div>
      </div>

      <div className="auth-card-stabilized fade-up" style={{ maxWidth: '440px' }}>
        <div className="auth-icon-box">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 9V7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7V9H17Z" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="5" y="9" width="14" height="11" rx="4" fill="#6366F1"/>
            <circle cx="12" cy="14.5" r="1.5" fill="white"/>
          </svg>
        </div>

        <div className="auth-header-text">
          <h1>Welcome Back</h1>
          <p>Glad to see you again! Sign in to continue</p>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <form onSubmit={handleSubmit} className="auth-form-stabilized">
          <div className="auth-input-container">
            <input
              type="email"
              className="auth-input-field"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-container">
            <input
              type={showPassword ? "text" : "password"}
              className="auth-input-field"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L5.136 5.136m10.142 10.142L20 20" /></svg>
              ) : (
                <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>

          <div className="auth-actions-row">
            <label className="auth-checkbox-label">
              <input type="checkbox" className="auth-checkbox-input" />
              Remember me
            </label>
            <Link to="/forgot-password" className="auth-forgot-link">
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="w-full h-[52px] bg-slate-900 text-white rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 mt-2 shadow-md hover:translate-y-[-1px] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all" 
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12H19M19 12L12 5M19 12L12 19" />
            </svg>
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-social-stack">
          <button type="button" className="auth-social-btn" onClick={() => handleSocialSignIn("google")} disabled={loading}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
          <button type="button" className="auth-social-btn" onClick={() => handleSocialSignIn("apple")} disabled={loading}>
            <svg viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-31.4-57.3-114.6-1.7-123.1zM281.2 49.3c18.4-22.3 10.4-44.5 10.4-44.5s-23.4 1.5-41.8 23.9c-16.1 19.5-10.3 42-10.3 42s24.4 2 41.7-21.4z"/></svg>
            Sign in with Apple
          </button>
        </div>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Don't have an account? <Link to="/register" className="auth-footer-link">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
