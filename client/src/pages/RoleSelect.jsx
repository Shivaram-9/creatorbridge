import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import OfflineBanner from "../components/OfflineBanner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import "./RoleSelect.css";
import "./Auth.css";

const ROLES = [
  {
    id: "influencer",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
        <line x1="12" y1="19" x2="12" y2="22"></line>
      </svg>
    ),
    title: "Creator",
    description: "I am a content creator or KOL. I want to partner with brands.",
  },
  {
    id: "brand",
    icon: (
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
        <path d="M9 22v-4h6v4"></path>
        <path d="M8 6h.01"></path>
        <path d="M16 6h.01"></path>
        <path d="M12 6h.01"></path>
        <path d="M12 10h.01"></path>
        <path d="M12 14h.01"></path>
        <path d="M16 10h.01"></path>
        <path d="M16 14h.01"></path>
        <path d="M8 10h.01"></path>
        <path d="M8 14h.01"></path>
      </svg>
    ),
    title: "Brand",
    description: "I represent a brand or business. I'm looking for creators to partner with.",
  },
];

export default function RoleSelect() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [selected, setSelected] = useState(user?.role || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);

  function handleOpenPrivacy() {
    navigate(`/privacy?onboarding=true&role=${selected}`);
  }

  return (
    <>
      <OfflineBanner />
      <div className="auth-stabilized-wrapper">
        {/* Floating Animated Text Background */}
        <div className="auth-floating-text-bg">
          <div className="floating-text">Pactogram</div>
        </div>

        <div className="role-select-page" style={{ position: 'relative', zIndex: 10, width: '100%', minHeight: 'auto' }}>
        <div className="role-select-header">
          <h1 className="page-title">Who are you?</h1>
          <p className="subtitle">Choose your role to get the best experience on Pactogram.</p>
        </div>

        <div className="role-cards">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              className={`role-card ${selected === role.id ? "role-card--selected" : ""}`}
              onClick={() => setSelected(role.id)}
              aria-pressed={selected === role.id}
            >
              <div className="role-card__icon-wrap">
                <span className="role-card__icon" aria-hidden="true">{role.icon}</span>
              </div>
              <h2 className="role-card__title">{role.title}</h2>
              <p className="role-card__desc">{role.description}</p>
              <div className="role-card__check" aria-hidden="true">
                {selected === role.id ? "✓" : ""}
              </div>
            </button>
          ))}
        </div>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <button
          type="button"
          className="btn btn-primary btn-block role-select-continue"
          disabled={!selected || saving}
          onClick={() => setShowTerms(true)}
        >
          {saving ? "Saving…" : "Continue →"}
        </button>

        {showTerms && (
          <div className="terms-modal-overlay">
            <div className="terms-modal-card fade-up">
              <div className="terms-modal-header">
                <h2>Privacy Policy</h2>
                <button className="terms-close" onClick={() => setShowTerms(false)}>✕</button>
              </div>
              
              <div className="terms-modal-body" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ marginBottom: '24px', fontSize: '16px', color: '#475569' }}>
                  Please review our Privacy Policy to understand how we collect, use, and protect your data before completing registration.
                </p>
                <button 
                  className="privacy-link-btn" 
                  onClick={handleOpenPrivacy}
                >
                  Read Privacy Policy
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
}
