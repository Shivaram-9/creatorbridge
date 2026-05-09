import { useEffect, useState, useRef, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "./Navbar.jsx";
import BottomNav from "./BottomNav.jsx";
import AIAssistant from "./AIAssistant.jsx";
import { api } from "../services/api.js";
import { connectSocket } from "../services/socket.js";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [msgUnreadTotal, setMsgUnreadTotal] = useState(0);
  
  const isAuthPage = ["/login", "/register", "/forgot-password", "/reset-password"].includes(location.pathname);
  const isMessagesPage = location.pathname.startsWith("/messages");
  const isChatActive = isMessagesPage && location.pathname.split("/").length > 2;
  const shouldBeCentered = ["/home", "/discover"].includes(location.pathname);

  useEffect(() => {
    if (user && !user.onboardingComplete && location.pathname !== "/onboarding" && !location.pathname.startsWith("/select-role")) {
      navigate("/onboarding");
    }
  }, [user, location.pathname, navigate]);

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

  useEffect(() => {
    if (!user) return;
    const socket = connectSocket();
    if (!socket) return;

    socket.on("message", fetchUnreadMessages);
    socket.on("notification", fetchNotifications);

    return () => {
      socket.off("message", fetchUnreadMessages);
      socket.off("notification", fetchNotifications);
    };
  }, [user, fetchUnreadMessages, fetchNotifications]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchUnreadMessages();
  }, [user, fetchUnreadMessages, fetchNotifications]);

  const handleMarkRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch { /* silent */ }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (isAuthPage) return <Outlet />;

  return (
    <div className="app-shell">
      <Navbar 
        user={user}
        unreadCount={unreadCount}
        msgUnreadCount={msgUnreadTotal}
        notifications={notifications}
        onMarkRead={handleMarkRead}
        logout={logout}
      />

      <main className={`main-viewport ${isMessagesPage ? 'messages-view-active' : ''}`}>
        <div className={shouldBeCentered ? "feed-layout-centered" : isMessagesPage ? "w-full" : "content-container-pro"}>
          <Outlet />
        </div>
      </main>

      {(!isChatActive) && <BottomNav msgUnreadCount={msgUnreadTotal} />}
      {!isMessagesPage && <AIAssistant />}
    </div>
  );
}


