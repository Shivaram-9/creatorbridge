import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import OfflineBanner from "../components/OfflineBanner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

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

  async function handleContinue() {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const updated = await api.users.updateMe({ role: selected });
      if (updated?.error) {
        setError(typeof updated.error === "string" ? updated.error : "Something went wrong");
      } else {
        setUser(updated);
        navigate("/profile", { replace: true });
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <OfflineBanner />
      <div className="container role-select-page">
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
          onClick={handleContinue}
        >
          {saving ? "Saving…" : "Continue →"}
        </button>
      </div>
    </>
  );
}
