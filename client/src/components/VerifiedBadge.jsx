import React from 'react';
import creatorBadge from '../assets/creator_badge.png';
import brandBadge from '../assets/brand_badge.png';

/**
 * VerifiedBadge - A clean, modern Instagram/X style verified tick
 * @param {string} role - 'brand' for gold tick, otherwise blue creator tick
 */
export default function VerifiedBadge({ role = 'influencer', style = {}, className = '' }) {
  const isBrand = role?.toLowerCase() === 'brand';
  const badgeSrc = isBrand ? brandBadge : creatorBadge;

  return (
    <span 
      className={`verified-badge ${className}`.trim()} 
      title={isBrand ? "Verified Brand" : "Verified Creator"}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: '5px',
        flexShrink: 0,
        verticalAlign: 'middle',
        position: 'relative',
        top: '-1px', // Fine-tune vertical centering
        ...style
      }}
    >
      <img 
        src={badgeSrc} 
        alt={isBrand ? "Verified Brand" : "Verified Creator"} 
        style={{ 
          width: '2.5em', 
          height: '2.5em', 
          display: 'block', 
          objectFit: 'contain',
          margin: '-0.7em' // Negative margin to offset the image's transparent padding
        }}
      />
    </span>
  );
}
