import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import toast from "react-hot-toast";
import "./Premium.css";

const TIERS = [
  {
    id: "silver",
    name: "Silver",
    price: "499",
    features: ["Verified Badge", "Basic Analytics", "5 Portfolio Items", "Priority Support"],
    color: "#94a3b8",
    badge: "🥈"
  },
  {
    id: "gold",
    name: "Gold",
    price: "999",
    features: ["Gold Badge", "Advanced Analytics", "10 Portfolio Items", "Campaign Priority", "Direct Messaging"],
    color: "#fbbf24",
    popular: true,
    badge: "🥇"
  },
  {
    id: "platinum",
    name: "Platinum",
    price: "1999",
    features: ["Platinum Badge", "Full Insights", "Unlimited Portfolio", "Featured Profile", "Dedicated Manager"],
    color: "#818cf8",
    badge: "💎"
  }
];

export default function Premium() {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkoutTier, setCheckoutTier] = useState(null);
  const [processing, setProcessing] = useState(false);

  const startCheckout = (tier) => {
    setCheckoutTier(tier);
  };

  const processPayment = async () => {
    setProcessing(true);
    
    try {
      const order = await api.premium.createOrder(checkoutTier.id);
      if (order.error) {
        toast.error(order.error);
        setProcessing(false);
        return;
      }

      const options = {
        key: "rzp_test_placeholder", // This should ideally come from backend or config
        amount: order.amount,
        currency: order.currency,
        name: "CreatorBridge",
        description: `${checkoutTier.name} Subscription`,
        order_id: order.id,
        handler: async (response) => {
          const verifyRes = await api.premium.verifyPayment({
            ...response,
            tier: checkoutTier.id
          });

          if (verifyRes.ok) {
            toast.success(`Successfully upgraded to ${checkoutTier.name}!`);
            setUser(verifyRes.user);
            setSuccess(true);
            setCheckoutTier(null);
          } else {
            toast.error(verifyRes.error || "Payment verification failed");
          }
          setProcessing(false);
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: "#0f172a",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (response) => {
        toast.error("Payment failed: " + response.error.description);
        setProcessing(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error("Checkout failed. Please try again.");
      setProcessing(false);
    }
  };


  if (success) {
    return (
      <div className="premium-page success-view slide-in">
        <div className="success-container">
          <div className="success-lottie">✨</div>
          <h1 className="success-title">Payment Successful!</h1>
          <p className="success-text">
            Congratulations! You are now a <strong>{user.premiumTier.toUpperCase()}</strong> member.
            Your premium perks are active globally across CreatorBridge.
          </p>
          <div className="success-badge-preview">
            <span style={{ color: TIERS.find(t => t.id === user.premiumTier)?.color }}>
              {TIERS.find(t => t.id === user.premiumTier)?.badge} {user.premiumTier.toUpperCase()}
            </span>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => window.location.href = "/profile"}>Go to Profile</button>
        </div>
      </div>
    );
  }

  if (checkoutTier) {
    return (
      <div className="premium-checkout-view slide-in">
        <div className="checkout-container">
          <button className="back-btn" onClick={() => setCheckoutTier(null)}>← Back</button>
          <div className="checkout-card">
            <div className="checkout-header">
              <h2>Confirm Subscription</h2>
              <p>You're upgrading to <strong>{checkoutTier.name}</strong></p>
            </div>
            
            <div className="checkout-summary">
              <div className="summary-item">
                <span>Plan</span>
                <span>{checkoutTier.name}</span>
              </div>
              <div className="summary-item total">
                <span>Total Amount</span>
                <span>₹{checkoutTier.price}/mo</span>
              </div>
            </div>

            <div className="payment-methods">
              <p className="methods-title">Pay via Secure Gateway</p>
              <div className="method-icons">
                <span className="card-icon">💳</span>
                <span className="card-icon">📱</span>
                <span className="card-icon">🏦</span>
              </div>
            </div>

            {error && <div className="checkout-error">{error}</div>}

            <button 
              className="btn btn-primary btn-block checkout-pay-btn" 
              disabled={processing}
              onClick={processPayment}
            >
              {processing ? (
                <span className="loader-row">
                  <span className="spinner-xs"></span> Processing...
                </span>
              ) : `Pay ₹${checkoutTier.price} Now`}
            </button>
            <p className="secure-note">🔒 Encrypted 256-bit secure transaction</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-page slide-up-fade">
      <header className="page-header-block">
        <h1 className="page-title-main">Elevate Your Presence</h1>
        <p className="page-subtitle-main">Join the elite tier of creators and brands on CreatorBridge.</p>
      </header>


      {user?.isPremium && (
        <div className="current-plan-banner gold-gradient">
          <p>✨ Active Plan: <strong>{user.premiumTier.toUpperCase()}</strong></p>
        </div>
      )}

      <div className="premium-grid">
        {TIERS.map(tier => (
          <div key={tier.id} className={`premium-card ${tier.popular ? 'popular' : ''} ${user?.premiumTier === tier.id ? 'current' : ''}`}>
            {tier.popular && <span className="popular-tag">RECOMMENDED</span>}
            <div className="tier-badge">{tier.badge}</div>
            <h3 className="tier-name" style={{ color: tier.color }}>{tier.name}</h3>
            <div className="tier-price">
              <span className="currency">₹</span>
              <span className="amount">{tier.price}</span>
              <span className="period">/month</span>
            </div>
            <div className="tier-divider"></div>
            <ul className="tier-features">
              {tier.features.map((f, i) => (
                <li key={i}>
                  <span className="check">✓</span> {f}
                </li>
              ))}
            </ul>
            <button 
              className={`btn ${tier.popular ? 'btn-primary' : 'btn-outline'}`}
              disabled={loading || user?.premiumTier === tier.id}
              onClick={() => startCheckout(tier)}
            >
              {user?.premiumTier === tier.id ? "Your Active Plan" : "Upgrade Now"}
            </button>
          </div>
        ))}
      </div>

      <div className="trust-badges">
        <div className="trust-item">🛡️ Secure Payment</div>
        <div className="trust-item">⚡ Instant Activation</div>
        <div className="trust-item">💬 24/7 Support</div>
      </div>
    </div>
  );
}
