import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, firstApiError } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { roleBadgeClass } from "../utils/badges.js";
import { BASE_URL } from "../config/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import PortfolioGrid from "../components/PortfolioGrid.jsx";
import { ShareIcon } from "../components/Icons.jsx";

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const isOwn = me?._id === userId;

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const data = await api.posts.userPosts(userId);
      if (!data?.error) {
        const formatted = (data || []).map(p => ({
          ...p,
          id: p._id,
          url: p.image ? (p.image.startsWith('http') ? p.image : `${BASE_URL}${p.image}`) : null,
          mediaType: "image"
        }));
        setUserPosts(formatted);
      }
    } catch (err) {
      console.error("Failed to load posts", err);
    } finally {
      setLoadingPosts(false);
    }
  }, [userId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.users.get(userId);
      if (data?.error) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong");
        setLoading(false);
        return;
      }
      setProfile(data);

      if (!isOwn && me) {
        const followingArr = Array.isArray(me.following) ? me.following : [];
        setIsFollowing(followingArr.includes(userId));
      }
      
      loadPosts();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [userId, isOwn, me, loadPosts]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleFollowToggle() {
    if (!me) return;
    setActionBusy(true);
    setError("");
    try {
      const action = isFollowing ? api.users.unfollow : api.users.follow;
      const result = await action(userId);
      if (result?.error) {
        setError(typeof result.error === "string" ? result.error : "Something went wrong");
      } else {
        setIsFollowing(!isFollowing);
        setProfile(prev => {
          if (!prev) return prev;
          const currentFollowers = Array.isArray(prev.followers) ? prev.followers : [];
          const newFollowers = isFollowing 
            ? currentFollowers.filter(id => id !== me._id)
            : [...currentFollowers, me._id];
          return { ...prev, followers: newFollowers };
        });
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setActionBusy(false);
    }
  }

  const handleShareProfile = async () => {
    const shareData = {
      title: "CreatorBridge Profile",
      text: `Check out ${profile?.name || profile?.username || 'this profile'} on CreatorBridge!`,
      url: `${window.location.origin}/user/${userId}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 2000);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        await navigator.clipboard.writeText(shareData.url);
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 2000);
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <p className="loading-line">Loading profile</p>
      </div>
    );
  }

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
  const followersArray = Array.isArray(profile.followers) ? profile.followers : [];
  const fl = fmtFollowers(followersArray.length);
  const hasSocials = profile.instagram || profile.youtube;
  const hasDetails = profile.location || fl || hasSocials;

  return (
    <div className="container up-container">
      <Link to="/discover" className="up-back">← Discover</Link>

      <div className="up-hero">
        <div className="up-hero__gradient" aria-hidden="true" />

        <div className="up-hero__content">
          <div className="up-avatar">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="up-avatar__img" />
            ) : (
              <span className="up-avatar__initials">{initials(profile.name, profile.email)}</span>
            )}
            <span className={`up-avatar__role-dot ${profile.role === "brand" ? "up-avatar__role-dot--brand" : ""}`} aria-label={profile.role} />
          </div>

          <h1 className="up-name">{displayName}</h1>
          {profile.username && <p className="up-username">@{profile.username}</p>}

          <div className="up-tags">
            <span className={`badge ${roleClass}`}>{profile.role}</span>
            {profile.category && <span className="up-cat-badge">{profile.category}</span>}
          </div>

          <div className="up-actions">
            {isOwn ? (
              <Link to="/profile" className="btn btn-primary">✏️ Edit profile</Link>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className={`align-btn align-btn--lg ${isFollowing ? 'align-btn--active' : ''}`}
                  disabled={actionBusy}
                  onClick={handleFollowToggle}
                  style={isFollowing ? { backgroundColor: '#f0f0f0', color: '#333' } : {}}
                >
                  {actionBusy ? "..." : isFollowing ? "Following" : "Follow"}
                </button>
                <Link to={`/chat/${userId}`} className="btn btn-primary">💬 Message</Link>
                <button 
                  className={`btn btn-secondary ${copyStatus ? 'btn-success' : ''}`} 
                  onClick={handleShareProfile}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ShareIcon />
                  {copyStatus ? "Copied!" : "Share profile"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div className="up-stats">
        <div className="up-stat">
          <span className="up-stat__value">{fl || "0"}</span>
          <span className="up-stat__label">Followers</span>
        </div>
        <div className="up-stat">
          <span className="up-stat__value">{userPosts.length}</span>
          <span className="up-stat__label">Posts</span>
        </div>
      </div>

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

      <section className="up-section">
        <h2 className="up-section__title">Posts</h2>
        {loadingPosts ? (
          <p className="loading-line">Loading posts...</p>
        ) : userPosts.length > 0 ? (
          <div className="up-section__card up-section__card--flush">
            <PortfolioGrid items={userPosts} />
          </div>
        ) : (
          <div className="empty-state empty-state--compact">
            <div className="empty-state__icon" aria-hidden="true">🖼️</div>
            <h3 className="empty-state__title">No posts yet</h3>
            {isOwn ? (
              <>
                <p className="empty-state__text">Share your work with the world!</p>
                <div className="empty-state__action">
                  <Link to="/home" className="btn btn-primary btn-sm">Create Post</Link>
                </div>
              </>
            ) : (
              <p className="empty-state__text">This user hasn't posted anything yet.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
