import { useState } from "react";

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);
  const [saved, setSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [shareStatus, setShareStatus] = useState("Share");

  const handleLike = () => {
    if (liked) {
      setLikesCount(likesCount - 1);
    } else {
      setLikesCount(likesCount + 1);
    }
    setLiked(!liked);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareStatus("Copied!");
    setTimeout(() => setShareStatus("Share"), 2000);
  };

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      setComments([...comments, { id: Date.now(), text: commentText, user: "You" }]);
      setCommentText("");
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
            <span className="post-action-icon">{liked ? "❤️" : "🤍"}</span>
            <span className="post-action-count">{likesCount}</span>
          </button>
          <button 
            className="post-action-btn" 
            onClick={() => setShowComments(!showComments)}
            aria-label="Comment"
          >
            <span className="post-action-icon">💬</span>
            <span className="post-action-count">{(post.comments || 0) + comments.length}</span>
          </button>
          <button className="post-action-btn" onClick={handleShare} aria-label="Share">
            <span className="post-action-icon">{shareStatus === "Copied!" ? "✅" : "📤"}</span>
            <span className="post-action-count">{shareStatus}</span>
          </button>
        </div>
        <button 
          className={`post-action-btn ${saved ? "post-action-btn--saved" : ""}`} 
          onClick={() => setSaved(!saved)}
          aria-label="Save"
        >
          <span className="post-action-icon">{saved ? "🔖" : "📑"}</span>
        </button>
      </div>

      {showComments && (
        <div className="post-comments-section">
          {comments.length > 0 && (
            <div className="post-comments-list">
              {comments.map((c) => (
                <div key={c.id} className="post-comment-item">
                  <strong>{c.user}</strong> {c.text}
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
