import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import Avatar from "../components/Avatar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";

export default function UsersList() {
  const { userId, type, postId } = useParams(); // type can be 'followers', 'following', or 'likes' (for posts)
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let pPromise;
      let listPromise;

      if (postId) {
        pPromise = Promise.resolve({ name: "Post Likes" });
        listPromise = api.posts.getLikes(postId);
      } else {
        pPromise = api.users.get(userId);
        listPromise = type === "followers" ? api.users.getFollowers(userId) : api.users.getFollowing(userId);
      }

      const [p, list] = await Promise.all([pPromise, listPromise]);
      
      if (p.error) setError(p.error);
      else setProfile(p);
      
      if (list.error) setError(list.error);
      else setUsers(list);
      
    } catch {
      setError("Failed to load list");
    } finally {
      setLoading(false);
    }
  }, [userId, type]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  let title = "Users";
  if (postId) title = "Likes";
  else if (type === "followers") title = "Aligners";
  else if (type === "following") title = "Aligned";

  return (
    <div className="container" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="header-inner" style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>←</button>
        <h1 className="page-title" style={{ fontSize: '1.5rem', margin: 0 }}>{title}</h1>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div className="users-list-page slide-in">
        {loading ? (
          <LoadingSpinner centered />
        ) : users.length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem 0' }}>
            <div className="empty-state__illustration">👥</div>
            <p className="empty-state__text">No {title.toLowerCase()} yet.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {users.map(u => (
              <div 
                key={u._id} 
                className="user-list-row" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '1rem', 
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/user/${u._id}`)}
              >
                <Avatar user={u} size="md" />
                <div style={{ marginLeft: '1rem', flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{u.username || u.name}</div>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>{u.category || u.role}</div>
                </div>
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => { e.stopPropagation(); navigate(`/user/${u._id}`); }}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
