import { useState, useRef } from "react";
import { auth } from "../config/firebase";
import ErrorBanner from "./ErrorBanner.jsx";

export default function OTPInput({ phoneNumber, onSuccess, onResend }) {
  // Firebase uses 6-digit OTPs
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = [
    useRef(null), useRef(null), useRef(null), 
    useRef(null), useRef(null), useRef(null)
  ];

  const handleChange = (index, e) => {
    const value = e.target.value;
    if (/[^0-9]/.test(value)) return; // Only allow digits

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only the last entered digit
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    
    if (enteredOtp.length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Use Firebase confirmation result from window
      const result = await window.confirmationResult.confirm(enteredOtp);
      onSuccess(result.user);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/invalid-verification-code') {
        setError("Invalid OTP. Please check and try again.");
      } else if (err.code === 'auth/code-expired') {
        setError("OTP has expired. Please resend the OTP.");
      } else {
        setError("Failed to verify OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ marginBottom: "1.5rem", color: "var(--muted, #8b9cb3)" }}>
        Enter OTP sent to +91 {phoneNumber}
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1.5rem" }}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={inputRefs[index]}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="input"
              style={{
                width: "2.5rem",
                height: "3.5rem",
                textAlign: "center",
                fontSize: "1.5rem",
                padding: "0",
                borderRadius: "12px"
              }}
              required
            />
          ))}
        </div>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "Verifying..." : "Verify OTP"}
        </button>

        <div style={{ marginTop: "1rem" }}>
          <button 
            type="button" 
            onClick={onResend}
            disabled={loading}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--primary, #5b8cff)",
              cursor: "pointer",
              fontSize: "0.95rem",
              textDecoration: "underline"
            }}
          >
            Didn't receive code? Resend
          </button>
        </div>
      </form>
    </div>
  );
}
