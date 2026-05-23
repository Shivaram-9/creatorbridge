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
      
      const newPreviews = files.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type
      }));
      setPreviews((prev) => [...prev, ...newPreviews].slice(0, 10));
    }
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && mediaFiles.length === 0) return;
    if (isPosting) return;

    setIsPosting(true);
    try {
      const formData = new FormData();
      formData.append("content", content);
      formData.append("category", category);
      formData.append("location", location);
      mediaFiles.forEach(file => formData.append("media", file));

      await onPost(formData);

      setContent("");
      setCategory("Lifestyle");
      setLocation("");
      setMediaFiles([]);
      setPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Post failed", err);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="create-post-pro">
      <div className="cp-header">
        <Avatar user={user} size="sm" />
        <textarea
          placeholder="Share your latest work, project or creator update..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {previews.length > 0 && (
        <div className="cp-previews">
          {previews.map((url, i) => (
            <div key={i} className="cp-preview-item">
              {typeof url === 'object' && url.type?.startsWith('video') ? (
                <video src={url.url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <img src={typeof url === 'object' ? url.url : url} alt="" />
              )}
              <button onClick={() => removeMedia(i)}>✕</button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="cp-form">
        <div className="cp-footer">
          <div className="cp-actions">
            <button type="button" className="cp-action-btn" onClick={() => fileInputRef.current.click()}>
              <span className="icon"><MediaIcon /></span> Media
            </button>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              multiple
              accept="image/*,video/*"
              onChange={handleMediaChange}
            />
          </div>
          <button 
            type="submit" 
            className="btn-submit cp-post-btn" 
            disabled={isPosting || (!content.trim() && mediaFiles.length === 0)}
          >
            {isPosting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
