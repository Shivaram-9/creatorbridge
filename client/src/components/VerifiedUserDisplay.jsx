import React from 'react';
import VerifiedBadge from './VerifiedBadge.jsx';

export default function VerifiedUserDisplay({ 
  user, 
  nameComponent, // For passing in custom H1 or H3 elements if needed
  showLabel = true, 
  className = ''
}) {
  if (!user) return null;

  const isVerified = user.isVerified || user.isPremium;
  const isBrand = user.role?.toLowerCase() === 'brand';
  const textColor = isBrand ? '#F5C024' : '#0095f6';
  const labelText = isBrand ? 'Verified Brand' : 'Verified Creator';
  const displayName = user.name || user.username;

  return (
    <div className={`verified-user-display flex flex-col items-start ${className}`}>
      {/* Username + Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {nameComponent ? nameComponent : <span className="font-bold text-slate-900 dark:text-white">{displayName}</span>}
        {isVerified && <VerifiedBadge role={user.role} />}
      </div>

      {/* Verification Label & Divider */}
      {isVerified && showLabel && (
        <div style={{ marginTop: '4px', marginBottom: '12px', display: 'inline-flex', flexDirection: 'column' }}>
          <span style={{ 
            color: textColor, 
            fontSize: '13px', 
            fontWeight: '600', 
            letterSpacing: '0.2px',
            marginBottom: '6px'
          }}>
            {labelText}
          </span>
          <div className="bg-[#E5E5E5] dark:bg-[#2A2A2A]" style={{ height: '1px', width: '100%' }}></div>
        </div>
      )}
    </div>
  );
}
