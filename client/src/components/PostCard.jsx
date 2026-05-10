import { memo, useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HeartIcon, MessageCircleIcon, SendIcon, BookmarkIcon, MoreHorizontalIcon } from "./Icons.jsx";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import ReportModal from "./ReportModal.jsx";
import MediaGallery from "./MediaGallery.jsx";
import "./PostCard.css";
import Lightbox from "./Lightbox.jsx";
import CollectionModal from "./CollectionModal.jsx";
import toast from "react-hot-toast";

const PostCard = memo(function PostCard({ post, onDelete, onUpdate }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const initialLiked = useMemo(() => {
    if (!user || !post.likes) return false;
    return post.likes.some(l => (l._id || l) === user._id);
  }, [user, post.likes]);

  const [liked, setLiked] = useState(initialLiked);
  const [likes, setLikes] = useState(Array.isArray(post.likes) ? post.likes : []);
  const likesCount = likes.length;
  
  const initialSaved = useMemo(() => {
    if (!user || !user.savedPosts) return false;
    return user.savedPosts.some(id => id.toString() === post._id);
  }, [user, post._id]);

  const [saved, setSaved] = useState(initialSaved);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(Array.isArray(post.comments) ? post.comments : []);
  const [shareStatus, setShareStatus] = useState("Share");
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showCollectionModal, setShowCollectionModal] = useState(false);

  if (!post) return null;

  const isOwner = user?._id === (post.user?._id || post.user);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    setIsDeleting(true);
    try {
      const res = await api.posts.remove(post._id);
      if (res?.error) {
        toast.error(res.error);
        setIsDeleting(false);
      } else {
        onDelete?.(post._id);
      }
    } catch {
      toast.error("Failed to delete post");
      setIsDeleting(false);
    }
  };

  const handlePin = async () => {
    try {
      const res = await api.posts.pin(post._id);
      if (res.error) toast.error(res.error);
      else {
        toast.success(post.isPinned ? "Unpinned" : "Pinned to Profile");
        onUpdate?.(res);
      }
    } catch (err) {
      alert("Failed to pin post");
    }
    setShowMenu(false);
  };

  const handleArchive = async () => {
    try {
      const res = await api.posts.archive(post._id);
      if (res.error) alert(res.error);
      else onUpdate?.(res);
    } catch (err) {
      alert("Failed to archive post");
    }
    setShowMenu(false);
  };

  const handleEdit = async () => {
    try {
      const res = await api.posts.update(post._id, { content: editContent });
      if (res.error) alert(res.error);
      else {
        onUpdate?.(res);
        setIsEditing(false);
      }
    } catch (err) {
      alert("Failed to update post");
    }
  };

  const handleLike = async () => {
    if (!user) return;
    const newLiked = !liked;
    setLiked(newLiked);
    try {
      const res = await api.posts.like(post._id);
      if (res?.error) setLiked(!newLiked);
      else setLikes(res.likes);
    } catch {
      setLiked(!newLiked);
    }
  };

  const handleShare = () => {
    const postUrl = `${window.location.origin}/post/${post._id}`;
    navigator.clipboard.writeText(postUrl);
    toast.success("Link copied to clipboard");
    setShareStatus("Copied!");
    setTimeout(() => setShareStatus("Share"), 2000);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !user) return;
    const text = commentText;
    setCommentText("");
    try {
      const res = await api.posts.comment(post._id, text);
      if (!res?.error) setComments(prev => [...prev, res]);
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    const newSaved = !saved;
    setSaved(newSaved);
    try {
      const res = await api.posts.save(post._id);
      if (res?.error) setSaved(!newSaved);
      else {
        const updatedSaved = newSaved 
          ? [...(user.savedPosts || []), post._id] 
          : (user.savedPosts || []).filter(id => id.toString() !== post._id);
        setUser({ ...user, savedPosts: updatedSaved });
      }
    } catch (err) {
      setSaved(!newSaved);
    }
  };

  useEffect(() => {
    if (post?._id && api?.analytics?.viewPost) {
      api.analytics.viewPost(post._id).catch(() => {});
    }
  }, [post?._id]);

  const mediaList = useMemo(() => {
    if (post.media && post.media.length > 0) return post.media.map(m => m.startsWith("http") ? m : `${api.getResolvedApiOrigin()}${m}`);
    if (post.image) return [post.image.startsWith("http") ? post.image : `${api.getResolvedApiOrigin()}${post.image}`];
    return [];
  }, [post.media, post.image]);

  return (
    <div className={`post-card slide-in ${post.isPinned ? "pinned" : ""}`}>
      <div className="post-header">
        <Avatar user={post.user} size="md" onClick={() => navigate(`/user/${post.user?._id}`)} />
        <div className="post-info">
          <h3 className="post-username" onClick={() => navigate(`/user/${post.user?._id}`)}>
            {post.user?.name || post.username}
            {(post.user?.isVerified || post.user?.isPremium) && (
              <VerifiedBadge size="sm" tier={post.user?.premiumTier} />
            )}
          </h3>
          <div className="post-meta">
            <span className="post-time">{new Date(post.createdAt).toLocaleDateString()}</span>
            {post.location && <span className="post-location">• {post.location}</span>}
          </div>
        </div>

        <div className="post-menu-container">
          {post.isPinned && <span className="pin-indicator">📌 Pinned</span>}
          <button className="btn-menu" onClick={() => setShowMenu(!showMenu)}>
            <MoreHorizontalIcon />
          </button>
          {showMenu && (
            <div className="dropdown-menu">
              {isOwner ? (
                <>
                  <button onClick={() => { setIsEditing(true); setShowMenu(false); }}>Edit Post</button>
                  <button onClick={handlePin}>{post.isPinned ? "Unpin" : "Pin to Profile"}</button>
                  <button onClick={handleArchive}>Archive</button>
                  <button onClick={() => { setShowCollectionModal(true); setShowMenu(false); }} style={{ color: 'var(--accent)' }}>Save to Collection</button>
                  <button onClick={handleDelete} className="text-danger" disabled={isDeleting}>Delete</button>
                </>
              ) : (
                <>
                  <button onClick={() => { setShowCollectionModal(true); setShowMenu(false); }} style={{ color: 'var(--accent)' }}>Save to Collection</button>
                  <button onClick={() => { setShowReportModal(true); setShowMenu(false); }}>Report</button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="post-content">
        {isEditing ? (
          <div className="edit-box">
            <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            <div className="edit-btns">
              <button onClick={() => setIsEditing(false)}>Cancel</button>
              <button onClick={handleEdit}>Save</button>
            </div>
          </div>
        ) : (
          <p className="post-text">
            {post.content}
            {post.hashtags?.length > 0 && (
              <div className="post-hashtags">
                {post.hashtags.map(h => <span key={h} className="hashtag">#{h} </span>)}
              </div>
            )}
          </p>
        )}
        <div onClick={() => setShowLightbox(true)}>
          <MediaGallery media={mediaList} />
        </div>
      </div>

      {showLightbox && (
        <Lightbox 
          media={mediaList} 
          startIndex={lightboxIndex} 
          onClose={() => setShowLightbox(false)} 
        />
      )}

      <div className="post-actions">
        <div className="post-actions__left">
          <button className={`post-action-btn ${liked ? "liked" : ""}`} onClick={handleLike}>
            <HeartIcon filled={liked} />
            <span>{likesCount}</span>
          </button>
          <button className="post-action-btn" onClick={() => setShowComments(!showComments)}>
            <MessageCircleIcon />
            <span>{comments.length}</span>
          </button>
          <button className="post-action-btn" onClick={handleShare}>
            <SendIcon />
            <span>{shareStatus}</span>
          </button>
        </div>
        <button className={`post-action-btn ${saved ? "saved" : ""}`} onClick={handleSave}>
          <BookmarkIcon filled={saved} />
        </button>
      </div>

      <div className="post-footer">
        {likes.length > 0 && (
          <div className="post-likes" onClick={() => navigate(`/post/${post._id}/likes`)}>
            Liked by <strong>{likes[0].name || "User"}</strong> {likes.length > 1 && <>and {likes.length - 1} others</>}
          </div>
        )}
        
        {showComments && (
          <div className="post-comments">
            {comments.map((c, i) => (
              <div key={i} className="comment-item">
                <strong>{c.user?.name}:</strong> {c.text}
              </div>
            ))}
            <form onSubmit={handleCommentSubmit} className="comment-form">
              <input 
                placeholder="Add a comment..." 
                value={commentText} 
                onChange={(e) => setCommentText(e.target.value)} 
              />
              <button disabled={!commentText.trim()}>Post</button>
            </form>
          </div>
        )}
      </div>

      {showReportModal && <ReportModal targetType="post" targetId={post._id} onClose={() => setShowReportModal(false)} />}
      {showCollectionModal && <CollectionModal postId={post._id} onClose={() => setShowCollectionModal(false)} />}
    </div>
  );
});

export default PostCard;
