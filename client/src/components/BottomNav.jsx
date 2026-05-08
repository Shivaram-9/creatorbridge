import { NavLink } from "react-router-dom";
import { HomeIcon, UsersIcon, MessageIcon, ProfileIcon } from "./Icons.jsx";

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

export default function BottomNav({ msgUnreadCount }) {
  return (
    <nav className="bottom-nav">
      <BottomNavItem to="/home" icon={<HomeIcon />} label="Home" />
      <BottomNavItem to="/discover" icon={<UsersIcon />} label="Discover" />
      <BottomNavItem to="/messages" icon={<MessageIcon />} label="Messages" badgeCount={msgUnreadCount} />
      <BottomNavItem to="/profile" icon={<ProfileIcon />} label="Profile" />
    </nav>
  );
}
