import { useState, useRef } from "react";
import Avatar from "./Avatar.jsx";
import { MediaIcon } from "./Icons.jsx";
import "./CreatePost.css";

export default function CreatePost({ onPost, user }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Lifestyle");
  const [location, setLocation] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setMediaFiles((prev) => [...prev, ...files].slice(0, 10));
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviews((prev) => [...prev, reader.result].slice(0, 10));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) return;

    const formData = new FormData();
    formData.append("content", content);
    formData.append("category", category);
    formData.append("location", location);
    mediaFiles.forEach(file => formData.append("media", file));

    onPost(formData);

    setContent("");
    setCategory("Lifestyle");
    setLocation("");
    setMediaFiles([]);
    setPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="create-post-pro">
      <div className="cp-header">
        <Avatar user={user} size="md" />
        <textarea
          placeholder="Share your latest project or lifestyle update..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {previews.length > 0 && (
        <div className="cp-previews">
          {previews.map((url, i) => (
            <div key={i} className="cp-preview-item">
              <img src={url} alt="" />
              <button onClick={() => removeMedia(i)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="cp-form">
        <div className="cp-options">
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="Lifestyle">Lifestyle</option>
            <option value="Portfolio">Portfolio Project</option>
            <option value="Collaboration">Collaboration</option>
            <option value="Behind the Scenes">Behind the Scenes</option>
          </select>
          <input 
            placeholder="Add location" 
            value={location} 
            onChange={e => setLocation(e.target.value)} 
            className="cp-location-input"
          />
        </div>

        <div className="cp-footer">
          <button 
            type="button" 
            className="btn-media" 
            onClick={() => fileInputRef.current.click()}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <MediaIcon />
            <span>Add Media</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            hidden
            multiple
            accept="image/*,video/*"
            onChange={handleMediaChange}
          />
          <button type="submit" className="btn-submit" disabled={!content.trim() && mediaFiles.length === 0}>
            Post to Profile
          </button>
        </div>
      </form>
    </div>
  );
}
