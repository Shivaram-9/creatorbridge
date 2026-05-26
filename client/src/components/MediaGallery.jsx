import { useState, useRef, useEffect } from "react";
import "./MediaGallery.css";

function AutoplayVideo({ src }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch((err) => {
            console.log("Feed autoplay prevented:", err);
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(video);

    return () => {
      if (video) {
        observer.unobserve(video);
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      src={src}
      preload="auto"
      controls
      muted
      loop
      playsInline
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  );
}

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
              <AutoplayVideo src={url} />
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
