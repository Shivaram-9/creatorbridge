import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import OfflineBanner from "../components/OfflineBanner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function Login() {
  const { user, login } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const result = await login(email.trim(), password);
      if (!result?.ok) {
        setError(result?.error || "Something went wrong");
      }
    } catch {
      setError("Something went wrong");
    } finally {
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
          <p className="muted" style={{ marginTop: "1rem", textAlign: "center" }}>
            No account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </>
  );
}
