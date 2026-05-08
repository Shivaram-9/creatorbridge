import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import "./Onboarding.css";

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [data, setData] = useState({
    role: user?.role || "influencer",
    category: "",
    bio: "",
    interests: [],
    avatar: null,
  });

  const categories = data.role === "influencer" 
    ? ["Fashion", "Tech", "Lifestyle", "Gaming", "Food", "Fitness", "Travel"]
    : ["Fashion Brand", "Electronics", "FMCG", "Agency", "Startup", "E-commerce"];

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const toggleInterest = (cat) => {
    setData(prev => ({
      ...prev,
      interests: prev.interests.includes(cat)
        ? prev.interests.filter(i => i !== cat)
        : [...prev.interests, cat]
    }));
  };

  const finish = async () => {
    setLoading(true);
    try {
      const res = await api.onboarding.complete({
        category: data.interests[0] || "General",
        bio: data.bio,
        onboardingComplete: true
      });
      if (res.error) setError(res.error);
      else {
        setUser(res);
        navigate("/home");
      }
    } catch {
      setError("Failed to complete onboarding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page slide-in">
      <div className="onboarding-card">
        {/* Progress Bar */}
        <div className="onboarding-progress">
          <div className="progress-fill" style={{ width: `${(step / 3) * 100}%` }}></div>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        {step === 1 && (
          <div className="onboarding-step">
            <span className="step-badge">Welcome</span>
            <h1>Let's get started</h1>
            <p>Tell us more about your presence on CreatorBridge.</p>
            
            <div className="role-selector">
              <div 
                className={`role-option ${data.role === 'influencer' ? 'active' : ''}`}
                onClick={() => setData({ ...data, role: 'influencer' })}
              >
                <span className="icon">🎨</span>
                <div className="role-text">
                  <strong>Influencer</strong>
                  <p>I create content and work with brands</p>
                </div>
              </div>
              <div 
                className={`role-option ${data.role === 'brand' ? 'active' : ''}`}
                onClick={() => setData({ ...data, role: 'brand' })}
              >
                <span className="icon">🏢</span>
                <div className="role-text">
                  <strong>Brand / Agency</strong>
                  <p>I want to hire creators for campaigns</p>
                </div>
              </div>
            </div>

            <button className="btn btn-primary btn-block btn-lg" onClick={handleNext}>Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <span className="step-badge">Identity</span>
            <h1>Pick your niche</h1>
            <p>Select categories that best describe your {data.role === 'brand' ? 'business' : 'content'}.</p>

            <div className="category-grid">
              {categories.map(cat => (
                <div 
                  key={cat} 
                  className={`cat-tag ${data.interests.includes(cat) ? 'active' : ''}`}
                  onClick={() => toggleInterest(cat)}
                >
                  {cat}
                </div>
              ))}
            </div>

            <div className="nav-btns">
              <button className="btn btn-secondary" onClick={handleBack}>Back</button>
              <button className="btn btn-primary" onClick={handleNext} disabled={data.interests.length === 0}>Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step">
            <span className="step-badge">Finish</span>
            <h1>Final Touches</h1>
            <p>Write a short bio to introduce yourself to the community.</p>

            <textarea 
              className="onboarding-textarea" 
              placeholder="Tell the world who you are..."
              value={data.bio}
              onChange={(e) => setData({ ...data, bio: e.target.value })}
            ></textarea>

            <div className="nav-btns">
              <button className="btn btn-secondary" onClick={handleBack}>Back</button>
              <button className="btn btn-primary" onClick={finish} disabled={loading || !data.bio.trim()}>
                {loading ? "Saving..." : "Go to Feed"}
              </button>
            </div>
          </div>
        )}

        <button className="skip-btn" onClick={() => navigate("/home")}>Skip for now</button>
      </div>
    </div>
  );
}
