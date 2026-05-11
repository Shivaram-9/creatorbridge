import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import OfflineBanner from "../components/OfflineBanner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import "./RoleSelect.css";

const ROLES = [
  {
    id: "influencer",
    icon: "🎤",
    title: "Influencer",
    description: "I create content and grow audiences. I'm looking for brand collaborations.",
  },
  {
    id: "brand",
    icon: "🏢",
    title: "Brand",
    description: "I represent a brand or business. I'm looking for influencers to partner with.",
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
        navigate("/", { replace: true });
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
          <p className="subtitle">Choose your role to get the best experience on CreatorBridge.</p>
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
                <h2>Terms & Conditions</h2>
                <button className="terms-close" onClick={() => setShowTerms(false)}>✕</button>
              </div>
              <div className="terms-modal-body">
                <p>Welcome to CreatorBridge! By clicking "I Agree", you acknowledge that you have read and agree to our Terms of Use and Privacy Policy.</p>
                
                <h3>1. User Agreement</h3>
                <p>You agree to use CreatorBridge responsibly and maintain the integrity of the platform. All brand-creator alliances must be conducted with professional standards.</p>
                
                <h3>2. Content & Conduct</h3>
                <p>You are responsible for the content you post. CreatorBridge maintains a zero-tolerance policy for harassment, hate speech, or fraudulent behavior.</p>
                
                <h3>3. Privacy</h3>
                <p>Your data is protected under our privacy protocols. We will never share your personal data with third parties without your explicit consent.</p>
                
                <h3>4. Alliances</h3>
                <p>CreatorBridge facilitates connections but is not responsible for the contractual details of external brand-creator agreements unless specified.</p>
              </div>
              <div className="terms-modal-footer">
                <button 
                  className="btn btn-primary btn-block" 
                  onClick={handleAgreeAndContinue}
                  disabled={saving}
                >
                  {saving ? "Processing..." : "I Agree"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
