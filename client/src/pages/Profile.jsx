import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { BASE_URL } from "../config/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Avatar from "../components/Avatar.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import PortfolioGrid from "../components/PortfolioGrid.jsx";
import { HeartIcon, MessageCircleIcon, SendIcon, BookmarkIcon } from "../components/Icons.jsx";
import toast from "react-hot-toast";
import "./Profile.css";

function fmtCount(n) {
  if (!n || n <= 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [copyStatus, setCopyStatus] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [lightboxPost, setLightboxPost] = useState(null);

  const loadData = useCallback(async () => {
    if (!user?._id) return;
    setLoadingData(true);
    try {
      const [postsRes, collabsRes] = await Promise.all([
        api.posts.userPosts(user._id),
        api.collaborations.list()
      ]);
      if (!postsRes.error) setPosts(Array.isArray(postsRes) ? postsRes : []);
      if (!collabsRes.error) setCollabs(Array.isArray(collabsRes) ? collabsRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const handleLike = async (e, post) => {
    e.stopPropagation();
    if (!user) return;

    // Optimistic Update
    const isLiked = post.likes?.some(l => (l._id || l) === user._id);
    const newLikes = isLiked 
      ? post.likes.filter(l => (l._id || l) !== user._id)
      : [...(post.likes || []), user._id];
    
    setPosts(prev => prev.map(p => p._id === post._id ? { ...p, likes: newLikes } : p));
    if (lightboxPost?._id === post._id) setLightboxPost({ ...lightboxPost, likes: newLikes });

    try {
      const res = await api.posts.like(post._id);
      if (res.error) {
        // Revert on error
        setPosts(prev => prev.map(p => p._id === post._id ? { ...p, likes: post.likes } : p));
        if (lightboxPost?._id === post._id) setLightboxPost(post);
        toast.error("Failed to like post");
      } else {
        // Sync with actual server data
        setPosts(prev => prev.map(p => p._id === post._id ? { ...p, likes: res.likes } : p));
        if (lightboxPost?._id === post._id) setLightboxPost({ ...lightboxPost, likes: res.likes });
      }
    } catch (err) {
      // Revert on catch
      setPosts(prev => prev.map(p => p._id === post._id ? { ...p, likes: post.likes } : p));
      if (lightboxPost?._id === post._id) setLightboxPost(post);
    }
  };

  const handleSave = async (e, post) => {
    e.stopPropagation();
    if (!user) return;
    
    try {
      const res = await api.posts.save(post._id);
      if (!res.error) {
        toast.success(res.saved ? "Post saved" : "Post removed from saves");
        
        // Update global user state for saved posts
        const updatedSavedPosts = res.saved 
          ? [...(user.savedPosts || []), post._id]
          : (user.savedPosts || []).filter(id => id.toString() !== post._id);
        
        setUser({ ...user, savedPosts: updatedSavedPosts });
      }
    } catch (err) {
      toast.error("Failed to save post");
    }
  };

  const handleCommentSubmit = async (e, postId, text) => {
    e.preventDefault();
    if (!text?.trim() || !user) return;

    try {
      const res = await api.posts.comment(postId, text);
      if (!res.error) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return { ...p, comments: [...(p.comments || []), res] };
          }
          return p;
        }));
        if (lightboxPost?._id === postId) {
          setLightboxPost(prev => ({
            ...prev,
            comments: [...(prev.comments || []), res]
          }));
        }
        toast.success("Comment posted!");
      }
    } catch (err) {
      toast.error("Failed to post comment");
    }
  };

  const handleSharePost = (e, post) => {
    e.stopPropagation();
    const postUrl = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(postUrl);
    toast.success("Link copied to clipboard");
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/user/${user._id}`);
      setCopyStatus(true);
      toast.success("Profile link copied!");
      setTimeout(() => setCopyStatus(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (loadingData) return <LoadingSpinner centered />;

  const getPostImage = (p) => {
    if (p.media && p.media.length > 0) {
      const m = p.media[0];
      return m.startsWith("http") ? m : `${BASE_URL}${m}`;
    }
    if (p.image) {
      return p.image.startsWith("http") ? p.image : `${BASE_URL}${p.image}`;
    }
    return null;
  };

  return (
    <div className="profile-ig">
      {/* Profile Header */}
      <div className="profile-ig-header">
        {/* Avatar - explicitly sized wrapper */}
        <div className="profile-ig-avatar-wrap" style={{ width: '150px', height: '150px', minWidth: '150px', borderRadius: '50%', overflow: 'hidden' }}>
          <Avatar user={user} size="xl" />
        </div>

        {/* Three Dots Menu for Owner */}
        <div className="up-abs-actions" style={{ position: 'absolute', top: '20px', right: '20px' }}>
          <button className="up-more-trigger" onClick={() => setShowMenu(!showMenu)}>•••</button>
          {showMenu && (
            <div className="dropdown-menu show slide-in" style={{ position: 'absolute', right: 0, top: '40px', background: 'white', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100 }}>
              <button className="dropdown-item" onClick={() => navigate("/profile/edit")}>Edit Profile</button>
              <button className="dropdown-item" onClick={handleShare}>Share Profile</button>
              <button className="dropdown-item" onClick={() => navigate("/settings")}>Settings</button>
              <button className="dropdown-item danger" onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>Logout</button>
            </div>
          )}
        </div>

        {/* Info Column */}
        <div className="profile-ig-info">
          {/* Username + Actions */}
          <div className="profile-ig-top">
            <h2 className="profile-ig-username">
              {user?.username}
              {(user?.isVerified || user?.isPremium) && (
                <VerifiedBadge size="sm" tier={user?.premiumTier} />
              )}
            </h2>
            <div className="profile-ig-actions">
              <button
                className="profile-ig-btn profile-ig-btn--primary"
                onClick={() => navigate("/profile/edit")}
              >
                Edit profile
              </button>
              <button
                className="profile-ig-btn"
                onClick={handleShare}
              >
                {copyStatus ? "Copied!" : "Share profile"}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="profile-ig-stats-alliances">
            <div className="profile-ig-stat">
              <strong>{posts.length}</strong>
              <span>posts</span>
            </div>
            <div
              className="profile-ig-stat clickable"
              onClick={() => navigate(`/user/${user._id}/alliances`)}
            >
              <strong>{fmtCount(new Set([...(user?.followers || []), ...(user?.following || [])]).size)}</strong>
              <span>Alliances</span>
            </div>
          </div>

          {/* Bio */}
          <div className="profile-ig-bio">
            {user?.name && <strong className="profile-ig-name">{user.name}</strong>}
            {user?.category && <span className="profile-ig-category">{user.category}</span>}
            {user?.bio && <p className="profile-ig-bio-text">{user.bio}</p>}
            {user?.location && (
              <span className="profile-ig-location">
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
                {user.location}
              </span>
            )}
            {user?.website && (
              <a
                className="profile-ig-website"
                href={user.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                {user.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bio (shows below avatar on mobile) */}
      <div className="profile-ig-bio-mobile">
        {user?.name && <strong className="profile-ig-name">{user.name}</strong>}
        {user?.category && <span className="profile-ig-category">{user.category}</span>}
        {user?.bio && <p className="profile-ig-bio-text">{user.bio}</p>}
        {user?.location && (
          <span className="profile-ig-location">📍 {user.location}</span>
        )}
        {user?.website && (
          <a
            className="profile-ig-website"
            href={user.website}
            target="_blank"
            rel="noopener noreferrer"
          >
            {user.website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>

      {/* Mobile Action Buttons */}
      <div className="profile-ig-actions-mobile">
        <button
          className="profile-ig-btn profile-ig-btn--mobile"
          onClick={() => navigate("/profile/edit")}
        >
          Edit profile
        </button>
        <button
          className="profile-ig-btn profile-ig-btn--mobile"
          onClick={handleShare}
        >
          {copyStatus ? "Copied!" : "Share profile"}
        </button>
      </div>

      {/* Tabs */}
      <div className="profile-ig-tabs">
        <button
          className={`profile-ig-tab ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span>POSTS</span>
        </button>
        <button
          className={`profile-ig-tab ${activeTab === "portfolio" ? "active" : ""}`}
          onClick={() => setActiveTab("portfolio")}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <span>PORTFOLIO</span>
        </button>
        <button
          className={`profile-ig-tab ${activeTab === "tagged" ? "active" : ""}`}
          onClick={() => setActiveTab("tagged")}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          <span>TAGGED</span>
        </button>
        <button
          className={`profile-ig-tab ${activeTab === "collabs" ? "active" : ""}`}
          onClick={() => setActiveTab("collabs")}
        >
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span>COLLABS</span>
        </button>
      </div>

      {/* Content Grid */}
      <div className="profile-ig-grid-wrap">
        {activeTab === "posts" && (
          <>
            {posts.length === 0 ? (
              <div className="profile-ig-empty">
                <div className="profile-ig-empty-icon">
                  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </div>
                <h3>Share Photos</h3>
                <p>When you share photos, they'll appear on your profile.</p>
                <button onClick={() => navigate("/home")} className="profile-ig-share-first">
                  Share your first photo
                </button>
              </div>
            ) : (
              <div className="profile-ig-grid">
                {posts.map(p => {
                  const imgSrc = getPostImage(p);
                  return (
                    <div
                      key={p._id}
                      className="profile-ig-grid-item"
                      onClick={() => setLightboxPost(p)}
                    >
                      {imgSrc ? (
                        <img
                          src={imgSrc}
                          alt=""
                          className="profile-ig-grid-img"
                          onError={e => { e.target.style.display = "none"; }}
                        />
                      ) : (
                        <div className="profile-ig-grid-text">
                          {p.content?.slice(0, 80)}
                        </div>
                      )}
                      <div className="profile-ig-grid-overlay">
                        <span>❤️ {p.likes?.length || 0}</span>
                        <span>💬 {p.comments?.length || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "portfolio" && (
          <PortfolioGrid userId={user?._id} />
        )}

        {activeTab === "tagged" && (
          <div className="profile-ig-empty">
            <div className="profile-ig-empty-icon">
              <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            </div>
            <h3>Photos of you</h3>
            <p>When people tag you in photos, they'll appear here.</p>
          </div>
        )}

        {activeTab === "collabs" && (
          collabs.length === 0 ? (
            <div className="profile-ig-empty">
              <div className="profile-ig-empty-icon">
                <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>No Collabs Yet</h3>
              <p>Your collaborations will appear here.</p>
            </div>
          ) : (
            <div className="profile-ig-grid">
              {collabs.map(c => (
                <div key={c._id} className="profile-ig-grid-item">
                  <div className="profile-ig-grid-text">{c.title || c.description}</div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Post Lightbox */}
      {lightboxPost && (
        <div className="profile-ig-lightbox" onClick={() => setLightboxPost(null)}>
          <div className="profile-ig-lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="profile-ig-lightbox-close" onClick={() => setLightboxPost(null)}>✕</button>
            {getPostImage(lightboxPost) && (
              <div className="profile-ig-lightbox-media">
                <img src={getPostImage(lightboxPost)} alt="" className="profile-ig-lightbox-img" />
              </div>
            )}
            <div className="profile-ig-lightbox-body">
              <div className="profile-ig-lightbox-content">
                <div className="profile-ig-lightbox-header">
                  <Avatar user={user} size="sm" />
                  <strong>{user?.username}</strong>
                </div>
                <div className="profile-ig-lightbox-scroll">
                  <div className="comment-item main-caption">
                    <strong>{user?.username}</strong> {lightboxPost.content}
                  </div>
                  {lightboxPost.comments?.map((c, i) => (
                    <div key={i} className="comment-item">
                      <strong>{c.user?.username || c.user?.name || "User"}</strong> {c.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="profile-ig-lightbox-footer">
                <div className="profile-ig-lightbox-actions">
                  <div className="actions-left">
                    <button className="action-btn" onClick={(e) => handleLike(e, lightboxPost)}>
                      <HeartIcon filled={lightboxPost.likes?.some(l => (l._id || l) === user?._id)} />
                    </button>
                    <button className="action-btn">
                      <MessageCircleIcon />
                    </button>
                    <button className="action-btn" onClick={(e) => handleSharePost(e, lightboxPost)}>
                      <SendIcon />
                    </button>
                  </div>
                  <button className="action-btn" onClick={(e) => handleSave(e, lightboxPost)}>
                    <BookmarkIcon filled={user?.savedPosts?.some(id => id.toString() === lightboxPost._id)} />
                  </button>
                </div>
                <div className="profile-ig-lightbox-counts">
                  <strong>{lightboxPost.likes?.length || 0} likes</strong>
                  <span className="post-date">{new Date(lightboxPost.createdAt).toLocaleDateString()}</span>
                </div>
                <form 
                  className="profile-ig-lightbox-comment-form"
                  onSubmit={(e) => {
                    const text = e.target.comment.value;
                    handleCommentSubmit(e, lightboxPost._id, text);
                    e.target.reset();
                  }}
                >
                  <input name="comment" placeholder="Add a comment..." autoComplete="off" />
                  <button type="submit">Post</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
