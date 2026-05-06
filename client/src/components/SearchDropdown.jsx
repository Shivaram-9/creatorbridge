import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import { BASE_URL } from "../config/api.js";

export default function SearchDropdown({ results, loading, onClose }) {
  if (!results && !loading) return null;

  return (
    <div className="search-dropdown slide-in">
      {loading ? (
        <div className="search-dropdown__loading">
          <div className="spinner-sm"></div>
          <span>Searching...</span>
        </div>
      ) : (
        <div className="search-dropdown__content">
          {/* Users Section */}
          <section className="search-section">
            <h3 className="search-section__title">Users</h3>
            {results.users?.length > 0 ? (
              <div className="search-results-list">
                {results.users.map((u) => (
                  <Link 
                    key={u._id} 
                    to={`/user/${u._id}`} 
                    className="search-result-item"
                    onClick={onClose}
                  >
                    <Avatar user={u} size="sm" />
                    <div className="search-result-info">
                      <span className="search-result-name">
                        {u.name || u.username}
                        {u.isVerified && <VerifiedBadge size="xs" />}
                      </span>
                      <span className="search-result-meta">@{u.username} • {u.category || 'Creator'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="search-empty-text">No users found</p>
            )}
          </section>

          <hr className="search-divider" />

          {/* Posts Section */}
          <section className="search-section">
            <h3 className="search-section__title">Posts</h3>
            {results.posts?.length > 0 ? (
              <div className="search-results-list">
                {results.posts.map((p) => (
                  <Link 
                    key={p._id} 
                    to="/home" // Simplified for now
                    className="search-result-item"
                    onClick={onClose}
                  >
                    <div className="search-result-post-thumb">
                      {p.image ? (
                        <img src={p.image.startsWith('http') ? p.image : `${BASE_URL}${p.image}`} alt="" />
                      ) : (
                        <div className="search-result-post-icon">📝</div>
                      )}
                    </div>
                    <div className="search-result-info">
                      <span className="search-result-text">{p.text?.slice(0, 50)}...</span>
                      <span className="search-result-meta">
                        by {p.user?.username}
                        {p.user?.isVerified && <VerifiedBadge size="xs" />}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="search-empty-text">No posts found</p>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
