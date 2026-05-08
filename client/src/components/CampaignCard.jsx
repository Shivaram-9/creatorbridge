import { Link } from "react-router-dom";
import "./CampaignCard.css";

export default function CampaignCard({ campaign, onApply, isInfluencer }) {
  const { title, budget, deadline, category, banner, createdBy, _id } = campaign;

  return (
    <div className="campaign-card">
      <div className="campaign-banner">
        <img src={banner || "https://via.placeholder.com/600x300?text=Campaign"} alt={title} />
        <div className="campaign-category">{category}</div>
      </div>
      <div className="campaign-content">
        <div className="campaign-header">
          <Link to={`/user/${createdBy?._id}`} className="campaign-brand">
            <img src={createdBy?.avatar || "/default-avatar.png"} alt={createdBy?.name} />
            <span>{createdBy?.name}</span>
          </Link>
          <div className="campaign-budget">{budget}</div>
        </div>
        <h3 className="campaign-title">{title}</h3>
        <p className="campaign-deadline">Deadline: {new Date(deadline).toLocaleDateString()}</p>
        <div className="campaign-actions">
          <Link to={`/campaign/${_id}`} className="btn-secondary">View Details</Link>
          {isInfluencer && (
            <button onClick={() => onApply(_id)} className="btn-primary">Apply Now</button>
          )}
        </div>
      </div>
    </div>
  );
}
