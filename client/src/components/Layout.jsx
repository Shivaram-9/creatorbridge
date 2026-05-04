import { useEffect, useState, useRef } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import OfflineBanner from "./OfflineBanner.jsx";
import { api } from "../services/api.js";

function BottomNavItem({ to, icon, label, badgeCount }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `bottom-nav-item ${isActive ? "active" : ""}`}
    >
      <div className="bottom-nav-icon">
        {icon}
        {badgeCount > 0 && (
          <span className="bottom-nav-badge">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </div>
      <span className="bottom-nav-label">{label}</span>
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef(null);

  /* Poll notifications count */
  useEffect(() => {
    if (!user) return;
    async function fetchCount() {
      try {
        const data = await api.notifications.list();
        if (Array.isArray(data)) {
          const unread = data.filter(n => !n.read).length;
          setUnreadCount(unread || data.length);
        }
      } catch { /* silent */ }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  /* Close menu on click outside */
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <div className="layout">
      <OfflineBanner />
      <header className="header">
        <div className="header-inner container">
          <Link to="/home" className="logo">
            CreatorBridge
          </Link>

          {user && (
            <>
              <form className="search-container" onSubmit={handleSearch}>
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search creators & brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <div className="header-actions">
                <Link to="/notifications" className="nav-icon-btn" aria-label="Notifications">
                  🔔
                  {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                </Link>

                <div className="top-menu-container" ref={menuRef}>
                  <button
                    className="nav-icon-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Menu"
                  >
                    ☰
                  </button>
                  {menuOpen && (
                    <div className="dropdown-menu">
                      <Link to="/settings" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                        ⚙ Settings
                      </Link>
                      <button
                        className="dropdown-item text-danger"
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                      >
                        🚪 Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      {user && (
        <nav className="bottom-nav">
          <BottomNavItem to="/home" icon="🏠" label="Home" />
          <BottomNavItem to="/reels" icon="🎬" label="Reels" />
          <BottomNavItem to="/connections" icon="🤝" label="Connections" />
          <BottomNavItem to="/messages" icon="💬" label="Messages" />
          <BottomNavItem to="/profile" icon="👤" label="Profile" />
        </nav>
      )}
    </div>
  );
}

