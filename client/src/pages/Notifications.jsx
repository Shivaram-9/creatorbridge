import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";

/** Relative timestamp — e.g. "2 min ago", "3 days ago" */
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/** Avatar circle */
function Avatar({ actor }) {
  const name = actor?.name || actor?.email || "?";
  const initials = (() => {
    if (actor?.name) {
      const parts = actor.name.trim().split(/\s+/);
      return parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : actor.name.slice(0, 2).toUpperCase();
    }
    return (actor?.email || "?").slice(0, 2).toUpperCase();
  })();

  return (
    <div className="notif-avatar">
      {actor?.avatar ? (
        <img src={actor.avatar} alt={name} className="notif-avatar__img" />
      ) : (
        <span className="notif-avatar__initials">{initials}</span>
      )}
    </div>
  );
}

/** Collab prefix detection (reused from Chat) */
const COLLAB_PREFIX = "📋 COLLABORATION PROPOSAL\n";
function previewContent(text) {
  if (!text) return "";
  if (text.startsWith(COLLAB_PREFIX)) return "🤝 Sent a collaboration proposal";
  return text.length > 80 ? text.slice(0, 80) + "…" : text;
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.notifications.list();
        if (cancelled) return;
        if (data?.error) {
          setError(typeof data.error === "string" ? data.error : "Something went wrong");
        } else {
          setItems(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) setError("Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="container notif-page">
      <header className="page-header">
        <h1 className="page-title">Notifications</h1>
        <p className="subtitle">Recent messages and activities.</p>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {loading ? (
        <p className="loading-line">Loading notifications</p>
      ) : items.length === 0 ? (
        <div className="empty-state empty-state--hero" role="status">
          <div className="empty-state__illustration" aria-hidden="true">🔔</div>
          <h2 className="empty-state__title">All caught up!</h2>
          <p className="empty-state__text">
            No new messages. Start exploring creators and brands.
          </p>
          <div className="empty-state__action">
            <Link to="/discover" className="btn btn-primary">Explore</Link>
          </div>
        </div>
      ) : (
        <div className="notif-list">
          {items.map((n) => {
            const actor = n.sender;
            const actorName = actor?.name || actor?.username || "Someone";
            const isRead = n.read;

            let link = "/home";
            let icon = "🔔";

            if (n.type === "follow") {
              link = `/user/${actor?._id || actor}`;
              icon = "👤";
            } else if (n.type === "like") {
              icon = "❤️";
            } else if (n.type === "comment") {
              icon = "💬";
            }

            return (
              <Link
                key={n._id}
                to={link}
                className={`notif-item ${!isRead ? 'notif-item--unread' : ''}`}
                onClick={() => !isRead && api.notifications.markRead(n._id)}
              >
                {!isRead && <div className="notif-item__type-dot" aria-hidden="true" />}
                <Avatar actor={actor} />
                <div className="notif-item__body">
                  <p className="notif-item__text">
                    <strong>{actorName}</strong> {n.message.replace(actorName, "").trim()}
                  </p>
                  <span className="notif-item__time">{timeAgo(n.createdAt)}</span>
                </div>
                <span className="notif-item__icon" aria-hidden="true">{icon}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
