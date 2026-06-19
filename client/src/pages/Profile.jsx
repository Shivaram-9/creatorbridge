import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GridIcon, BriefcaseIcon, TagIcon, ProfileIcon, RocketIcon, ShoppingBagIcon, StarIcon, HandshakeIcon, InfinityIcon, TrendingDownIcon, EyeIcon, UsersIcon } from "../components/Icons.jsx";
import { api } from "../services/api.js";
import { BASE_URL } from "../config/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Avatar from "../components/Avatar.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import PortfolioGrid from "../components/PortfolioGrid.jsx";
import { HeartIcon, MessageCircleIcon, SendIcon, BookmarkIcon, ShieldIcon } from "../components/Icons.jsx";
import toast from "react-hot-toast";
import "./Profile.css";
import UserListModal from "../components/UserListModal.jsx";
import TrustScore from "../components/TrustScore.jsx";

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
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [postToShare, setPostToShare] = useState(null);
  
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioCaption, setPortfolioCaption] = useState("");
  const [portfolioUploading, setPortfolioUploading] = useState(false);
  
  const coverInputRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!user?._id) return;
    setLoadingData(true);
    try {
      const [meRes, postsRes, collabsRes] = await Promise.all([
        api.users.me(),
        api.posts.userPosts(user._id),
        api.collaborations.list()
      ]);
      if (!meRes.error) setUser(meRes);
      if (!postsRes.error) setPosts(Array.isArray(postsRes) ? postsRes : []);
      if (!collabsRes.error) setCollabs(Array.isArray(collabsRes) ? collabsRes : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  }, [user?._id, setUser]);

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
      toast.error("Failed to share post");
    }
  };

  const handleAddPortfolio = async () => {
    if (!portfolioUrl) return toast.error("Media URL is required");
    try {
      setPortfolioUploading(true);
      const res = await api.users.addPortfolioItem({
        url: portfolioUrl,
        caption: portfolioCaption,
        mediaType: isVideo(portfolioUrl) ? "video" : "image"
      });
      if (res.error) {
        toast.error(res.error);
      } else {
        setUser(res);
        setShowPortfolioModal(false);
        setPortfolioUrl("");
        setPortfolioCaption("");
        toast.success("Portfolio item added");
      }
    } catch (err) {
      toast.error("Failed to add portfolio item");
    } finally {
      setPortfolioUploading(false);
    }
  };

  const handleRemovePortfolio = async (itemId) => {
    try {
      const res = await api.users.removePortfolioItem(itemId);
      if (res.error) toast.error(res.error);
      else {
        setUser(res);
        toast.success("Portfolio item removed");
      }
    } catch (err) {
      toast.error("Failed to remove portfolio item");
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
    setPostToShare(post);
  };

  const handleSharePostToUser = async (targetUser) => {
    try {
      if (!postToShare) return;
      const postUrl = `${window.location.origin}/post/${postToShare._id}`;
      const res = await api.messages.send({
        receiverId: targetUser._id,
        content: `Check out this post: ${postUrl}`
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success(`Shared with @${targetUser.username}!`);
        setPostToShare(null);
      }
    } catch (err) {
      toast.error("Failed to share post");
    }
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

  const isVideo = (url) => {
    if (!url) return false;
    const lowerUrl = url.toLowerCase().split('?')[0];
    return !!lowerUrl.match(/\.(mp4|mov|webm|ogg|mkv|avi|m4v|3gp)$/) || lowerUrl.includes('/video/') || lowerUrl.includes('video/upload');
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
              <Avatar user={user} size="xl" style={{ width: '100%', height: '100%', border: 'none', minWidth: 'unset', minHeight: 'unset' }} />
            </div>
            
            <div className="profile-info-content">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 className="profile-display-name" style={{ margin: 0 }}>
                  {user?.name || user?.username}
                </h1>
                {(user?.isVerified || user?.isPremium) && <VerifiedBadge size="lg" tier={user.premiumTier} role={user.role} />}
              </div>
              {(user?.isVerified || user?.isPremium) && (
                <div style={{ marginTop: '4px', marginBottom: '8px' }}>
                  <span className="verified-badge-pill" style={{ display: 'inline-flex', alignItems: 'center', background: '#f8fafc', color: '#0f172a', padding: '4px 12px', borderRadius: '100px', fontSize: '13px', fontWeight: '600', border: '1px solid #e2e8f0' }}>
                    <span>{user.role === 'brand' ? 'Verified Brand' : 'Verified Creator'}</span>
                  </span>
                </div>
              )}
              
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

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginTop: '16px', alignItems: 'flex-start' }}>
                {user?.experience && (
                  <div onClick={() => setShowExperienceModal(true)} style={{ cursor: 'pointer' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'var(--text-main)', textDecoration: 'underline' }}>Experience</h4>
                    <p className="profile-bio-text" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', margin: 0 }}>{user.experience}</p>
                  </div>
                )}

                {user?.portfolioLink && (
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'transparent', userSelect: 'none' }}>&nbsp;</h4>
                    <a href={user.portfolioLink.startsWith('http') ? user.portfolioLink : `https://${user.portfolioLink}`} target="_blank" rel="noopener noreferrer" className="profile-link-item">
                      🎨 Portfolio
                    </a>
                  </div>
                )}

                {user?.socialMediaLink && (
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px', color: 'transparent', userSelect: 'none' }}>&nbsp;</h4>
                    <a href={user.socialMediaLink.startsWith('http') ? user.socialMediaLink : `https://${user.socialMediaLink}`} target="_blank" rel="noopener noreferrer" className="profile-link-item">
                      💼 LinkedIn
                    </a>
                  </div>
                )}
              </div>

              {user?.website && (
                <div style={{ marginTop: '16px' }}>
                  <a href={user.website.startsWith('http') ? user.website : `https://${user.website}`} target="_blank" rel="noopener noreferrer" className="profile-link-item">
                    🔗 {user.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}

              <div className="profile-actions-row">
                <button className="action-btn secondary" onClick={() => navigate("/profile/edit")}>
                  <UsersIcon /> Edit
                </button>
                <button className="action-btn secondary" onClick={handleShare}>
                  <SendIcon /> {copyStatus ? "Copied!" : "Share"}
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


        </div>
      </div>



      <div className="stats-cards-row">
        <div className="stat-card-wide clickable" onClick={() => navigate(`/user/${user._id}/alliances`)}>
          <div className="stat-icon-wrap"><UsersIcon /></div>
          <div className="stat-info">
            <span className="stat-val">
              {fmtCount(user?.connectionsCount !== undefined ? user.connectionsCount : new Set([...(user?.followers || []), ...(user?.following || [])]).size)}
            </span>
            <span className="stat-lbl">Connections</span>
            <span className="stat-sub">People in network</span>
          </div>
        </div>
        <div className="stat-card-wide clickable" onClick={() => navigate("/analytics")}>
          <div className="stat-icon-wrap"><BriefcaseIcon /></div>
          <div className="stat-info">
            <span className="stat-val">{fmtCount(user?.profileViews || 0)}</span>
            <span className="stat-lbl">Profile Views</span>
            <span className="stat-sub">All time views</span>
          </div>
        </div>
        <div className="stat-card-wide clickable" onClick={() => navigate("/analytics")}>
          <div className="stat-icon-wrap"><TrendingDownIcon /></div>
          <div className="stat-info">
            <span className="stat-val">{fmtCount(user?.profileReach || 0)}</span>
            <span className="stat-lbl">Profile Reach</span>
            <span className="stat-sub">Unique accounts</span>
          </div>
        </div>
        <div className="stat-card-wide clickable" onClick={() => navigate("/collaborations")}>
          <div className="stat-icon-wrap"><EyeIcon /></div>
          <div className="stat-info">
            <span className="stat-val">{fmtCount(user?.featuredIn || 0)}</span>
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
        {activeTab === "portfolio" && (
          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button 
                onClick={() => setShowPortfolioModal(true)}
                style={{
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '8px 16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                + Add Item
              </button>
            </div>
            <PortfolioGrid items={user?.portfolio || []} onDelete={handleRemovePortfolio} />
          </div>
        )}

        {activeTab === "about" && <div style={{ textAlign: 'center', padding: '40px', background: '#fff', borderRadius: '16px', color: '#64748B' }}>{user?.bio || "No bio yet."}</div>}

        {activeTab === "trust" && (
          <div style={{ marginTop: '24px' }}>
            <TrustScore user={user} isOwnProfile={true} onUpdate={(updated) => setUser(updated)} />
          </div>
        )}
      </div>
      </div>

      {/* Post Lightbox */}
      {lightboxPost && (
        <div className="profile-ig-lightbox" onClick={() => setLightboxPost(null)}>
          <div className="profile-ig-lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="profile-ig-lightbox-close" onClick={() => setLightboxPost(null)}>✕</button>
            {getPostImage(lightboxPost) && (
              <div className="profile-ig-lightbox-media">
                {isVideo(getPostImage(lightboxPost)) ? (
                  <video src={`${getPostImage(lightboxPost)}#t=0.001`} controls autoPlay playsInline preload="metadata" className="profile-ig-lightbox-img" style={{ objectFit: 'contain' }} />
                ) : (
                  <img src={getPostImage(lightboxPost)} alt="" className="profile-ig-lightbox-img" style={{ objectFit: 'contain' }} />
                )}
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
      {postToShare && (
        <UserListModal 
          userId={user._id} 
          type="following" 
          onClose={() => setPostToShare(null)} 
          onSelect={handleSharePostToUser}
        />
      )}

      {showPortfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-slate-900">Add Portfolio Item</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Media URL (Image or Video)</label>
                <input 
                  type="url" 
                  placeholder="https://..." 
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500"
                  value={portfolioUrl} 
                  onChange={e => setPortfolioUrl(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Caption (Optional)</label>
                <textarea 
                  placeholder="Project details..." 
                  className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500 resize-none"
                  rows="3"
                  value={portfolioCaption} 
                  onChange={e => setPortfolioCaption(e.target.value)} 
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button 
                  onClick={() => setShowPortfolioModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                  disabled={portfolioUploading}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddPortfolio}
                  disabled={portfolioUploading || !portfolioUrl}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {portfolioUploading ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Experience Modal */}
      {showExperienceModal && (
        <div className="modal-overlay slide-in" onClick={() => setShowExperienceModal(false)}>
          <div className="modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', padding: '32px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '20px', fontWeight: 'bold' }}>Work Experience</h3>
            <div style={{ whiteSpace: 'pre-line', color: '#334155', fontSize: '15px', lineHeight: '1.6', maxHeight: '60vh', overflowY: 'auto' }}>
              {user?.experience}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
