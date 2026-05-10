import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BellIcon, SearchIcon, MessageIcon } from "./Icons.jsx";
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

  useEffect(() => {
    setNotifOpen(false);
    setMenuOpen(false);
    setIsSearchOpen(false);
  }, [navigate]);

  return (
    <header className="navbar-fixed">
      <div className="navbar-inner">
        <div style={{ flex: '1 0 0' }}>
          <Link to="/home" className="logo-main-text">
            CreatorBridge
          </Link>
        </div>

        {user && (
          <div className="search-input-container" ref={searchRef}>
            <form onSubmit={handleSearch}>
              <span className="search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search"
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
        )}

        <div style={{ flex: '1 0 0', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
          {user && (
            <>
              <div className="relative" ref={notifRef}>
                <button className="nav-icon-btn" onClick={() => setNotifOpen(!notifOpen)}>
                  <BellIcon filled={notifOpen} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute top-12 right-0 w-80 bg-white rounded-lg shadow-premium border border-gray-100 overflow-hidden fade-up">
                    <div className="p-4 border-b border-gray-100 font-bold text-gray-800">Notifications</div>
                    <div className="max-h-80 overflow-y-auto">
                      {(!notifications || notifications.length === 0) ? (
                        <div className="p-6 text-center text-gray-500 text-sm">No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n?._id} 
                            className={`p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!n?.read ? 'bg-blue-50/50' : 'bg-white'}`}
                            onClick={() => handleNotifClick(n)}
                          >
                            <p className="text-sm text-gray-800 m-0 leading-snug">{n?.message}</p>
                            <span className="text-xs text-gray-500 mt-1 block">{n?.createdAt ? formatTime(n.createdAt) : ""}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/messages" className="nav-icon-btn relative">
                <MessageIcon />
                {msgUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                    {msgUnreadCount > 9 ? "9+" : msgUnreadCount}
                  </span>
                )}
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  className="bg-transparent border-none cursor-pointer relative"
                  style={{ padding: '2px' }}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <div className={`rounded-full p-[2px] transition-all ${menuOpen ? 'border border-gray-400' : 'border border-transparent'}`}>
                    <Avatar user={user} size="sm" />
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${socketStatus === 'online' ? 'bg-green-500' : socketStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                </button>
                {menuOpen && (
                  <div className="absolute top-12 right-0 w-48 bg-white rounded-lg shadow-premium border border-gray-100 py-2 fade-up">
                    <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors" onClick={() => setMenuOpen(false)}>Profile</Link>
                    <Link to="/saved" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors" onClick={() => setMenuOpen(false)}>Saved</Link>
                    <Link to="/settings" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors" onClick={() => setMenuOpen(false)}>Settings</Link>
                    <div className="h-px bg-gray-100 my-2"></div>
                    <button
                      className="w-full text-left bg-transparent border-none px-4 py-2 text-sm text-red-500 hover:bg-gray-50 transition-colors cursor-pointer"
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
