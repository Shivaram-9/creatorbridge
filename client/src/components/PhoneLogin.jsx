import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { setToken } from "../services/api.js";
import { auth } from "../config/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import OTPInput from "./OTPInput.jsx";
import ErrorBanner from "./ErrorBanner.jsx";

export default function PhoneLogin() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [step, setStep] = useState(1); // 1: Phone input, 2: OTP input
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (!window.recaptchaVerifier) {
        console.log("INIT RECAPTCHA");

        const verifier = new RecaptchaVerifier(
          auth,
          "recaptcha-container",
          {
            size: "invisible",
            callback: () => {
              console.log("reCAPTCHA solved");
            }
          }
        );

        verifier.render(); // 🔥 VERY IMPORTANT

        window.recaptchaVerifier = verifier;
      }
    } catch (err) {
      console.error("Recaptcha Init Error:", err);
    }

    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) { }
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const phoneNumber = `+91${phone}`;
      console.log("Using Auth:", auth);

      console.log("Sending OTP to:", phoneNumber); // Debug log

      const appVerifier = window.recaptchaVerifier;

      if (!appVerifier) {
        throw new Error("Recaptcha not initialized");
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        phoneNumber,
        appVerifier
      );

      window.confirmationResult = confirmationResult;
      setStep(2);
    } catch (err) {
      console.error("Firebase Error:", err);
      setError(`Failed to send OTP. ${err.message || err.code || "Please try again."}`);

      // Reset recaptcha on error so user can try again
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.render().then((widgetId) => {
            window.grecaptcha.reset(widgetId);
          }).catch(console.error);
        } catch (resetErr) {
          console.error("Failed to reset recaptcha:", resetErr);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySuccess = (user) => {
    // Store token in localStorage
    localStorage.setItem("token", user.uid);
    setToken(user.uid);

    // Create user object
    const mockUser = {
      _id: user.uid,
      name: "Guest User",
      email: "guest@example.com",
      phone: user.phoneNumber || `+91${phone}`,
      role: "influencer"
    };

    // Update auth context
    setUser(mockUser);

    // Navigate to profile setup as requested
    navigate("/profile-setup", { replace: true });
  };

  return (
    <>
      <div id="recaptcha-container"></div>

      {step === 1 ? (
        <form onSubmit={handleSendOtp}>
          <div className="field">
            <label htmlFor="phone">Phone Number</label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div
                className="input"
                style={{
                  width: "4rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(255, 255, 255, 0.05)"
                }}
              >
                +91
              </div>
              <input
                id="phone"
                className="input"
                type="tel"
                placeholder="Enter 10-digit number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))} // Only allow digits
                maxLength={10}
                required
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <ErrorBanner message={error} onDismiss={() => setError("")} />

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      ) : (
        <OTPInput
          phoneNumber={phone}
          onSuccess={handleVerifySuccess}
          onResend={handleSendOtp}
        />
      )}
    </>
  );
}
