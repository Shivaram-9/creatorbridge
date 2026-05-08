import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import "./Premium.css";

const TIERS = [
  {
    id: "silver",
    name: "Silver",
    price: "₹499",
    period: "/month",
    features: ["Verified Badge", "Basic Analytics", "5 Portfolio Items", "Priority Support"],
    color: "#94a3b8"
  },
  {
    id: "gold",
    name: "Gold",
    price: "₹999",
    period: "/month",
    features: ["Gold Badge", "Advanced Analytics", "10 Portfolio Items", "Campaign Priority", "Direct Messaging"],
    color: "#fbbf24",
    popular: true
  },
  {
    id: "platinum",
    name: "Platinum",
    price: "₹1999",
    period: "/month",
    features: ["Platinum Badge", "Full Insights", "Unlimited Portfolio", "Featured Profile", "Dedicated Manager"],
    color: "#818cf8"
  }
];

export default function Premium() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleUpgrade = async (tierId) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.premium.upgrade(tierId);
      if (res.error) {
        setError(res.error);
      } else {
        setUser(res);
        setSuccess(true);
      }
    } catch {
      setError("Upgrade failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="premium-page success slide-in">
        <div className="success-card">
          <div className="success-icon">✨</div>
          <h1>Welcome to Premium!</h1>
          <p>Your account has been upgraded to <strong>{user.premiumTier.toUpperCase()}</strong>.</p>
          <button className="btn btn-primary" onClick={() => setSuccess(false)}>View Features</button>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-page container slide-in">
      <header className="premium-header">
        <h1>Premium Plans</h1>
        <p>Unlock professional tools to grow your brand and reach.</p>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {user?.isPremium && (
        <div className="current-plan-banner">
          <p>You are currently on the <strong>{user.premiumTier.toUpperCase()}</strong> plan.</p>
        </div>
      )}

      <div className="premium-grid">
        {TIERS.map(tier => (
          <div key={tier.id} className={`premium-card ${tier.popular ? 'popular' : ''} ${user?.premiumTier === tier.id ? 'current' : ''}`}>
            {tier.popular && <span className="popular-tag">MOST POPULAR</span>}
            <div className="tier-name" style={{ color: tier.color }}>{tier.name}</div>
            <div className="tier-price">
              <span className="price">{tier.price}</span>
              <span className="period">{tier.period}</span>
            </div>
            <ul className="tier-features">
              {tier.features.map((f, i) => <li key={i}>✅ {f}</li>)}
            </ul>
            <button 
              className={`btn ${tier.popular ? 'btn-primary' : 'btn-secondary'}`}
              disabled={loading || user?.premiumTier === tier.id}
              onClick={() => handleUpgrade(tier.id)}
            >
              {user?.premiumTier === tier.id ? "Current Plan" : "Upgrade Now"}
            </button>
          </div>
        ))}
      </div>

      <div className="premium-footer">
        <h3>Secure Payments</h3>
        <p>Powered by Stripe & Razorpay. Cancel anytime.</p>
      </div>
    </div>
  );
}
