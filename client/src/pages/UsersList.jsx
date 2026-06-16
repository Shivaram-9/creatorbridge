import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import Avatar from "../components/Avatar.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { useAuth } from "../context/AuthContext.jsx";

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
        if (type === "alliances") {
          listPromise = Promise.all([
            api.users.getFollowers(userId),
            api.users.getFollowing(userId)
          ]).then(([followers, following]) => {
            const combined = [...(Array.isArray(followers) ? followers : []), ...(Array.isArray(following) ? following : [])];
            // Unique by _id
            const unique = [];
            const seen = new Set();
            for (const u of combined) {
              if (u && u._id && !seen.has(u._id)) {
                seen.add(u._id);
                unique.push(u);
              }
            }
            return unique;
          });
        } else {
          listPromise = type === "followers" ? api.users.getFollowers(userId) : api.users.getFollowing(userId);
        }
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
  }, [userId, type, postId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  let title = "Users";
  if (postId) title = "Likes";
  else if (type === "followers") title = "Alliances";
  else if (type === "following") title = "Alliances";
  else if (type === "alliances") title = "Alliances";

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
        ) : users.filter(u => !!u).length === 0 ? (
          <div className="empty-state" style={{ padding: '4rem 0' }}>
            <div className="empty-state__illustration">👥</div>
            <p className="empty-state__text">No {title.toLowerCase()} yet.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {users.filter(u => !!u).map(u => (
              <UserRow key={u?._id || Math.random()} user={u} onUpdate={loadData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserRow({ user, onUpdate }) {
  const navigate = useNavigate();
  const { user: me, setUser: setMe } = useAuth();
  const [busy, setBusy] = useState(false);
  
  if (!user) return null;

  const isFollowing = me?.following?.includes(user._id);

  async function handleFollow(e) {
    e.stopPropagation();
    if (!me) return;
    setBusy(true);
    try {
      const action = isFollowing ? api.users.unfollow : api.users.follow;
      const res = await action(user._id);
      if (!res.error) {
        setMe(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div 
      className="user-list-row" 
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '1rem', 
        borderBottom: '1px solid var(--border)',
        cursor: 'pointer'
      }}
      onClick={() => user._id && navigate(`/user/${user._id}`)}
    >
      <Avatar user={user} size="md" />
      <div style={{ marginLeft: '1rem', flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center' }}>
          {user.username || user.name}
          {(user.isVerified || user.isPremium) && <VerifiedBadge size="xs" tier={user.premiumTier} role={user.role} />}
        </div>
        <div className="muted" style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
          {user.bio || user.category || user.role}
        </div>
      </div>
      {me && me._id !== user._id && (
        <button 
          className={`btn btn-sm ${isFollowing ? 'btn-secondary' : 'btn-primary'}`}
          onClick={handleFollow}
          disabled={busy}
          style={{ minWidth: '80px' }}
        >
          {busy ? "..." : isFollowing ? "Connected" : "Connect"}
        </button>
      )}
    </div>
  );
}
