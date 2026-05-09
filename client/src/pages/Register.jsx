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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
      <div className="auth-card-premium fade-up" style={{ maxWidth: '480px' }}>
        {/* User Plus Illustration */}
        <div className="auth-hero-icon">
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="70" cy="70" r="70" fill="url(#paint0_radial)" fillOpacity="0.6"/>
            <g>
              <circle cx="70" cy="55" r="20" fill="white" style={{ filter: 'drop-shadow(0 10px 15px rgba(99, 102, 241, 0.2))' }}/>
              <path d="M40 100C40 83.4315 53.4315 70 70 70C86.5685 70 100 83.4315 100 100" stroke="#6366F1" strokeWidth="3" strokeLinecap="round"/>
              <circle cx="95" cy="85" r="12" fill="#6366F1"/>
              <path d="M95 79V91M89 85H101" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </g>
            <defs>
              <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(70 70) rotate(90) scale(70)">
                <stop stopColor="#6366F1" stopOpacity="0.2"/>
                <stop offset="1" stopColor="#6366F1" stopOpacity="0"/>
              </radialGradient>
            </defs>
          </svg>
        </div>

        <h1 className="auth-title-pro">Create account</h1>
        <p className="auth-subtitle-pro">Join us and get started</p>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <form onSubmit={handleSubmit} className="w-full">
          <div className="input-group-pro">
            <span className="input-icon-left">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </span>
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
            <span className="input-icon-left">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </span>
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
            <span className="input-icon-left">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </span>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              className="input-premium"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L5.136 5.136m10.142 10.142L20 20" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
            </button>
          </div>

          <div className="input-group-pro">
            <span className="input-icon-left">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </span>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              className="input-premium"
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
              {showConfirmPassword ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L5.136 5.136m10.142 10.142L20 20" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
            </button>
          </div>

          <div className="password-reqs-pro">
            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-2">Password must contain:</p>
            <div className={`password-req-item ${reqs.length ? 'valid' : ''}`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              At least 8 characters
            </div>
            <div className={`password-req-item ${reqs.upper ? 'valid' : ''}`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              One uppercase letter
            </div>
            <div className={`password-req-item ${reqs.lower ? 'valid' : ''}`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              One lowercase letter
            </div>
            <div className={`password-req-item ${reqs.number ? 'valid' : ''}`}>
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              One number or special character
            </div>
          </div>

          <button type="submit" className="btn-gradient-pro" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
            {!loading && <div className="btn-circle-arrow"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></div>}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-slate-400 font-medium">or</span></div>
        </div>

        <div className="social-login-group">
          <button type="button" className="btn-social-auth">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pjax/google.png" width="18" alt="Google" />
            Sign up with Google
          </button>
          <button type="button" className="btn-social-auth">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M15.5 8.3c-.1-2.2-1.8-3.9-4-4-2.2-.1-4.1 1.6-4.2 3.8-.1 2.2 1.6 4.1 3.8 4.2 2.2.1 4.1-1.6 4.4-3.8l.1-.2z"/><path d="M17.5 9c0 4.7-3.8 8.5-8.5 8.5S.5 13.7.5 9 4.3.5 9 .5s8.5 3.8 8.5 8.5z"/></svg>
            Sign up with Apple
          </button>
        </div>

        <footer className="mt-8">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-4">
            <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L10 9.503l7.834-4.603a1 1 0 011.166 1.63L10.584 12.03a1 1 0 01-1.168 0L1 6.53a1 1 0 011.166-1.63z" clipRule="evenodd" /></svg>
            Your data is safe with us
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed max-w-[280px] mx-auto">
            By continuing, you agree to our<br />
            <Link to="/terms" className="text-indigo-600 font-semibold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-indigo-600 font-semibold hover:underline">Privacy Policy</Link>
          </p>
          <div className="mt-6 pt-6 border-t border-slate-50">
            <p className="text-sm text-slate-500">Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Login</Link></p>
          </div>
        </footer>
      </div>
    </div>
  );
}
