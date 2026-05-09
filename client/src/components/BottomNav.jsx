import { NavLink } from "react-router-dom";
import { HomeIcon, UsersIcon, MessageIcon, ProfileIcon, BriefcaseIcon } from "./Icons.jsx";

export default function BottomNav({ msgUnreadCount }) {
  return (
    <nav className="bottom-nav-fixed">
      <div className="bottom-nav-inner">
        <NavLink to="/home" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : ""}`}>
          <HomeIcon />
          <span className="nav-tab-label">Home</span>
        </NavLink>
        
        <NavLink to="/discover" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : ""}`}>
          <UsersIcon />
          <span className="nav-tab-label">Discover</span>
        </NavLink>
        
        <NavLink to="/messages" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : ""}`}>
          <div className="relative">
            <MessageIcon />
            {msgUnreadCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-indigo-600 text-white text-[9px] flex items-center justify-center rounded-full border border-white font-bold">
                {msgUnreadCount > 9 ? "9+" : msgUnreadCount}
              </span>
            )}
          </div>
          <span className="nav-tab-label">Messages</span>
        </NavLink>

        <NavLink to="/deals" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : ""}`}>
          <BriefcaseIcon />
          <span className="nav-tab-label">Deals</span>
        </NavLink>
        
        <NavLink to="/profile" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : ""}`}>
          <ProfileIcon />
          <span className="nav-tab-label">Profile</span>
        </NavLink>
      </div>
    </nav>

  );
}
