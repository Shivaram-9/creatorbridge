import { useEffect, useState, useRef, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import OfflineBanner from "./OfflineBanner.jsx";
import Navbar from "./Navbar.jsx";
import BottomNav from "./BottomNav.jsx";
import { api } from "../services/api.js";
import { connectSocket, getSocket } from "../services/socket.js";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [msgUnreadTotal, setMsgUnreadTotal] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef(null);

  const fetchUnreadMessages = useCallback(async () => {
    try {
      const conversations = await api.messages.list();
      if (Array.isArray(conversations)) {
        const total = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setMsgUnreadTotal(total);
      }
    } catch { /* silent */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.notifications.list();
      if (Array.isArray(data)) setNotifications(data);
    } catch { /* silent */ }
  }, []);

  /* Socket integration */
  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();
    if (!socket) return;

    const onMessage = (msg) => {
      // If we receive a message that isn't from us, fetch unread count again
      if (msg.sender?._id !== user._id) {
        fetchUnreadMessages();
      }
    };

    socket.on("message", onMessage);
    socket.on("notification", fetchNotifications);

    return () => {
      socket.off("message", onMessage);
      socket.off("notification", fetchNotifications);
    };
  }, [user, fetchUnreadMessages, fetchNotifications]);

  /* Poll notifications */
  useEffect(() => {
    if (!user) return;
    
    fetchNotifications();
    fetchUnreadMessages();
    const intervalNotif = setInterval(fetchNotifications, 60_000);
    const intervalMsg = setInterval(fetchUnreadMessages, 60_000); 
    return () => {
      clearInterval(intervalNotif);
      clearInterval(intervalMsg);
    };
  }, [user, fetchUnreadMessages, fetchNotifications]);

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

      {user && <BottomNav msgUnreadCount={msgUnreadTotal} notifUnreadCount={unreadCount} />}
    </div>
  );
}

