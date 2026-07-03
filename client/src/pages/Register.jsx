import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import toast from "react-hot-toast";
import "./Auth.css";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register, socialSignIn } = useAuth();
  const navigate = useNavigate();

  const handleSocialSignIn = async (provider) => {
    setLoading(true);
    setError("");
    try {
      const result = await socialSignIn(provider);
      if (result.ok) {
        toast.success("Welcome!");
        navigate("/home");
      } else {
        const errorMsg = result.error || "Social sign-up failed";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = "An unexpected error occurred during social sign-up";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = () => {
    const { password } = formData;
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)
    };
  };

  const reqs = validatePassword();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return setError("Passwords do not match");
    }
    if (!Object.values(reqs).every(Boolean)) {
      toast.error("Please meet all password requirements");
      return setError("Please meet all password requirements");
    }

    setLoading(true);
    setError("");
    try {
      const result = await register(formData.name, formData.email, formData.password);
      if (result.ok) {
        toast.success("Account created successfully!");
        navigate("/select-role");
      } else {
        const errorMsg = result.error || "Something went wrong";
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = "Registration failed. Please try again.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-stabilized-wrapper">
      {/* Floating Animated Text Background */}
      <div className="auth-floating-text-bg">
        <div className="floating-text">Pactogram</div>
      </div>

      <div className="auth-card-stabilized fade-up" style={{ maxWidth: '440px' }}>
        <div className="auth-icon-box" style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.5)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#blue-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="blue-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563EB" />
                <stop offset="100%" stopColor="#1D4ED8" />
              </linearGradient>
            </defs>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <polyline points="16 11 18 13 22 9"></polyline>
          </svg>
        </div>

        <div className="auth-header-text">
          <h1>Create account</h1>
          <p>Join us and get started with your journey</p>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <form onSubmit={handleSubmit} className="auth-form-stabilized">
          <div className="auth-input-container">
            <input
              type="text"
              name="name"
              className="auth-input-field"
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-input-container">
            <input
              type="email"
              name="email"
              className="auth-input-field"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="auth-input-field"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              className="auth-input-field"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-password-reqs">
            <div className={`auth-req-item ${reqs.length ? 'valid' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="premium-check">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>At least 8 characters</span>
            </div>
            <div className={`auth-req-item ${reqs.upper ? 'valid' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="premium-check">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>One uppercase letter</span>
            </div>
            <div className={`auth-req-item ${reqs.lower ? 'valid' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="premium-check">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>One lowercase letter</span>
            </div>
            <div className={`auth-req-item ${reqs.number ? 'valid' : ''}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="premium-check">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span>One number or special character</span>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full h-[52px] bg-slate-900 text-white rounded-xl text-[15px] font-bold flex items-center justify-center gap-2 mt-4 shadow-md hover:translate-y-[-1px] hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all" 
            disabled={loading}
          >
            {loading ? "Creating..." : "Create account"}
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
            Sign up with Google
          </button>
          <button type="button" className="auth-social-btn" onClick={() => handleSocialSignIn("apple")} disabled={loading}>
            <svg viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-31.4-57.3-114.6-1.7-123.1zM281.2 49.3c18.4-22.3 10.4-44.5 10.4-44.5s-23.4 1.5-41.8 23.9c-16.1 19.5-10.3 42-10.3 42s24.4 2 41.7-21.4z"/></svg>
            Sign up with Apple
          </button>
        </div>

        <div className="auth-footer">
          <p className="auth-footer-text">
            Already have an account? <Link to="/login" className="auth-footer-link">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
