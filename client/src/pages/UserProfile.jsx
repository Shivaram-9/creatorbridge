import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { api, firstApiError } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { roleBadgeClass } from "../utils/badges.js";
import { BASE_URL } from "../config/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import PortfolioGrid from "../components/PortfolioGrid.jsx";
import { ShareIcon } from "../components/Icons.jsx";
import Avatar from "../components/Avatar.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import "./UserProfile.css";

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
  const [hasRequested, setHasRequested] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionBusy, setActionBusy] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const isOwn = me?._id === userId;
  const navigate = useNavigate();

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

  const [incomingRequest, setIncomingRequest] = useState(null);

  const handleRespondRequest = async (action) => {
    if (!incomingRequest?.id) return;
    setActionBusy(true);
    try {
      const res = await api.privacy.respondRequest(incomingRequest.id, action);
      if (res.error) setError(res.error);
      else {
        load(); // Refresh
      }
    } catch {
      setError("Failed to respond to request");
    } finally {
      setActionBusy(false);
    }
  };

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
      setHasRequested(!!data.isRequested);
      setIncomingRequest(data.hasIncomingRequest ? { id: data.incomingRequestId } : null);
      
      // Track view for AI Discovery (Prompt-7)
      if (!isOwn && me) {
        api.discovery.trackView(userId, data.category);
      }

      if (!isOwn && me) {
        const followingArr = Array.isArray(me.following) ? me.following : [];
        setIsFollowing(followingArr.includes(userId));
      }
      
      // If we can see posts (own, public, or following)
      if (isOwn || !data.isPrivate || (me && Array.isArray(me.following) && me.following.includes(userId))) {
        loadPosts();
      } else {
        setLoadingPosts(false);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [userId, isOwn, me, loadPosts]);

  useEffect(() => {
    load();
  }, [load]);

  const [showAlignMenu, setShowAlignMenu] = useState(false);

  async function handleFollowToggle() {
    if (!me) return;
    setActionBusy(true);
    setError("");
    try {
      if (isFollowing) {
        const result = await api.users.unfollow(userId);
        if (result.error) setError(result.error);
        else setIsFollowing(false);
      } else {
        const result = await api.users.follow(userId);
        if (result.error) setError(result.error);
        else if (result.requested) {
          setHasRequested(true);
        } else {
          setIsFollowing(true);
        }
      }
      setShowAlignMenu(false);
      load(); // Refresh profile state
    } catch {
      setError("Action failed");
    } finally {
      setActionBusy(false);
    }
  }

  const handleBlock = async () => {
    if (!window.confirm("Block this user? They won't be able to see your profile or message you.")) return;
    try {
      await api.moderation.block(userId);
      navigate("/home");
    } catch {
      setError("Failed to block user");
    }
  };

  const handleReport = async () => {
    const reason = window.prompt("Reason for reporting this user?");
    if (!reason) return;
    try {
      await api.moderation.report({
        targetType: "user",
        targetId: userId,
        reason
      });
      alert("Report submitted. Thank you.");
    } catch {
      setError("Failed to submit report");
    }
  };

  const handleShareProfile = async () => {
    const url = `${window.location.origin}/user/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    } catch {
      setError("Failed to copy link");
    }
  };

  if (loading) return <LoadingSpinner centered />;

  if (error && !profile) {
    return (
      <div className="container" style={{ paddingTop: '80px' }}>
        <div className="empty-state">
          <h2>Profile Unavailable</h2>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate("/discover")}>Discover Others</button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const displayName = profile.name || profile.username || "User";
  const roleClass = roleBadgeClass(profile.role);
  const followersCount = Array.isArray(profile.followers) ? profile.followers.length : 0;
  const isPrivateAndHidden = profile.isPrivate && !isOwn && !isFollowing;

  return (
    <div className="container up-container slide-in">
      <Link to="/discover" className="up-back">← Discover</Link>

      <div className="up-hero">
        <div className="up-hero__gradient" aria-hidden="true" />
        <div className="up-hero__content">
          <div className="up-avatar">
            <Avatar user={profile} size="xl" className="up-avatar-main" />
            <span className={`up-avatar__role-dot ${profile.role === "brand" ? "up-avatar__role-dot--brand" : ""}`} />
          </div>

          <h1 className="up-name">
            {displayName}
            {(profile.isVerified || profile.isPremium) && <VerifiedBadge size="md" tier={profile.premiumTier} />}
          </h1>
          {profile.username && <p className="up-username">@{profile.username} {profile.isPrivate && "🔒"}</p>}

          <div className="up-tags">
            <span className={`badge ${roleClass}`}>{profile.role}</span>
            {profile.category && <span className="up-cat-badge">{profile.category}</span>}
          </div>

          <div className="up-actions-wrap">
            <div className="up-actions-row">
              {isOwn ? (
                <Link to="/profile" className="btn btn-primary">✏️ Edit Profile</Link>
              ) : (
                <>
                  {incomingRequest ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" onClick={() => handleRespondRequest('accept')} disabled={actionBusy}>Accept</button>
                      <button className="btn btn-secondary" onClick={() => handleRespondRequest('reject')} disabled={actionBusy}>Decline</button>
                    </div>
                  ) : (
                    <div className="up-dual-actions">
                      <button
                        className={`btn ${isFollowing ? 'btn-secondary' : 'btn-primary'} ${hasRequested ? 'btn-outline' : ''}`}
                        disabled={actionBusy || hasRequested}
                        onClick={handleFollowToggle}
                      >
                        {actionBusy ? "..." : hasRequested ? "Request sent" : isFollowing ? "Aligned" : "Align"}
                      </button>
                      
                      {!isOwn && (isFollowing || !profile.isPrivate) && (
                        <Link to={`/messages/${userId}`} className="up-message-box">Messages</Link>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* More Actions Menu (Top Right) */}
        {!isOwn && (
          <div className="up-abs-actions">
            <button className="btn btn-icon up-more-trigger" onClick={() => setShowAlignMenu(!showAlignMenu)}>•••</button>
            {showAlignMenu && (
              <div className="dropdown-menu show slide-in">
                {isFollowing && (
                  <button className="dropdown-item danger" onClick={handleFollowToggle}>End Align</button>
                )}
                <button className="dropdown-item" onClick={handleShareProfile}>{copyStatus ? "Copied!" : "Share Profile"}</button>
                <button className="dropdown-item danger" onClick={handleBlock}>Block User</button>
              </div>
            )}
          </div>
        )}
      </div>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div className="up-stats-alliances">
        <div className="up-stat" onClick={() => !isPrivateAndHidden && navigate(`/user/${userId}/alliances`)}>
          <span className="up-stat__value">
            {fmtFollowers((Array.isArray(profile?.followers) ? profile.followers.length : 0) + (Array.isArray(profile?.following) ? profile.following.length : 0)) || "0"}
          </span>
          <span className="up-stat__label">Alliances</span>
        </div>
        <div className="up-stat">
          <span className="up-stat__value">{isPrivateAndHidden ? "?" : (userPosts?.length || 0)}</span>
          <span className="up-stat__label">Posts</span>
        </div>
      </div>

      {isPrivateAndHidden ? (
        <div className="private-account-message">
          <div className="icon">🔒</div>
          <h3>This account is private</h3>
          <p>Align with this user to see their posts and connections.</p>
        </div>
      ) : (
        <>
          {(profile.bio || profile.location) && (
            <section className="up-section">
              <h2 className="up-section__title">About</h2>
              <div className="up-section__card">
                {profile.bio && <p className="up-bio">{profile.bio}</p>}
                <div className="up-detail-list">
                  {profile.location && <div className="up-detail"><span>📍</span> {profile.location}</div>}
                  {profile.category && <div className="up-detail"><span>🏷️</span> {profile.category}</div>}
                  {profile.website && (
                    <div className="up-detail">
                      <span>🔗</span> 
                      <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                        {profile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="up-section">
            <h2 className="up-section__title">Posts</h2>
            {loadingPosts ? (
              <PostSkeleton />
            ) : userPosts.length > 0 ? (
              <div className="up-section__card up-section__card--flush">
                <PortfolioGrid items={userPosts} />
              </div>
            ) : (
              <div className="empty-state">
                <p>No posts yet.</p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
