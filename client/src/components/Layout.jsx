import { useEffect, useState, useRef } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import OfflineBanner from "./OfflineBanner.jsx";
import Navbar from "./Navbar.jsx";
import BottomNav from "./BottomNav.jsx";
import { api } from "../services/api.js";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [msgUnreadTotal, setMsgUnreadTotal] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef(null);

  /* Poll notifications */
  useEffect(() => {
    if (!user) return;
    async function fetchNotifications() {
      try {
        const data = await api.notifications.list();
        if (Array.isArray(data)) setNotifications(data);
      } catch { /* silent */ }
    }
    
    async function fetchUnreadMessages() {
      try {
        const conversations = await api.messages.list();
        if (Array.isArray(conversations)) {
          const total = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
          setMsgUnreadTotal(total);
        }
      } catch { /* silent */ }
    }

    fetchNotifications();
    fetchUnreadMessages();
    const intervalNotif = setInterval(fetchNotifications, 30_000);
    const intervalMsg = setInterval(fetchUnreadMessages, 15_000); // Poll messages faster
    return () => {
      clearInterval(intervalNotif);
      clearInterval(intervalMsg);
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch { /* silent */ }
  };

  /* Close menu on click outside */
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/discover?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <div className="layout">
      <OfflineBanner />
      
      <Navbar 
        user={user}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        unreadCount={unreadCount}
        msgUnreadCount={msgUnreadTotal}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        menuRef={menuRef}
        logout={logout}
      />

      <main className="main-content">
        <Outlet />
      </main>

      {user && <BottomNav msgUnreadCount={msgUnreadTotal} unreadCount={unreadCount} />}
    </div>
  );
}

