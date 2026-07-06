import React, { useState } from 'react';
import { api } from '../services/api.js';
import './TrustScore.css';
import VerifiedUserDisplay from './VerifiedUserDisplay.jsx';
import { ShieldIcon, ProfileIcon, StarIcon } from './Icons.jsx';

const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
);

const LightningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
);

export default function TrustScore({ user, isOwnProfile }) {
  if (!user) return null;
  const idStr = user._id || "default";
  const isVerified = user.premiumTier && user.premiumTier !== 'free';
  
  const finalScore = user.trustScore || 0;
  const completedCampaigns = user.completedCampaigns || 0;
  const responseRate = user.responseRate || 0;
  const onTimeDelivery = user.onTimeDelivery || 0;
  const averageRating = (user.averageRating || 0).toFixed(1);
  
  // Real profile completeness calculation
  let completeness = 30; // base score for signing up
  if (user.avatar) completeness += 15;
  if (user.bio) completeness += 15;
  if (user.industry || user.niche) completeness += 10;
  if (user.location) completeness += 10;
  if (user.portfolio?.length > 0) completeness += 10;
  if (user.followers?.length > 0 || user.following?.length > 0) completeness += 10;
  const profileCompleteness = Math.min(100, completeness);

  // Determine Level
  let levelName = '';
  let levelClass = '';
  let colorHex = '';

  if (finalScore >= 90) {
    levelName = 'Elite Partner';
    levelClass = 'level-elite';
    colorHex = '#2563eb'; // Blue
  } else if (finalScore >= 75) {
    levelName = 'Trusted Partner';
    levelClass = 'level-trusted';
    colorHex = '#16a34a'; // Green
  } else if (finalScore >= 60) {
    levelName = 'Active Partner';
    levelClass = 'level-active';
    colorHex = '#ca8a04'; // Yellow
  } else {
    levelName = 'Needs Improvement';
    levelClass = 'level-needs-improvement';
    colorHex = '#dc2626'; // Red
  }

  // Circular progress math
  const strokeDasharray = `${finalScore} 100`;

  return (
    <div className="trust-score-container">
      <div className="trust-score-header">
        <div className="trust-header-info">
          <h2>Trust Score Report</h2>
          <p>Transparent collaboration metrics evaluated by Pactogram</p>
        </div>
        <div className={`trust-level-badge ${levelClass}`}>
          {levelName}
        </div>
      </div>

      <div className="trust-grid">
        {/* Left Column: Circular Indicator */}
        <div className="trust-circular-section">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path className="circle-bg"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path className="circle"
              strokeDasharray={strokeDasharray}
              stroke={colorHex}
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <text x="18" y="19" className="percentage">{finalScore}</text>
            <text x="18" y="24" className="percentage-label">/ 100</text>
          </svg>
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
            Calculated across 5 performance pillars
          </div>
        </div>

        {/* Right Column: Metrics Cards */}
        <div className="trust-metrics-grid">
          
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Identity Verification</span>
              <span className="metric-icon"><ShieldIcon /></span>
            </div>
            <div className="metric-value">
              {isVerified ? (
                  <VerifiedUserDisplay 
                    user={user}
                    showLabel={false}
                    nameComponent={<>Verified</>}
                  />
              ) : (
                'Unverified'
              )}
            </div>
            <div className="metric-sub">{isVerified ? 'Identity confirmed' : 'Pending verification'}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Profile Completeness</span>
              <span className="metric-icon"><ProfileIcon /></span>
            </div>
            <div className="metric-value">{profileCompleteness}%</div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${profileCompleteness}%`, background: colorHex }}></div>
            </div>
          </div>




          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">On-Time Delivery</span>
              <span className="metric-icon"><ClockIcon /></span>
            </div>
            <div className="metric-value">{onTimeDelivery}%</div>
            <div className="metric-sub">Asset submission track record</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Profile Rating</span>
              <span className="metric-icon"><StarIcon /></span>
            </div>
            <div className="metric-value">{averageRating}</div>
            <div className="metric-sub">Verified reviews</div>
          </div>

        </div>
      </div>
    </div>
  );
}
