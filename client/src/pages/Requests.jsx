import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import Avatar from "../components/Avatar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { UsersIcon } from "../components/Icons.jsx";
import "./Requests.css";

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await api.privacy.getRequests();
        if (data.error) setError(data.error);
        else setRequests(data);
      } catch {
        setError("Failed to load requests");
      } finally {
        setLoading(false);
      }
    }
    loadRequests();
  }, []);

  const handleAction = async (id, action) => {
    try {
      const res = await api.privacy.respondRequest(id, action);
      if (res.error) setError(res.error);
      else {
        setRequests(prev => prev.filter(r => r._id !== id));
      }
    } catch {
      setError("Failed to process request");
    }
  };

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="requests-page slide-up-fade">
      <header className="page-header-block">
        <h1 className="page-title-main">Connection Requests</h1>
        <p className="page-subtitle-main">People who want to follow you and see your private content.</p>
      </header>



      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {requests.length === 0 ? (
        <div className="empty-requests empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div className="empty-icon"><UsersIcon style={{ width: '48px', height: '48px', color: '#94a3b8', marginBottom: '16px' }} /></div>
          <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No pending requests</h3>
          <p style={{ color: '#64748b', fontSize: '14px' }}>When someone requests to connect with you, they'll show up here.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map(req => (
            <div key={req._id} className="request-card">
              <div className="request-user">
                <Avatar user={req.sender} size="lg" />
                <div className="user-info">
                  <strong>{req.sender.name}</strong>
                  <span>@{req.sender.username}</span>
                </div>
              </div>
              <div className="request-actions">
                <button className="btn btn-primary" onClick={() => handleAction(req._id, 'accept')}>Accept</button>
                <button className="btn btn-secondary" onClick={() => handleAction(req._id, 'reject')}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
