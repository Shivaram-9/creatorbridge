import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import Avatar from "../components/Avatar.jsx";
import Chat from "./Chat.jsx";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userId } = useParams();
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
  }, [userId]);

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
    <div className="messaging-v3-container fade-up">
      {/* Sidebar: List of conversations */}
      <aside className={`messages-sidebar-pro ${userId ? 'hidden-mobile' : ''}`}>
        <header className="sidebar-header-pro">
          <h1>Messages</h1>
          <button style={{ padding: '8px', background: 'none', border: 'none', borderRadius: '50%', cursor: 'pointer' }}>
            <svg style={{ width: '24px', height: '24px', color: '#64748b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </header>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <div className="sidebar-scroll-area" style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>No messages yet.</div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv._id} 
                className={`chat-item-v3 ${userId === conv.partner._id ? 'active' : ''}`}
                onClick={() => navigate(`/messages/${conv.partner._id}`)}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar user={conv.partner} size="md" />
                  {conv.unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '12px', height: '12px', background: '#6366f1', border: '2px solid white', borderRadius: '50%' }}></span>
                  )}
                </div>
                <div className="chat-item-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <span className="chat-item-name">{conv.partner.name || conv.partner.username}</span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{formatTime(conv.lastMessage.createdAt)}</span>
                  </div>
                  <p className="chat-item-preview" style={{ fontWeight: conv.unreadCount > 0 ? '700' : '400', color: conv.unreadCount > 0 ? '#0f172a' : '#64748b' }}>
                    {conv.lastMessage.content || (conv.lastMessage.media ? "📷 Photo" : "Media")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={`chat-detail-view-pro ${!userId ? 'hidden-mobile' : ''}`}>
        {userId ? (
          <Chat standalone={false} />
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', textAlign: 'center', background: '#f8fafc' }}>
            <div style={{ width: '96px', height: '96px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)' }}>
              <svg style={{ width: '48px', height: '48px', color: '#6366f1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Your Messages</h2>
            <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '280px', margin: '0 auto' }}>Send private photos and messages to a friend or brand.</p>
            <button style={{ marginTop: '32px', padding: '12px 24px', background: '#6366f1', color: 'white', fontWeight: '700', borderRadius: '16px', border: 'none', cursor: 'pointer', boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.3)' }}>
              Send Message
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
