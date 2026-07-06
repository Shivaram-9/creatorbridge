import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { CheckCircleIcon } from "../components/Icons.jsx";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError("Password must contain at least one uppercase letter");
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError("Password must contain at least one lowercase letter");
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number");
      return;
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain at least one special character");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.auth.resetPassword(token, password);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', paddingTop: '4rem' }}>
      <div className="card card--auth fade-in">
        <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>Set Password</h1>
        <p className="subtitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Choose a new strong password for your account.
        </p>

        <ErrorBanner message={error} onDismiss={() => setError("")} />
        
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--success)' }}><CheckCircleIcon style={{ width: '3rem', height: '3rem' }} /></div>
            <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '2rem' }}>
              Password updated! Redirecting to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>New Password</label>
              <input
                type="password"
                className="input"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 chars, A-Z, a-z, 0-9, special char"
              />
            </div>
            <div className="field">
              <label>Confirm Password</label>
              <input
                type="password"
                className="input"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
