import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import { api } from "../services/api.js";
import { BASE_URL } from "../config/api.js";

export default function SearchDropdown({ results, loading, onClose, onItemClick }) {
  const [recentSearches, setRecentSearches] = useState([]);
  const [trending, setTrending] = useState([]);
  const [suggested, setSuggested] = useState([]);

  useEffect(() => {
    // Load recent searches
    const saved = localStorage.getItem("cb_recent_searches");
    if (saved) setRecentSearches(JSON.parse(saved).slice(0, 5));

    // Load trending/suggested if no results
    if (!results && !loading) {
      api.users.getTrending().then(res => setTrending(Array.isArray(res) ? res.slice(0, 3) : []));
      api.users.getSuggested().then(res => setSuggested(Array.isArray(res) ? res.slice(0, 3) : []));
    }
  }, [results, loading]);

  const clearRecent = (e) => {
    e.stopPropagation();
    localStorage.removeItem("cb_recent_searches");
    setRecentSearches([]);
  };

  if (!results && !loading && recentSearches.length === 0 && trending.length === 0 && suggested.length === 0) return null;

  return (
    <div className="search-dropdown slide-in" style={{
      position: 'absolute', top: '100%', left: 0, right: 0,
      backgroundColor: 'white', borderRadius: '16px', marginTop: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.12)', zIndex: 1000,
      maxHeight: '80vh', overflowY: 'auto', border: '1px solid rgba(0,0,0,0.05)', padding: '1rem'
    }}>
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <div className="spinner-sm" style={{ margin: '0 auto 10px' }}></div>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Searching marketplace...</span>
        </div>
      ) : results ? (
        <div className="search-results">
           <section style={{ marginBottom: '1.5rem' }}>
            <h3 className="search-section-title">Profiles</h3>
            {results.users?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {results.users.map((u) => (
                  <Link key={u._id} to={`/user/${u._id}`} className="search-item" onClick={() => onItemClick(u)}>
                    <Avatar user={u} size="sm" />
                    <div className="search-item-info">
                      <div className="name-row">
                        <span className="name">{u.name || u.username}</span>
                        {(u.isVerified || u.isPremium) && <VerifiedBadge size="xs" tier={u.premiumTier} />}
                        <span className={`role-badge ${u.role}`}>{u.role}</span>
                      </div>
                      <span className="handle">@{u.username} • {u.category || 'Creator'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : <p className="empty-msg">No profiles found</p>}
          </section>
        </div>
      ) : (
        <div className="search-empty-state">
          {recentSearches.length > 0 && (
            <section style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 className="search-section-title">Recent</h3>
                <button onClick={clearRecent} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '12px', fontWeight: 700 }}>Clear</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {recentSearches.map((s, i) => (
                  <Link key={i} to={`/user/${s._id}`} className="search-item" onClick={() => onItemClick(s)}>
                    <Avatar user={s} size="sm" />
                    <span className="name">{s.username}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section style={{ marginBottom: '1.5rem' }}>
            <h3 className="search-section-title">Trending 🔥</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {trending.map(u => (
                <Link key={u._id} to={`/user/${u._id}`} className="search-item" onClick={() => onItemClick(u)}>
                  <Avatar user={u} size="sm" />
                  <div className="search-item-info">
                    <div className="name-row">
                      <span className="name">{u.username}</span>
                      {(u.isVerified || u.isPremium) && <VerifiedBadge size="xs" tier={u.premiumTier} />}
                    </div>
                    <span className="handle">{u.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h3 className="search-section-title">Suggested For You</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {suggested.map(u => (
                <Link key={u._id} to={`/user/${u._id}`} className="search-item" onClick={() => onItemClick(u)}>
                  <Avatar user={u} size="sm" />
                  <div className="search-item-info">
                    <div className="name-row">
                      <span className="name">{u.username}</span>
                      {(u.isVerified || u.isPremium) && <VerifiedBadge size="xs" tier={u.premiumTier} />}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .search-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 0.75rem; fontWeight: 800; }
        .search-item { display: flex; align-items: center; gap: 12px; padding: 8px; border-radius: 12px; text-decoration: none; transition: background 0.2s; }
        .search-item:hover { background-color: #f8fafc; }
        .search-item-info { display: flex; flexDirection: column; flex: 1; }
        .name-row { display: flex; align-items: center; gap: 6px; }
        .name { font-weight: 700; color: #1a1a1a; font-size: 14px; }
        .handle { font-size: 12px; color: #64748b; }
        .role-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; font-weight: 800; text-transform: uppercase; }
        .role-badge.brand { background-color: #eff6ff; color: #2563eb; }
        .role-badge.influencer { background-color: #f0fdf4; color: #16a34a; }
        .empty-msg { padding: 0.5rem; color: #94a3b8; fontSize: 13px; textAlign: center; }
      `}} />
    </div>
  );
}
