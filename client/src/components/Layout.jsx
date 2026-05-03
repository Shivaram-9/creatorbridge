import { useEffect, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import OfflineBanner from "./OfflineBanner.jsx";
import { api } from "../services/api.js";

function NavLinkItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
      end={to === "/"}
    >
      {children}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  /* Poll notifications count on mount + every 60s */
  useEffect(() => {
    if (!user) return;

    async function fetchCount() {
      try {
        const data = await api.notifications.list();
        if (Array.isArray(data)) setUnreadCount(data.length);
      } catch {
        /* silent — badge is cosmetic */
      }
    }

    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="layout">
      <OfflineBanner />
      <header className="header">
        <div className="header-inner container">
          <Link to="/" className="logo">
            CreatorBridge
          </Link>
          {user && (
            <nav className="nav">
              <NavLinkItem to="/discover">Discover</NavLinkItem>
              <NavLinkItem to="/connections">Connections</NavLinkItem>
              <NavLinkItem to="/notifications">
                <span className="nav-notif-wrap">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="nav-badge" aria-label={`${unreadCount} notifications`}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
              </NavLinkItem>
              <NavLinkItem to="/settings">⚙ Settings</NavLinkItem>
            </nav>
          )}
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
