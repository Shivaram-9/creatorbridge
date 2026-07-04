import React from 'react';

/**
 * VerifiedBadge - A clean, modern Instagram/X style verified tick
 * @param {string} role - 'brand' for gold tick, otherwise blue creator tick
 */
export default function VerifiedBadge({ role = 'influencer', style = {}, className = '' }) {
  const isBrand = role?.toLowerCase() === 'brand';
  const badgeColor = isBrand ? '#F5C024' : '#0095f6';

  return (
    <span 
      className={`verified-badge ${className}`.trim()} 
      title={isBrand ? "Verified Brand" : "Verified Creator"}
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
      <svg 
        viewBox="0 0 24 24" 
        aria-label="Verified" 
        role="img" 
        style={{ width: '0.8em', height: '0.8em', verticalAlign: 'middle', fill: 'currentColor' }}
      >
        <path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.918-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.337 2.25c-.416-.165-.866-.25-1.336-.25-2.21 0-3.918 1.79-3.918 4 0 .495.084.965.238 1.4-1.273.65-2.148 2.02-2.148 3.6 0 1.46.827 2.766 2.057 3.465-.02.137-.032.276-.032.418 0 2.21 1.71 3.998 3.918 3.998.47 0 .92-.084 1.336-.25 1.503 1.253 3.615 1.253 5.118 0 .416.166.866.25 1.336.25 2.21 0 3.918-1.79 3.918-4 0-.142-.012-.28-.032-.418 1.23-.698 2.057-2.004 2.057-3.465z" />
        <path d="M11.026 15.222l-2.656-2.77c-.393-.41-.393-1.073 0-1.483.393-.41 1.03-.41 1.423 0l1.944 2.028 4.398-4.59c.393-.41 1.03-.41 1.423 0 .393.41.393 1.073 0 1.483l-5.11 5.332c-.393.41-1.03.41-1.423 0z" fill="#fff" />
      </svg>
    </span>
  );
}
