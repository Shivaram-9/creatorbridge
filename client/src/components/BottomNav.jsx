import { NavLink } from "react-router-dom";
import { HomeIcon, UsersIcon, MessageIcon, ProfileIcon, BriefcaseIcon } from "./Icons.jsx";

function BottomNavItem({ to, icon, label, badgeCount }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
    >
      <div className="nav-tab-icon">
        {icon}
        {badgeCount > 0 && (
          <span className="badge-dot" style={{ top: '-4px', right: '-8px' }}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </div>
      <span className="nav-tab-label">{label}</span>
    </NavLink>
  );
}

export default function BottomNav({ msgUnreadCount }) {
  return (
    <nav className="bottom-nav-fixed">
      <div className="bottom-nav-inner">
        <BottomNavItem to="/home" icon={<HomeIcon />} label="Home" />
        <BottomNavItem to="/discover" icon={<UsersIcon />} label="Discover" />
        <BottomNavItem to="/messages" icon={<MessageIcon />} label="Messages" badgeCount={msgUnreadCount} />
        <BottomNavItem to="/deals" icon={<BriefcaseIcon />} label="Deals" />
        <BottomNavItem to="/profile" icon={<ProfileIcon />} label="Profile" />
      </div>
    </nav>
  );
}

