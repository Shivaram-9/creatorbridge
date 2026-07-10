import { useState, useRef } from "react";
import Avatar from "./Avatar.jsx";
import { MediaIcon } from "./Icons.jsx";
import ImageCropperModal from "./ImageCropperModal.jsx";
import "./CreatePost.css";

export default function CreatePost({ onPost, user }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Lifestyle");
  const [location, setLocation] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  const [cropQueue, setCropQueue] = useState([]);
  const [currentCropIndex, setCurrentCropIndex] = useState(0);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Split into images and non-images (videos)
      const images = files.filter(f => f.type.startsWith('image/'));
      const others = files.filter(f => !f.type.startsWith('image/'));
      
      // Directly add non-images
      if (others.length > 0) {
        setMediaFiles((prev) => [...prev, ...others].slice(0, 10));
        const newPreviews = others.map(file => ({
          url: URL.createObjectURL(file),
          type: file.type
        }));
        setPreviews((prev) => [...prev, ...newPreviews].slice(0, 10));
      }

      // Queue images for cropping
      if (images.length > 0) {
        const queueItems = images.map(file => ({
          file,
          src: URL.createObjectURL(file)
        }));
        setCropQueue(prev => [...prev, ...queueItems]);
      }
    }
  };

  const handleCropComplete = (croppedBlob) => {
    // Add cropped blob to media files
    // Convert blob to File object to maintain compatibility with FormData
    const originalFile = cropQueue[currentCropIndex].file;
    const newFile = new File([croppedBlob], originalFile.name || 'image.jpg', { type: 'image/jpeg' });
    
    setMediaFiles(prev => [...prev, newFile].slice(0, 10));
    setPreviews(prev => [...prev, {
      url: URL.createObjectURL(newFile),
      type: 'image/jpeg'
    }].slice(0, 10));

    handleNextCrop();
  };

  const handleNextCrop = () => {
    if (currentCropIndex < cropQueue.length - 1) {
      setCurrentCropIndex(prev => prev + 1);
    } else {
      // Finished cropping queue
      setCropQueue([]);
      setCurrentCropIndex(0);
    }
  };

  const handleCropCancel = () => {
    // If canceled, just add the original uncropped image
    const originalFile = cropQueue[currentCropIndex].file;
    setMediaFiles(prev => [...prev, originalFile].slice(0, 10));
    setPreviews(prev => [...prev, {
      url: cropQueue[currentCropIndex].src,
      type: originalFile.type
    }].slice(0, 10));

    handleNextCrop();
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

      {cropQueue.length > 0 && currentCropIndex < cropQueue.length && (
        <ImageCropperModal
          imageSrc={cropQueue[currentCropIndex].src}
          onComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
}
