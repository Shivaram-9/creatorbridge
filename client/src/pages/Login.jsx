import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await api.auth.login({ email, password });
      if (data.error) {
        setError(data.error);
      } else {
        login(data.user, data.token);
        navigate("/home");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-premium fade-up">
        <div className="auth-hero-icon-container">
          <svg style={{ width: '42px', height: '42px' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17 9V7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7V9H17Z" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <rect x="5" y="9" width="14" height="11" rx="4" fill="#6366F1"/>
            <circle cx="12" cy="14.5" r="1.5" fill="white"/>
          </svg>
        </div>

        <h1 className="auth-title-pro">Welcome Back</h1>
        <p className="auth-subtitle-pro">Glad to see you again!<br />Sign in to continue</p>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <form onSubmit={handleSubmit} className="w-full">
          <div className="input-group-pro">
            <input
              type="email"
              className="input-premium"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group-pro">
            <input
              type={showPassword ? "text" : "password"}
              className="input-premium"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 p-1"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L5.136 5.136m10.142 10.142L20 20" /></svg>
              ) : (
                <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 mb-6">
            <label className="flex items-center text-[12px] text-slate-500 cursor-pointer select-none">
              <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-2" />
              Remember me
            </label>
            <Link to="/forgot-password" size="sm" className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700">
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn-gradient-pro" disabled={loading}>
            <span>{loading ? "Signing in..." : "Login"}</span>
            <div className="btn-circle-arrow">
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" />
              </svg>
            </div>
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-[11px]"><span className="px-2 bg-white text-slate-400 font-bold uppercase tracking-wider">or</span></div>
        </div>

        <button onClick={() => navigate("/register")} className="w-full h-12 rounded-2xl border-1.5 border-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all active:scale-[0.98]">
          Create an account
        </button>

        <footer className="mt-8 text-center">
          <p className="text-[10px] text-slate-400 leading-relaxed max-w-[200px] mx-auto">
            By continuing, you agree to our<br />
            <Link to="/terms" className="text-indigo-600 font-semibold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-indigo-600 font-semibold hover:underline">Privacy Policy</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
