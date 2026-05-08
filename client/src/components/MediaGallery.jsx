import { useState } from "react";
import "./MediaGallery.css";

export default function MediaGallery({ media = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const next = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % media.length);
  };

  const prev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  };

  return (
    <div className="media-gallery">
      <div className="gallery-container" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
        {media.map((url, i) => (
          <div key={i} className="gallery-item">
            {url.endsWith(".mp4") || url.endsWith(".mov") ? (
              <video src={url} controls muted loop />
            ) : (
              <img src={url} alt={`Media ${i}`} loading="lazy" />
            )}
          </div>
        ))}
      </div>
      
      {media.length > 1 && (
        <>
          <button className="gallery-btn prev" onClick={prev}>‹</button>
          <button className="gallery-btn next" onClick={next}>›</button>
          <div className="gallery-dots">
            {media.map((_, i) => (
              <span key={i} className={`dot ${i === currentIndex ? "active" : ""}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
