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
            {url.toLowerCase().split('?')[0].match(/\.(mp4|mov|webm)$/) ? (
              <video src={`${url}#t=0.001`} preload="metadata" controls muted loop playsInline />
            ) : (
              <img 
                src={url} 
                alt={`Media ${i}`} 
                loading="lazy" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800";
                }}
              />
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
