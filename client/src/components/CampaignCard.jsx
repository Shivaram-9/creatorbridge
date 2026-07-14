import { Link } from "react-router-dom";
import "./CampaignCard.css";
import { formatCurrency } from "../utils/formatters";

export default function CampaignCard({ campaign, onApply, user }) {
  const { title, budget, deadline, category, banner, createdBy, _id } = campaign;

  const hasApplied = campaign.applicants?.includes(user?._id);

  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  ];
  const fallbackGradient = gradients[(_id?.charCodeAt(0) || 0) % gradients.length];

  return (
    <div className="campaign-card">
      {/* Banner */}
      <div className="campaign-banner" style={{ background: banner ? 'transparent' : fallbackGradient }}>
        {banner && banner.startsWith('http') ? (
          <img src={banner} alt={title} onError={(e) => { e.target.style.display = 'none'; }} />
        ) : null}
        <div className="campaign-category-badge">{category}</div>
      </div>

      {/* Content */}
      <div className="campaign-content">
        {/* Brand row */}
        <div className="campaign-brand-row">
          <Link to={`/user/${createdBy?._id}`} className="campaign-brand-link">
            {createdBy?.avatar ? (
              <img src={createdBy.avatar} alt={createdBy?.name} className="campaign-brand-avatar" />
            ) : (
              <div className="campaign-brand-initials">{createdBy?.name?.charAt(0) || 'B'}</div>
            )}
            <span className="campaign-brand-name">{createdBy?.name || 'Brand'}</span>
          </Link>
          <span className="campaign-budget-tag">{formatCurrency(budget)}</span>
        </div>

        {/* Title */}
        <h3 className="campaign-title">{title}</h3>

        {/* Meta */}
        <div className="campaign-meta-row">
          <span className="campaign-deadline">📅 {new Date(deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>

        {/* Actions */}
        <div className="campaign-actions">
          <Link to={`/campaign/${_id}`} className="btn-view-details">View Details</Link>

          {user?.role === 'brand' && user?._id === createdBy?._id && (
            <Link to="/brand-dashboard" className="btn-manage">Manage</Link>
          )}

          {user?.role !== 'brand' && (
            hasApplied ? (
              <button className="btn-applied" disabled>Applied ✓</button>
            ) : (
              <button onClick={() => onApply(_id)} className="btn-apply-now">Apply Now</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

