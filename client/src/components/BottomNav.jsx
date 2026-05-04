import { NavLink } from "react-router-dom";

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

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <BottomNavItem to="/home" icon="🏠" label="Home" />
      <BottomNavItem to="/reels" icon="🎬" label="Reels" />
      <BottomNavItem to="/connections" icon="👥" label="Connections" />
      <BottomNavItem to="/messages" icon="💬" label="Messages" />
      <BottomNavItem to="/profile" icon="👤" label="Profile" />
    </nav>
  );
}
