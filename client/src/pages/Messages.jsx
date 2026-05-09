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
    <div className="messaging-v3-container slide-up-fade">
      {/* Sidebar: List of conversations */}
      <aside className={`messages-sidebar-pro ${userId ? 'hidden md:flex' : 'flex'}`}>
        <header className="sidebar-header-pro">
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Messages</h1>
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </header>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <div className="sidebar-scroll-area">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-medium">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-500 text-sm">No messages yet.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div 
                key={conv._id} 
                className={`chat-item-v3 ${userId === conv.partner._id ? 'active' : ''}`}
                onClick={() => navigate(`/messages/${conv.partner._id}`)}
              >
                <div className="relative">
                  <Avatar user={conv.partner} size="md" />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-600 border-2 border-white rounded-full"></span>
                  )}
                </div>
                <div className="chat-item-info">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className="chat-item-name">{conv.partner.name || conv.partner.username}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{formatTime(conv.lastMessage.createdAt)}</span>
                  </div>
                  <p className={`chat-item-preview ${conv.unreadCount > 0 ? 'font-bold text-slate-900' : ''}`}>
                    {conv.lastMessage.content || (conv.lastMessage.media ? "📷 Photo" : "Media")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className={`chat-detail-view-pro ${userId ? 'flex' : 'hidden md:flex'}`}>
        {userId ? (
          <Chat standalone={false} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/30">
            <div className="w-24 h-24 bg-white rounded-full shadow-premium flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Messages</h2>
            <p className="text-slate-500 max-w-xs">Send private photos and messages to a friend or brand.</p>
            <button className="mt-8 px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
              Send Message
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
