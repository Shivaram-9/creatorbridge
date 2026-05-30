import React from 'react';

/**
 * VerifiedBadge - A premium verified badge for creators and brands.
 * @param {string} size - Size of the badge (sm, md, lg)
 * @param {boolean} showTooltip - Whether to show the tooltip
 * @param {string} tier - silver, gold, platinum, or none
 */
export default function VerifiedBadge({ size = 'md', showTooltip = true, tier = 'none' }) {
  const sizes = {
    xs: '12px',
    sm: '14px',
    md: '16px',
    lg: '20px',
    xl: '24px'
  };

  const colors = {
    none: '#1d9bf0',      // Standard Blue
    silver: '#94a3b8',    // Slate/Silver
    gold: '#fbbf24',      // Amber/Gold
    platinum: '#818cf8'   // Indigo/Platinum
  };

  const badgeSize = sizes[size] || sizes.md;
  const tierKey = (tier || 'none').toLowerCase();
  const badgeColor = colors[tierKey] || colors.none;

  return (
    <span 
      className={`verified-badge verified-badge--${tier}`} 
      title={showTooltip ? (tier !== 'none' ? `${tier.charAt(0).toUpperCase() + tier.slice(1)} Premium` : "Verified Creator") : ""}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: '4px',
        color: badgeColor,
        flexShrink: 0,
        verticalAlign: 'middle'
      }}
    >
      <img 
        src="/diamond image.png" 
        alt="Verified" 
        style={{ width: badgeSize, height: badgeSize, objectFit: 'contain', verticalAlign: 'middle' }}
      />
    </span>
  );
}
