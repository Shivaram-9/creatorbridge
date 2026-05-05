import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BellIcon, MenuIcon, SearchIcon } from "./Icons.jsx";
import { getSocket } from "../services/socket.js";

export default function Navbar({ 
  user, searchQuery, setSearchQuery, handleSearch, 
  unreadCount, notifications, onMarkRead,
  menuOpen, setMenuOpen, menuRef, logout 
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const notifRef = useRef(null);
  const navigate = useNavigate();

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
            <form className="search-container" onSubmit={handleSearch}>
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
            </form>

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

              <div className="top-menu-container" ref={menuRef}>
                <button
                  className="nav-icon-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Menu"
                  style={{ position: 'relative' }}
                >
                  <MenuIcon />
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
          </>
        )}
      </div>
    </header>
  );
}
