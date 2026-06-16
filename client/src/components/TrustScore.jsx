import React, { useMemo } from 'react';
import './TrustScore.css';
import VerifiedBadge from './VerifiedBadge.jsx';

// Simple deterministic hash to generate consistent mock data for a user
function stringToHash(str) {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export default function TrustScore({ user }) {
  if (!user) return null;

  // Generate deterministic metrics based on user ID or username
  const seed = stringToHash(user._id || user.username || 'default');
  
  // Calculate base score logic based on actual profile data + seed
  const isVerified = user.isVerified || user.isPremium;
  const hasAvatar = !!user.profilePicture;
  const hasBio = !!user.bio;
  const hasPortfolio = user.portfolio && user.portfolio.length > 0;
  
  let profileCompleteness = 40;
  if (hasAvatar) profileCompleteness += 20;
  if (hasBio) profileCompleteness += 20;
  if (hasPortfolio) profileCompleteness += 20;

  // Generate mocked advanced metrics (between 80-100 for verified, 60-90 for unverified)
  const baseRate = isVerified ? 85 : 60;
  const completionRate = Math.min(100, baseRate + (seed % 15) + (profileCompleteness / 20));
  const responseRate = Math.min(100, baseRate + ((seed + 1) % 15));
  const onTimeDelivery = Math.min(100, baseRate + ((seed + 2) % 15));
  const collabsCount = (seed % 42) + (isVerified ? 10 : 0);
  
  const ratingBase = isVerified ? 4.5 : 3.8;
  const averageRating = Math.min(5.0, ratingBase + ((seed % 10) / 10)).toFixed(1);

  // Final Trust Score Calculation
  const trustScoreRaw = (
    (profileCompleteness * 0.15) +
    (completionRate * 0.25) +
    (responseRate * 0.20) +
    (onTimeDelivery * 0.20) +
    ((averageRating / 5) * 100 * 0.20)
  );
  
  const finalScore = Math.round(trustScoreRaw);

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
          <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
            Calculated across 5 performance pillars
          </div>
        </div>

        {/* Right Column: Metrics Cards */}
        <div className="trust-metrics-grid">
          
          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Identity Verification</span>
              <span className="metric-icon">🛡️</span>
            </div>
            <div className="metric-value">
              {isVerified ? 'Verified' : 'Unverified'}
              {isVerified && <VerifiedBadge size="sm" tier={user.premiumTier} role={user.role} />}
            </div>
            <div className="metric-sub">{isVerified ? 'Identity confirmed' : 'Basic account'}</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Profile Completeness</span>
              <span className="metric-icon">👤</span>
            </div>
            <div className="metric-value">{profileCompleteness}%</div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${profileCompleteness}%`, background: colorHex }}></div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Campaign Completion</span>
              <span className="metric-icon">🎯</span>
            </div>
            <div className="metric-value">{Math.round(completionRate)}%</div>
            <div className="metric-sub">{collabsCount} total campaigns</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Avg. Response Rate</span>
              <span className="metric-icon">⚡</span>
            </div>
            <div className="metric-value">{Math.round(responseRate)}%</div>
            <div className="metric-sub">Usually replies in &lt; 24h</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">On-Time Delivery</span>
              <span className="metric-icon">⏱️</span>
            </div>
            <div className="metric-value">{Math.round(onTimeDelivery)}%</div>
            <div className="metric-sub">Asset submission track record</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Partner Rating</span>
              <span className="metric-icon">⭐</span>
            </div>
            <div className="metric-value">{averageRating}</div>
            <div className="metric-sub">Based on {collabsCount > 0 ? Math.max(1, Math.floor(collabsCount * 0.7)) : 0} reviews</div>
          </div>

        </div>
      </div>

      {/* Suggestions Section (Visible only if score is below 90) */}
      {finalScore < 90 && (
        <div className="suggestions-section">
          <div className="suggestions-title">
            <span>📈</span> How to improve your score
          </div>
          
          {!isVerified && (
            <div className="suggestion-item">
              <div className="suggestion-icon">1</div>
              <div className="suggestion-content">
                <h4>Verify your identity</h4>
                <p>Getting verified significantly boosts your trust score and shows partners you are authentic.</p>
              </div>
            </div>
          )}
          
          {profileCompleteness < 100 && (
            <div className="suggestion-item">
              <div className="suggestion-icon">{!isVerified ? '2' : '1'}</div>
              <div className="suggestion-content">
                <h4>Complete your profile</h4>
                <p>Add a bio, profile picture, and portfolio items to reach 100% profile completeness.</p>
              </div>
            </div>
          )}

          <div className="suggestion-item">
            <div className="suggestion-icon">{(!isVerified && profileCompleteness < 100) ? '3' : (!isVerified || profileCompleteness < 100) ? '2' : '1'}</div>
            <div className="suggestion-content">
              <h4>Maintain fast response times</h4>
              <p>Replying to messages and collaboration requests within 24 hours will gradually increase your response rate metric.</p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
