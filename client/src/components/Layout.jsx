import { useEffect, useState, useRef, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "./Navbar.jsx";
import BottomNav from "./BottomNav.jsx";
import Sidebar from "./Sidebar.jsx";

import GlobalPostModal from "./GlobalPostModal.jsx";
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
  const isProfilePage = location.pathname.startsWith("/profile") || location.pathname.startsWith("/user/");
  const isChatActive = isMessagesPage && location.pathname.split("/").length > 2;
  const shouldBeCentered = [].includes(location.pathname);
  const isHomePage = location.pathname === "/home" || location.pathname === "/";

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
      const { senderId, senderName, requestId } = data;

      import("react-hot-toast").then(m => {
        const toast = m.default;
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-10 border border-indigo-50`}>
            <div className="flex-1 w-0 p-5">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    {senderName[0]?.toUpperCase()}
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-gray-900">
                    Connection Request
                  </p>
                  <p className="mt-1 text-sm text-gray-600">
                    <span className="font-semibold">{senderName}</span> wants to connect with you.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col border-l border-gray-100">
              <button
                onClick={async () => {
                  toast.dismiss(t.id);
                  try {
                    let rId = requestId;
                    if (!rId) {
                      const reqs = await api.privacy.getRequests();
                      const reqDoc = reqs.find(r => r.sender._id === senderId || r.sender === senderId);
                      rId = reqDoc?._id;
                    }
                    if (rId) {
                      await api.privacy.respondRequest(rId, 'accept');
                      toast.success(`You are now connected with ${senderName}!`);
                    }
                  } catch (err) {
                    toast.error("Failed to accept request");
                  }
                }}
                className="w-full border-b border-gray-100 rounded-none rounded-tr-2xl p-4 flex items-center justify-center text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={async () => {
                  toast.dismiss(t.id);
                  try {
                    let rId = requestId;
                    if (!rId) {
                      const reqs = await api.privacy.getRequests();
                      const reqDoc = reqs.find(r => r.sender._id === senderId || r.sender === senderId);
                      rId = reqDoc?._id;
                    }
                    if (rId) {
                      await api.privacy.respondRequest(rId, 'decline');
                      toast.success(`Declined request from ${senderName}`);
                    }
                  } catch (err) {
                    toast.error("Failed to decline request");
                  }
                }}
                className="w-full rounded-none rounded-br-2xl p-4 flex items-center justify-center text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                Decline
              </button>
            </div>
          </div>
        ), { duration: 8000, position: 'top-right' });
      });
    });

    socket.on("align_request_accepted", (data) => {
      fetchNotifications();
      import("react-hot-toast").then(m => m.default.success(`${data.receiverName || "User"} accepted your connection request!`));
    });

    socket.on("align_request_declined", (data) => {
      fetchNotifications();
      import("react-hot-toast").then(m => m.default.error(`${data.receiverName || "User"} declined your connection request.`));
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
      <Sidebar user={user} msgUnreadCount={msgUnreadTotal} logout={logout} />
      
      <div className="main-content-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
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
              isHomePage
                ? "home-layout-wide"
                : shouldBeCentered
                ? "feed-layout-centered"
                : isMessagesPage
                ? "messages-layout-wrap"
                : isProfilePage
                ? "profile-layout-wrap"
                : "content-container-pro"
            }
          >
            <Outlet />
          </div>
        </main>

        {(!isChatActive) && <BottomNav msgUnreadCount={msgUnreadTotal} />}

      </div>
      <GlobalPostModal user={user} />
    </div>
  );
}


