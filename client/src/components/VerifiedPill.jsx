import React from 'react';

export default function VerifiedPill({ user, className = '', style = {}, fallbackText }) {
  if (!user) return null;
  const isBrand = user.role === 'brand';
  
  if (!user.isVerified && !user.isPremium) {
    return <span className={className} style={{ textTransform: 'capitalize', ...style }}>{fallbackText || user.role || 'Creator'}</span>;
  }

  const textColor = isBrand ? '#F5C024' : '#0095f6';

  return (
    <span 
      className={`verified-text-label ${className}`} 
      style={{ 
        color: textColor, 
        fontSize: '13px', 
        fontWeight: '600', 
        letterSpacing: '0.2px', 
        ...style 
      }}
    >
      {isBrand ? 'Verified Brand' : 'Verified Creator'}
    </span>
  );
}
