import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import OfflineBanner from "../components/OfflineBanner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* Already logged-in users who already picked a role go home */
  if (user) return <Navigate to="/" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      /* Register with a default role; the user picks their real role next */
      const result = await register(email.trim(), password, "influencer");
      if (!result?.ok) {
        setError(result?.error || "Something went wrong");
      } else {
        /* Successful signup → go to role selection */
        navigate("/select-role", { replace: true });
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
            Create account
          </h1>
          <p className="subtitle">Join CreatorBridge and start connecting.</p>
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                className="input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <ErrorBanner message={error} onDismiss={() => setError("")} />
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Creating…" : "Create account"}
            </button>
          </form>
          <p className="muted" style={{ marginTop: "1rem", textAlign: "center" }}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </>
  );
}
