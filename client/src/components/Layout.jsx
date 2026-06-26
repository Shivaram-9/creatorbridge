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

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [helpSubject, setHelpSubject] = useState("");
  const [helpMessage, setHelpMessage] = useState("");
  const [helpSending, setHelpSending] = useState(false);

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

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  const handleHelpSubmit = async (e) => {
    e.preventDefault();
    if (!helpSubject.trim() || !helpMessage.trim()) {
      import("react-hot-toast").then(m => m.default.error("Please fill in all fields"));
      return;
    }
    setHelpSending(true);
    try {
      const res = await api.users.support({ subject: helpSubject, message: helpMessage });
      if (res.error) {
        import("react-hot-toast").then(m => m.default.error(res.error));
      } else {
        import("react-hot-toast").then(m => m.default.success("Support request sent! We will reply to your email inbox."));
        setShowHelpCenter(false);
        setHelpSubject("");
        setHelpMessage("");
      }
    } catch (err) {
      import("react-hot-toast").then(m => m.default.error("Failed to send request"));
    } finally {
      setHelpSending(false);
    }
  };

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
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white dark:bg-[#171717] shadow-xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-10 border border-indigo-50 dark:border-[#262626]`}>
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
                      fetchNotifications();
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
                      fetchNotifications();
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
      <Sidebar user={user} msgUnreadCount={msgUnreadTotal} logout={() => setShowLogoutConfirm(true)} openHelpCenter={() => setShowHelpCenter(true)} />
      
      <div className="main-content-wrapper" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Navbar 
          user={user}
          unreadCount={unreadCount}
          msgUnreadCount={msgUnreadTotal}
          notifications={notifications}
          onMarkRead={handleMarkRead}
          fetchNotifications={fetchNotifications}
          logout={() => setShowLogoutConfirm(true)}
          openHelpCenter={() => setShowHelpCenter(true)}
        />

        <div className="flex flex-col lg:flex-row flex-1 w-full relative">
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
              <Outlet context={{ openHelpCenter: () => setShowHelpCenter(true), refreshUnreadMessages: fetchUnreadMessages }} />
            </div>
          </main>
        </div>

        {(!isChatActive) && <BottomNav msgUnreadCount={msgUnreadTotal} />}

      </div>
      <GlobalPostModal user={user} />
      
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)}>
          <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-2xl w-[90%] max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 mx-auto flex items-center justify-center mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Log out?</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Are you sure you want to log out of your account?</p>
              
              <div className="flex flex-col gap-3">
                <button 
                  className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
                  onClick={handleConfirmLogout}
                >
                  Yes, Log out
                </button>
                <button 
                  className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-colors"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Center Modal */}
      {showHelpCenter && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowHelpCenter(false)}>
          <div className="bg-white dark:bg-[#171717] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Help Center</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Send a request to our support team.</p>
              </div>
              <button onClick={() => setShowHelpCenter(false)} className="text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white transition-colors p-2 bg-gray-50 dark:bg-slate-700 rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <form onSubmit={handleHelpSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Subject</label>
                <input 
                  type="text" 
                  value={helpSubject}
                  onChange={e => setHelpSubject(e.target.value)}
                  placeholder="What do you need help with?"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-1">Message</label>
                <textarea 
                  value={helpMessage}
                  onChange={e => setHelpMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm resize-none dark:text-white"
                  required
                ></textarea>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 p-4 rounded-xl text-sm flex gap-3 items-start mt-2">
                <svg className="flex-shrink-0 mt-0.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                <p>We will reply to your registered email (<strong>{user?.email}</strong>) as soon as possible.</p>
              </div>
              <button 
                type="submit" 
                disabled={helpSending}
                className="w-full mt-2 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {helpSending ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    Send Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


