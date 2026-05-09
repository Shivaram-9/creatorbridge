import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import OfflineBanner from "../components/OfflineBanner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import PhoneLogin from "../components/PhoneLogin.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fromPath = location.state?.from?.pathname;
  const from = fromPath && fromPath !== "/" ? fromPath : "/home";

  const [loginMethod, setLoginMethod] = useState("email"); // "email" or "phone"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    
    try {
      const result = await login(email.trim(), password);
      
      if (result?.ok) {
        // Success -> stop loading and navigate
        setSubmitting(false);
        navigate(from, { replace: true });
      } else {
        // Error -> show message and stop loading
        setError(result?.error || "Invalid credentials");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page-bg">
      <div className="auth-card-pro slide-fade-in">
        <div className="auth-logo-wrap">
          <Link to="/" className="logo-main" style={{ fontSize: '2rem' }}>
            CreatorBridge
          </Link>
        </div>

        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to manage your collaborations.</p>
        
        {loginMethod === "email" ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="field-group">
              <label className="field-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                className="input-pro"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field-group">
              <label className="field-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="input-pro"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 600 }}>
                Forgot Password?
              </Link>
            </div>

            <ErrorBanner message={error} onDismiss={() => setError("")} />
            
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        ) : (
          <PhoneLogin />
        )}

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button 
            type="button" 
            onClick={() => setLoginMethod(loginMethod === "email" ? "phone" : "email")}
            className="w-full text-center text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
          >
            {loginMethod === "email" ? "Login with Phone Instead" : "Login with Email Instead"}
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
}

