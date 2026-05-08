import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import toast from "react-hot-toast";
import "./Earnings.css";

export default function Earnings() {
  const { user, setUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("UPI");
  const [payoutDetails, setPayoutDetails] = useState("");

  useEffect(() => {
    loadFinances();
  }, []);

  const loadFinances = async () => {
    try {
      const [s, t] = await Promise.all([
        api.premium.getStats(),
        api.premium.getTransactions()
      ]);
      setStats(s);
      setTransactions(Array.isArray(t) ? t : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (Number(withdrawAmount) > (stats?.walletBalance || 0)) {
      return toast.error("Insufficient balance");
    }
    try {
      const res = await api.premium.withdraw({
        amount: Number(withdrawAmount),
        payoutMethod,
        payoutDetails
      });
      if (res.error) throw new Error(res.error);
      toast.success("Withdrawal request submitted! 🚀");
      setShowWithdraw(false);
      loadFinances();
    } catch (err) {
      toast.error(err.message || "Withdrawal failed");
    }
  };

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="earnings-page container slide-in">
      <header className="earnings-header">
        <div className="header-badge">FINANCIAL HUB</div>
        <h1>Wallet & Revenue</h1>
        <p>Manage your professional earnings and payouts securely.</p>
      </header>

      <div className="earnings-grid">
        <div className="earnings-card primary wallet">
          <span className="lbl">Wallet Balance</span>
          <h2 className="val">₹{stats?.walletBalance || 0}</h2>
          <button className="btn btn-light btn-sm" onClick={() => setShowWithdraw(true)}>Withdraw Funds</button>
        </div>
        <div className="earnings-card pending">
          <span className="lbl">Lifetime Earnings</span>
          <h2 className="val">₹{stats?.earnings || 0}</h2>
          <div className="card-footer">Total revenue generated</div>
        </div>
        <div className="earnings-card completed">
          <span className="lbl">Payout Status</span>
          <h2 className="val">{user.subscriptionStatus === 'active' ? 'Active' : 'Standby'}</h2>
          <div className="card-footer">Account status</div>
        </div>
      </div>

      {showWithdraw && (
        <div className="modal-overlay">
          <div className="withdraw-modal card slide-up">
            <h3>Request Withdrawal</h3>
            <p>Funds will be transferred within 2-3 business days.</p>
            <form onSubmit={handleWithdraw}>
              <div className="form-group">
                <label>Amount (Min ₹500)</label>
                <input 
                  type="number" 
                  min="500" 
                  value={withdrawAmount} 
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label>Method</label>
                <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value)}>
                  <option value="UPI">UPI</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>
              <div className="form-group">
                <label>{payoutMethod} Details</label>
                <input 
                  type="text" 
                  placeholder={payoutMethod === 'UPI' ? 'Enter VPA (e.g. user@okaxis)' : 'Account No & IFSC'}
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  required 
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setShowWithdraw(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <section className="transactions-section">
        <div className="section-header">
          <h2>Billing History</h2>
        </div>

        <div className="transactions-list">
          {transactions.length === 0 ? (
            <div className="empty-transactions">
              <div className="icon">💸</div>
              <p>No transactions found.</p>
            </div>
          ) : (
            <table className="transactions-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Invoice</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr key={idx}>
                    <td>{new Date(tx.createdAt).toLocaleDateString()}</td>
                    <td>{tx.description}</td>
                    <td className="tx-amount">₹{tx.amount}</td>
                    <td><span className={`tx-status ${tx.status}`}>{tx.status}</span></td>
                    <td>
                      {tx.type === 'subscription' && tx.status === 'completed' && (
                        <a href={`${api.getResolvedApiOrigin()}/api/premium/invoice/${tx.transactionId}`} target="_blank" rel="noreferrer" className="invoice-link">
                          📄 Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

