import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BellIcon, MenuIcon, SearchIcon, MessageIcon } from "./Icons.jsx";
import { getSocket } from "../services/socket.js";
import Avatar from "./Avatar.jsx";
import SearchDropdown from "./SearchDropdown.jsx";
import { api } from "../services/api.js";

export default function Navbar({ 
  user, searchQuery, setSearchQuery, handleSearch, 
  unreadCount, msgUnreadCount, notifications, onMarkRead,
  menuOpen, setMenuOpen, menuRef, logout 
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Live search with debounce and cancellation
  useEffect(() => {
    if (!searchQuery.trim()) {
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
      if (isSearchOpen && searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen, isSearchOpen]);

  /* Reset on location change */
  useEffect(() => {
    setNotifOpen(false);
    setMenuOpen(false);
    setIsSearchOpen(false);
  }, [navigate]);

  return (
    <header className="navbar-fixed">
      <div className="navbar-inner">
        <div className="nav-left">
          <Link to="/home" className="logo-link">
            CreatorBridge
          </Link>
        </div>

        {user && (
          <>
            <div className="nav-center">
              <form className="relative w-full" onSubmit={handleSearch} ref={searchRef}>
                <span className="search-icon-wrap">
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  className="search-box"
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

            <div className="nav-right">
              <div className="relative" ref={notifRef}>
                <button 
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors relative" 
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notifications"
                >
                  <BellIcon />
                  {unreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="dropdown-card fade-up-entry">
                    <div className="p-3 border-b border-slate-100 font-bold text-slate-800">Notifications</div>
                    <div className="max-h-80 overflow-y-auto">
                      {(!notifications || notifications.length === 0) ? (
                        <div className="p-4 text-center text-slate-500 text-sm">No notifications</div>
                      ) : (
                        (notifications || []).map(n => (
                          <div 
                            key={n?._id} 
                            className={`p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer ${!n?.read ? 'bg-indigo-50/30' : ''}`}
                            onClick={() => handleNotifClick(n)}
                          >
                            <p className="text-sm text-slate-800 leading-snug">{n?.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">{n?.createdAt ? formatTime(n.createdAt) : ""}</span>
                          </div>
                        ))
                      )}
                    </div>
                    <Link to="/notifications" className="block p-3 text-center text-indigo-600 font-bold text-sm border-t border-slate-100 hover:bg-indigo-50/20" onClick={() => setNotifOpen(false)}>
                      View all activity
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/messages" className="p-2 rounded-full hover:bg-slate-100 transition-colors relative" aria-label="Messages">
                <MessageIcon />
                {msgUnreadCount > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">{msgUnreadCount}</span>}
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  className="p-1 rounded-full hover:bg-slate-100 transition-colors relative"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Menu"
                >
                  <Avatar user={user} size="sm" />
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-${socketStatus === 'online' ? 'emerald' : socketStatus === 'connecting' ? 'amber' : 'rose'}-500`} />
                </button>
                {menuOpen && (
                  <div className="dropdown-card fade-up-entry w-60">
                    <div className="py-2">
                      {!user.isEmailVerified && (
                        <Link to="/verify-email" className="flex items-center px-4 py-2.5 text-sm font-semibold text-amber-600 hover:bg-amber-50" onClick={() => setMenuOpen(false)}>
                          <span className="mr-3">⚠️</span> Verify Email
                        </Link>
                      )}
                      <Link to="/requests" className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Align Requests</Link>
                      <Link to="/deals" className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>My Deals</Link>
                      <Link to="/saved" className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Saved Posts</Link>
                      <Link to="/premium" className="flex items-center px-4 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50" onClick={() => setMenuOpen(false)}>
                        <span className="mr-3">⭐</span> Upgrade to Premium
                      </Link>
                      <Link to="/earnings" className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                        <span className="mr-3">💰</span> My Earnings
                      </Link>
                      <Link to="/analytics" className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Analytics</Link>
                      <Link to="/settings" className="flex items-center px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Settings</Link>
                      <div className="my-1 border-t border-slate-100"></div>
                      <button
                        className="flex items-center w-full px-4 py-2.5 text-sm font-bold text-rose-500 hover:bg-rose-50"
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


