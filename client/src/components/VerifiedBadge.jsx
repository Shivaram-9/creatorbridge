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
      <svg 
        width={badgeSize} 
        height={badgeSize} 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        aria-hidden="true"
      >
        <path d="M22.5 12.5c0-1.58-.88-2.95-2.18-3.66.15-.44.23-.91.23-1.4 0-2.45-1.99-4.44-4.44-4.44-.49 0-.96.08-1.4.23-1.31-1.3-2.95-2.18-4.66-2.18-1.58 0-2.95.88-3.66 2.18-.44-.15-.91-.23-1.4-.23-2.45 0-4.44 1.99-4.44 4.44 0 .49.08.96.23 1.4C1.3 10.05.42 11.42.42 13c0 1.58.88 2.95 2.18 3.66-.15.44-.23.91-.23 1.4 0 2.45 1.99 4.44 4.44 4.44.49 0 .96-.08 1.4-.23 1.31 1.3 2.95 2.18 4.66 2.18 1.58 0 2.95-.88 3.66-2.18.44.15.91.23 1.4.23 2.45 0 4.44-1.99 4.44-4.44 0-.49-.08-.96-.23-1.4 1.3-1.31 2.18-2.95 2.18-4.66zm-4.87-1.57l-7.06 7.06c-.19.19-.44.29-.7.29s-.51-.1-.7-.29l-3.5-3.5c-.39-.39-.39-1.02 0-1.41s1.02-.39 1.41 0L10 15.3l6.35-6.35c.39-.39 1.02-.39 1.41 0s.39 1.02 0 1.41z"></path>
      </svg>
    </span>
  );
}
