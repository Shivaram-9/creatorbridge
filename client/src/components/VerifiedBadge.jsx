import React from 'react';

/**
 * VerifiedBadge - A premium verified badge for creators and brands.
 * @param {string} size - Size of the badge (sm, md, lg)
 * @param {boolean} showTooltip - Whether to show the tooltip
 * @param {string} tier - silver, gold, platinum, or none
 */
export default function VerifiedBadge({ size = 'md', showTooltip = true, tier = 'none', role = 'influencer', style = {}, className = '' }) {
  const sizes = {
    xs: '18px',
    sm: '22px',
    md: '28px',
    lg: '34px',
    xl: '42px'
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
      className={`verified-badge verified-badge--${tier} ${className}`.trim()} 
      title={showTooltip ? (tier !== 'none' ? `${tier.charAt(0).toUpperCase() + tier.slice(1)} Premium` : "Verified Creator") : ""}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: '4px',
        color: badgeColor,
        flexShrink: 0,
        verticalAlign: 'middle',
        ...style
      }}
    >
      <img 
        src={role?.toLowerCase() === 'brand' ? "/brand_badge.svg" : "/influencer_badge.svg"} 
        alt="Verified" 
        style={{ width: badgeSize, height: badgeSize, objectFit: 'contain', verticalAlign: 'middle' }}
      />
    </span>
  );
}
