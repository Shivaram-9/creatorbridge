import { NavLink } from "react-router-dom";
import { HomeIcon, UsersIcon, MessageIcon, ProfileIcon } from "./Icons.jsx";

export default function BottomNav({ msgUnreadCount }) {
  return (
    <nav className="bottom-nav-fixed">
      <div className="bottom-nav-inner">
        <NavLink to="/home" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : "text-gray-500"}`}>
          <HomeIcon />
          <span className="text-[10px] font-medium mt-1">Home</span>
        </NavLink>
        
        <NavLink to="/discover" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : "text-gray-500"}`}>
          <UsersIcon />
          <span className="text-[10px] font-medium mt-1">Discover</span>
        </NavLink>
        
        <NavLink to="/messages" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : "text-gray-500"}`}>
          <div className="relative">
            <MessageIcon />
            {msgUnreadCount > 0 && (
              <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold">
                {msgUnreadCount > 9 ? "9+" : msgUnreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1">Messages</span>
        </NavLink>
        
        <NavLink to="/profile" className={({ isActive }) => `nav-tab-pro ${isActive ? "active" : "text-gray-500"}`}>
          <ProfileIcon />
          <span className="text-[10px] font-medium mt-1">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
