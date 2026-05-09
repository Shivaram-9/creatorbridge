import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import "./Auth.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await api.auth.forgotPassword(email);
      if (res.error) {
        setError(res.error);
      } else {
        setMessage(res.message || "Instructions sent! Please check your email.");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-stabilized-wrapper">
      <div className="auth-card-stabilized fade-up">
        <div className="auth-icon-box">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>

        <div className="auth-header-text">
          <h1>Recovery</h1>
          <p>Enter your email to receive password reset instructions</p>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError("")} />
        
        {message ? (
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>📩</div>
            <p style={{ color: '#10b981', fontWeight: 700, marginBottom: '2rem', fontSize: '15px' }}>{message}</p>
            <Link to="/login" className="auth-social-btn" style={{ textDecoration: 'none' }}>Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form-stabilized">
            <div className="auth-input-container">
              <input
                type="email"
                className="auth-input-field"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
              />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" />
              </svg>
            </button>
            <div className="auth-footer" style={{ marginTop: '24px' }}>
              <Link to="/login" className="auth-footer-link" style={{ fontSize: '14px' }}>Back to Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

