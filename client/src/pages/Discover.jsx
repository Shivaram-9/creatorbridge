import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "../components/Avatar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { BASE_URL } from "../config/api.js";

export default function Discover() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await api.search.discover();
        if (res?.error) {
          setError(res.error);
        } else {
          setData(res);
        }
      } catch {
        setError("Failed to load discovery data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="discover-page container">
      <header className="discover-header">
        <h1 className="discover-title">Explore</h1>
        <p className="discover-subtitle">Discover creators, brands, and trending content</p>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {/* Suggested Creators */}
      <section className="discover-section">
        <div className="section-header">
          <h2 className="section-title">Suggested Creators</h2>
          <Link to="/discover" className="section-link">See all</Link>
        </div>
        <div className="creator-grid">
          {data?.suggested?.map(u => (
            <div key={u._id} className="creator-card">
              <Link to={`/user/${u._id}`} className="creator-card__link">
                <Avatar user={u} size="xl" />
                <h3 className="creator-card__name">{u.name || u.username}</h3>
                <p className="creator-card__username">@{u.username}</p>
                <span className="creator-card__category">{u.category || 'Creator'}</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Section */}
      <div className="discover-row">
        <section className="discover-section trending-users">
          <h2 className="section-title">Trending Users</h2>
          <div className="trending-list">
            {data?.trending?.map((u, idx) => (
              <Link key={u._id} to={`/user/${u._id}`} className="trending-item">
                <span className="trending-idx">{idx + 1}</span>
                <Avatar user={u} size="sm" />
                <div className="trending-info">
                  <span className="trending-name">{u.name || u.username}</span>
                  <span className="trending-meta">{u.followers?.length || 0} Aligners</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="discover-section popular-posts">
          <h2 className="section-title">Popular Posts</h2>
          <div className="popular-post-grid">
            {data?.popularPosts?.map(p => (
              <div key={p._id} className="popular-post-card">
                {p.image ? (
                  <img src={p.image.startsWith('http') ? p.image : `${BASE_URL}${p.image}`} alt="" className="popular-post-img" />
                ) : (
                  <div className="popular-post-text-fallback">{p.text?.slice(0, 40)}</div>
                )}
                <div className="popular-post-overlay">
                  <div className="popular-post-user">
                    <Avatar user={p.user} size="xs" />
                    <span>{p.user?.username}</span>
                  </div>
                  <div className="popular-post-likes">❤️ {p.likes?.length || 0}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Recently Active */}
      <section className="discover-section">
        <h2 className="section-title">Recently Active Profiles</h2>
        <div className="active-row">
          {data?.recentlyActive?.map(u => (
            <Link key={u._id} to={`/user/${u._id}`} className="active-user">
              <Avatar user={u} size="md" />
              <div className="active-dot" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
