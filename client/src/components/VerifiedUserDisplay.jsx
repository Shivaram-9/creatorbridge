import React from 'react';
import VerifiedBadge from './VerifiedBadge.jsx';

export default function VerifiedUserDisplay({ 
  user, 
  nameComponent, // For passing in custom H1 or H3 elements if needed
  showLabel = true, 
  className = '',
  appendedLabel = null, // e.g. <span>• 5/25/2026</span>
  unverifiedLabel = null // Fallback text when unverified
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
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
        {nameComponent 
          ? React.cloneElement(nameComponent, {
              style: { ...nameComponent.props.style, display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px' },
              children: (
                <React.Fragment>
                  {nameComponent.props.children}
                  {isVerified && <VerifiedBadge role={user.role} />}
                </React.Fragment>
              )
            })
          : (
            <span className="font-bold text-slate-900 dark:text-white" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              {displayName}
              {isVerified && <VerifiedBadge role={user.role} />}
            </span>
          )
        }
      </div>

      {/* Verification Label & Divider */}
      {isVerified && showLabel && (
        <div style={{ marginTop: '4px', marginBottom: '12px', display: 'inline-flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <span style={{ 
              color: textColor, 
              fontSize: '13px', 
              fontWeight: '600', 
              letterSpacing: '0.2px'
            }}>
              {labelText}
            </span>
            {appendedLabel && <div className="text-sm text-slate-500 dark:text-slate-400">{appendedLabel}</div>}
          </div>
          <div className="bg-[#E5E5E5] dark:bg-[#2A2A2A]" style={{ height: '1px', width: '100%' }}></div>
        </div>
      )}

      {/* Unverified Fallback */}
      {!isVerified && (unverifiedLabel || appendedLabel) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', marginBottom: '12px' }}>
          {unverifiedLabel && (
            <span className="text-sm text-slate-500 dark:text-slate-400" style={{ textTransform: 'capitalize' }}>
              {unverifiedLabel}
            </span>
          )}
          {appendedLabel && <div className="text-sm text-slate-500 dark:text-slate-400">{appendedLabel}</div>}
        </div>
      )}
    </div>
  );
}
