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
  const shouldBeCentered = ["/home"].includes(location.pathname);

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
    
    socket.on("align_request_received", (data) => {
      fetchNotifications();
      const senderId = data.senderId;
      const senderName = data.senderName || "Someone";

      import("react-hot-toast").then(m => {
        const toast = m.default;
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    New Alignment Request
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {senderName} wants to align with you.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={async () => {
                  toast.dismiss(t.id);
                  try {
                    // We need the requestId. The socket payload should ideally have it.
                    // For now, let's refresh notifications and use the latest one.
                    const reqs = await api.privacy.getRequests();
                    const reqDoc = reqs.find(r => r.sender._id === senderId || r.sender === senderId);
                    if (reqDoc) {
                      await api.privacy.respondRequest(reqDoc._id, 'accept');
                      toast.success("Aligned successfully!");
                    }
                  } catch (err) {
                    toast.error("Failed to accept request");
                  }
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none"
              >
                Accept
              </button>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ), { duration: 6000 });
      });
    });

    socket.on("align_request_accepted", (data) => {
      fetchNotifications();
      import("react-hot-toast").then(m => m.default.success(`${data.receiverName || "User"} accepted your alignment request!`));
    });

    socket.on("align_request_declined", (data) => {
      fetchNotifications();
      import("react-hot-toast").then(m => m.default.error(`${data.receiverName || "User"} declined your alignment request.`));
    });

    return () => {
      socket.off("message", fetchUnreadMessages);
      socket.off("notification", fetchNotifications);
      socket.off("align_request_received");
      socket.off("align_request_accepted");
      socket.off("align_request_declined");
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
        <div
          className={
            shouldBeCentered
              ? "feed-layout-centered"
              : isMessagesPage
              ? "messages-layout-wrap"
              : "content-container-pro"
          }
        >
          <Outlet />
        </div>
      </main>

      {(!isChatActive) && <BottomNav msgUnreadCount={msgUnreadTotal} />}
      {!isMessagesPage && <AIAssistant />}
    </div>
  );
}


