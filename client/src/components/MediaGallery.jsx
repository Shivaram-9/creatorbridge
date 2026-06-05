import { useState, useRef, useEffect } from "react";
import "./MediaGallery.css";

function AutoplayVideo({ src }) {
  const videoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);

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

  const handleVideoClick = (e) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !video.muted;
    video.muted = newMuted;
    setIsMuted(newMuted);
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <video
        ref={videoRef}
        src={src}
        preload="auto"
        muted={isMuted}
        loop
        playsInline
        onClick={handleVideoClick}
        style={{ width: "100%", objectFit: "contain", display: "block", cursor: "pointer" }}
      />
      
      {/* Translucent speaker volume overlay matching Instagram Reels/Posts */}
      <button
        onClick={handleVideoClick}
        style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          background: "rgba(0, 0, 0, 0.6)",
          border: "none",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 5,
          transition: "background 0.2s, transform 0.1s active"
        }}
      >
        {isMuted ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.21.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="white">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        )}
      </button>
    </div>
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
            {(() => {
              const lowerUrl = url.toLowerCase().split('?')[0];
              const isVideoUrl = !!lowerUrl.match(/\.(mp4|mov|webm)$/) || lowerUrl.includes('/video/');
              return isVideoUrl ? (
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
              );
            })()}
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
