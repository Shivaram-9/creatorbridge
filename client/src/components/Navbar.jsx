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
          api.users.search(searchQuery, { signal: abortController.signal }),
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
    } else if (n.post) {
      navigate(`/home`); // Could be a post detail page if we had one
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
      if (searchResults && searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  return (
    <header className="header">
      <div className="header-inner container">
        <Link to="/home" className="logo">
          CreatorBridge
        </Link>

        {user && (
          <>
            <div className="header-actions">
              <div className="top-menu-container" ref={notifRef}>
                <button 
                  className="nav-icon-btn" 
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notifications"
                >
                  <BellIcon />
                  {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="dropdown-menu dropdown-menu--notif slide-in">
                    <div className="dropdown-header">Notifications</div>
                    <div className="dropdown-scroll">
                      {notifications.length === 0 ? (
                        <div className="dropdown-item dropdown-item--empty">No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n._id} 
                            className={`dropdown-item dropdown-item--notif ${!n.read ? 'unread' : ''}`}
                            onClick={() => handleNotifClick(n)}
                          >
                            <div className="notif-content">
                              <p className="notif-text">{n.message}</p>
                              <span className="notif-time">{formatTime(n.createdAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Link to="/notifications" className="dropdown-footer" onClick={() => setNotifOpen(false)}>
                      View all
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/messages" className="nav-icon-btn" aria-label="Messages">
                <MessageIcon />
                {msgUnreadCount > 0 && <span className="nav-badge">{msgUnreadCount}</span>}
              </Link>
              <div className="top-menu-container" ref={menuRef}>
                <button
                  className="nav-icon-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Menu"
                  style={{ position: 'relative', padding: '0.25rem' }}
                >
                  <Avatar user={user} size="sm" />
                  <span 
                    className={`status-dot status-dot--${socketStatus}`}
                    title={`Live status: ${socketStatus.charAt(0).toUpperCase() + socketStatus.slice(1)}`}
                    style={{
                      position: 'absolute',
                      bottom: '2px',
                      right: '2px',
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      border: '2px solid white',
                      backgroundColor: socketStatus === 'online' ? '#10b981' : socketStatus === 'connecting' ? '#f59e0b' : '#ef4444',
                      boxShadow: socketStatus === 'online' ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none',
                      animation: socketStatus === 'connecting' ? 'pulse 1.5s infinite' : 'none'
                    }}
                  />
                </button>
                <style>{`
                  @keyframes pulse {
                    0% { transform: scale(0.95); opacity: 0.8; }
                    50% { transform: scale(1.1); opacity: 1; }
                    100% { transform: scale(0.95); opacity: 0.8; }
                  }
                `}</style>
                {menuOpen && (
                    <div className="dropdown-menu slide-in">
                      {user && user.role === "admin" && (
                        <Link to="/admin" className="dropdown-item" style={{ color: 'var(--accent)', fontWeight: 700 }} onClick={() => setMenuOpen(false)}>
                          Admin Panel
                        </Link>
                      )}
                      {!user.isEmailVerified && (
                        <Link to="/verify-email" className="dropdown-item" style={{ color: 'var(--warning)', fontWeight: 600 }} onClick={() => setMenuOpen(false)}>
                          ⚠️ Verify Email
                        </Link>
                      )}
                      <Link to="/saved" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        Saved Posts
                      </Link>
                      <Link to="/analytics" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        Analytics
                      </Link>
                      <Link to="/settings" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        Settings
                      </Link>
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>

            <form className="search-container" onSubmit={handleSearch} ref={searchRef}>
              <span className="search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search creators & brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <SearchDropdown 
                results={searchResults} 
                loading={searchLoading} 
                onClose={() => setSearchResults(null)} 
              />
            </form>
          </>
        )}
      </div>
    </header>
  );
}
