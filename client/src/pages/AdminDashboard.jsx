import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { 
  UsersIcon, 
  FlagIcon, 
  CreditCardIcon, 
  CheckCircleIcon,
  ShieldIcon,
  BriefcaseIcon
} from "../components/Icons.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Avatar from "../components/Avatar.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
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
      
      if (isManualRefresh) {
        toast.success("Dashboard statistics refreshed!");
      }
    } catch (err) {
      setError("Failed to load admin data");
      if (isManualRefresh) toast.error("Refresh failed");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
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

  const handleWithdrawal = async (id, status) => {
    const adminNotes = window.prompt("Add admin notes (optional):");
    try {
      await api.admin.updateWithdrawal(id, { status, adminNotes });
      setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status, adminNotes } : w));
    } catch {
      setError("Failed to update withdrawal");
    }
  };

  const handleVerifyRequest = async (requestId, status) => {
    const adminNotes = status === 'rejected' ? window.prompt("Reason for rejection:") : "";
    if (status === 'rejected' && !adminNotes) return;

    try {
      await api.admin.updateVerification(requestId, { status, adminNotes });
      setVerifications(prev => prev.map(v => v._id === requestId ? { ...v, status, adminNotes } : v));
      toast.success(`Request ${status}`);
    } catch {
      setError("Failed to update verification");
    }
  };


  if (loading && !stats) return <LoadingSpinner centered />;

  return (
    <div className="admin-page slide-in">

      <header className="admin-header">
        <div className="header-info">
          <h1>Enterprise Control Panel</h1>
          <p>Global platform oversight, revenue monitoring, and moderation</p>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {isRefreshing ? '↻ Refreshing...' : '↻ Refresh Data'}
        </button>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="stat-label">Total Revenue</span>
                <CreditCardIcon style={{ width: 24, height: 24, color: '#3b82f6' }} />
              </div>
              <span className="stat-value">₹{stats?.totalRevenue?.toLocaleString()}</span>
              <div className="stat-sub">
                <span className="pill gold">{stats?.premiumUsers} Premium Users</span>
              </div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="stat-label">Platform Growth</span>
                <UsersIcon style={{ width: 24, height: 24, color: '#3b82f6' }} />
              </div>
              <span className="stat-value">{stats?.userCount}</span>
              <div className="stat-sub">
                <span className="pill">{stats?.influencerCount} Influencers</span>
                <span className="pill">{stats?.brandCount} Brands</span>
              </div>
            </div>
            <div className="stat-card warning">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="stat-label">Moderation Queue</span>
                <FlagIcon style={{ width: 24, height: 24, color: '#ef4444' }} />
              </div>
              <span className="stat-value">{stats?.pendingReports}</span>
              <span className="stat-trend">Reports pending</span>
            </div>
            <div className="stat-card info">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <span className="stat-label">Campaign Activity</span>
                <BriefcaseIcon style={{ width: 24, height: 24, color: '#0052cc' }} />
              </div>
              <span className="stat-value">{stats?.dealCount || 0}</span>
              <span className="stat-trend">Active Campaigns</span>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-content">
            <div className="users-table-container card" style={{ marginBottom: '32px' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Verified Creators</h3>
                <span className="pill gold">Creators Only</span>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Wallet</th>
                    <th>Status</th>
                    
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.isVerified && u.role === 'influencer').map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-cell">
                          <Avatar user={u} size="sm" />
                          <div className="user-cell-info">
                            <strong>
                              {u.name || u.username}
                              <span style={{ color: '#3b82f6', marginLeft: '4px' }}>✓</span>
                            </strong>
                            <span>@{u.username}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="role-pill influencer">Creator</span></td>
                      <td>₹{u.walletBalance || 0}</td>
                      <td>
                        <span className={`status-pill ${u.isBanned ? 'banned' : 'active'}`}>
                          {u.isBanned ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      
                    </tr>
                  ))}
                  {users.filter(u => u.isVerified && u.role === 'influencer').length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No verified creators found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="users-table-container card" style={{ marginBottom: '32px' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Verified Brands</h3>
                <span className="pill gold">Brands Only</span>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Wallet</th>
                    <th>Status</th>
                    
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.isVerified && u.role === 'brand').map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-cell">
                          <Avatar user={u} size="sm" />
                          <div className="user-cell-info">
                            <strong>
                              {u.name || u.username}
                              <span style={{ color: '#3b82f6', marginLeft: '4px' }}>✓</span>
                            </strong>
                            <span>@{u.username}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="role-pill brand">Brand</span></td>
                      <td>₹{u.walletBalance || 0}</td>
                      <td>
                        <span className={`status-pill ${u.isBanned ? 'banned' : 'active'}`}>
                          {u.isBanned ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      
                    </tr>
                  ))}
                  {users.filter(u => u.isVerified && u.role === 'brand').length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No verified brands found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="users-table-container card">
              <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>Platform Admins</h3>
                <span className="pill info">Administrators</span>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Wallet</th>
                    <th>Status</th>
                    
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === 'admin').map(u => (
                    <tr key={u._id}>
                      <td>
                        <div className="user-cell">
                          <Avatar user={u} size="sm" />
                          <div className="user-cell-info">
                            <strong>{u.name || u.username} <ShieldIcon style={{width: 14, height: 14, color: '#3b82f6'}}/></strong>
                            <span>@{u.username}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="role-pill admin">Admin</span></td>
                      <td>₹{u.walletBalance || 0}</td>
                      <td>
                        <span className={`status-pill ${u.isBanned ? 'banned' : 'active'}`}>
                          {u.isBanned ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
          <div className="verifications-list">
            {verifications.length === 0 ? <div className="empty-state">No pending verification requests.</div> : (
              verifications.map(req => (
                <div key={req._id} className="verification-admin-card card">
                  <div className="v-admin-header">
                    <Avatar user={req.user} size="md" />
                    <div className="v-admin-user">
                      <strong>{req.user?.name}</strong>
                      <span>@{req.user?.username} • {req.category}</span>
                    </div>
                    <span className={`status-pill ${req.status}`}>{req.status}</span>
                  </div>

                  <div className="v-admin-body">
                    <div className="v-proof-section">
                      <label>ID Proof</label>
                      <a href={req.idProof.startsWith('http') ? req.idProof : `${api.getResolvedApiOrigin()}${req.idProof}`} target="_blank" rel="noreferrer" className="v-proof-link">
                        View ID Document 📄
                      </a>
                    </div>
                    
                    <div className="v-socials">
                      <label>Social Links</label>
                      <div className="v-social-tags">
                        {req.socialLinks?.instagram && <span className="pill">IG: {req.socialLinks.instagram}</span>}
                        {req.socialLinks?.youtube && <span className="pill">YT: {req.socialLinks.youtube}</span>}
                        {req.socialLinks?.twitter && <span className="pill">TW: {req.socialLinks.twitter}</span>}
                      </div>
                    </div>
                  </div>

                  {req.status === 'pending' && (
                    <div className="v-admin-actions">
                      <button className="btn btn-success" onClick={() => handleVerifyRequest(req._id, 'approved')}>Approve</button>
                      <button className="btn btn-danger" onClick={() => handleVerifyRequest(req._id, 'rejected')}>Reject</button>
                    </div>
                  )}
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

