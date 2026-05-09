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
    <div className="messages-v2 slide-up-fade">
      <header className="page-header-block">
        <h1 className="page-title-main">Messages</h1>
      </header>


      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div className="content-container-pro slide-up-fade">
        <div className="messages-list-wrap">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="p-20 text-center">
              <div className="text-5xl mb-6">💬</div>
              <h3 className="text-xl font-bold text-slate-800">No conversations yet</h3>
              <p className="text-slate-500 mt-2">Messages from brands and creators will appear here.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv._id} 
                className="chat-item-pro"
                onClick={() => navigate(`/chat/${conv.partner._id}`)}
              >
                <Avatar user={conv.partner} size="md" />
                <div className="chat-info-pro">
                  <div className="chat-name-row">
                    <span className="chat-user-name">{conv.partner.name || conv.partner.username}</span>
                    <span className="chat-timestamp">{formatTime(conv.lastMessage.createdAt)}</span>
                  </div>
                  <p className="chat-preview-text">
                    {conv.lastMessage.content || (conv.lastMessage.media ? "📷 Photo" : "Media")}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full"></span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
