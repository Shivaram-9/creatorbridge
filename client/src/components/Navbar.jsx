import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BellIcon, SearchIcon, MessageIcon, ShieldIcon, UsersIcon } from "./Icons.jsx";
import { getSocket } from "../services/socket.js";
import Avatar from "./Avatar.jsx";
import SearchDropdown from "./SearchDropdown.jsx";
import { api } from "../services/api.js";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.jsx";

// Sun Icon
const SunIcon = () => (
  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

// Moon Icon
const MoonIcon = () => (
  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);

export default function Navbar({ 
  user, 
  unreadCount = 0, 
  msgUnreadCount = 0, 
  notifications = [], 
  onMarkRead = () => {}, 
  fetchNotifications,
  logout,
  openHelpCenter
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  useEffect(() => {
    if (!searchQuery || !searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const abortController = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const [users, posts] = await Promise.all([
          api.discovery.search(searchQuery, { signal: abortController.signal }),
          api.search.posts(searchQuery, { signal: abortController.signal })
        ]);
        if (!abortController.signal.aborted) {
          setSearchResults({ users, posts });
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error("Search failed", err);
      } finally {
        if (!abortController.signal.aborted) setSearchLoading(false);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      abortController.abort();
    };
  }, [searchQuery]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const updateStatus = () => setSocketStatus(socket.connected ? "online" : "offline");
    updateStatus();
    socket.on("connect", updateStatus);
    socket.on("disconnect", updateStatus);
    socket.on("connect_error", () => setSocketStatus("error"));
    return () => {
      socket.off("connect", updateStatus);
      socket.off("disconnect", updateStatus);
    };
  }, []);

  const handleBellClick = async () => {
    navigate('/notifications');
    if (unreadCount > 0) {
      try {
        await api.notifications.markAllRead();
        if (typeof fetchNotifications === 'function') {
          fetchNotifications();
        }
      } catch (err) {
        console.error("Failed to mark all as read", err);
      }
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (isSearchOpen && searchRef.current && !searchRef.current.contains(e.target)) setIsSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen, isSearchOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setIsSearchOpen(false);
  }, [navigate]);

  return (
    <header className="navbar-fixed">
      <div className="navbar-inner">
        <div>
          <Link to="/home" className="logo-main-text" style={{ display: 'flex', alignItems: 'center' }}>
            <img src="/LOGOAPP1.png" alt="Pactogram" className="navbar-logo-img" />
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user && (
            <>
              <button className="nav-icon-btn relative" onClick={handleBellClick}>
                <BellIcon filled={false} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>



              <Link 
                to="/search" 
                className="p-2 ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border-none bg-transparent cursor-pointer flex items-center justify-center text-slate-700 dark:text-slate-300 md:hidden"
                title="Collabs"
              >
                <UsersIcon />
              </Link>

              <div className="relative ml-2" ref={menuRef}>
                <button
                  className="bg-transparent border-none cursor-pointer"
                  style={{ padding: '2px' }}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <div className={`relative rounded-full p-[2px] transition-all ${menuOpen ? 'border border-gray-400' : 'border border-transparent'}`}>
                    <Avatar user={user} size="sm" />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#171717] ${socketStatus === 'online' ? 'bg-green-500' : socketStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  </div>
                </button>
                {menuOpen && (
                  <div className="absolute top-12 right-0 w-48 bg-white dark:bg-[#171717] rounded-lg shadow-premium border border-gray-100 dark:border-[#262626] py-2 fade-up">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-black dark:hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Profile</Link>
                    <Link to="/saved" className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-black dark:hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Saved</Link>

                    <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-black dark:hover:text-white transition-colors" onClick={() => setMenuOpen(false)}>Settings</Link>
                    <div className="h-px bg-gray-100 dark:bg-slate-700 my-2"></div>
                    <button
                      className="w-full text-left bg-transparent border-none px-4 py-2 text-sm text-black dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      onClick={() => { setMenuOpen(false); logout(); }}
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
