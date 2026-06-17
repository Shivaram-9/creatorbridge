import React, { useState } from 'react';
import { api } from '../services/api.js';
import './TrustScore.css';
import VerifiedBadge from './VerifiedBadge.jsx';
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

export default function TrustScore({ user, isOwnProfile, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    trustScore: user?.trustScore || 0,
    completedCampaigns: user?.completedCampaigns || 0,
    responseRate: user?.responseRate || 0,
    onTimeDelivery: user?.onTimeDelivery || 0,
    averageRating: user?.averageRating || 0,
  });

  const handleSave = async () => {
    try {
      const res = await api.patch('/users/me', formData);
      if (onUpdate) onUpdate(res.data);
      setIsEditing(false);
    } catch(err) {
      alert("Failed to update metrics");
    }
  };

  if (!user) return null;
  // Strict backend data binding
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2>Trust Score Report</h2>
            {isOwnProfile && (
              <button 
                onClick={() => setIsEditing(true)}
                style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer', fontWeight: '500' }}
              >
                ✏️ Edit Demo Metrics
              </button>
            )}
          </div>
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
              <span className="metric-icon"><ShieldIcon /></span>
            </div>
            <div className="metric-value">
              {isVerified ? (
                <>
                  Verified
                  <VerifiedBadge size="sm" tier={user.premiumTier} role={user.role} />
                </>
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
              <span className="metric-title">Completed Campaigns</span>
              <span className="metric-icon"><TargetIcon /></span>
            </div>
            <div className="metric-value">{completedCampaigns}</div>
            <div className="metric-sub">Total collaborations</div>
          </div>

          <div className="metric-card">
            <div className="metric-header">
              <span className="metric-title">Avg. Response Rate</span>
              <span className="metric-icon"><LightningIcon /></span>
            </div>
            <div className="metric-value">{responseRate}%</div>
            <div className="metric-sub">Usually replies in &lt; 24h</div>
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
              <span className="metric-title">Partner Rating</span>
              <span className="metric-icon"><StarIcon /></span>
            </div>
            <div className="metric-value">{averageRating}</div>
            <div className="metric-sub">Verified reviews</div>
          </div>

        </div>
      </div>

      {isEditing && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: 'bold' }}>Edit Demo Metrics</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#475569' }}>Trust Score (0-100)</label>
              <input type="number" value={formData.trustScore} onChange={e => setFormData({...formData, trustScore: Number(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#475569' }}>Completed Campaigns</label>
              <input type="number" value={formData.completedCampaigns} onChange={e => setFormData({...formData, completedCampaigns: Number(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#475569' }}>Response Rate (%)</label>
              <input type="number" value={formData.responseRate} onChange={e => setFormData({...formData, responseRate: Number(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#475569' }}>On-Time Delivery (%)</label>
              <input type="number" value={formData.onTimeDelivery} onChange={e => setFormData({...formData, onTimeDelivery: Number(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', marginBottom: '4px', color: '#475569' }}>Average Rating (0.0 - 5.0)</label>
              <input type="number" step="0.1" value={formData.averageRating} onChange={e => setFormData({...formData, averageRating: Number(e.target.value)})} style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '6px' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#f1f5f9', cursor: 'pointer', color: '#475569', fontWeight: '500' }}>Cancel</button>
              <button onClick={handleSave} style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#2563eb', cursor: 'pointer', color: 'white', fontWeight: '500' }}>Save Metrics</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
