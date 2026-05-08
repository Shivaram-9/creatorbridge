import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import Avatar from "../components/Avatar.jsx";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchConversations() {
      try {
        const data = await api.messages.list();
        if (data?.error) {
          setError(data.error);
        } else {
          const sorted = Array.isArray(data) ? [...data].sort((a, b) => {
            if ((a.unreadCount > 0) && (b.unreadCount === 0)) return -1;
            if ((a.unreadCount === 0) && (b.unreadCount > 0)) return 1;
            return new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt);
          }) : [];
          setConversations(sorted);
        }
      } catch {
        setError("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, []);

  const formatTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const then = new Date(date);
    const diff = now - then;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return then.toLocaleDateString();
  };

  return (
    <div className="messages-v2">
      <div className="header-inner" style={{ padding: '0 0 1rem' }}>
        <h1 className="page-title">Messages</h1>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div className="msg-content slide-in">
        <div className="chat-list">
          {loading ? (
            <p className="loading-line">Loading chats...</p>
          ) : conversations.length === 0 ? (
            <div className="empty-state" style={{ marginTop: '4rem' }}>
              <div className="empty-state__illustration">💬</div>
              <p className="empty-state__text">No active chats yet.</p>
              <Link to="/discover" className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>
                Find creators
              </Link>
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv._id} 
                className={`chat-list-item ${conv.unreadCount > 0 ? 'chat-list-item--unread' : ''}`} 
                onClick={() => navigate(`/chat/${conv.partner._id}`)}
              >
                <div className="chat-item-avatar">
                  <Avatar user={conv.partner} size="md" showOnline />
                </div>
                <div className="chat-item-info">
                  <div className="chat-item-name" style={{ fontWeight: conv.unreadCount > 0 ? 700 : 500 }}>
                    {conv.partner.name || conv.partner.username}
                  </div>
                  <div className="chat-item-last" style={{ color: conv.unreadCount > 0 ? 'var(--text)' : 'var(--text-muted)' }}>
                    {conv.lastMessage.content || (conv.lastMessage.media ? "📷 Photo" : "Media")} · {formatTime(conv.lastMessage.createdAt)}
                  </div>
                </div>
                {conv.unreadCount > 0 && (
                  <div className="unread-badge">
                    {conv.unreadCount}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
