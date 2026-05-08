import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import "./Earnings.css";

export default function Earnings() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [s, t] = await Promise.all([
          api.premium.getStats(),
          api.premium.getTransactions()
        ]);
        if (s.error) setError(s.error);
        else setStats(s);
        if (t.error) setError(t.error);
        else setTransactions(t);
      } catch {
        setError("Failed to load earnings data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="earnings-page container slide-in">
      <header className="earnings-header">
        <h1>Creator Earnings</h1>
        <p>Manage your revenue and transaction history.</p>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div className="earnings-summary-grid">
        <div className="summary-card">
          <span className="label">Total Balance</span>
          <h2 className="value">₹{stats?.earnings || 0}</h2>
          <button className="btn btn-primary btn-sm" disabled={!stats?.earnings}>Withdraw</button>
        </div>
        <div className="summary-card">
          <span className="label">Plan Status</span>
          <h2 className="value" style={{ color: stats?.isPremium ? '#10b981' : '#8e8e8e' }}>
            {stats?.isPremium ? stats.premiumTier.toUpperCase() : "FREE"}
          </h2>
          <span className="sublabel">{stats?.subscriptionStatus || "None"}</span>
        </div>
        <div className="summary-card">
          <span className="label">Pending Payouts</span>
          <h2 className="value">₹0</h2>
          <span className="sublabel">Next payout: --</span>
        </div>
      </div>

      <section className="transactions-section">
        <h3>Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="transaction-list">
            {transactions.map(t => (
              <div key={t._id} className="transaction-item">
                <div className="t-info">
                  <div className="t-type">{t.type.toUpperCase()}</div>
                  <div className="t-desc">{t.description}</div>
                  <div className="t-date">{new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
                <div className={`t-amount ${t.type === 'payout' ? 'neg' : 'pos'}`}>
                  {t.type === 'payout' ? '-' : '+'}₹{t.amount}
                </div>
                <div className={`t-status ${t.status.toLowerCase()}`}>{t.status}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
