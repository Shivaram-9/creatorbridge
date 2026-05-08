import { NavLink } from "react-router-dom";
import { HomeIcon, UsersIcon, MessageIcon, ProfileIcon, BriefcaseIcon } from "./Icons.jsx";

function BottomNavItem({ to, icon, label, badgeCount }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `bottom-tab-pro ${isActive ? "active" : ""}`}
    >
      <div className="tab-icon-wrap" style={{ fontSize: '1.4rem', position: 'relative', display: 'flex' }}>
        {icon}
        {badgeCount > 0 && (
          <span className="badge-dot" style={{ top: '-4px', right: '-8px', fontSize: '0.65rem' }}>
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </div>
      <span className="tab-label">{label}</span>
    </NavLink>
  );
}

export default function BottomNav({ msgUnreadCount }) {
  return (
    <nav className="bottom-nav-pro">
      <div className="bottom-nav-content">
        <BottomNavItem to="/home" icon={<HomeIcon />} label="Home" />
        <BottomNavItem to="/discover" icon={<UsersIcon />} label="Discover" />
        <BottomNavItem to="/messages" icon={<MessageIcon />} label="Messages" badgeCount={msgUnreadCount} />
        <BottomNavItem to="/deals" icon={<BriefcaseIcon />} label="Deals" />
        <BottomNavItem to="/profile" icon={<ProfileIcon />} label="Profile" />
      </div>
    </nav>
  );
}


