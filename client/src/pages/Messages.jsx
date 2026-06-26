import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import Avatar from "../components/Avatar.jsx";
import Chat from "./Chat.jsx";
import { MessageIcon, SearchIcon } from "../components/Icons.jsx";
import "./Messages.css";

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userId } = useParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

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
            const timeA = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt) : 0;
            const timeB = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt) : 0;
            return timeB - timeA;
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

  useEffect(() => {
    async function searchUsers() {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }
      setIsSearching(true);
      try {
        const results = await api.users.search(searchQuery);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch {
        console.error("Failed to search users");
      } finally {
        setIsSearching(false);
      }
    }
    const timer = setTimeout(searchUsers, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredConversations = conversations.filter(conv => {
    if (!conv || !conv.partner) return false;
    const q = searchQuery.toLowerCase();
    const partner = conv.partner;
    const username = (partner.username || "").toLowerCase();
    const name = (partner.name || "").toLowerCase();
    return username.includes(q) || name.includes(q);
  });

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
        <header className="sidebar-header-pro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
          <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>Messages</h1>
          <button 
            onClick={() => document.getElementById('message-search-input')?.focus()}
            style={{ padding: '8px', background: 'none', border: 'none', cursor: 'pointer' }}
            title="New Message"
          >
            <svg style={{ width: '24px', height: '24px', color: 'var(--text-main)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </header>

        <div style={{ padding: '0 20px 16px' }}>
          <div style={{ background: 'var(--bg-main)', borderRadius: '8px', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>🔍</span>
            <input 
              id="message-search-input"
              type="text" 
              placeholder="Search people or messages" 
              style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', width: '100%', color: 'var(--text-main)' }} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        <div className="sidebar-scroll-area" style={{ flex: 1, overflowY: 'auto' }}>
          {searchQuery && (
            <div className="search-results-section" style={{ borderBottom: '1px solid var(--border-light)', marginBottom: '10px' }}>
              <p style={{ padding: '0 20px 8px', fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Profiles</p>
              {isSearching ? (
                <div style={{ padding: '10px 20px', fontSize: '13px', color: '#64748b' }}>Searching...</div>
              ) : searchResults.length === 0 ? (
                <div style={{ padding: '10px 20px', fontSize: '13px', color: '#64748b' }}>No profiles found</div>
              ) : (
                searchResults.map(user => (
                  <div 
                    key={user._id} 
                    className={`chat-item-v3 search-result-item ${userId === user._id ? 'active' : ''}`}
                    onClick={() => {
                      setSearchQuery("");
                      navigate(`/messages/${user._id}`);
                    }}
                    style={{ padding: '8px 20px' }}
                  >
                    <Avatar user={user} size="sm" />
                    <div className="chat-item-info" style={{ marginLeft: '12px' }}>
                      <span style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-main)' }}>{user.name || user.username}</span>
                      <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>@{user.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!searchQuery && (
            <p style={{ padding: '0 20px 8px', fontSize: '12px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase' }}>Recent</p>
          )}

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>Loading chats...</div>
          ) : filteredConversations.length === 0 && !searchQuery ? (
            <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div className="empty-icon"><MessageIcon style={{ width: '48px', height: '48px', color: '#94a3b8', marginBottom: '16px' }} /></div>
              <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No messages yet</h3>
              <p style={{ color: '#64748b', fontSize: '14px' }}>When you connect with others, your conversations will appear here.</p>
            </div>
          ) : (
            filteredConversations.map(conv => conv && conv.partner && (
              <div 
                key={conv._id} 
                className={`chat-item-v3 ${userId === conv.partner?._id ? 'active' : ''}`}
                onClick={() => navigate(`/messages/${conv.partner?._id}`)}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar user={conv.partner} size="md" />
                  {conv.unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '-2px', right: '-2px', width: '12px', height: '12px', background: 'var(--primary)', border: '2px solid white', borderRadius: '50%' }}></span>
                  )}
                </div>
                <div className="chat-item-info">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                    <span className="chat-item-name">{conv.partner?.name || conv.partner?.username || "Unknown User"}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{conv.lastMessage?.createdAt ? formatTime(conv.lastMessage.createdAt) : ""}</span>
                  </div>
                  <p className="chat-item-preview" style={{ fontWeight: conv.unreadCount > 0 ? '700' : '400', color: conv.unreadCount > 0 ? 'var(--text-main)' : 'var(--text-muted)' }}>
                    {conv.lastMessage?.content || (conv.lastMessage?.media ? "📷 Photo" : "Media")}
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
            {/* Removed the broken 'Your Messages' layout as requested */}
          </div>
        )}
      </main>
    </div>
  );
}
