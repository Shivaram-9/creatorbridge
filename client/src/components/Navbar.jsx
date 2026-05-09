import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BellIcon, MenuIcon, SearchIcon, MessageIcon } from "./Icons.jsx";
import { getSocket } from "../services/socket.js";
import Avatar from "./Avatar.jsx";
import SearchDropdown from "./SearchDropdown.jsx";
import { api } from "../services/api.js";

export default function Navbar({ 
  user, 
  unreadCount = 0, 
  msgUnreadCount = 0, 
  notifications = [], 
  onMarkRead = () => {}, 
  logout 
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const notifRef = useRef(null);
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

  // Live search with debounce and cancellation
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
        if (err.name !== 'AbortError') {
          console.error("Search failed", err);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setSearchLoading(false);
        }
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

  const handleNotifClick = (n) => {
    onMarkRead(n._id);
    setNotifOpen(false);
    if (n.type === "follow") {
      navigate(`/user/${n.sender?._id || n.sender}`);
    } else if (n.type === "align_request") {
      navigate(`/requests`);
    } else if (n.post) {
      navigate(`/home`); 
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  /* Close dropdowns on click outside */
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (isSearchOpen && searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen, menuOpen, isSearchOpen]);

  /* Reset on location change */
  useEffect(() => {
    setNotifOpen(false);
    setMenuOpen(false);
    setIsSearchOpen(false);
  }, [navigate]);

  return (
    <header className="navbar-fixed">
      <div className="navbar-inner">
        <div className="flex justify-start">
          <Link to="/home" className="logo-main-text">
            CreatorBridge
          </Link>
        </div>

        {user && (
          <>
            <div className="nav-search-wrap">
              <form className="relative w-full max-w-[440px]" onSubmit={handleSearch} ref={searchRef}>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  className="search-input-pro"
                  placeholder="Search creators & brands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                />
                {isSearchOpen && (
                  <SearchDropdown 
                    results={searchResults} 
                    loading={searchLoading} 
                    onClose={() => setIsSearchOpen(false)}
                    onItemClick={(item) => {
                      if (!item) return;
                      setIsSearchOpen(false);
                      setSearchQuery("");
                    }}
                  />
                )}
              </form>
            </div>

            <div className="nav-actions-wrap">
              <div className="relative" ref={notifRef}>
                <button 
                  className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors relative text-slate-700" 
                  onClick={() => setNotifOpen(!notifOpen)}
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="dropdown-card-pro slide-up-fade">
                    <div className="p-4 border-b border-slate-100 font-bold text-slate-800">Notifications</div>
                    <div className="max-h-80 overflow-y-auto">
                      {(!notifications || notifications.length === 0) ? (
                        <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n?._id} 
                            className={`p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors ${!n?.read ? 'bg-indigo-50/30' : ''}`}
                            onClick={() => handleNotifClick(n)}
                          >
                            <p className="text-sm text-slate-800 leading-snug">{n?.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1.5 block font-medium">{n?.createdAt ? formatTime(n.createdAt) : ""}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <Link to="/notifications" className="block p-3.5 text-center text-indigo-600 font-bold text-sm border-t border-slate-100 hover:bg-indigo-50/20" onClick={() => setNotifOpen(false)}>
                      View all activity
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/messages" className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors relative text-slate-700">
                <MessageIcon />
                {msgUnreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                    {msgUnreadCount}
                  </span>
                )}
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  className="p-0.5 rounded-full hover:ring-4 hover:ring-slate-100 transition-all relative"
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <Avatar user={user} size="sm" />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-${socketStatus === 'online' ? 'emerald' : socketStatus === 'connecting' ? 'amber' : 'rose'}-500`} />
                </button>
                {menuOpen && (
                  <div className="dropdown-card-pro slide-up-fade">
                    <div className="py-1">
                      {!user.isEmailVerified && (
                        <>
                          <Link to="/verify-email" className="dropdown-item-pro text-amber-600 font-bold" onClick={() => setMenuOpen(false)}>
                            <span>⚠️</span> Verify Email
                          </Link>
                          <div className="dropdown-divider"></div>
                        </>
                      )}
                      <Link to="/requests" className="dropdown-item-pro" onClick={() => setMenuOpen(false)}>Align Requests</Link>
                      <Link to="/saved" className="dropdown-item-pro" onClick={() => setMenuOpen(false)}>Saved Posts</Link>
                      <div className="dropdown-divider"></div>
                      <Link to="/premium" className="dropdown-item-pro text-indigo-600 font-bold" onClick={() => setMenuOpen(false)}>
                        <span>⭐</span> Upgrade to Premium
                      </Link>
                      <Link to="/earnings" className="dropdown-item-pro" onClick={() => setMenuOpen(false)}>
                        <span>💰</span> My Earnings
                      </Link>
                      <Link to="/analytics" className="dropdown-item-pro" onClick={() => setMenuOpen(false)}>Analytics</Link>
                      <Link to="/settings" className="dropdown-item-pro" onClick={() => setMenuOpen(false)}>Settings</Link>
                      <div className="dropdown-divider"></div>
                      <button
                        className="dropdown-item-pro w-full font-bold text-rose-500 hover:bg-rose-50"
                        onClick={() => { setMenuOpen(false); logout(); }}
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}



