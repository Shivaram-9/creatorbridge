import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { CheckCircleIcon, UsersIcon, CheckCircle2, XCircleIcon } from "lucide-react";
import Avatar from "../components/Avatar.jsx";
import { api } from "../services/api.js";
import toast from "react-hot-toast";
import "./BrandDashboard.css";

export default function BrandDashboard() {
  const { user } = useAuth();

  const [applications, setApplications] = useState([]);

  useEffect(() => {
    async function fetchApps() {
      try {
        const data = await api.campaigns.getBrandApplications();
        if (!data.error) setApplications(data);
      } catch (err) {
        toast.error("Failed to load applications");
      }
    }
    fetchApps();
  }, []);

  const handleAction = async (appId, campaignId, action) => {
    try {
      const res = await api.campaigns.respond(campaignId, { status: action === 'accepted' ? 'Accepted' : 'Rejected', userId: appId });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setApplications(prev => prev.map(app => 
        app._id === appId ? { ...app, status: action === 'accepted' ? 'Accepted' : 'Rejected' } : app
      ));
      if (action === 'accepted') {
        toast.success("Creator Accepted!");
      } else {
        toast.error("Application Rejected");
      }
    } catch {
      toast.error("Action failed");
    }
  };

  return (
    <div className="brand-dashboard container slide-in" style={{ padding: '30px 20px', maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Brand Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your active campaigns and creators.</p>
        </div>
        <Link to="/campaigns/create" style={{ background: '#2563EB', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none' }}>
          + Create Campaign
        </Link>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div className="stat-box card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Campaigns</span>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0', fontWeight: 'bold' }}>8</h2>
        </div>
        <div className="stat-box card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Applications</span>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0', fontWeight: 'bold' }}>142</h2>
        </div>
        <div className="stat-box card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Creators Hired</span>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0', fontWeight: 'bold' }}>21</h2>
        </div>
        <div className="stat-box card" style={{ padding: '20px', borderRadius: '12px', background: 'var(--bg-secondary)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Campaign Reach</span>
          <h2 style={{ fontSize: '28px', margin: '8px 0 0 0', fontWeight: 'bold', color: '#10b981' }}>2.1M</h2>
        </div>
      </div>

      <div className="campaign-block card" style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-primary)', border: '1px solid var(--border-light)', marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              All Applications
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: 600 }}>
            <span>Total: <strong style={{ color: '#2563EB' }}>{applications.length}</strong></span>
            <span style={{ color: '#10b981' }}>Accepted: <strong>{applications.filter(a => a.status === 'Accepted').length}</strong></span>
            <span style={{ color: '#dc2626' }}>Rejected: <strong>{applications.filter(a => a.status === 'Rejected').length}</strong></span>
          </div>
        </div>

        <div className="applications-list">
          <h4 style={{ marginBottom: '16px', fontSize: '15px' }}>Recent Applications</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {applications.length === 0 && <div className="empty-state">No applications found.</div>}
            {applications.map(app => (
              <div key={app._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <img src={app.influencer?.avatar || "/default-avatar.png"} alt="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h5 style={{ margin: 0, fontSize: '15px' }}>{app.influencer?.name}</h5>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', alignItems: 'center' }}>
                      <span>Campaign: {app.campaign?.title}</span>
                      <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>{app.expectedPayment}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {app.portfolio && (
                    <a href={app.portfolio} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', background: 'transparent', border: '1px solid var(--border-light)', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'none', color: 'var(--text-main)' }}>Portfolio</a>
                  )}
                  {app.status === 'Pending' ? (
                    <>
                      <button onClick={() => handleAction(app.influencer._id, app.campaign._id, 'accepted')} style={{ padding: '6px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Accept</button>
                      <button onClick={() => handleAction(app.influencer._id, app.campaign._id, 'rejected')} style={{ padding: '6px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Reject</button>
                    </>
                  ) : (
                    <span style={{ padding: '6px 16px', background: app.status === 'Accepted' ? '#dcfce7' : '#fee2e2', color: app.status === 'Accepted' ? '#166534' : '#991b1b', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>{app.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
