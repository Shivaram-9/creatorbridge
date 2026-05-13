import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import "./Onboarding.css";

const PRELOADED_CATEGORIES = [
  "Fashion", "Technology", "Automobile", "Food", "Travel", "Fitness", 
  "Music", "Gaming", "Education", "Finance", "Healthcare", "Real Estate", 
  "Photography", "Luxury", "Beauty", "Sports", "Startup", "Marketing", 
  "Agency", "Ecommerce", "Art", "Design", "Entertainment", "News", "Politics",
  "Consulting", "Software", "Hardware", "Agriculture", "Architecture", 
  "Aviation", "Biotechnology", "Chemicals", "Construction", "Energy", 
  "Environment", "Events", "Insurance", "Legal", "Logistics", "Manufacturing", 
  "Media", "Non-Profit", "Pharmaceuticals", "Retail", "Telecommunications", 
  "Transportation", "Veterinary", "Wellness", "Wholesale", "Writing", 
  "Accounting", "Advertising", "Apparel", "Astrology", "Banking", "Blogging", 
  "Coaching", "Comedy", "Crafts", "Crypto", "Culinary", "Dance", "Dating", 
  "Decor", "Dentistry", "DIY", "E-learning", "Engineering", "Farming", 
  "Film", "Floral", "Furniture", "Gardening", "Genealogy", "Graphic Design", 
  "Home Improvement", "Hospitality", "Human Resources", "Illustration", 
  "Interior Design", "Investment", "Jewelry", "Journalism", "Languages", 
  "Magic", "Management", "Martial Arts", "Mental Health", "Modeling", 
  "Motivation", "Nutrition", "Parenting", "Personal Training", "Pets", 
  "Podcast", "Public Relations", "Publishing", "Recruiting", "Robotics", 
  "Sales", "Science", "Security", "SEO", "Social Media", "Software Development", 
  "Space", "Sustainability", "Tattoos", "Taxes", "Theater", "Translation", 
  "Tutoring", "UI/UX", "Venture Capital", "Video Production", "Virtual Reality", 
  "Vlogging", "Web Design", "Web3", "Wedding Planning", "Yoga", "Zoology"
].sort();

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [data, setData] = useState({
    category: "",
    customCategory: "",
    bio: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [showOtherInput, setShowOtherInput] = useState(false);

  const filteredCategories = useMemo(() => {
    return PRELOADED_CATEGORIES.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const finish = async () => {
    setLoading(true);
    try {
      const finalCategory = showOtherInput ? data.customCategory : data.category;
      const res = await api.onboarding.complete({
        category: finalCategory || "General",
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
            <h1>Business Category</h1>
            <p>Select the category that best describes your business.</p>

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
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #dbdbdb', fontSize: '15px', outline: 'none' }}
              />
              
              {!showOtherInput && (
                <div style={{ marginTop: '8px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #efefef', borderRadius: '8px', background: 'white' }}>
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
              <button className="btn btn-primary" onClick={handleNext} disabled={!data.category || (showOtherInput && !data.customCategory.trim())}>Continue</button>
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
