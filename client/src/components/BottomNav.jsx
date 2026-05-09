import { NavLink } from "react-router-dom";
import { HomeIcon, UsersIcon, MessageIcon, ProfileIcon, BriefcaseIcon } from "./Icons.jsx";

export default function BottomNav({ msgUnreadCount }) {
  return (
    <nav className="bottom-nav-fixed">
      <div className="bottom-nav-inner">
        <NavLink to="/home" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : ""}`}>
          <div className="nav-tab-icon"><HomeIcon /></div>
          <span>Home</span>
        </NavLink>
        
        <NavLink to="/discover" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : ""}`}>
          <div className="nav-tab-icon"><UsersIcon /></div>
          <span>Discover</span>
        </NavLink>
        
        <NavLink to="/messages" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : ""}`}>
          <div className="nav-tab-icon">
            <MessageIcon />
            {msgUnreadCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-indigo-600 text-white text-[9px] flex items-center justify-center rounded-full border border-white">
                {msgUnreadCount > 9 ? "9+" : msgUnreadCount}
              </span>
            )}
          </div>
          <span>Messages</span>
        </NavLink>

        <NavLink to="/deals" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : ""}`}>
          <div className="nav-tab-icon"><BriefcaseIcon /></div>
          <span>Deals</span>
        </NavLink>
        
        <NavLink to="/profile" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : ""}`}>
          <div className="nav-tab-icon"><ProfileIcon /></div>
          <span>Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
