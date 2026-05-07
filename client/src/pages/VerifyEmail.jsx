import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(token ? "verifying" : "idle");
  const [error, setError] = useState("");
  const [resendStatus, setResendStatus] = useState("");

  useEffect(() => {
    if (token && status === "verifying") {
      handleVerify();
    }
  }, [token]);

  const handleVerify = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.auth.verifyEmail(token);
      if (res.error) {
        setError(res.error);
        setStatus("idle");
      } else {
        setStatus("success");
      }
    } catch {
      setError("Failed to verify email");
      setStatus("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!user?.email) {
      setError("Please log in to resend verification");
      return;
    }
    setLoading(true);
    setResendStatus("");
    try {
      const res = await api.auth.resendVerification(user.email);
      if (res.error) {
        setError(res.error);
      } else {
        setResendStatus("Check your inbox for a new link!");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', paddingTop: '4rem' }}>
      <div className="card fade-in" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        {status === "verifying" && (
          <>
            <div className="spinner" style={{ margin: '0 auto 2rem' }}></div>
            <h1 className="page-title">Verifying...</h1>
            <p className="subtitle">Please wait while we confirm your email.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎊</div>
            <h1 className="page-title">Email Verified!</h1>
            <p className="subtitle" style={{ marginBottom: '2rem' }}>
              Your account is now fully active. You can now access all enterprise features.
            </p>
            <Link to="/home" className="btn btn-primary btn-block">Go to Feed</Link>
          </>
        )}

        {status === "idle" && (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📧</div>
            <h1 className="page-title">Verify Email</h1>
            <p className="subtitle" style={{ marginBottom: '2rem' }}>
              {user?.isEmailVerified 
                ? "Your email is already verified!" 
                : "Confirm your email address to secure your account and gain full access."}
            </p>

            <ErrorBanner message={error} onDismiss={() => setError("")} />
            {resendStatus && <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '1rem' }}>{resendStatus}</p>}

            {!user?.isEmailVerified && (
              <button 
                onClick={handleResend} 
                className="btn btn-primary btn-block" 
                disabled={loading}
              >
                {loading ? "Sending..." : "Resend Verification Link"}
              </button>
            )}
            
            <Link to="/home" className="btn btn-secondary btn-block" style={{ marginTop: '1rem' }}>
              Back to Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
