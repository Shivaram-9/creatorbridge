import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import PhoneLogin from "../components/PhoneLogin.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fromPath = location.state?.from?.pathname;
  const from = fromPath && fromPath !== "/" ? fromPath : "/home";

  const [loginMethod, setLoginMethod] = useState("email");
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
        setSubmitting(false);
        navigate(from, { replace: true });
      } else {
        setError(result?.error || "Invalid credentials");
        setSubmitting(false);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card-main fade-up-entry">
        <Link to="/" className="auth-card-logo">
          CreatorBridge
        </Link>
        
        <h1 className="auth-card-title">Welcome Back</h1>
        <p className="auth-card-subtitle">Sign in to manage your collaborations.</p>
        
        {loginMethod === "email" ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-pro" htmlFor="email">Email Address</label>
              <input
                id="email"
                className="input-field-pro"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label-pro" htmlFor="password">Password</label>
              <input
                id="password"
                className="input-field-pro"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="text-left">
              <Link to="/forgot-password" style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600 }}>
                Forgot Password?
              </Link>
            </div>

            <ErrorBanner message={error} onDismiss={() => setError("")} />
            
            <button type="submit" className="btn-primary-pro" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <PhoneLogin />
        )}

        <div className="mt-4">
          <button 
            type="button" 
            onClick={() => setLoginMethod(loginMethod === "email" ? "phone" : "email")}
            className="w-full text-sm font-semibold py-2 px-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            {loginMethod === "email" ? "Login with Phone Instead" : "Login with Email Instead"}
          </button>
        </div>

        <p className="mt-6 text-sm text-slate-600">
          Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
}
