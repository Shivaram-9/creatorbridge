import { useState } from "react";
import { BASE_URL } from "../config/api.js";

/**
 * Instagram-style portfolio grid with lightbox.
 */
export default function PortfolioGrid({ items = [], onDelete }) {
  const [viewIdx, setViewIdx] = useState(null);

  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '16px', color: 'var(--text-muted)' }}>
        <span style={{ fontSize: '40px' }}>📁</span>
        <h3 style={{ marginTop: '16px', color: 'var(--text-main)' }}>No Portfolio Items Yet</h3>
      </div>
    );
  }

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

  const isExternalLink = (url) => {
    if (!url) return false;
    if (!url.startsWith('http')) return false;
    if (url.match(/\.(jpeg|jpg|gif|png|webp|svg|heic|heif|mp4|mov|webm)$/i)) return false;
    if (url.includes('res.cloudinary.com')) return false;
    if (url.includes('unsplash.com')) return false;
    return true;
  };

  const extractDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  return (
    <>
      <div className="portfolio-grid" role="list" aria-label="Posts">
        {items.filter(item => !!item).map((item, idx) => {
          const url = getMediaUrl(item);
          const isLink = isExternalLink(url);
          
          return (
          <button
            key={item?._id || item?.id || idx}
            type="button"
            className={`portfolio-cell ${isLink ? 'portfolio-cell-link' : ''}`}
            onClick={(e) => {
              if (isLink) {
                e.stopPropagation();
                window.open(url, '_blank');
              } else {
                setViewIdx(idx);
              }
            }}
            aria-label={item?.caption || item?.content || `Post ${idx + 1}`}
          >
            {isLink ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', background: '#f8fafc', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '16px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ marginBottom: '12px' }}>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                  {item.caption || extractDomain(url)}
                </span>
                <span style={{ fontSize: '12px', color: '#38bdf8', marginTop: '4px' }}>Visit Link ↗</span>
                {onDelete && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Delete this link?")) {
                        onDelete(item._id || item.id);
                      }
                    }}
                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : item?.mediaType === "video" ? (
              <div className="portfolio-cell__video-thumb">
                <span className="portfolio-cell__play" aria-hidden="true">▶</span>
              </div>
            ) : (
              <img 
                src={url} 
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
        )})}
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
