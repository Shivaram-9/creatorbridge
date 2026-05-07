import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";

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
    <div className="container" style={{ maxWidth: '480px', paddingTop: '4rem' }}>
      <div className="card card--auth fade-in">
        <h1 className="page-title" style={{ textAlign: 'center', marginBottom: '1rem' }}>Recovery</h1>
        <p className="subtitle" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Enter your email to receive password reset instructions.
        </p>

        <ErrorBanner message={error} onDismiss={() => setError("")} />
        
        {message ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📩</div>
            <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '2rem' }}>{message}</p>
            <Link to="/login" className="btn btn-secondary btn-block">Back to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>Email Address</label>
              <input
                type="email"
                className="input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <Link to="/login" className="muted" style={{ fontSize: '0.875rem' }}>Back to Login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
