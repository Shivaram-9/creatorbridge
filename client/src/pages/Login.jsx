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
    <>
      <OfflineBanner />
      <div className="container auth-card">
        <div className="card card--auth">
          <h1 className="page-title" style={{ fontSize: "1.5rem" }}>
            Sign in
          </h1>
          <p className="subtitle">Welcome back to CreatorBridge.</p>
          
          {loginMethod === "email" ? (
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  className="input"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <ErrorBanner message={error} onDismiss={() => setError("")} />
              <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
                {submitting ? "Loading..." : "Sign in"}
              </button>
            </form>
          ) : (
            <PhoneLogin />
          )}

          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <button 
              type="button" 
              onClick={() => setLoginMethod(loginMethod === "email" ? "phone" : "email")}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--primary, #3b82f6)",
                cursor: "pointer",
                fontSize: "0.95rem",
                textDecoration: "underline"
              }}
            >
              {loginMethod === "email" ? "Login with Phone Instead" : "Login with Email Instead"}
            </button>
          </div>

          <p className="muted" style={{ marginTop: "1rem", textAlign: "center" }}>
            No account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </>
  );
}
