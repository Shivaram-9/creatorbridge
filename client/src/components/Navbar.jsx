import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BellIcon, MenuIcon, SearchIcon, MessageIcon } from "./Icons.jsx";
import { getSocket } from "../services/socket.js";
import Avatar from "./Avatar.jsx";
import SearchDropdown from "./SearchDropdown.jsx";
import { api } from "../services/api.js";

export default function Navbar({ 
  user, searchQuery, setSearchQuery, handleSearch, 
  unreadCount, msgUnreadCount, notifications, onMarkRead,
  menuOpen, setMenuOpen, menuRef, logout 
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Live search with debounce and cancellation
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const abortController = new AbortController();

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [users, posts] = await Promise.all([
          api.discovery.search(searchQuery, { signal: abortController.signal }),
          api.search.posts(searchQuery, { signal: abortController.signal })
        ]);
        if (!abortController.signal.aborted) {
          setSearchResults({ users, posts });
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Search failed", err);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const updateStatus = () => setSocketStatus(socket.connected ? "online" : "offline");
    updateStatus();

    socket.on("connect", updateStatus);
    socket.on("disconnect", updateStatus);
    socket.on("connect_error", () => setSocketStatus("error"));

    return () => {
      socket.off("connect", updateStatus);
      socket.off("disconnect", updateStatus);
    };
  }, []);

  const handleNotifClick = (n) => {
    onMarkRead(n._id);
    setNotifOpen(false);
    if (n.type === "follow") {
      navigate(`/user/${n.sender?._id || n.sender}`);
    } else if (n.type === "align_request") {
      navigate(`/requests`);
    } else if (n.post) {
      navigate(`/home`); 
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  /* Close dropdowns on click outside */
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (isSearchOpen && searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen, isSearchOpen]);

  /* Reset on location change */
  useEffect(() => {
    setNotifOpen(false);
    setMenuOpen(false);
    setIsSearchOpen(false);
  }, [navigate]);

  return (
    <header className="navbar-fixed">
      <div className="navbar-content">
        <div className="brand-section">
          <Link to="/home" className="logo-main">
            CreatorBridge
          </Link>
        </div>

        {user && (
          <>
            <div className="search-section">
              <form className="search-bar-wrap" onSubmit={handleSearch} ref={searchRef}>
                <span className="search-bar-icon">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  className="search-bar-input"
                  placeholder="Search creators & brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                />
                {isSearchOpen && (
                  <SearchDropdown 
                    results={searchResults} 
                    loading={searchLoading} 
                    onClose={() => setIsSearchOpen(false)}
                    onItemClick={(item) => {
                      if (!item) return;
                      const saved = JSON.parse(localStorage.getItem("cb_recent_searches") || "[]");
                      const updated = [item, ...saved.filter(x => x._id !== item._id)].slice(0, 10);
                      localStorage.setItem("cb_recent_searches", JSON.stringify(updated));
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                  />
                )}
              </form>
            </div>

            <div className="actions-section">
              <div className="dropdown-container" ref={notifRef}>
                <button 
                  className="nav-action-btn" 
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notifications"
                >
                  <BellIcon />
                  {unreadCount > 0 && <span className="badge-dot" style={{ top: '4px', right: '4px' }}>{unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="dropdown-card slide-fade-in">
                    <div className="dropdown-header" style={{ padding: '12px', borderBottom: '1px solid var(--border-light)', fontWeight: 700 }}>Notifications</div>
                    <div className="dropdown-scroll" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                      {(!notifications || notifications.length === 0) ? (
                        <div className="dropdown-item-pro" style={{ color: 'var(--text-muted)', justifyContent: 'center' }}>No notifications</div>
                      ) : (
                        (notifications || []).map(n => (
                          <div 
                            key={n?._id} 
                            className={`dropdown-item-pro ${!n?.read ? 'unread' : ''}`}
                            onClick={() => handleNotifClick(n)}
                            style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                          >
                            <div className="notif-content" style={{ padding: '4px 0' }}>
                              <p className="notif-text" style={{ fontSize: '0.85rem' }}>{n?.message}</p>
                              <span className="notif-time" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n?.createdAt ? formatTime(n.createdAt) : ""}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link to="/notifications" className="dropdown-footer" onClick={() => setNotifOpen(false)} style={{ display: 'block', textAlign: 'center', padding: '12px', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none', borderTop: '1px solid var(--border-light)' }}>
                      View all activity
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/messages" className="nav-action-btn" aria-label="Messages">
                <MessageIcon />
                {msgUnreadCount > 0 && <span className="badge-dot" style={{ top: '4px', right: '4px' }}>{msgUnreadCount}</span>}
              </Link>

              <div className="dropdown-container" ref={menuRef}>
                <button
                  className="nav-action-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Menu"
                  style={{ position: 'relative', padding: '4px' }}
                >
                  <Avatar user={user} size="sm" />
                  <span 
                    className={`status-dot status-dot--${socketStatus}`}
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      border: '2px solid white',
                      backgroundColor: socketStatus === 'online' ? '#10b981' : socketStatus === 'connecting' ? '#f59e0b' : '#ef4444'
                    }}
                  />
                </button>
                {menuOpen && (
                  <div className="dropdown-card slide-fade-in" style={{ width: '250px', padding: '8px 0' }}>
                    {!user.isEmailVerified && (
                      <>
                        <Link to="/verify-email" className="dropdown-item-pro" style={{ color: '#f59e0b', fontWeight: 600 }} onClick={() => setMenuOpen(false)}>
                          <span style={{ marginRight: '10px' }}>⚠️</span> Verify Email
                        </Link>
                        <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                      </>
                    )}
                    
                    <Link to="/requests" className="dropdown-item-pro" onClick={() => setMenuOpen(false)}>
                      <span style={{ width: '24px', display: 'inline-block' }}></span> Align Requests
                    </Link>
                    <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                    
                    <Link to="/deals" className="dropdown-item-pro" onClick={() => setMenuOpen(false)}>
                      <span style={{ marginRight: '10px' }}>🤝</span> My Deals
                    </Link>
                    <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                    
                    <Link to="/saved" className="dropdown-item-pro" onClick={() => setMenuOpen(false)}>
                      <span style={{ width: '24px', display: 'inline-block' }}></span> Saved Posts
                    </Link>
                    <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                    
                    <Link to="/premium" className="dropdown-item-pro" style={{ color: '#6366f1', fontWeight: 600 }} onClick={() => setMenuOpen(false)}>
                      <span style={{ marginRight: '10px' }}>⭐</span> Upgrade to Premium
                    </Link>
                    <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                    
                    <Link to="/earnings" className="dropdown-item-pro" onClick={() => setMenuOpen(false)}>
                      <span style={{ marginRight: '10px' }}>💰</span> My Earnings
                    </Link>
                    <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                    
                    <Link to="/analytics" className="dropdown-item-pro" onClick={() => setMenuOpen(false)}>
                      <span style={{ width: '24px', display: 'inline-block' }}></span> Analytics
                    </Link>
                    <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                    
                    <Link to="/settings" className="dropdown-item-pro" onClick={() => setMenuOpen(false)}>
                      <span style={{ width: '24px', display: 'inline-block' }}></span> Settings
                    </Link>
                    <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }}></div>
                    
                    <button
                      className="dropdown-item-pro"
                      style={{ color: '#ef4444', width: '100%', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => { setMenuOpen(false); logout(); }}
                    >
                      <span style={{ width: '24px', display: 'inline-block' }}></span> Logout
                    </button>
                  </div>
                )}

              </div>
            </div>
          </>
        )}
      </div>
    </header>


  );
}
