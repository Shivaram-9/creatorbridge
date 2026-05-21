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

  const handleLike = async (e, post) => {
    e.stopPropagation();
    if (!user) return;

    const isLiked = post.likes?.some(l => (l._id || l) === user._id);
    const newLikes = isLiked 
      ? post.likes.filter(l => (l._id || l) !== user._id)
      : [...(post.likes || []), user._id];
    
    setPosts(prev => prev.map(p => p._id === post._id ? { ...p, likes: newLikes } : p));
    if (lightboxPost?._id === post._id) setLightboxPost({ ...lightboxPost, likes: newLikes });

    try {
      const res = await api.posts.like(post._id);
      if (res.error) {
        setPosts(prev => prev.map(p => p._id === post._id ? { ...p, likes: post.likes } : p));
        if (lightboxPost?._id === post._id) setLightboxPost(post);
        toast.error("Failed to like post");
      } else {
        setPosts(prev => prev.map(p => p._id === post._id ? { ...p, likes: res.likes } : p));
        if (lightboxPost?._id === post._id) setLightboxPost({ ...lightboxPost, likes: res.likes });
      }
    } catch (err) {
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

  const handleShare = () => setShowShareModal(true);

  const handleShareToUser = async (targetUser) => {
    try {
      const profileUrl = `${window.location.origin}/user/${user._id}`;
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

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("cover", file);
    try {
      toast.loading("Uploading cover...", { id: "cover-upload" });
      const res = await api.users.updateCover(formData);
      if (res?.error) toast.error(res.error, { id: "cover-upload" });
      else {
        toast.success("Cover updated!", { id: "cover-upload" });
        setUser(res);
      }
    } catch (err) {
      toast.error("Failed to upload cover", { id: "cover-upload" });
    }
  };

  if (loadingData) return <LoadingSpinner centered />;

  return (
    <div className="profile-container fade-in">
      <div className="cover-container">
        <img src={user?.cover ? (user.cover.startsWith("http") ? user.cover : `${BASE_URL}${user.cover}`) : "https://via.placeholder.com/1200x300"} alt="Cover" className="cover-img" />
        <div className="cover-actions">
          <button className="cover-btn" onClick={() => coverInputRef.current.click()}>
            <span>📷</span> Edit cover
          </button>
          <input type="file" ref={coverInputRef} hidden accept="image/*" onChange={handleCoverChange} />
        </div>
      </div>

      <div className="profile-header-base">
        <div className="profile-top-row">
          <div className="profile-info-section">
            <div className="profile-avatar-wrap">
              <Avatar user={user} size="xl" style={{ width: '100%', height: '100%', border: 'none' }} />
            </div>
            
            <div className="profile-info-content">
              <h1 className="profile-display-name">
                {user?.name || user?.username}
                {(user?.isVerified || user?.isPremium) && (
                  <span className="verified-badge-pill">
                    <VerifiedBadge size="sm" tier={user.premiumTier} /> 
                    {user.role === 'brand' ? 'Verified Brand' : 'Verified Creator'}
                  </span>
                )}
              </h1>
              
              <div className="profile-title-row" style={{ marginTop: '8px', marginBottom: '16px' }}>
                <span>{user?.category || "Content Creator"}</span>
                <span className="profile-title-separator">|</span>
                <span>{user?.role === 'brand' ? 'Brand' : 'Creator'}</span>
                {user?.location && (
                  <>
                    <span className="profile-title-separator">|</span>
                    <span>📍 {user.location}</span>
                  </>
                )}
              </div>

              <p className="profile-bio-text">{user?.bio || "No bio yet."}</p>

              {user?.website && (
                <div style={{ marginTop: '12px' }}>
                  <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="profile-link-item">
                    🔗 {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              <div className="profile-actions-row">
                <button className="action-btn secondary" onClick={handleShare}>
                  <SendIcon /> {copyStatus ? "Copied!" : "Share Profile"}
                </button>
                <div style={{ position: 'relative' }}>
                  <button className="action-btn secondary icon-only" onClick={() => setShowMenu(!showMenu)}>•••</button>
                  {showMenu && (
                    <div className="dropdown-menu show slide-in" style={{ position: 'absolute', left: 0, top: '100%', marginTop: '8px', background: 'white', border: '1px solid #eee', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 100, minWidth: '150px' }}>
                      <button className="dropdown-item" onClick={() => navigate("/profile/edit")}>Edit Profile</button>
                      <button className="dropdown-item" onClick={() => navigate("/settings")}>Settings</button>
                      <button className="dropdown-item danger" onClick={() => { localStorage.clear(); window.location.href = "/login"; }}>Logout</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="identity-overview-card">
            <h2 className="overview-title">Identity Overview ℹ️</h2>
            <div className="overview-list">
              <div className="overview-item">
                <span className="overview-key">Professional Since</span>
                <span className="overview-val">2020</span>
              </div>
              <div className="overview-item">
                <span className="overview-key">Industry</span>
                <span className="overview-val">{user?.category || "Tech & Gaming"}</span>
              </div>
              <div className="overview-item">
                <span className="overview-key">Creator Type</span>
                <span className="overview-val">{user?.role === 'brand' ? 'Brand' : 'Content Creator'}</span>
              </div>
              <div className="overview-item">
                <span className="overview-key">Verified Identity</span>
                <span className="overview-val" style={{ color: user?.isVerified ? '#2563EB' : 'inherit' }}>
                  {user?.isVerified ? "Verified" : "Not Verified"}
                </span>
              </div>
              <div className="overview-item">
                <span className="overview-key">Network Reach</span>
                <span className="overview-val">{fmtCount(user?.profileViews || 12600)}+</span>
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

      <div className="collab-section">
        <div className="collab-header">
          <h3>Open to Collaborate On</h3>
          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/collaborations'); }}>View all opportunities →</a>
        </div>
        <div className="collab-tags">
          <span className="collab-tag blue">🚀 Brand Campaigns</span>
          <span className="collab-tag green">🛍️ Product Reviews</span>
          <span className="collab-tag purple">⭐ Sponsored Content</span>
          <span className="collab-tag orange">🤝 Brand Partnerships</span>
          <span className="collab-tag blue">♾️ Long Term Collaborations</span>
        </div>
      </div>

      <div className="stats-cards-row">
        <div className="stat-card-wide clickable" onClick={() => navigate(`/user/${user._id}/alliances`)}>
          <div className="stat-icon-wrap purple">👥</div>
          <div className="stat-info">
            <span className="stat-val">{fmtCount(new Set([...(user?.followers || []), ...(user?.following || [])]).size)}</span>
            <span className="stat-lbl">Connections</span>
            <span className="stat-sub">People in network</span>
          </div>
        </div>
        <div className="stat-card-wide">
          <div className="stat-icon-wrap green">💼</div>
          <div className="stat-info">
            <span className="stat-val">{fmtCount(user?.profileViews || 0)}+</span>
            <span className="stat-lbl">Profile Views</span>
            <span className="stat-sub">All time views</span>
          </div>
        </div>
        <div className="stat-card-wide">
          <div className="stat-icon-wrap orange">📉</div>
          <div className="stat-info">
            <span className="stat-val">{fmtCount((user?.profileViews || 0) * 2)}</span>
            <span className="stat-lbl">Profile Reach</span>
            <span className="stat-sub">Unique accounts</span>
          </div>
        </div>
        <div className="stat-card-wide">
          <div className="stat-icon-wrap blue">👁️</div>
          <div className="stat-info">
            <span className="stat-val">8</span>
            <span className="stat-lbl">Featured In</span>
            <span className="stat-sub">By brands</span>
          </div>
        </div>
      </div>

      <div className="profile-tabs-wide">
        <div className={`tab-item-wide ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          <span>📱</span> Posts
        </div>
        <div className={`tab-item-wide ${activeTab === 'portfolio' ? 'active' : ''}`} onClick={() => setActiveTab('portfolio')}>
          <span>💼</span> Portfolio
        </div>
        <div className={`tab-item-wide ${activeTab === 'tagged' ? 'active' : ''}`} onClick={() => setActiveTab('tagged')}>
          <span>🏷️</span> Tagged
        </div>
        <div className={`tab-item-wide ${activeTab === 'about' ? 'active' : ''}`} onClick={() => setActiveTab('about')}>
          <span>👤</span> About
        </div>
      </div>

      <div style={{ marginBottom: '40px' }}>
        {activeTab === "posts" && (
          <div className="profile-ig-grid">
            {posts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px' }}>
                <span style={{ fontSize: '40px' }}>📷</span>
                <h3 style={{ marginTop: '16px' }}>No Posts Yet</h3>
              </div>
            ) : (
              posts.map(post => (
                <div key={post._id} className="profile-ig-grid-item" onClick={() => setLightboxPost(post)}>
                  {getPostImage(post) ? (
                    <img src={getPostImage(post)} alt="" className="profile-ig-grid-img" />
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
        {activeTab === "portfolio" && <PortfolioGrid userId={user._id} />}
        {activeTab === "tagged" && <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', color: '#64748B' }}>No tagged posts yet.</div>}
        {activeTab === "about" && <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', color: '#64748B' }}>{user?.bio || "No bio yet."}</div>}
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
                    <button className="action-btn icon-only" onClick={(e) => handleLike(e, lightboxPost)} style={{ background: 'transparent' }}>
                      <HeartIcon filled={lightboxPost.likes?.some(l => (l._id || l) === user?._id)} />
                    </button>
                    <button className="action-btn icon-only" style={{ background: 'transparent' }}>
                      <MessageCircleIcon />
                    </button>
                    <button className="action-btn icon-only" onClick={(e) => handleSharePost(e, lightboxPost)} style={{ background: 'transparent' }}>
                      <SendIcon />
                    </button>
                  </div>
                  <button className="action-btn icon-only" onClick={(e) => handleSave(e, lightboxPost)} style={{ background: 'transparent' }}>
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
