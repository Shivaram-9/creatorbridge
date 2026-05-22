import { Link, useLocation } from "react-router-dom";
import { 
  HomeIcon, 
  SearchIcon, 
  UsersIcon, 
  BriefcaseIcon, 
  MessageIcon, 
  BookmarkIcon, 
  ProfileIcon 
} from "./Icons.jsx";
import "./Sidebar.css";

export default function Sidebar({ user, msgUnreadCount = 0, logout }) {
  const location = useLocation();

  const menuItems = [
    { name: "Home", path: "/home", icon: <HomeIcon /> },
    { name: "Discover", path: "/discover", icon: <SearchIcon /> },
    { name: "Messages", path: "/messages", icon: <MessageIcon />, badge: msgUnreadCount },
    { name: "Profile", path: user ? `/user/${user._id}` : "/profile", icon: <ProfileIcon /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link to="/home" className="logo-text">
          <span className="logo-icon">🔷</span> Pactogram
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
          <span className="sidebar-icon">⚙️</span>
          <span className="sidebar-label">Settings</span>
        </Link>
        <Link to="/settings" className="sidebar-item">
          <span className="sidebar-icon">❓</span>
          <span className="sidebar-label">Help Center</span>
        </Link>
        <button className="sidebar-item logout-btn" onClick={logout}>
          <span className="sidebar-icon">🚪</span>
          <span className="sidebar-label">Logout</span>
        </button>
      </div>
    </aside>
  );
}
