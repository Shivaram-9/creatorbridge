import { useEffect, useState, useCallback, useRef } from "react";
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
import UserListModal from "../components/UserListModal.jsx";

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
  const [showShareModal, setShowShareModal] = useState(false);
  const coverInputRef = useRef(null);

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

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleShareToUser = async (targetUser) => {
    try {
      const profileUrl = `${window.location.origin}/user/${user._id}`;
      const res = await api.messages.send({
        receiverId: targetUser._id,
        content: `Check out this profile: ${profileUrl}`
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Shared with @${targetUser.username}!`);
        setShowShareModal(false);
      }
    } catch (err) {
      toast.error("Failed to share profile");
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

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("cover", file);

    try {
      toast.loading("Uploading cover...", { id: "cover-upload" });
      const res = await api.users.updateCover(formData);
      if (res?.error) {
        toast.error(res.error, { id: "cover-upload" });
      } else {
        toast.success("Cover updated!", { id: "cover-upload" });
        setUser(res);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload cover", { id: "cover-upload" });
    }
  };

  return (
    <div className="profile-container">
      {/* Cover Image */}
      <div className="cover-container">
        <img src={user?.cover ? (user.cover.startsWith("http") ? user.cover : `${BASE_URL}${user.cover}`) : "https://via.placeholder.com/1200x300"} alt="Cover" className="cover-img" />
        <div className="cover-actions">
          <button className="cover-btn" onClick={() => coverInputRef.current.click()}>
            <span>📷</span> Edit cover
          </button>
          <input
            type="file"
            ref={coverInputRef}
            hidden
            accept="image/*"
            onChange={handleCoverChange}
          />
        </div>
      </div>

      {/* Profile Header (Overlapping) */}
      <div className="profile-header-wrap">
        <div className="profile-avatar-wrap">
          <img src={user?.avatar || "/placeholder_avatar.png"} alt="Avatar" />
        </div>
        
        <div className="profile-actions">
          <button className="action-btn secondary" onClick={handleShare}>
            {copyStatus ? "Copied!" : "Share Profile"}
          </button>
          <button className="action-btn secondary" onClick={() => setShowMenu(!showMenu)}>•••</button>
          {showMenu && (
            <div className="dropdown-menu show slide-in" style={{ position: 'absolute', right: 40, top: 'calc(100% + 10px)', background: 'white', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100 }}>
              <button className="dropdown-item" onClick={() => navigate("/profile/edit")}>Edit Profile</button>
              <button className="dropdown-item" onClick={() => navigate("/settings")}>Settings</button>
              <button className="dropdown-item danger" onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>Logout</button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Info & Content Grid */}
      <div className="profile-content-grid">
        {/* Main Info Column */}
        <div className="main-info-col">
          <div className="profile-name-section">
            <h1 className="profile-display-name">
              {user?.name || user?.username}
              {(user?.isVerified || user?.isPremium) && (
                <span className="verified-badge-pill">Verified Creator</span>
              )}
            </h1>
            <span className="profile-title-text">{user?.category || "Content Creator"}</span>
          </div>

          <p className="profile-bio-text">
            {user?.bio || "No bio yet."}
          </p>

          <div className="profile-links">
            {user?.location && (
              <span className="profile-link-item">📍 {user.location}</span>
            )}
            {user?.website && (
              <a href={user.website} target="_blank" rel="noopener noreferrer" className="profile-link-item">
                🔗 {user.website}
              </a>
            )}
          </div>

          {/* Stats Cards */}
          <div className="stats-cards-grid">
            <div className="stat-card">
              <span className="stat-value">{posts.length}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-card clickable" onClick={() => navigate(`/user/${user._id}/alliances`)}>
              <span className="stat-value">{fmtCount(new Set([...(user?.followers || []), ...(user?.following || [])]).size)}</span>
              <span className="stat-label">Connections</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{fmtCount(user?.profileViews || 0)}</span>
              <span className="stat-label">Profile Views</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{fmtCount(user?.followers?.length || 0)}</span>
              <span className="stat-label">Followers</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="profile-tabs">
            <div className={`tab-item ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>Posts</div>
            <div className={`tab-item ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')}>Portfolio</div>
            <div className={`tab-item ${activeTab === 'tagged' ? 'active' : ''}`} onClick={() => setActiveTab('tagged')}>Tagged</div>
            <div className={`tab-item ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>About</div>
          </div>
          {/* Tab Content */}
          <div className="profile-tab-content">
            {activeTab === "posts" && (
              <div className="profile-ig-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
                {posts.length === 0 ? (
                  <div className="profile-ig-no-posts" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px' }}>
                    <div className="no-posts-box">
                      <span style={{ fontSize: '40px' }}>📷</span>
                      <h3>No Posts Yet</h3>
                    </div>
                  </div>
                ) : (
                  posts.map(post => (
                    <div key={post._id} className="profile-ig-grid-item" onClick={() => setLightboxPost(post)} style={{ position: 'relative', cursor: 'pointer', borderRadius: '12px', overflow: 'hidden' }}>
                      {getPostImage(post) ? (
                        <img src={getPostImage(post)} alt="" className="profile-ig-grid-img" style={{ width: '100%', height: '200px', objectFit: 'cover' }} />
                      ) : (
                        <div className="profile-ig-grid-text" style={{ padding: '20px', background: '#fff', border: '1px solid #eee', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{post.content}</div>
                      )}
                      <div className="profile-ig-grid-overlay" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', opacity: 0, transition: 'opacity 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                        <span>❤️ {post.likes?.length || 0}</span>
                        <span>💬 {post.comments?.length || 0}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeTab === "portfolio" && <PortfolioGrid userId={user._id} />}
            {activeTab === "tagged" && <div style={{ textAlign: 'center', padding: '40px', color: '#71839B' }}>No tagged posts yet.</div>}
            {activeTab === "about" && <div style={{ textAlign: 'center', padding: '40px', color: '#71839B' }}>{user?.bio || "No bio yet."}</div>}
          </div>
        </div>

        {/* Identity Overview Sidebar */}
        <div className="identity-overview-col">
          <div className="identity-overview-card">
            <h2 className="overview-title">Identity Overview ℹ️</h2>
            <div className="overview-list">
              <div className="overview-item">
                <span className="overview-key">Professional Since</span>
                <span className="overview-val">2020</span>
              </div>
              <div className="overview-item">
                <span className="overview-key">Industry</span>
                <span className="overview-val">{user?.category || "Not Specified"}</span>
              </div>
              <div className="overview-item">
                <span className="overview-key">Creator Type</span>
                <span className="overview-val">Content Creator</span>
              </div>
              <div className="overview-item">
                <span className="overview-key">Verified Identity</span>
                <span className="overview-val">{user?.isVerified ? "Verified" : "Not Verified"}</span>
              </div>
              <div className="overview-item">
                <span className="overview-key">Network Reach</span>
                <span className="overview-val">12.6K+</span>
              </div>
            </div>

            {(!user?.isVerified && !user?.isPremium) && (
              <div className="get-verified-card">
                <p className="get-verified-text">Build trust with brands. Get verified to unlock more opportunities.</p>
                <button className="get-verified-btn" onClick={() => navigate("/apply-verification")}>Get Verified</button>
              </div>
            )}
          </div>
        </div>
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
      {showShareModal && (
        <UserListModal 
          userId={user._id} 
          type="following" 
          onClose={() => setShowShareModal(false)} 
          onSelect={handleShareToUser}
        />
      )}
    </div>
  );
}
