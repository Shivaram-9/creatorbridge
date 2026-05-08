import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { user, login } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(token ? "verifying-link" : "idle");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Resend form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP state
  const [otp, setOtp] = useState("");

  useEffect(() => {
    if (token && step === "verifying-link") {
      handleLinkVerify();
    }
  }, [token]);

  const handleLinkVerify = async () => {
    setLoading(true);
    try {
      const res = await api.auth.verifyEmail(token);
      if (res.error) {
        setError(res.error);
        setStep("idle");
      } else {
        setStep("success");
      }
    } catch {
      setError("Failed to verify email");
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const startResendFlow = () => {
    setStep("resend-form");
  };

  const handleResendSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // First, confirm credentials to ensure it's the real user
      const loginRes = await api.auth.login({ email, password });
      if (loginRes.error) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }

      const res = await api.auth.sendOtp(email);
      if (res.error) {
        setError(res.error);
      } else {
        setStep("otp-input");
        setSuccess("Verification code sent to your email!");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.auth.verifyOtp(email || user?.email, otp);
      if (res.error) {
        setError(res.error);
      } else {
        setStep("success");
      }
    } catch {
      setError("Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '500px', paddingTop: '4rem' }}>
      <div className="card fade-in" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
        
        {step === "verifying-link" && (
          <>
            <div className="spinner" style={{ margin: '0 auto 2rem' }}></div>
            <h1 className="page-title">Verifying Link...</h1>
            <p className="subtitle">Confirming your account, please wait.</p>
          </>
        )}

        {step === "success" && (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>✅</div>
            <h1 className="page-title">Account Verified!</h1>
            <p className="subtitle" style={{ marginBottom: '2rem' }}>
              Your email has been verified successfully.
            </p>
            <button 
              onClick={() => navigate("/home")} 
              className="btn btn-primary btn-block"
            >
              Continue to App
            </button>
          </>
        )}

        {step === "idle" && (
          <>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📧</div>
            <h1 className="page-title">Verify Your Email</h1>
            <p className="subtitle" style={{ marginBottom: '2rem' }}>
              Please check your inbox for the verification link or use a code.
            </p>
            <ErrorBanner message={error} onDismiss={() => setError("")} />
            <button onClick={startResendFlow} className="btn btn-primary btn-block">
              Resend Verification
            </button>
            <Link to="/home" className="btn btn-secondary btn-block" style={{ marginTop: '1rem' }}>
              Back to Home
            </Link>
          </>
        )}

        {step === "resend-form" && (
          <>
            <h1 className="page-title" style={{ fontSize: '1.25rem' }}>Re-confirm Identity</h1>
            <p className="subtitle" style={{ marginBottom: '1.5rem' }}>Confirm your credentials to receive a new code.</p>
            <ErrorBanner message={error} onDismiss={() => setError("")} />
            <form onSubmit={handleResendSubmit}>
              <div className="field" style={{ textAlign: 'left' }}>
                <label>Email</label>
                <input 
                  type="email" className="input" required 
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="field" style={{ textAlign: 'left' }}>
                <label>Password</label>
                <input 
                  type="password" className="input" required 
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="field" style={{ textAlign: 'left' }}>
                <label>Confirm Password</label>
                <input 
                  type="password" className="input" required 
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? "Processing..." : "Send Verification Code"}
              </button>
              <button 
                type="button" onClick={() => setStep("idle")} 
                className="btn btn-secondary btn-block" style={{ marginTop: '1rem' }}
              >
                Cancel
              </button>
            </form>
          </>
        )}

        {step === "otp-input" && (
          <>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📩</div>
            <h1 className="page-title">Enter Code</h1>
            <p className="subtitle">Enter the 6-digit code sent to your email.</p>
            <ErrorBanner message={error} onDismiss={() => setError("")} />
            {success && <p style={{ color: 'var(--success)', fontWeight: 600, marginBottom: '1rem' }}>{success}</p>}
            <form onSubmit={handleOtpVerify}>
              <div className="field">
                <input 
                  type="text" className="input" placeholder="000000" 
                  maxLength={6} required style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }}
                  value={otp} onChange={(e) => setOtp(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? "Verifying..." : "Verify Code"}
              </button>
              <button 
                type="button" onClick={() => setStep("resend-form")} 
                className="btn btn-secondary btn-block" style={{ marginTop: '1rem' }}
              >
                Resend Again
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}
