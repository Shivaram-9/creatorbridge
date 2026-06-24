import { Link, NavLink, useLocation } from "react-router-dom";
import { 
  HomeIcon, 
  SearchIcon, 
  UsersIcon, 
  BriefcaseIcon, 
  MessageIcon, 
  BookmarkIcon, 
  ProfileIcon,
  SettingsIcon,
  HelpCircleIcon,
  LogOutIcon,
  ShieldIcon
} from "./Icons.jsx";
import "./Sidebar.css";

export default function Sidebar({ user, msgUnreadCount = 0, logout, openHelpCenter }) {
  const location = useLocation();

  const menuItems = [
    { name: "Home", path: "/home", icon: <HomeIcon /> },
    { name: "Discover", path: "/discover", icon: <SearchIcon /> },
    { name: "Messages", path: "/messages", icon: <MessageIcon />, badge: msgUnreadCount },
    { name: "Find Your Collab", path: "/search", icon: <UsersIcon /> },
    { name: "Profile", path: "/profile", icon: <ProfileIcon /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link to="/home" className="logo-text" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/LOGOAPP1.png" alt="Pactogram" style={{ height: '36px', width: 'auto', flexShrink: 0 }} />
        </Link>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`sidebar-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.name}</span>
              {item.badge > 0 && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">


        <Link to="/settings" className={`sidebar-item ${location.pathname === '/settings' ? 'active' : ''}`}>
          <span className="sidebar-icon"><SettingsIcon /></span>
          <span className="sidebar-label">Settings</span>
        </Link>

        <button className="sidebar-item logout-btn" onClick={logout}>
          <span className="sidebar-icon"><LogOutIcon /></span>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
