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
        {/* Floating Mail Illustration */}
        <div className="auth-hero-icon">
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="70" cy="70" r="70" fill="url(#paint0_radial)" fillOpacity="0.6"/>
            <g>
              <rect x="35" y="45" width="70" height="50" rx="12" fill="white" style={{ filter: 'drop-shadow(0 10px 15px rgba(99, 102, 241, 0.2))' }}/>
              <rect x="35" y="45" width="70" height="50" rx="12" fill="url(#paint1_linear)" fillOpacity="0.1"/>
              <path d="M35 55L70 75L105 55" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
            </g>
            <circle cx="110" cy="40" r="6" fill="#A78BFA" fillOpacity="0.6"/>
            <circle cx="30" cy="80" r="4" fill="#6366F1" fillOpacity="0.4"/>
            <defs>
              <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(70 70) rotate(90) scale(70)">
                <stop stopColor="#6366F1" stopOpacity="0.2"/>
                <stop offset="1" stopColor="#6366F1" stopOpacity="0"/>
              </radialGradient>
              <linearGradient id="paint1_linear" x1="35" y1="45" x2="105" y2="95" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6366F1"/>
                <stop offset="1" stopColor="#A78BFA"/>
              </linearGradient>
            </defs>
          </svg>
        </div>

        <h1 className="auth-title-pro">Welcome Back</h1>
        <p className="auth-subtitle-pro">Glad to see you again!<br />Sign in to continue</p>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <form onSubmit={handleSubmit} className="w-full">
          <div className="input-group-pro">
            <span className="input-icon-left">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </span>
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
            <span className="input-icon-left">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </span>
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
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L5.136 5.136m10.142 10.142L20 20" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between mt-2 mb-8 px-1">
            <label className="flex items-center text-sm text-slate-500 cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mr-2" />
              Remember me
            </label>
            <Link to="/forgot-password" size="sm" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn-gradient-pro"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
            {!loading && (
              <div className="btn-circle-arrow">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            )}
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-slate-400 font-medium">or</span></div>
        </div>

        <Link to="/register" className="btn-outline-pro">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          Create an account
        </Link>

        <footer className="mt-12">
          <div className="flex justify-center mb-6">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L10 9.503l7.834-4.603a1 1 0 011.166 1.63L10.584 12.03a1 1 0 01-1.168 0L1 6.53a1 1 0 011.166-1.63z" clipRule="evenodd" /></svg>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-[280px] mx-auto">
            By continuing, you agree to our<br />
            <Link to="/terms" className="text-indigo-600 font-semibold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-indigo-600 font-semibold hover:underline">Privacy Policy</Link>
          </p>
        </footer>
      </div>
    </div>
  );
}
