import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { BellIcon, MenuIcon, SearchIcon } from "./Icons.jsx";

export default function Navbar({ user, searchQuery, setSearchQuery, handleSearch, unreadCount, menuOpen, setMenuOpen, menuRef, logout }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  const dummyNotifications = [
    { id: 1, text: "Sarah Jenkins liked your post", time: "2m ago", type: "like" },
    { id: 2, text: "New connection request from David Miller", time: "1h ago", type: "connection" },
    { id: 3, text: "Global Brands Co viewed your profile", time: "3h ago", type: "view" },
  ];

  /* Close dropdowns on click outside */
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifOpen && notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notifOpen]);

  return (
    <header className="header">
      <div className="header-inner container">
        <Link to="/home" className="logo">
          CreatorBridge
        </Link>

        {user && (
          <>
            <form className="search-container" onSubmit={handleSearch}>
              <span className="search-icon">
                <SearchIcon />
              </span>
              <input
                type="text"
                className="search-input"
                placeholder="Search creators & brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="header-actions">
              <div className="top-menu-container" ref={notifRef}>
                <button 
                  className="nav-icon-btn" 
                  onClick={() => setNotifOpen(!notifOpen)}
                  aria-label="Notifications"
                >
                  <BellIcon />
                  {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="dropdown-menu dropdown-menu--notif slide-in">
                    <div className="dropdown-header">Notifications</div>
                    {dummyNotifications.map(n => (
                      <div key={n.id} className="dropdown-item dropdown-item--notif">
                        <div className="notif-content">
                          <p className="notif-text">{n.text}</p>
                          <span className="notif-time">{n.time}</span>
                        </div>
                      </div>
                    ))}
                    <Link to="/notifications" className="dropdown-footer" onClick={() => setNotifOpen(false)}>
                      View all
                    </Link>
                  </div>
                )}
              </div>

              <div className="top-menu-container" ref={menuRef}>
                <button
                  className="nav-icon-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Menu"
                >
                  <MenuIcon />
                </button>
                {menuOpen && (
                  <div className="dropdown-menu slide-in">
                    <Link to="/settings" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                      Settings
                    </Link>
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
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
