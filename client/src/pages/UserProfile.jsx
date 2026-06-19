import { useCallback, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { GridIcon, BriefcaseIcon, TagIcon, ProfileIcon, RocketIcon, ShoppingBagIcon, StarIcon, HandshakeIcon, InfinityIcon, TrendingDownIcon, EyeIcon, UsersIcon } from "../components/Icons.jsx";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { getSocket } from "../services/socket.js";
import { BASE_URL } from "../config/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import PortfolioGrid from "../components/PortfolioGrid.jsx";
import { SendIcon, HeartIcon, MessageCircleIcon, BookmarkIcon, ShieldIcon } from "../components/Icons.jsx";
import Avatar from "../components/Avatar.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import toast from "react-hot-toast";
import "./UserProfile.css";
import UserListModal from "../components/UserListModal.jsx";
import TrustScore from "../components/TrustScore.jsx";

function fmtCount(n) {
  if (!n || n <= 0) return "0";
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
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [lightboxPost, setLightboxPost] = useState(null);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const [showAlignMenu, setShowAlignMenu] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);
  const [isRatingSubmit, setIsRatingSubmit] = useState(false);

  const isOwn = me?._id === userId;
  const navigate = useNavigate();

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const data = await api.posts.userPosts(userId);
      if (!data?.error) {
        setUserPosts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load posts", err);
    } finally {
      setLoadingPosts(false);
    }
  }, [userId]);

  const handleRespondRequest = async (action) => {
    if (!incomingRequest?.id) return;
    setActionBusy(true);
    try {
      const res = await api.privacy.respondRequest(incomingRequest.id, action);
      if (res.error) toast.error(res.error);
      else {
        toast.success(action === 'accept' ? 'Request accepted!' : 'Request declined');
        if (action === 'accept') {
          setIsFollowing(true);
          setHasRequested(false);
          setIncomingRequest(null);
        } else {
          setIsFollowing(false);
          setHasRequested(false);
          setIncomingRequest(null);
        }
        load();
      }
    } catch {
      toast.error("Failed to respond to request");
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
      
      if (!isOwn && me) {
        api.discovery.trackView(userId, data.category);
        setIsFollowing(!!data.isFollowing);
      }
      
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

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !userId) return;

    const onAccepted = (data) => {
      if (data.receiverId === userId) {
        setIsFollowing(true);
        setHasRequested(false);
        load();
      }
    };
    const onDeclined = (data) => {
      if (data.receiverId === userId) {
        setIsFollowing(false);
        setHasRequested(false);
      }
    };
    const onRatingUpdated = (data) => {
      if (data.userId === userId) {
        setProfile(prev => prev ? { ...prev, averageRating: data.averageRating, trustScore: data.trustScore } : prev);
      }
    };

    socket.on("align_request_accepted", onAccepted);
    socket.on("align_request_declined", onDeclined);
    socket.on("profile_rating_updated", onRatingUpdated);

    return () => {
      socket.off("align_request_accepted", onAccepted);
      socket.off("align_request_declined", onDeclined);
      socket.off("profile_rating_updated", onRatingUpdated);
    };
  }, [userId, load]);

  const handleRateProfile = async (ratingValue) => {
    if (isOwn) return;
    setIsRatingSubmit(true);
    try {
      const res = await api.users.rate(userId, ratingValue);
      if (res.error) toast.error(res.error);
      else toast.success("Rating submitted successfully!");
    } catch {
      toast.error("Failed to submit rating");
    } finally {
      setIsRatingSubmit(false);
    }
  };

  const handleEndAlign = async () => {
    setActionBusy(true);
    try {
      const result = await api.users.unfollow(userId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsFollowing(false);
        setHasRequested(false);
        toast.success("Connection ended");
        setProfile(prev => {
          if (!prev) return prev;
          const updatedFollowers = (prev.followers || []).filter(
            id => (id._id || id).toString() !== me?._id?.toString()
          );
          return { ...prev, followers: updatedFollowers };
        });
      }
    } catch {
      toast.error("Failed to end connection");
    } finally {
      setActionBusy(false);
      setShowAlignMenu(false);
    }
  };

  async function handleFollowToggle() {
    if (!me) return;
    setActionBusy(true);
    setError("");
    try {
      if (isFollowing) {
        await handleEndAlign();
      } else {
        const result = await api.users.follow(userId);
        if (result.error) {
          toast.error(result.error);
        } else {
          setHasRequested(true);
          setIsFollowing(false);
          toast.success("Request pending");
        }
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setActionBusy(false);
    }
  }

  const handleBlock = async () => {
    if (!window.confirm("Block this user? They won't be able to see your profile or message you.")) return;
    try {
      await api.moderation.block(userId);
      toast.success(`${profile.name || profile.username} has been blocked`);
      navigate("/home");
    } catch {
      toast.error("Failed to block user");
    }
  };

  const handleReport = async () => {
    const reason = window.prompt("Reason for reporting this user?");
    if (!reason) return;
    try {
      await api.moderation.report({ targetType: "user", targetId: userId, reason });
      alert("Report submitted. Thank you.");
    } catch {
      setError("Failed to submit report");
    }
  };

  const handleShareProfile = () => setShowShareModal(true);

  const handleShareToUser = async (targetUser) => {
    try {
      const profileUrl = `${window.location.origin}/user/${userId}`;
      const res = await api.messages.send({
        receiverId: targetUser._id,
        content: `Check out this profile: ${profileUrl}`
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Shared with @${targetUser.username}!`);
        setShowShareModal(false);
      }
    } catch (err) {
      toast.error("Failed to share profile");
    }
  };

  const getPostImage = (p) => {
    if (p.media && p.media.length > 0) {
      const m = p.media[0];
      return m.startsWith("http") ? m : `${BASE_URL}${m}`;
    }
    if (p.image) return p.image.startsWith("http") ? p.image : `${BASE_URL}${p.image}`;
    return null;
  };

  const isVideo = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase().split('?')[0];
    return !!lowerUrl.match(/\.(mp4|mov|webm|ogg|mkv|avi|m4v|3gp)$/) || lowerUrl.includes('/video/') || lowerUrl.includes('video/upload');
  };

  if (loading) return <LoadingSpinner centered />;
  if (error && !profile) return (
    <div className="up-container" style={{ paddingTop: '80px', textAlign: 'center' }}>
      <h2>Profile Unavailable</h2>
      <p>{error}</p>
      <button className="action-btn primary" onClick={() => navigate("/discover")} style={{ margin: '20px auto' }}>Discover Others</button>
    </div>
  );
  if (!profile) return null;

  const displayName = profile.name || profile.username || "User";
  const isPrivateAndHidden = profile.isPrivate && !isOwn && !isFollowing;

  return (
    <div className="up-container fade-in">
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      
      <div className="cover-container">
        <img src={profile?.cover ? (profile.cover.startsWith("http") ? profile.cover : `${BASE_URL}${profile.cover}`) : "https://via.placeholder.com/1200x300"} alt="Cover" className="cover-img" />
      </div>

      <div className="profile-header-base">
        <div className="profile-top-row">
          <div className="profile-info-section">
            <div className="profile-avatar-wrap">
              <Avatar user={profile} size="xl" style={{ width: '100%', height: '100%', border: 'none' }} />
            </div>
            
            <div className="profile-info-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 className="profile-display-name" style={{ margin: 0 }}>
                  {displayName}
                </h1>
                {(profile?.isVerified || profile?.isPremium) && <VerifiedBadge size="lg" tier={profile.premiumTier} role={profile.role} />}
              </div>
              {(profile?.isVerified || profile?.isPremium) && (
                <div style={{ marginTop: '4px', marginBottom: '8px' }}>
                  <span className="verified-badge-pill" style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', color: '#0f172a', padding: '4px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', border: '1px solid #e2e8f0' }}>
                    <span>{profile.role === 'brand' ? 'Verified Brand' : 'Verified Creator'}</span>
                  </span>
                </div>
              )}
              
              <div className="profile-title-row" style={{ marginTop: '8px', marginBottom: '16px' }}>
                <span>{profile?.category || "Content Creator"}</span>
                <span className="profile-title-separator">|</span>
                <span>{profile?.role === 'brand' ? 'Brand' : 'Creator'}</span>
                {profile?.location && (
                  <>
                    <span className="profile-title-separator">|</span>
                    <span>📍 {profile.location}</span>
                  </>
                )}
              </div>

              <p className="profile-bio-text">{profile?.bio || "No bio yet."}</p>

              {profile?.experience && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-main)' }}>Experience</h4>
                  <p className="profile-bio-text" style={{ whiteSpace: 'pre-line' }}>{profile.experience}</p>
                </div>
              )}

              {profile?.website && (
                <div style={{ marginTop: '12px' }}>
                  <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="profile-link-item">
                    🔗 {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {profile?.portfolioLink && (
                <div style={{ marginTop: '8px' }}>
                  <a href={profile.portfolioLink.startsWith('http') ? profile.portfolioLink : `https://${profile.portfolioLink}`} target="_blank" rel="noopener noreferrer" className="profile-link-item">
                    🎨 Portfolio
                  </a>
                </div>
              )}
              {profile?.socialMediaLink && (
                <div style={{ marginTop: '8px' }}>
                  <a href={profile.socialMediaLink.startsWith('http') ? profile.socialMediaLink : `https://${profile.socialMediaLink}`} target="_blank" rel="noopener noreferrer" className="profile-link-item">
                    💼 LinkedIn
                  </a>
                </div>
              )}

              {!isOwn && (
                <div style={{ marginTop: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>Rate Profile:</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        disabled={isRatingSubmit}
                        onClick={() => handleRateProfile(star)}
                        onMouseEnter={() => setRatingHover(star)}
                        onMouseLeave={() => setRatingHover(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: isRatingSubmit ? 'not-allowed' : 'pointer',
                          color: star <= (ratingHover || profile?.averageRating || 0) ? '#f59e0b' : '#e2e8f0',
                          fontSize: '24px',
                          padding: 0,
                          transition: 'color 0.2s ease',
                          opacity: isRatingSubmit ? 0.5 : 1
                        }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  {profile?.averageRating > 0 && (
                    <span style={{ fontSize: '13px', color: '#64748b', marginLeft: '4px' }}>
                      ({profile.averageRating.toFixed(1)})
                    </span>
                  )}
                </div>
              )}

              <div className="profile-actions-row">
                {isOwn ? (
                  <button className="action-btn primary" onClick={() => navigate("/profile")}>
                    <UsersIcon /> Edit
                  </button>
                ) : incomingRequest ? (
                  <>
                    <button className="action-btn primary" onClick={() => handleRespondRequest('accept')} disabled={actionBusy}>Accept</button>
                    <button className="action-btn secondary" onClick={() => handleRespondRequest('reject')} disabled={actionBusy}>Decline</button>
                  </>
                ) : (
                  <>
                    <button
                      className={`action-btn ${isFollowing ? 'secondary' : 'primary'}`}
                      disabled={actionBusy || hasRequested}
                      onClick={handleFollowToggle}
                    >
                      <UsersIcon />
                      {actionBusy ? "..." : hasRequested ? "Pending" : isFollowing ? "Connected" : "Connect"}
                    </button>
                    <button className="action-btn secondary" onClick={() => navigate(`/messages/${userId}`)}>
                      <MessageCircleIcon /> Message
                    </button>
                  </>
                )}
                
                <button className="action-btn secondary" onClick={handleShareProfile}>
                  <SendIcon /> {copyStatus ? "Copied!" : "Share"}
                </button>
                <div style={{ position: 'relative' }}>
                  <button className="action-btn secondary icon-only" onClick={() => setShowAlignMenu(!showAlignMenu)}>•••</button>
                  {showAlignMenu && (
                    <div className="dropdown-menu show slide-in" style={{ position: 'absolute', left: 0, top: '100%', marginTop: '8px', background: 'white', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '150px' }}>
                      {isFollowing && <button className="dropdown-item danger" onClick={handleEndAlign}>End Connection</button>}
                      <button className="dropdown-item danger" onClick={handleBlock}>Block User</button>
                      <button className="dropdown-item danger" onClick={handleReport}>Report User</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="stats-cards-row">
        <div className="stat-card-wide clickable" onClick={() => !isPrivateAndHidden && navigate(`/user/${userId}/alliances`)}>
          <div className="stat-icon-wrap"><UsersIcon /></div>
          <div className="stat-info">
            <span className="stat-val">
              {fmtCount(profile?.connectionsCount !== undefined ? profile.connectionsCount : new Set([...(profile?.followers || []), ...(profile?.following || [])]).size)}
            </span>
            <span className="stat-lbl">Connections</span>
            <span className="stat-sub">People in network</span>
          </div>
        </div>
        <div className="stat-card-wide">
          <div className="stat-icon-wrap"><BriefcaseIcon /></div>
          <div className="stat-info">
            <span className="stat-val">{fmtCount(profile?.profileViews || 0)}</span>
            <span className="stat-lbl">Profile Views</span>
            <span className="stat-sub">All time views</span>
          </div>
        </div>
        <div className="stat-card-wide">
          <div className="stat-icon-wrap"><TrendingDownIcon /></div>
          <div className="stat-info">
            <span className="stat-val">{fmtCount(profile?.profileReach || 0)}</span>
            <span className="stat-lbl">Profile Reach</span>
            <span className="stat-sub">Unique accounts</span>
          </div>
        </div>
        <div className="stat-card-wide">
          <div className="stat-icon-wrap"><EyeIcon /></div>
          <div className="stat-info">
            <span className="stat-val">{fmtCount(profile?.featuredIn || 0)}</span>
            <span className="stat-lbl">Featured In</span>
            <span className="stat-sub">By brands</span>
          </div>
        </div>
      </div>

      <div className="profile-bottom-wrapper">
      <div className="profile-tabs-wide">
        <div className={`tab-item-wide ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          <span className="tab-icon"><GridIcon /></span> Posts
        </div>
        <div className={`tab-item-wide ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')}>
          <span className="tab-icon"><BriefcaseIcon /></span> Portfolio
        </div>

        <div className={`tab-item-wide ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
          <span className="tab-icon"><ProfileIcon /></span> About
        </div>
        <div className={`tab-item-wide ${activeTab === 'trust' ? 'active' : ''}`} onClick={() => setActiveTab('trust')}>
          <span className="tab-icon"><ShieldIcon /></span> Trust Report
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        {isPrivateAndHidden ? (
          <div style={{ textAlign: 'center', padding: '60px', background: '#fff', borderRadius: '16px' }}>
            <span style={{ fontSize: '40px' }}>🔒</span>
            <h3 style={{ margin: '16px 0 8px' }}>This account is private</h3>
            <p style={{ color: '#64748B' }}>Connect with this user to see their posts and portfolio.</p>
          </div>
        ) : (
          <>
            {activeTab === "posts" && (
              <div className="profile-ig-grid">
                {loadingPosts ? (
                   <div style={{ gridColumn: '1 / -1' }}><PostSkeleton /></div>
                ) : userPosts.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px' }}>
                    <span style={{ fontSize: '40px' }}>📷</span>
                    <h3 style={{ marginTop: '16px' }}>No Posts Yet</h3>
                  </div>
                ) : (
                  userPosts.map(post => (
                    <div key={post._id} className="profile-ig-grid-item" onClick={() => setLightboxPost(post)}>
                      {getPostImage(post) ? (
                        isVideo(getPostImage(post)) ? (
                          <video src={`${getPostImage(post)}#t=0.001`} className="profile-ig-grid-img" preload="metadata" muted playsInline />
                        ) : (
                          <img src={getPostImage(post)} alt="" className="profile-ig-grid-img" />
                        )
                      ) : (
                        <div className="profile-ig-grid-text">{post.content}</div>
                      )}
                      <div className="profile-ig-grid-overlay">
                        <span>❤️ {post.likes?.length || 0}</span>
                        <span>💬 {post.comments?.length || 0}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeTab === "portfolio" && <PortfolioGrid items={profile?.portfolio || []} />}

            {activeTab === "about" && <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', color: '#64748B' }}>{profile?.bio || "No bio yet."}</div>}

            {activeTab === "trust" && (
              <div style={{ marginTop: '24px' }}>
                <TrustScore user={profile} isOwnProfile={isOwn} onUpdate={(updated) => setProfile(updated)} />
              </div>
            )}
          </>
        )}
      </div>
      </div>

      {lightboxPost && (
        <div className="profile-ig-lightbox" onClick={() => setLightboxPost(null)}>
          <div className="profile-ig-lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="profile-ig-lightbox-close" onClick={() => setLightboxPost(null)}>✕</button>
            {getPostImage(lightboxPost) && (
              <div className="profile-ig-lightbox-media">
                {isVideo(getPostImage(lightboxPost)) ? (
                  <video src={`${getPostImage(lightboxPost)}#t=0.001`} controls autoPlay playsInline preload="metadata" className="profile-ig-lightbox-img" style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
                ) : (
                  <img src={getPostImage(lightboxPost)} alt="" className="profile-ig-lightbox-img" />
                )}
              </div>
            )}
            <div className="profile-ig-lightbox-body">
              <div className="profile-ig-lightbox-content">
                <div className="profile-ig-lightbox-header">
                  <Avatar user={profile} size="sm" />
                  <strong>{profile?.username}</strong>
                </div>
                <div className="profile-ig-lightbox-scroll">
                  <div className="comment-item main-caption">
                    <strong>{profile?.username}</strong> {lightboxPost.content}
                  </div>
                  {lightboxPost.comments?.map((c, i) => (
                    <div key={i} className="comment-item">
                      <strong>{c.user?.username || c.user?.name || "User"}</strong> {c.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareModal && (
        <UserListModal 
          userId={me?._id} 
          type="following" 
          onClose={() => setShowShareModal(false)} 
          onSelect={handleShareToUser}
        />
      )}
    </div>
  );
}
