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
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Link to="/home" className="logo-main-text">
            CreatorBridge
          </Link>
        </div>

        {user && (
          <>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', margin: '0 24px' }}>
              <form style={{ position: 'relative', width: '100%', maxWidth: '440px' }} onSubmit={handleSearch} ref={searchRef}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  style={{ width: '100%', height: '44px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: '12px', padding: '0 16px 0 48px', fontSize: '14px', outline: 'none' }}
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button 
                  style={{ padding: '10px', borderRadius: '12px', background: 'none', border: 'none', cursor: 'pointer', position: 'relative', color: '#475569' }} 
                  onClick={() => setNotifOpen(!notifOpen)}
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: '8px', right: '8px', width: '16px', height: '16px', background: '#6366f1', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '2px solid white', fontWeight: '700' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="dropdown-card-pro fade-up" style={{ position: 'absolute', top: '50px', right: 0, width: '320px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', fontWeight: '700', color: '#1e293b' }}>Notifications</div>
                    <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                      {(!notifications || notifications.length === 0) ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>No notifications</div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n?._id} 
                            style={{ padding: '16px', borderBottom: '1px solid #f8fafc', cursor: 'pointer', background: !n?.read ? 'rgba(99,102,241,0.03)' : 'white' }}
                            onClick={() => handleNotifClick(n)}
                          >
                            <p style={{ fontSize: '14px', color: '#334155', margin: 0, lineHeight: '1.4' }}>{n?.message}</p>
                            <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '6px', display: 'block' }}>{n?.createdAt ? formatTime(n.createdAt) : ""}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Link to="/messages" style={{ padding: '10px', borderRadius: '12px', color: '#475569', position: 'relative' }}>
                <MessageIcon />
                {msgUnreadCount > 0 && (
                  <span style={{ position: 'absolute', top: '8px', right: '8px', width: '16px', height: '16px', background: '#6366f1', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', border: '2px solid white', fontWeight: '700' }}>
                    {msgUnreadCount}
                  </span>
                )}
              </Link>

              <div style={{ position: 'relative' }} ref={menuRef}>
                <button
                  style={{ padding: '2px', borderRadius: '50%', background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}
                  onClick={() => setMenuOpen(!menuOpen)}
                >
                  <Avatar user={user} size="sm" />
                  <span style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white', background: socketStatus === 'online' ? '#10b981' : socketStatus === 'connecting' ? '#f59e0b' : '#ef4444' }} />
                </button>
                {menuOpen && (
                  <div className="dropdown-card-pro fade-up" style={{ position: 'absolute', top: '50px', right: 0, width: '220px', background: 'white', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '8px 0' }}>
                    <Link to="/profile" style={{ display: 'block', padding: '12px 16px', fontSize: '14px', color: '#334155', fontWeight: '600' }} onClick={() => setMenuOpen(false)}>My Profile</Link>
                    <Link to="/requests" style={{ display: 'block', padding: '12px 16px', fontSize: '14px', color: '#334155', fontWeight: '600' }} onClick={() => setMenuOpen(false)}>Align Requests</Link>
                    <Link to="/settings" style={{ display: 'block', padding: '12px 16px', fontSize: '14px', color: '#334155', fontWeight: '600' }} onClick={() => setMenuOpen(false)}>Settings</Link>
                    <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }}></div>
                    <button
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '12px 16px', fontSize: '14px', color: '#ef4444', fontWeight: '700', cursor: 'pointer' }}
                      onClick={() => { setMenuOpen(false); logout(); }}
                    >
                      Logout
                    </button>
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
