import React from "react";
import { useNavigate } from "react-router-dom";
import { SparklesIcon } from "./Icons.jsx";
import VerifiedUserDisplay from "./VerifiedUserDisplay.jsx";
import { api } from "../services/api.js";
import "./SmartDiscoverCard.css";

export default function SmartDiscoverCard({ user, onAction }) {
  const navigate = useNavigate();

  if (!user) return null;

  // Resolve avatar URL
  const src = user.avatar 
    ? (user.avatar.startsWith('http') ? user.avatar : `${api.getResolvedApiOrigin()}${user.avatar}`) 
    : "";

  // Use heuristic score or fallback to a default decent score
  const matchScore = user.matchScore || 85; 
  
  const isBrand = user.role === "brand";

  const formatCount = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num;
  };

  const handleCardClick = () => {
    navigate(`/user/${user.username || user._id}`);
  };

  const handlePrimaryAction = (e) => {
    e.stopPropagation();
    if (onAction) onAction(user);
    else navigate(`/user/${user.username || user._id}`);
  };

  return (
    <div className="smart-card" onClick={handleCardClick}>
      {/* AI Match Score Badge */}
      <div className={`smart-card-match-badge ${matchScore >= 90 ? 'high' : ''}`}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}><SparklesIcon /> {matchScore}% Match</span>
      </div>

      <div className="smart-card-header">
        <img 
          src={src} 
          alt={user.name} 
          className={`smart-card-avatar ${isBrand ? 'brand' : ''}`}
          onError={(e) => { e.target.style.display='none'; }}
        />
        <div className="smart-card-info">
          <VerifiedUserDisplay 
            user={user}
            nameComponent={
              <h3 className={`smart-card-name text-slate-900 dark:text-white`} title={user.name}>{user.name}</h3>
            }
          />
          {!(user.isVerified || user.isPremium) && (
            <div className="smart-card-role" style={{ width: '100%', marginTop: '4px' }}>
              <span style={{ textTransform: 'capitalize', fontSize: '13px', color: '#64748b' }}>
                {user.category || (isBrand ? "Brand" : "Creator")}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="smart-card-metrics">
        {isBrand ? (
          <>
            <div className="smart-metric">
              <span className="smart-metric-label">Campaigns</span>
              <span className="smart-metric-val">{user.campaignCount || Math.floor(Math.random() * 20) + 1} Active</span>
            </div>
            <div className="smart-metric">
              <span className="smart-metric-label">Budget</span>
              <span className="smart-metric-val text-budget-value">Premium</span>
            </div>
          </>
        ) : (
          <>
            <div className="smart-metric">
              <span className="smart-metric-label">Followers</span>
              <span className="smart-metric-val">{formatCount(user.followers || 0)}</span>
            </div>
            <div className="smart-metric">
              <span className="smart-metric-label">Engagement</span>
              <span className="smart-metric-val">{((user.profileViews || 1) / (user.followers || 100) * 100).toFixed(1)}%</span>
            </div>
          </>
        )}
      </div>

      <div className="smart-card-actions">
        <button className="smart-btn smart-btn-primary" onClick={handlePrimaryAction}>
          {isBrand ? "View Brand" : "Invite"}
        </button>
        <button className="smart-btn smart-btn-secondary" onClick={(e) => { e.stopPropagation(); navigate(`/chat?user=${user._id}`); }}>
          Message
        </button>
      </div>
    </div>
  );
}
