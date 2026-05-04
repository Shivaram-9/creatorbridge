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
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef(null);

  /* Poll notifications count */
  useEffect(() => {
    if (!user) return;
    async function fetchCount() {
      try {
        const data = await api.notifications.list();
        if (Array.isArray(data)) {
          const unread = data.filter(n => !n.read).length;
          setUnreadCount(unread || data.length);
        }
      } catch { /* silent */ }
    }
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    return () => clearInterval(interval);
  }, [user]);

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
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        menuRef={menuRef}
        logout={logout}
      />

      <main className="main-content">
        <Outlet />
      </main>

      {user && <BottomNav />}
    </div>
  );
}

