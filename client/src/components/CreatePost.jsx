import { useState } from "react";

export default function CreatePost({ onPost, user }) {
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    onPost({
      content,
      image: imageUrl.trim() || null,
    });

    setContent("");
    setImageUrl("");
  };

  return (
    <div className="card create-post-card">
      <div className="create-post-header">
        <div className="post-avatar">
          {user?.avatar ? (
            <img src={user.avatar} alt="" className="post-avatar__img" />
          ) : (
            <span className="post-avatar__initials">{user?.name?.slice(0, 2).toUpperCase() || "ME"}</span>
          )}
        </div>
        <div className="create-post-info">
          <p className="create-post-label">Share something with your network</p>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="create-post-form">
        <textarea
          className="input create-post-textarea"
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
        <div className="create-post-footer">
          <div className="create-post-input-group">
            <span className="create-post-icon" aria-hidden="true">🖼?️</span>
            <input
              type="text"
              className="input input-sm"
              placeholder="Optional image URL..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={!content.trim()}>
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
