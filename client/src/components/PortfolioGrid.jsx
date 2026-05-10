import { useState } from "react";
import { BASE_URL } from "../config/api.js";

/**
 * Instagram-style portfolio grid with lightbox.
 */
export default function PortfolioGrid({ items = [], onDelete }) {
  const [viewIdx, setViewIdx] = useState(null);

  if (items.length === 0) return null;

  const current = viewIdx !== null ? items[viewIdx] : null;

  const getMediaUrl = (item) => {
    const url = item.url || (item.media && item.media[0]) || item.image;
    if (!url) return "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400";
    if (url.startsWith("http")) return url;
    return `${BASE_URL}${url}`;
  };

  function prev(e) {
    e.stopPropagation();
    setViewIdx((i) => (i > 0 ? i - 1 : items.length - 1));
  }

  function next(e) {
    e.stopPropagation();
    setViewIdx((i) => (i < items.length - 1 ? i + 1 : 0));
  }

  return (
    <>
      <div className="portfolio-grid" role="list" aria-label="Posts">
        {items.filter(item => !!item).map((item, idx) => (
          <button
            key={item?._id || item?.id || idx}
            type="button"
            className="portfolio-cell"
            onClick={() => setViewIdx(idx)}
            aria-label={item?.caption || item?.content || `Post ${idx + 1}`}
          >
            {item?.mediaType === "video" ? (
              <div className="portfolio-cell__video-thumb">
                <span className="portfolio-cell__play" aria-hidden="true">▶</span>
              </div>
            ) : (
              <img 
                src={getMediaUrl(item)} 
                alt={item?.caption || item?.content || ""} 
                className="portfolio-cell__img" 
                loading="lazy" 
                style={{ transition: 'opacity 0.3s' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.opacity = '0';
                  setTimeout(() => {
                    e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400";
                    e.target.style.opacity = '1';
                  }, 100);
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {current && (
        <div className="lightbox" onClick={() => setViewIdx(null)} role="dialog" aria-label="View post">
          <div className="lightbox__inner" onClick={(e) => e.stopPropagation()}>
            {items.length > 1 && (
              <button type="button" className="lightbox__arrow lightbox__arrow--left" onClick={prev} aria-label="Previous">
                ‹
              </button>
            )}

            <div className="lightbox__media">
              {current.mediaType === "video" ? (
                <video src={getMediaUrl(current)} controls className="lightbox__video" />
              ) : (
                <img 
                  src={getMediaUrl(current)} 
                  alt={current.caption || current.content || ""} 
                  className="lightbox__img" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800";
                  }}
                />
              )}
            </div>

            {items.length > 1 && (
              <button type="button" className="lightbox__arrow lightbox__arrow--right" onClick={next} aria-label="Next">
                ›
              </button>
            )}

            {onDelete && (
              <button 
                className="lightbox__delete" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm("Delete this post?")) {
                    onDelete(current._id || current.id);
                    setViewIdx(null);
                  }
                }}
                style={{
                  position: 'absolute',
                  top: '10px',
                  left: '10px',
                  background: 'rgba(239, 68, 68, 0.9)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  zIndex: 20
                }}
              >
                🗑️ Delete
              </button>
            )}

            {current.caption && (
              <p className="lightbox__caption">{current.caption}</p>
            )}

            <span className="lightbox__counter">{viewIdx + 1} / {items.length}</span>
          </div>

          <button type="button" className="lightbox__close" onClick={() => setViewIdx(null)} aria-label="Close">
            ✕
          </button>
        </div>
      )}
    </>
  );
}
