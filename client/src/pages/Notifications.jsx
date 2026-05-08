import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import Avatar from "../components/Avatar.jsx";
import "./Notifications.css";

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [notifs, reqs] = await Promise.all([
        api.notifications.list(),
        api.privacy.getRequests()
      ]);
      
      if (notifs?.error) setError(notifs.error);
      else setItems(Array.isArray(notifs) ? notifs : []);
      
      if (reqs && !reqs.error) setPendingRequests(reqs);
    } catch {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const markAllAsRead = async () => {
    try {
      await api.notifications.markAllRead();
      setItems(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      setError("Failed to mark all as read");
    }
  };

  const handleNotifClick = async (n) => {
    if (!n.read) {
      api.notifications.markRead(n._id).catch(() => {});
      setItems(prev => prev.map(item => item._id === n._id ? { ...item, read: true } : item));
    }
    
    // Redirect based on type
    if (n.type === "follow") navigate(`/user/${n.sender?._id || n.sender}`);
    else if (n.type === "align_request") navigate(`/requests`);
    else if (n.type === "like" || n.type === "comment") navigate(`/post/${n.post?._id || n.post}`);
    else if (n.type === "campaign_invite" || n.type === "campaign_apply") navigate(`/collaborations`);
    else if (n.type === "chat" || n.type === "collab_message") navigate(`/chat/${n.sender?._id || n.sender}`);
    else if (n.type === "premium_upgrade") navigate(`/premium`);
    else if (n.type === "security_alert") navigate(`/settings`);
  };

  const filteredItems = items.filter(n => {
    if (filter === "all") return true;
    if (filter === "interactions") return ["like", "comment"].includes(n.type);
    if (filter === "connections") return ["follow", "align_request"].includes(n.type);
    return true;
  });

  const getIcon = (type) => {
    switch(type) {
      case 'like': return '❤️';
      case 'comment': return '💬';
      case 'follow': return '👤';
      case 'align_request': return '🔒';
      case 'campaign_invite':
      case 'campaign_apply': return '📋';
      case 'premium_upgrade': return '✨';
      case 'chat': return '✉️';
      case 'security_alert': return '🛡️';
      default: return '🔔';
    }
  };

  return (
    <div className="notifications-v3 container slide-in">
      <header className="notif-header">
        <div className="notif-header-top">
          <h1 className="page-title">Activity</h1>
          <button className="btn-text" onClick={markAllAsRead}>Mark all as read</button>
        </div>
        
        <div className="notif-filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'interactions' ? 'active' : ''} onClick={() => setFilter('interactions')}>Likes & Comments</button>
          <button className={filter === 'connections' ? 'active' : ''} onClick={() => setFilter('connections')}>Connections</button>
        </div>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {pendingRequests.length > 0 && filter === "all" && (
        <div className="requests-preview-notif" onClick={() => navigate('/requests')}>
          <div className="requests-avatar-stack">
            {pendingRequests.slice(0, 3).map((r, i) => (
              <Avatar key={r._id} user={r.sender} size="sm" />
            ))}
          </div>
          <div className="requests-preview-text">
            <strong>Align Requests</strong>
            <span>{pendingRequests.length} pending requests</span>
          </div>
          <span className="arrow">→</span>
        </div>
      )}

      {loading ? (
        <div className="notif-skeleton">
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton-item" />)}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>No notifications here</h3>
          <p>We'll notify you when someone interacts with you.</p>
        </div>
      ) : (
        <div className="notif-list">
          {filteredItems.map(n => (
            <div 
              key={n._id} 
              className={`notif-item ${!n.read ? 'unread' : ''}`}
              onClick={() => handleNotifClick(n)}
            >
              <div className="notif-avatar">
                <Avatar user={n.sender} size="md" />
                <span className="notif-type-icon">{getIcon(n.type)}</span>
              </div>
              <div className="notif-info">
                <p className="notif-text">
                  <span className="username">{n.sender?.username || n.sender?.name || "System"}</span> {n.message}
                </p>
                <span className="notif-date">{timeAgo(n.createdAt)}</span>
              </div>
              {!n.read && <div className="unread-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
