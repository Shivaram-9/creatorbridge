import { useState, useMemo } from "react";
import { HeartIcon, MessageCircleIcon, SendIcon, BookmarkIcon } from "./Icons.jsx";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function PostCard({ post }) {
  const { user } = useAuth();
  
  // Initial liked state based on whether current user's ID is in post.likes array
  const initialLiked = useMemo(() => {
    if (!user || !post.likes) return false;
    return post.likes.includes(user._id);
  }, [user, post.likes]);

  const [liked, setLiked] = useState(initialLiked);
  const [likesCount, setLikesCount] = useState(Array.isArray(post.likes) ? post.likes.length : 0);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(Array.isArray(post.comments) ? post.comments : []);
  const [shareStatus, setShareStatus] = useState("Share");

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

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-avatar">
          {post.avatar ? (
            <img src={post.avatar} alt={post.username} className="post-avatar__img" />
          ) : (
            <span className="post-avatar__initials">{post.username?.slice(0, 2).toUpperCase()}</span>
          )}
        </div>
        <div className="post-info">
          <h3 className="post-username">{post.username}</h3>
          <span className="post-time">{post.time}</span>
        </div>
      </div>

      <div className="post-content">
        <p className="post-text">{post.content}</p>
        {post.image && (
          <div className="post-image-wrapper">
            <img src={post.image} alt="Post content" className="post-image" />
          </div>
        )}
      </div>

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
          onClick={() => setSaved(!saved)}
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
    </div>
  );
}
