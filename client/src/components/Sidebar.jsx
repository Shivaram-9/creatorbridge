import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  const menuItems = [
    { name: "Home", path: "/home", icon: <HomeIcon /> },
    { name: "Discover", path: "/discover", icon: <SearchIcon /> },
    { name: "Messages", path: "/messages", icon: <MessageIcon />, badge: msgUnreadCount },
    { name: "Find Your Collab", path: "/search", icon: <UsersIcon /> },
    { name: "Campaigns", path: "/campaigns", icon: <BriefcaseIcon /> },
    { name: "Profile", path: "/profile", icon: <ProfileIcon /> },
  ];

  const handleOpenPostModal = () => {
    const params = new URLSearchParams(location.search);
    params.set('create', 'true');
    navigate(location.pathname + '?' + params.toString());
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link to="/home" className="logo-text" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/LOGOAPP1.png" alt="Pactogram" className="dark:invert" style={{ height: '36px', width: 'auto', flexShrink: 0 }} />
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

        <div className="mt-6 mb-2 hidden md:block px-4">
          <button 
            onClick={handleOpenPostModal}
            className="w-full bg-blue-600 dark:bg-blue-600 text-white font-bold py-3.5 rounded-full hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            <span className="text-xl leading-none -mt-0.5">+</span> Post
          </button>
        </div>
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
