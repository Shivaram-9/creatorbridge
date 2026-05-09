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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* Already logged-in users who already picked a role go home */
  if (user) return <Navigate to="/home" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

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
    <div className="auth-page-bg">
      <div className="auth-card-pro slide-fade-in">
        <div className="auth-logo-wrap">
          <Link to="/" className="logo-main" style={{ fontSize: '2rem' }}>
            CreatorBridge
          </Link>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join the professional collaboration network.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="field-group">
            <label className="field-label" htmlFor="reg-email">Email / Username</label>
            <input
              id="reg-email"
              className="input-pro"
              type="text"
              placeholder="Enter your email or username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              className="input-pro"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="reg-confirm-password">Confirm Password</label>
            <input
              id="reg-confirm-password"
              className="input-pro"
              type="password"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <ErrorBanner message={error} onDismiss={() => setError("")} />
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? "Processing..." : "Create Account"}
            </button>
          </div>
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}

