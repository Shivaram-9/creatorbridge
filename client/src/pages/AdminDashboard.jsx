import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Avatar from "../components/Avatar.jsx";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, r, u] = await Promise.all([
        api.admin.getStats(),
        api.admin.getReports(),
        api.admin.getUsers()
      ]);
      setStats(s);
      setReports(r);
      setUsers(u);
    } catch (err) {
      console.error("Failed to load admin data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveReport = async (id, status) => {
    try {
      await api.admin.resolveReport(id, status);
      setReports(prev => prev.map(r => r._id === id ? { ...r, status } : r));
    } catch (err) {
      alert("Failed to update report");
    }
  };

  const handleToggleBan = async (userId) => {
    if (!window.confirm("Are you sure you want to change this user's ban status?")) return;
    try {
      const res = await api.admin.toggleBan(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, isBanned: res.isBanned } : u));
    } catch (err) {
      alert("Failed to toggle ban");
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("FORCE DELETE this post? This cannot be undone.")) return;
    try {
      await api.admin.deletePost(postId);
      alert("Post deleted successfully");
    } catch (err) {
      alert("Failed to delete post");
    }
  };

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#1a1a1a' }}>Moderation Panel</h1>
        <p style={{ color: '#666' }}>Platform management and community safety</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2rem', borderBottom: '1px solid #eee', marginBottom: '2rem' }}>
        {['overview', 'reports', 'users'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '1rem 0.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--accent)' : '#666',
              fontWeight: 600,
              textTransform: 'capitalize',
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <StatCard title="Total Users" value={stats?.userCount} color="#1d9bf0" />
          <StatCard title="Total Posts" value={stats?.postCount} color="#10b981" />
          <StatCard title="Pending Reports" value={stats?.pendingReports} color="#f59e0b" />
        </div>
      )}

      {activeTab === 'reports' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reports.length === 0 ? <p>No reports found.</p> : reports.map(report => (
            <div key={report._id} style={{ padding: '1.5rem', background: 'white', borderRadius: '12px', border: '1px solid #eee' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: '20px', 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    backgroundColor: report.status === 'pending' ? '#fff7ed' : '#f0fdf4',
                    color: report.status === 'pending' ? '#9a3412' : '#166534',
                    textTransform: 'uppercase'
                  }}>
                    {report.status}
                  </span>
                  <h3 style={{ margin: '8px 0 4px', fontSize: '16px' }}>Reason: {report.reason}</h3>
                  <p style={{ color: '#666', fontSize: '14px' }}>{report.description}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {report.status === 'pending' && (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => handleResolveReport(report._id, 'resolved')}>Resolve</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleResolveReport(report._id, 'dismissed')}>Dismiss</button>
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid #f5f5f5' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Reporter</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Avatar user={report.reporter} size="xs" />
                    <span style={{ fontSize: '14px' }}>{report.reporter?.username}</span>
                  </div>
                </div>
                {report.targetUser && (
                  <div>
                    <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Target User</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar user={report.targetUser} size="xs" />
                      <span style={{ fontSize: '14px' }}>{report.targetUser?.username}</span>
                      <button 
                        className={`btn btn-xs ${report.targetUser.isBanned ? 'btn-success' : 'btn-danger'}`}
                        onClick={() => handleToggleBan(report.targetUser._id)}
                        style={{ marginLeft: 'auto' }}
                      >
                        {report.targetUser.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </div>
                  </div>
                )}
                {report.targetPost && (
                  <div style={{ gridColumn: 'span 2', marginTop: '8px' }}>
                    <label style={{ fontSize: '12px', color: '#999', display: 'block', marginBottom: '4px' }}>Target Post</label>
                    <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#444' }}>{report.targetPost.text?.slice(0, 100)}...</span>
                      <button className="btn btn-xs btn-danger" onClick={() => handleDeletePost(report.targetPost._id)}>Delete Post</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'users' && (
        <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #eee', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #eee' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', color: '#666' }}>User</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', color: '#666' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '13px', color: '#666' }}>Joined</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontSize: '13px', color: '#666' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Avatar user={u} size="sm" />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{u.name || u.username}</div>
                        <div style={{ fontSize: '12px', color: '#888' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '14px', textTransform: 'capitalize' }}>{u.role}</td>
                  <td style={{ padding: '1rem', fontSize: '14px', color: '#666' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    {u.role !== 'admin' && (
                      <button 
                        className={`btn btn-sm ${u.isBanned ? 'btn-success' : 'btn-danger'}`}
                        onClick={() => handleToggleBan(u._id)}
                      >
                        {u.isBanned ? "Unban User" : "Ban User"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, color }) {
  return (
    <div style={{ 
      padding: '1.5rem', 
      background: 'white', 
      borderRadius: '16px', 
      border: '1px solid #eee',
      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    }}>
      <h4 style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>{title}</h4>
      <div style={{ fontSize: '28px', fontWeight: 800, color: color }}>{value || 0}</div>
    </div>
  );
}
