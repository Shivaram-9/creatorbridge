import React from 'react';
import VerifiedBadge from './VerifiedBadge';

export default function VerifiedPill({ user, className = '', style = {}, fallbackText }) {
  if (!user) return null;
  const isBrand = user.role === 'brand';
  
  if (!user.isVerified && !user.isPremium) {
    return <span className={className} style={{ textTransform: 'capitalize', ...style }}>{fallbackText || user.role || 'Creator'}</span>;
  }

  return (
    <span className={`verified-badge-pill ${isBrand ? 'brand' : 'influencer'} ${className}`} style={style}>
      <span>{isBrand ? 'Verified Brand' : 'Verified Creator'}</span>
    </span>
  );
}
