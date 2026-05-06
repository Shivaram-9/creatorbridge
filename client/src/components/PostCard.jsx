import { useState, useMemo } from "react";
import { HeartIcon, MessageCircleIcon, SendIcon, BookmarkIcon, MoreHorizontalIcon } from "./Icons.jsx";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import ReportModal from "./ReportModal.jsx";

export default function PostCard({ post, onDelete }) {
  const { user, setUser } = useAuth();
  
  // Initial liked state based on whether current user's ID is in post.likes array
  const initialLiked = useMemo(() => {
    if (!user || !post.likes) return false;
    return post.likes.includes(user._id);
  }, [user, post.likes]);

  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(Array.isArray(post.likes) ? post.likes.length : 0);
  
  const initialSaved = useMemo(() => {
    if (!user || !user.savedPosts) return false;
    return user.savedPosts.some(id => id.toString() === post._id);
  }, [user, post._id]);

  const [saved, setSaved] = useState(initialSaved);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(Array.isArray(post.comments) ? post.comments : []);
  const [shareStatus, setShareStatus] = useState("Share");
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const isOwner = user?._id === (post.user?._id || post.user);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      const res = await api.posts.remove(post._id);
      if (res?.error) {
        alert(res.error);
        setIsDeleting(false);
      } else {
        onDelete?.(post._id);
      }
    } catch {
      alert("Failed to delete post");
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (!user) return;
    
    // Optimistic UI update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

    try {
      const res = await api.posts.like(post._id);
      if (res?.error) {
        // Rollback on error
        setLiked(!newLiked);
        setLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
      }
    } catch {
      // Rollback on error
      setLiked(!newLiked);
      setLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
    }
  };

  const handleShare = () => {
    const profileUrl = `${window.location.origin}/user/${post.user?._id || post.user}`;
    navigator.clipboard.writeText(profileUrl);
    setShareStatus("Copied!");
    setTimeout(() => setShareStatus("Share"), 2000);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;

    const text = commentText;
    setCommentText(""); // Clear input immediately

    try {
      const res = await api.posts.comment(post._id, text);
      if (res?.error) {
        console.error(res.error);
      } else {
        setComments(prev => [...prev, res]);
      }
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Optimistic UI
    const newSaved = !saved;
    setSaved(newSaved);

    try {
      const res = await api.posts.save(post._id);
      if (res?.error) {
        setSaved(!newSaved);
        alert(res.error);
      } else {
        // Sync global user state
        const updatedSaved = newSaved 
          ? [...(user.savedPosts || []), post._id] 
          : (user.savedPosts || []).filter(id => id.toString() !== post._id);
        
        setUser({ ...user, savedPosts: updatedSaved });
        
        // Simple toast feedback
        console.log(newSaved ? "Post Saved" : "Removed from Saved");
      }
    } catch (err) {
      setSaved(!newSaved);
      console.error("Save error:", err);
    }
  };

  return (
    <div className="post-card">
        <div className="post-header">
          <Avatar 
            user={{ 
              _id: post.user?._id || post.user, 
              name: post.username, 
              avatar: post.avatar 
            }} 
            size="md" 
          />
          <div className="post-info">
            <h3 className="post-username">
              {post.username}
              {post.user?.isVerified && <VerifiedBadge size="sm" />}
            </h3>
            <span className="post-time">{post.time}</span>
          </div>

        <div className="post-menu-container" style={{ marginLeft: 'auto', position: 'relative' }}>
          <button 
            className="btn btn-ghost btn-sm" 
            onClick={() => setShowDeleteMenu(!showDeleteMenu)}
            aria-label="Options"
          >
            <MoreHorizontalIcon />
          </button>
          {showDeleteMenu && (
            <div 
              className="dropdown-menu show" 
              style={{ 
                position: 'absolute', 
                right: 0, 
                top: '100%', 
                zIndex: 10, 
                backgroundColor: 'white',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                padding: '4px',
                minWidth: '120px'
              }}
            >
              {isOwner ? (
                <button 
                  className="dropdown-item text-danger" 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  style={{ color: '#ef4444', width: '100%', textAlign: 'left', padding: '8px 12px' }}
                >
                  {isDeleting ? "Deleting..." : "Delete Post"}
                </button>
              ) : (
                <button 
                  className="dropdown-item" 
                  onClick={() => { setShowReportModal(true); setShowDeleteMenu(false); }}
                  style={{ width: '100%', textAlign: 'left', padding: '8px 12px' }}
                >
                  Report Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="post-content">
        <p className="post-text">{post.content}</p>
        {post.image && (
          <div 
            className="post-image-wrapper" 
            style={{ backgroundColor: '#f3f4f6', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            onClick={() => setShowLightbox(true)}
          >
            <img 
              src={post.image} 
              alt="Post content" 
              className="post-image" 
              style={{ transition: 'opacity 0.3s ease-in-out' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.opacity = '0';
                setTimeout(() => {
                  e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800";
                  e.target.style.opacity = '1';
                }, 100);
              }}
            />
          </div>
        )}
      </div>

      {showLightbox && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 2000, backgroundColor: 'rgba(0,0,0,0.9)' }} 
          onClick={() => setShowLightbox(false)}
        >
          <div 
            className="lightbox-content slide-in" 
            style={{ maxWidth: '95vw', maxHeight: '95vh', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button 
              className="btn btn-ghost" 
              style={{ position: 'absolute', top: '-40px', right: '0', color: 'white', fontSize: '1.5rem' }}
              onClick={() => setShowLightbox(false)}
            >
              ✕
            </button>
            <img 
              src={post.image} 
              alt="" 
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }} 
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200";
              }}
            />
          </div>
        </div>
      )}

      <div className="post-actions">
        <div className="post-actions__left">
          <button 
            className={`post-action-btn ${liked ? "post-action-btn--liked" : ""}`} 
            onClick={handleLike}
            aria-label="Like"
          >
            <span className="post-action-icon">
              <HeartIcon filled={liked} />
            </span>
            <span className="post-action-count">{likesCount}</span>
          </button>
          <button 
            className="post-action-btn" 
            onClick={() => setShowComments(!showComments)}
            aria-label="Comment"
          >
            <span className="post-action-icon">
              <MessageCircleIcon />
            </span>
            <span className="post-action-count">{comments.length}</span>
          </button>
          <button className="post-action-btn" onClick={handleShare} aria-label="Share">
            <span className="post-action-icon">
              <SendIcon />
            </span>
            <span className="post-action-count">{shareStatus}</span>
          </button>
        </div>
        <button 
          className={`post-action-btn ${saved ? "post-action-btn--saved" : ""}`} 
          onClick={handleSave}
          aria-label="Save"
        >
          <span className="post-action-icon">
            <BookmarkIcon filled={saved} />
          </span>
        </button>
      </div>

      {showComments && (
        <div className="post-comments-section">
          {comments.length > 0 && (
            <div className="post-comments-list">
              {comments.map((c, i) => (
                <div key={c._id || i} className="post-comment-item">
                  <strong>{c.user?.username || c.user?.name || "User"}:</strong> {c.text}
                </div>
              ))}
            </div>
          )}
          <form className="post-comment-form" onSubmit={handleCommentSubmit}>
            <input 
              type="text" 
              className="post-comment-input" 
              placeholder="Write a comment..." 
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={!commentText.trim()}>
              Post
            </button>
          </form>
        </div>
      )}
      {showReportModal && (
        <ReportModal 
          targetPost={post._id} 
          onClose={() => setShowReportModal(false)} 
        />
      )}
    </div>
  );
}
