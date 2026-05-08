import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Avatar from "../components/Avatar.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const s = await api.admin.getStats();
      setStats(s);

      if (activeTab === "overview" || activeTab === "reports") {
        const r = await api.admin.getReports();
        setReports(r);
      }
      if (activeTab === "users") {
        const u = await api.admin.getUsers();
        setUsers(u);
      }
      if (activeTab === "withdrawals") {
        const w = await api.admin.getWithdrawals();
        setWithdrawals(w);
      }
      if (activeTab === "verifications") {
        const v = await api.admin.getVerifications();
        setVerifications(v);
      }
    } catch (err) {
      setError("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (id, status) => {
    try {
      await api.admin.resolveReport(id, status);
      setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r));
    } catch {
      setError("Failed to update report");
    }
  };

  const handleToggleBan = async (userId) => {
    if (!window.confirm("Change ban status for this user?")) return;
    try {
      const res = await api.admin.toggleBan(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: res.isBanned } : u));
    } catch {
      setError("Failed to toggle ban");
    }
  };

  const handleWithdrawal = async (id, status) => {
    const adminNotes = window.prompt("Add admin notes (optional):");
    try {
      await api.admin.updateWithdrawal(id, { status, adminNotes });
      setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status, adminNotes } : w));
    } catch {
      setError("Failed to update withdrawal");
    }
  };

  const handleVerify = async (userId) => {
    if (!window.confirm("Verify this creator?")) return;
    try {
      await api.admin.verifyUser(userId);
      setVerifications(prev => prev.filter(v => v._id !== userId));
      alert("Creator verified! ✅");
    } catch {
      setError("Verification failed");
    }
  };

  if (loading && !stats) return <LoadingSpinner centered />;

  return (
    <div className="admin-page container slide-in">
      <header className="admin-header">
        <div className="header-info">
          <h1>Enterprise Control Panel</h1>
          <p>Global platform oversight, revenue monitoring, and moderation</p>
        </div>
        <button className="btn btn-secondary" onClick={loadData}>🔄 Refresh</button>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <nav className="admin-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Users</button>
        <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
          Reports {stats?.pendingReports > 0 && <span className="tab-badge warning">{stats.pendingReports}</span>}
        </button>
        <button className={activeTab === 'withdrawals' ? 'active' : ''} onClick={() => setActiveTab('withdrawals')}>
          Payouts {stats?.pendingWithdrawals > 0 && <span className="tab-badge">{stats.pendingWithdrawals}</span>}
        </button>
        <button className={activeTab === 'verifications' ? 'active' : ''} onClick={() => setActiveTab('verifications')}>Verifications</button>
      </nav>

      <div className="admin-content">
        {activeTab === 'overview' && (
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-label">Total Revenue</span>
              <span className="stat-value">₹{stats?.totalRevenue?.toLocaleString()}</span>
              <div className="stat-sub">
                <span className="pill gold">{stats?.premiumUsers} Premium Users</span>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-label">Platform Growth</span>
              <span className="stat-value">{stats?.userCount}</span>
              <div className="stat-sub">
                <span className="pill">{stats?.influencerCount} Influencers</span>
                <span className="pill">{stats?.brandCount} Brands</span>
              </div>
            </div>
            <div className="stat-card warning">
              <span className="stat-label">Moderation Queue</span>
              <span className="stat-value">{stats?.pendingReports}</span>
              <span className="stat-trend">Reports pending</span>
            </div>
            <div className="stat-card info">
              <span className="stat-label">Marketplace Activity</span>
              <span className="stat-value">{stats?.dealCount}</span>
              <span className="stat-trend">Active Deals</span>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-table-container card">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Wallet</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <div className="user-cell">
                        <Avatar user={u} size="sm" />
                        <div className="user-cell-info">
                          <strong>{u.name || u.username}</strong>
                          <span>@{u.username}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className={`role-pill ${u.role}`}>{u.role}</span></td>
                    <td>₹{u.walletBalance || 0}</td>
                    <td>
                      <span className={`status-pill ${u.isBanned ? 'banned' : 'active'}`}>
                        {u.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className={`btn btn-sm ${u.isBanned ? 'btn-success' : 'btn-danger'}`} onClick={() => handleToggleBan(u._id)}>
                          {u.isBanned ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div className="withdrawals-list">
            {withdrawals.length === 0 ? <div className="empty-state">No withdrawal requests.</div> : (
              withdrawals.map(w => (
                <div key={w._id} className={`payout-card ${w.status}`}>
                  <div className="payout-info">
                    <div className="user-mini">
                      <Avatar user={w.user} size="sm" />
                      <div>
                        <strong>{w.user?.name}</strong>
                        <span>@{w.user?.username}</span>
                      </div>
                    </div>
                    <div className="payout-amount">
                      <label>Requested Amount</label>
                      <h3>₹{w.amount}</h3>
                    </div>
                    <div className="payout-method">
                      <label>Payout via {w.payoutMethod}</label>
                      <p>{w.payoutDetails}</p>
                    </div>
                  </div>
                  <div className="payout-actions">
                    {w.status === 'pending' ? (
                      <>
                        <button className="btn btn-success" onClick={() => handleWithdrawal(w._id, 'completed')}>Approve & Pay</button>
                        <button className="btn btn-danger" onClick={() => handleWithdrawal(w._id, 'rejected')}>Reject</button>
                      </>
                    ) : (
                      <span className={`status-badge ${w.status}`}>{w.status.toUpperCase()}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'verifications' && (
          <div className="verifications-grid">
            {verifications.length === 0 ? <div className="empty-state">No pending verifications.</div> : (
              verifications.map(v => (
                <div key={v._id} className="verification-card card">
                  <Avatar user={v} size="lg" />
                  <h3>{v.name}</h3>
                  <p>@{v.username}</p>
                  <div className="v-stats">
                    <span>{v.followers?.length} Followers</span>
                    <span>{v.category}</span>
                  </div>
                  <button className="btn btn-primary w-full" onClick={() => handleVerify(v._id)}>Verify Creator</button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-queue">
            {reports.map(report => (
              <div key={report._id} className={`report-card-admin status-${report.status}`}>
                <div className="report-main">
                  <div className="report-header-admin">
                    <span className={`status-pill ${report.status}`}>{report.status}</span>
                    <span className="report-type">{report.targetType} Report</span>
                  </div>
                  <h3 className="report-reason">{report.reason}</h3>
                  <p className="report-desc">{report.description}</p>
                </div>
                <div className="report-actions-admin">
                  {report.status === 'pending' && (
                    <>
                      <button className="btn btn-success" onClick={() => handleResolveReport(report._id, 'resolved')}>Resolve</button>
                      <button className="btn btn-ghost" onClick={() => handleResolveReport(report._id, 'dismissed')}>Dismiss</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

