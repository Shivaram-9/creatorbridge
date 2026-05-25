import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import "./Lightbox.css";

export default function Lightbox({ media = [], startIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const next = () => setCurrentIndex((prev) => (prev + 1) % media.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);

  return createPortal(
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lb-close" onClick={onClose}>✕</button>
      
      <div className="lb-content" onClick={(e) => e.stopPropagation()}>
        {media.length > 1 && (
          <button className="lb-nav lb-prev" onClick={prev}>‹</button>
        )}
        
        <div className="lb-main">
          {media[currentIndex]?.toLowerCase().split('?')[0].match(/\.(mp4|mov|webm)$/) ? (
            <video src={media[currentIndex]} controls autoPlay playsInline />
          ) : (
            <img src={media[currentIndex]} alt="" className="zoomable" />
          )}
        </div>

        {media.length > 1 && (
          <button className="lb-nav lb-next" onClick={next}>›</button>
        )}
      </div>

      <div className="lb-footer">
        {currentIndex + 1} / {media.length}
      </div>
    </div>,
    document.body
  );
}
