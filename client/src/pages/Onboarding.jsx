import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import "./Onboarding.css";

import { CITIES } from "../constants/cities.js";

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [data, setData] = useState({
    category: "",
    customCategory: "",
    gender: "",
    location: "",
    bio: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories/onboarding");
        if (res.ok) {
          const data = await res.json();
          setDbCategories(data.map(c => c.name));
        }
      } catch (err) {
        console.error("Failed to load onboarding categories:", err);
      }
    }
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    return dbCategories.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, dbCategories]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const finish = async () => {
    setLoading(true);
    try {
      const finalCategory = showOtherInput ? data.customCategory : data.category;
      const res = await api.onboarding.complete({
        category: finalCategory || "General",
        gender: data.gender,
        location: data.location,
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
        <div className="onboarding-progress">
          <div className="progress-fill" style={{ width: `${(step / 2) * 100}%` }}></div>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        {step === 1 && (
          <div className="onboarding-step">
            <span className="step-badge">Identity</span>
            <h1>Business Category & Gender</h1>
            <p>Select your category and gender.</p>

            <div style={{ width: '100%', marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Gender</label>
              <select 
                value={data.gender}
                onChange={(e) => setData({...data, gender: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: 'transparent' }}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div style={{ width: '100%', marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>City / Location</label>
              <select 
                value={data.location}
                onChange={(e) => setData({...data, location: e.target.value})}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none', backgroundColor: 'transparent' }}
              >
                <option value="">Select City</option>
                {CITIES.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', width: '100%', textAlign: 'left' }}>Category</label>
            <div style={{ position: 'relative', width: '100%', marginBottom: '20px', textAlign: 'left' }}>
              <input 
                type="text" 
                placeholder="Search categories..." 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowOtherInput(false);
                  setData({...data, category: ""});
                }}
                className="onboarding-search-input"
              />
              
              {!showOtherInput && (
                <div className="onboarding-dropdown">
                  {filteredCategories.map(cat => (
                    <div 
                      key={cat} 
                      onClick={() => {
                        setData({...data, category: cat});
                        setSearchQuery(cat);
                        setShowOtherInput(false);
                      }}
                      style={{ padding: '10px 16px', cursor: 'pointer', background: data.category === cat ? '#f0f9ff' : 'transparent', color: data.category === cat ? 'var(--primary)' : 'inherit', borderBottom: '1px solid #efefef' }}
                    >
                      {cat}
                    </div>
                  ))}
                  {filteredCategories.length === 0 && searchQuery && (
                     <div style={{ padding: '10px 16px', color: '#999', fontSize: '14px' }}>No matches found.</div>
                  )}
                  <div 
                    onClick={() => {
                      setShowOtherInput(true);
                      setData({...data, category: "Other"});
                    }}
                    style={{ padding: '10px 16px', cursor: 'pointer', background: data.category === 'Other' ? '#f0f9ff' : 'transparent', color: 'var(--primary)', fontWeight: 'bold' }}
                  >
                    Other...
                  </div>
                </div>
              )}

              {showOtherInput && (
                <div style={{ marginTop: '16px' }}>
                  <input 
                    type="text" 
                    placeholder="Enter custom category" 
                    value={data.customCategory}
                    onChange={(e) => setData({...data, customCategory: e.target.value})}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--primary)', fontSize: '15px', outline: 'none' }}
                    autoFocus
                  />
                  <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--primary)', cursor: 'pointer', display: 'inline-block' }} onClick={() => { setShowOtherInput(false); setSearchQuery(""); setData({...data, category: ""}); }}>
                    ← Back to list
                  </div>
                </div>
              )}
            </div>

            <div className="nav-btns">
              <button className="btn btn-secondary" onClick={() => navigate("/home")}>Back</button>
              <button className="btn btn-primary" onClick={handleNext} disabled={!data.category || !data.location || (showOtherInput && !data.customCategory.trim())}>Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
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

        <button 
          className="skip-btn" 
          onClick={async () => {
            try {
              const res = await api.onboarding.complete({ onboardingComplete: true });
              if (!res.error) setUser(res);
            } catch (err) {
              console.error("Skip failed", err);
            }
            navigate("/home");
          }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
