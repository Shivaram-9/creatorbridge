import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, firstApiError } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES } from "../constants/categories.js";
import { roleBadgeClass } from "../utils/badges.js";
import ErrorBanner from "../components/ErrorBanner.jsx";

/** Format followers count */
function fmtFollowers(n) {
  if (!n || n <= 0) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

/** Generate initials */
function initials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "?";
}

export default function Discover() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("");
  const [users, setUsers] = useState([]);
  const [outgoingTo, setOutgoingTo] = useState(new Set());
  const [acceptedWith, setAcceptedWith] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const q = filter.trim() || undefined;
      const [list, out, acc] = await Promise.all([
        api.users.list(q),
        api.connections.outgoing(),
        api.connections.accepted(),
      ]);
      const errMsg = firstApiError(list, out, acc);
      if (errMsg) {
        setError(errMsg);
      } else {
        const usersArr = Array.isArray(list) ? list : [];
        setUsers(usersArr);
        const outArr = Array.isArray(out) ? out : [];
        const accArr = Array.isArray(acc) ? acc : [];
        setOutgoingTo(new Set(outArr.map((o) => o.to?._id || o.to).filter(Boolean)));
        setAcceptedWith(new Set(accArr.map((a) => a.user?._id || a.user).filter(Boolean)));
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const headingFilter = useMemo(() => filter.trim() || "All categories", [filter]);

  async function sendRequest(targetId) {
    setActionId(targetId);
    setError("");
    try {
      const result = await api.connections.request(targetId);
      if (result?.error) {
        setError(typeof result.error === "string" ? result.error : "Something went wrong");
      } else {
        setOutgoingTo((prev) => new Set(prev).add(targetId));
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Discover</h1>
        <p className="subtitle">Browse creators and brands. Filter by category to narrow results.</p>
      </header>

      <div className="filter-bar field" style={{ marginBottom: 0 }}>
        <label htmlFor="filter-cat">Category filter</label>
        <select id="filter-cat" className="input" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <p className="filter-hint">
        Showing results for <strong>{headingFilter}</strong>
      </p>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {loading ? (
        <p className="loading-line">Loading people</p>
      ) : users.length === 0 ? (
        <div className="empty-state empty-state--hero" role="status">
          <div className="empty-state__illustration" aria-hidden="true">🔍</div>
          <h2 className="empty-state__title">No creators or brands found</h2>
          <p className="empty-state__text">
            Try clearing the category filter or pick a different niche to discover more people on CreatorBridge.
          </p>
          <div className="empty-state__action">
            {filter && (
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFilter("")}>
                Clear filter
              </button>
            )}
            <Link to="/profile" className="btn btn-primary btn-sm">Complete your profile</Link>
          </div>
        </div>
      ) : (
        <div className="list-gap">
          {users.map((u) => {
            const id = u._id;
            const isSelf = id === user?._id;
            const connected = acceptedWith.has(id);
            const pending = outgoingTo.has(id);
            const fl = fmtFollowers(u.followers);
            return (
              <article key={id} className="card user-card">
                <div className="user-card__body">
                  <div className="user-card__heading">
                    {/* Avatar */}
                    <div className="user-card__avatar">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="user-card__avatar-img" />
                      ) : (
                        <span className="user-card__avatar-initials">{initials(u.name, u.email)}</span>
                      )}
                    </div>
                    <div className="user-card__heading-text">
                      <div className="user-card__name-row">
                        <h2 className="user-card__name"><Link to={`/user/${id}`}>{u.name || u.email}</Link></h2>
                        <span className={`badge ${roleBadgeClass(u.role)}`}>{u.role}</span>
                      </div>
                      {u.username && <p className="user-card__username">@{u.username}</p>}
                    </div>
                  </div>
                  <dl className="user-card__meta">
                    <div className="user-card__meta-row">
                      <dt>Category</dt>
                      <dd className={u.category ? "" : "muted-pill"}>{u.category || "Not set yet"}</dd>
                    </div>
                    {fl && (
                      <div className="user-card__meta-row">
                        <dt>Followers</dt>
                        <dd>{fl}</dd>
                      </div>
                    )}
                  </dl>
                  {u.location && (
                    <p className="user-card__location">
                      <span aria-hidden="true">📍</span>
                      {u.location}
                    </p>
                  )}
                  {u.bio && <p className="user-card__bio">{u.bio}</p>}
                  {(u.instagram || u.youtube) && (
                    <div className="user-card__socials">
                      {u.instagram && (
                        <a
                          href={u.instagram.startsWith("http") ? u.instagram : `https://instagram.com/${u.instagram.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-chip"
                        >
                          📸 Instagram
                        </a>
                      )}
                      {u.youtube && (
                        <a
                          href={u.youtube.startsWith("http") ? u.youtube : `https://youtube.com/@${u.youtube.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="social-chip"
                        >
                          ▶️ YouTube
                        </a>
                      )}
                    </div>
                  )}
                  {/* Portfolio thumbnails */}
                  {Array.isArray(u.portfolio) && u.portfolio.length > 0 && (
                    <div className="user-card__portfolio-strip">
                      {u.portfolio.slice(0, 4).map((p, pi) => (
                        <div key={p._id || pi} className="user-card__portfolio-thumb">
                          {p.mediaType === "video" ? (
                            <span className="user-card__portfolio-play">▶</span>
                          ) : (
                            <img src={p.url} alt="" className="user-card__portfolio-img" loading="lazy" />
                          )}
                        </div>
                      ))}
                      {u.portfolio.length > 4 && (
                        <span className="user-card__portfolio-more">+{u.portfolio.length - 4}</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="user-card__aside">
                  <Link to={`/user/${id}`} className="btn btn-ghost btn-sm">View Profile</Link>
                  {isSelf ? (
                    <span className="status-pill--muted">You</span>
                  ) : connected ? (
                    <>
                      <span className="status-pill">🤝 Aligned</span>
                      <Link to={`/chat/${id}`} className="msg-btn">
                        💬 Message
                      </Link>
                    </>
                  ) : pending ? (
                    <span className="pending-btn">⏳ Pending</span>
                  ) : (
                    <button
                      type="button"
                      className="align-btn"
                      disabled={actionId === id}
                      onClick={() => sendRequest(id)}
                    >
                      {actionId === id ? "Sending…" : "🤝 Align"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
