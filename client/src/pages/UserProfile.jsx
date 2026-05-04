import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, firstApiError } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { roleBadgeClass } from "../utils/badges.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import PortfolioGrid from "../components/PortfolioGrid.jsx";

function initials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "?";
}

function fmtFollowers(n) {
  if (!n || n <= 0) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export default function UserProfile() {
  const { userId } = useParams();
  const { user: me } = useAuth();

  const [profile, setProfile] = useState(null);
  const [connState, setConnState] = useState("none"); // "none" | "pending" | "connected"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  const isOwn = me?._id === userId;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const reqs = [api.users.get(userId)];

      /* Only fetch connection status for other users */
      if (!isOwn) {
        reqs.push(api.connections.outgoing());
        reqs.push(api.connections.accepted());
      }

      const results = await Promise.all(reqs);
      const data = results[0];
      if (data?.error) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong");
        setLoading(false);
        return;
      }
      setProfile(data);

      if (!isOwn) {
        const outgoing = results[1];
        const accepted = results[2];
        const errMsg = firstApiError(outgoing, accepted);
        if (!errMsg) {
          const outArr = Array.isArray(outgoing) ? outgoing : [];
          const accArr = Array.isArray(accepted) ? accepted : [];
          const outSet = new Set(outArr.map((o) => o.to?._id || o.to).filter(Boolean));
          const accSet = new Set(accArr.map((a) => a.user?._id || a.user).filter(Boolean));
          if (accSet.has(userId)) setConnState("connected");
          else if (outSet.has(userId)) setConnState("pending");
          else setConnState("none");
        }
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [userId, isOwn]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendAlignRequest() {
    setActionBusy(true);
    setError("");
    try {
      const result = await api.connections.request(userId);
      if (result?.error) {
        setError(typeof result.error === "string" ? result.error : "Something went wrong");
      } else {
        setConnState("pending");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setActionBusy(false);
    }
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="container">
        <p className="loading-line">Loading profile</p>
      </div>
    );
  }

  /* ── Error / not found ── */
  if (error && !profile) {
    return (
      <div className="container">
        <div className="empty-state empty-state--hero" style={{ marginTop: "2rem" }}>
          <div className="empty-state__illustration" aria-hidden="true">😕</div>
          <h2 className="empty-state__title">Could not load profile</h2>
          <p className="empty-state__text">{error || "User not found"}</p>
          <div className="empty-state__action">
            <Link to="/discover" className="btn btn-primary btn-sm">Explore</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const displayName = profile.name || profile.email || "User";
  const roleClass = roleBadgeClass(profile.role);
  const fl = fmtFollowers(profile.followers);
  const portfolio = Array.isArray(profile.portfolio) ? profile.portfolio : [];
  const hasSocials = profile.instagram || profile.youtube;
  const hasDetails = profile.location || fl || hasSocials;

  return (
    <div className="container up-container">
      {/* Back nav */}
      <Link to="/discover" className="up-back">← Discover</Link>

      {/* ═══════════════════════════════
          HERO CARD
         ═══════════════════════════════ */}
      <div className="up-hero">
        {/* Decorative gradient strip */}
        <div className="up-hero__gradient" aria-hidden="true" />

        <div className="up-hero__content">
          {/* Avatar */}
          <div className="up-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="up-avatar__img" />
            ) : (
              <span className="up-avatar__initials">{initials(profile.name, profile.email)}</span>
            )}
            <span className={`up-avatar__role-dot ${profile.role === "brand" ? "up-avatar__role-dot--brand" : ""}`} aria-label={profile.role} />
          </div>

          {/* Identity */}
          <h1 className="up-name">{displayName}</h1>
          {profile.username && <p className="up-username">@{profile.username}</p>}

          <div className="up-tags">
            <span className={`badge ${roleClass}`}>{profile.role}</span>
            {profile.category && <span className="up-cat-badge">{profile.category}</span>}
          </div>

          {/* Action buttons */}
          <div className="up-actions">
            {isOwn ? (
              <Link to="/profile" className="btn btn-primary">✏️ Edit profile</Link>
            ) : connState === "connected" ? (
              <>
                <span className="up-status up-status--connected">🤝 Aligned</span>
                <Link to={`/chat/${userId}`} className="btn btn-primary">💬 Message</Link>
              </>
            ) : connState === "pending" ? (
              <span className="up-status up-status--pending">⏳ Request Pending</span>
            ) : (
              <button
                type="button"
                className="align-btn align-btn--lg"
                disabled={actionBusy}
                onClick={sendAlignRequest}
              >
                {actionBusy ? "Sending…" : "🤝 Align"}
              </button>
            )}
          </div>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {/* ═══════════════════════════════
          STATS ROW
         ═══════════════════════════════ */}
      {(fl || portfolio.length > 0) && (
        <div className="up-stats">
          {fl && (
            <div className="up-stat">
              <span className="up-stat__value">{fl}</span>
              <span className="up-stat__label">Followers</span>
            </div>
          )}
          {portfolio.length > 0 && (
            <div className="up-stat">
              <span className="up-stat__value">{portfolio.length}</span>
              <span className="up-stat__label">Post</span>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════
          ABOUT
         ═══════════════════════════════ */}
      {(profile.bio || hasDetails) && (
        <section className="up-section">
          <h2 className="up-section__title">About</h2>
          <div className="up-section__card">
            {profile.bio && <p className="up-bio">{profile.bio}</p>}

            {(profile.location || fl) && (
              <div className="up-detail-list">
                {profile.location && (
                  <div className="up-detail">
                    <span className="up-detail__icon" aria-hidden="true">📍</span>
                    <span className="up-detail__text">{profile.location}</span>
                  </div>
                )}
                {profile.category && (
                  <div className="up-detail">
                    <span className="up-detail__icon" aria-hidden="true">🏷️</span>
                    <span className="up-detail__text">{profile.category}</span>
                  </div>
                )}
              </div>
            )}

            {hasSocials && (
              <div className="up-socials">
                {profile.instagram && (
                  <a
                    href={profile.instagram.startsWith("http") ? profile.instagram : `https://instagram.com/${profile.instagram.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="up-social-btn up-social-btn--ig"
                  >
                    <span className="up-social-btn__icon" aria-hidden="true">📸</span>
                    <span className="up-social-btn__label">Instagram</span>
                    <span className="up-social-btn__handle">{profile.instagram.startsWith("http") ? "View" : profile.instagram}</span>
                  </a>
                )}
                {profile.youtube && (
                  <a
                    href={profile.youtube.startsWith("http") ? profile.youtube : `https://youtube.com/@${profile.youtube.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="up-social-btn up-social-btn--yt"
                  >
                    <span className="up-social-btn__icon" aria-hidden="true">▶️</span>
                    <span className="up-social-btn__label">YouTube</span>
                    <span className="up-social-btn__handle">{profile.youtube.startsWith("http") ? "View" : profile.youtube}</span>
                  </a>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════
          PORTFOLIO
         ═══════════════════════════════ */}
      {portfolio.length > 0 && (
        <section className="up-section">
          <h2 className="up-section__title">Post</h2>
          <div className="up-section__card up-section__card--flush">
            <PortfolioGrid items={portfolio} />
          </div>
        </section>
      )}

      {/* Empty portfolio state for own profile */}
      {isOwn && portfolio.length === 0 && (
        <section className="up-section">
          <h2 className="up-section__title">Post</h2>
          <div className="empty-state empty-state--compact">
            <div className="empty-state__icon" aria-hidden="true">🖼️</div>
            <h3 className="empty-state__title">No posts yet</h3>
            <p className="empty-state__text">Upload images and videos to showcase your work.</p>
            <div className="empty-state__action">
              <Link to="/profile" className="btn btn-primary btn-sm">Add from profile</Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
