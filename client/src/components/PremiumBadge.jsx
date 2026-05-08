import React from 'react';

/**
 * PremiumBadge - Visual indicator for premium tiers.
 * @param {string} tier - silver, gold, platinum
 * @param {string} size - sm, md, lg
 */
export default function PremiumBadge({ tier = 'silver', size = 'md' }) {
  const sizes = {
    sm: '14px',
    md: '18px',
    lg: '24px'
  };

  const colors = {
    silver: '#94a3b8', // Silver/Slate
    gold: '#fbbf24',   // Amber/Gold
    platinum: '#818cf8' // Indigo/Platinum
  };

  const badgeSize = sizes[size] || sizes.md;
  const badgeColor = colors[tier.toLowerCase()] || colors.silver;

  return (
    <span 
      className={`premium-badge premium-badge--${tier.toLowerCase()}`}
      title={`${tier.charAt(0).toUpperCase() + tier.slice(1)} Premium Member`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: '4px',
        color: badgeColor,
        flexShrink: 0,
        verticalAlign: 'middle',
        filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.1))'
      }}
    >
      <svg 
        width={badgeSize} 
        height={badgeSize} 
        viewBox="0 0 24 24" 
        fill="currentColor"
      >
        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
      </svg>
    </span>
  );
}
