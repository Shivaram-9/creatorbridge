import { useState, useRef } from "react";
import Avatar from "./Avatar.jsx";

export default function CreatePost({ onPost, user }) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    onPost({
      content,
      imageFile: image,
      image: preview,
    });

    setContent("");
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="card create-post-card">
      <div className="create-post-header">
        <Avatar user={user} size="md" />
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
        
        {preview && (
          <div className="create-post-preview" style={{ position: 'relative', marginTop: '1rem' }}>
            <img src={preview} alt="Preview" style={{ width: '100%', borderRadius: '8px', maxHeight: '300px', objectFit: 'cover' }} />
            <button 
              type="button" 
              className="btn btn-ghost btn-sm" 
              style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: 'white' }}
              onClick={() => { setImage(null); setPreview(null); }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="create-post-footer">
          <div className="create-post-input-group">
            <button 
              type="button" 
              className="btn btn-ghost" 
              style={{ padding: '0.5rem' }} 
              onClick={() => fileInputRef.current.click()}
              aria-label="Upload image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              accept="image/*"
              onChange={handleImageChange}
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
