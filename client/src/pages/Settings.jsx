import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { roleBadgeClass } from "../utils/badges.js";

function initials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "?";
}

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="container settings-page">
      <header className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="subtitle">Manage your account and preferences.</p>
      </header>

      {/* ── Account card ── */}
      <section className="settings-section" aria-labelledby="account-heading">
        <h2 id="account-heading" className="settings-section__title">Account</h2>
        <div className="settings-card">

          {/* Identity row */}
          <div className="settings-identity">
            <div className="settings-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="settings-avatar__img" />
              ) : (
                <span className="settings-avatar__initials">{initials(user?.name, user?.email)}</span>
              )}
            </div>
            <div className="settings-identity__info">
              <p className="settings-identity__name">{user?.name || "No name set"}</p>
              <p className="settings-identity__email">{user?.email}</p>
              {user?.role && (
                <span className={`badge ${roleBadgeClass(user.role)} settings-identity__badge`}>
                  {user.role}
                </span>
              )}
            </div>
          </div>

          <div className="settings-divider" />

          {/* Edit profile row */}
          <Link to="/profile" className="settings-row settings-row--link">
            <div className="settings-row__left">
              <span className="settings-row__icon" aria-hidden="true">✏️</span>
              <div>
                <p className="settings-row__label">Edit profile</p>
                <p className="settings-row__sub">Update your name, bio, avatar, and social links</p>
              </div>
            </div>
            <span className="settings-row__chevron" aria-hidden="true">›</span>
          </Link>

          <div className="settings-divider" />

          {/* Notifications row */}
          <Link to="/notifications" className="settings-row settings-row--link">
            <div className="settings-row__left">
              <span className="settings-row__icon" aria-hidden="true">🔔</span>
              <div>
                <p className="settings-row__label">Notifications</p>
                <p className="settings-row__sub">View your connection requests and messages</p>
              </div>
            </div>
            <span className="settings-row__chevron" aria-hidden="true">›</span>
          </Link>
        </div>
      </section>

      {/* ── Explore section ── */}
      <section className="settings-section" aria-labelledby="explore-heading">
        <h2 id="explore-heading" className="settings-section__title">Explore</h2>
        <div className="settings-card">
          <Link to="/discover" className="settings-row settings-row--link">
            <div className="settings-row__left">
              <span className="settings-row__icon" aria-hidden="true">🌐</span>
              <div>
                <p className="settings-row__label">Discover creators & brands</p>
                <p className="settings-row__sub">Find your next collaboration partner</p>
              </div>
            </div>
            <span className="settings-row__chevron" aria-hidden="true">›</span>
          </Link>

          <div className="settings-divider" />

          <Link to="/connections" className="settings-row settings-row--link">
            <div className="settings-row__left">
              <span className="settings-row__icon" aria-hidden="true">👥</span>
              <div>
                <p className="settings-row__label">Connections</p>
                <p className="settings-row__sub">Manage your network and accept requests</p>
              </div>
            </div>
            <span className="settings-row__chevron" aria-hidden="true">›</span>
          </Link>
        </div>
      </section>

      {/* ── Danger zone ── */}
      <section className="settings-section" aria-labelledby="account-actions-heading">
        <h2 id="account-actions-heading" className="settings-section__title">Account actions</h2>
        <div className="settings-card">
          <div className="settings-row">
            <div className="settings-row__left">
              <span className="settings-row__icon" aria-hidden="true">🚪</span>
              <div>
                <p className="settings-row__label">Log out</p>
                <p className="settings-row__sub">Sign out of your CreatorBridge account</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={logout}
            >
              Log out
            </button>
          </div>
        </div>
      </section>

      {/* App version footer */}
      <p className="settings-footer">CreatorBridge · v1.0</p>
    </div>
  );
}
