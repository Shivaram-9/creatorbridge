import { useState } from "react";

/**
 * Instagram-style portfolio grid with lightbox.
 *   <PortfolioGrid items={[{_id, url, caption, mediaType}]} />
 */
export default function PortfolioGrid({ items = [] }) {
  const [viewIdx, setViewIdx] = useState(null);

  if (items.length === 0) return null;

  const current = viewIdx !== null ? items[viewIdx] : null;

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
      <div className="portfolio-grid" role="list" aria-label="Portfolio">
        {items.map((item, idx) => (
          <button
            key={item._id || idx}
            type="button"
            className="portfolio-cell"
            onClick={() => setViewIdx(idx)}
            aria-label={item.caption || `Portfolio item ${idx + 1}`}
          >
            {item.mediaType === "video" ? (
              <div className="portfolio-cell__video-thumb">
                <span className="portfolio-cell__play" aria-hidden="true">▶</span>
              </div>
            ) : (
              <img src={item.url} alt={item.caption || ""} className="portfolio-cell__img" loading="lazy" />
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {current && (
        <div className="lightbox" onClick={() => setViewIdx(null)} role="dialog" aria-label="View portfolio item">
          <div className="lightbox__inner" onClick={(e) => e.stopPropagation()}>
            {items.length > 1 && (
              <button type="button" className="lightbox__arrow lightbox__arrow--left" onClick={prev} aria-label="Previous">
                ‹
              </button>
            )}

            <div className="lightbox__media">
              {current.mediaType === "video" ? (
                <video src={current.url} controls className="lightbox__video" />
              ) : (
                <img src={current.url} alt={current.caption || ""} className="lightbox__img" />
              )}
            </div>

            {items.length > 1 && (
              <button type="button" className="lightbox__arrow lightbox__arrow--right" onClick={next} aria-label="Next">
                ›
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
