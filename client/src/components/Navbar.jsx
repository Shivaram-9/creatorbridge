import { Link } from "react-router-dom";

export default function Navbar({ user, searchQuery, setSearchQuery, handleSearch, unreadCount, menuOpen, setMenuOpen, menuRef, logout }) {
  return (
    <header className="header">
      <div className="header-inner container">
        <Link to="/home" className="logo">
          CreatorBridge
        </Link>

        {user && (
          <>
            <form className="search-container" onSubmit={handleSearch}>
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search creators & brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>

            <div className="header-actions">
              <Link to="/notifications" className="nav-icon-btn" aria-label="Notifications">
                🔔
                {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
              </Link>

              <div className="top-menu-container" ref={menuRef}>
                <button
                  className="nav-icon-btn"
                  onClick={() => setMenuOpen(!menuOpen)}
                  aria-label="Menu"
                >
                  ☰
                </button>
                {menuOpen && (
                  <div className="dropdown-menu">
                    <Link to="/settings" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                      ⚙ Settings
                    </Link>
                    <button
                      className="dropdown-item text-danger"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                    >
                      🚪 Logout
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
