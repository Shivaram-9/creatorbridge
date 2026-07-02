import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PrivacyPolicyContent from '../components/PrivacyPolicyContent.jsx';
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import OfflineBanner from "../components/OfflineBanner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import "./RoleSelect.css";

const ROLES = [
  {
    id: "influencer",
    icon: "🎤",
    title: "Creator",
    description: "I am a content creator or KOL. I want to partner with brands.",
  },
  {
    id: "brand",
    icon: "🏢",
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

  async function handleAgreeAndContinue() {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await api.users.updateMe({ role: selected });
      if (updated?.error) {
        setError(typeof updated.error === "string" ? updated.error : "Something went wrong");
      } else {
        setUser(updated);
        if (selected === "brand") navigate("/onboarding");
        else navigate("/home", { replace: true });
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
      setShowTerms(false);
    }
  }

  return (
    <>
      <OfflineBanner />
      <div className="role-select-page">
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
              
              <div className="terms-modal-body" style={{ padding: '0 32px' }}>
                <PrivacyPolicyContent />
              </div>
              
              <div className="terms-modal-footer" style={{ textAlign: 'center' }}>
                <p style={{ marginBottom: '15px', color: '#64748b' }}>
                  By clicking "I Agree", you acknowledge that you have read and accepted the Privacy Policy.
                </p>
                <button 
                  className="btn btn-primary btn-block" 
                  onClick={handleAgreeAndContinue}
                  disabled={saving}
                >
                  {saving ? "Processing..." : "I Agree & Continue"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
