import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = () => {
    const { password } = formData;
    return {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)
    };
  };

  const reqs = validatePassword();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (!Object.values(reqs).every(Boolean)) {
      return setError("Please meet all password requirements");
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.auth.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      if (data.error) {
        setError(data.error);
      } else {
        login(data.user, data.token);
        navigate("/select-role");
      }
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card-premium fade-up">
        <div className="auth-hero-icon-container">
          <svg style={{ width: '42px', height: '42px' }} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="#6366F1" strokeWidth="2"/>
            <path d="M20 21C20 17.134 16.866 14 13 14H11C7.13401 14 4 17.134 4 21" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="18" cy="14" r="3" fill="#6366F1"/>
            <path d="M18 12.5V15.5M16.5 14H19.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <h1 className="auth-title-pro">Create account</h1>
        <p className="auth-subtitle-pro">Join us and get started</p>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <form onSubmit={handleSubmit} className="w-full">
          <div className="input-group-pro">
            <input
              type="text"
              name="name"
              className="input-premium"
              placeholder="Full name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group-pro">
            <input
              type="email"
              name="email"
              className="input-premium"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group-pro">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="input-premium"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group-pro">
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              className="input-premium"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="password-reqs-pro">
            <div className={`password-req-item ${reqs.length ? 'valid' : ''}`}>
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>At least 8 characters</span>
            </div>
            <div className={`password-req-item ${reqs.upper ? 'valid' : ''}`}>
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>One uppercase letter</span>
            </div>
            <div className={`password-req-item ${reqs.lower ? 'valid' : ''}`}>
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>One lowercase letter</span>
            </div>
            <div className={`password-req-item ${reqs.number ? 'valid' : ''}`}>
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>One number or special character</span>
            </div>
          </div>

          <button type="submit" className="btn-gradient-pro" disabled={loading}>
            <span>{loading ? "Creating..." : "Create account"}</span>
            <div className="btn-circle-arrow">
              <svg style={{ width: '16px', height: '16px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" />
              </svg>
            </div>
          </button>
        </form>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-[11px]"><span className="px-2 bg-white text-slate-400 font-bold uppercase tracking-wider">or</span></div>
        </div>

        <div className="flex flex-col gap-2">
          <button type="button" className="btn-social-auth">
            <img style={{ width: '18px', height: '18px' }} src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pjax/google.png" alt="Google" />
            Sign up with Google
          </button>
          <button type="button" className="btn-social-auth">
            <svg style={{ width: '18px', height: '18px' }} viewBox="0 0 384 512" fill="currentColor"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-31.4-57.3-114.6-1.7-123.1zM281.2 49.3c18.4-22.3 10.4-44.5 10.4-44.5s-23.4 1.5-41.8 23.9c-16.1 19.5-10.3 42-10.3 42s24.4 2 41.7-21.4z"/></svg>
            Sign up with Apple
          </button>
        </div>

        <footer className="mt-8 text-center border-t border-slate-50 pt-6">
          <p className="text-sm text-slate-500">Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Login</Link></p>
        </footer>
      </div>
    </div>
  );
}
