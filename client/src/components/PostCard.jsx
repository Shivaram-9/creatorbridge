import { useState } from "react";

export default function PostCard({ post }) {
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);

  const handleLike = () => {
    if (liked) {
      setLikesCount(likesCount - 1);
    } else {
      setLikesCount(likesCount + 1);
    }
    setLiked(!liked);
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
        <button 
          className={`post-action-btn ${liked ? "post-action-btn--liked" : ""}`} 
          onClick={handleLike}
        >
          <span className="post-action-icon">{liked ? "❤️" : "🤍"}</span>
          <span className="post-action-count">{likesCount}</span>
        </button>
        <button className="post-action-btn">
          <span className="post-action-icon">💬</span>
          <span className="post-action-count">{post.comments || 0}</span>
        </button>
      </div>
    </div>
  );
}
