import "./CollaborationCard.css";

export default function CollaborationCard({ collab, onUpdateStatus, currentUserId }) {
  const { campaign, brand, influencer, status, _id } = collab;
  const isBrand = brand._id === currentUserId;
  const partner = isBrand ? influencer : brand;

  return (
    <div className={`collab-card status-${status.toLowerCase()}`}>
      <div className="collab-info">
        <div className="collab-campaign">
          <img src={campaign?.banner?.startsWith('http') ? campaign.banner : ''} alt={campaign?.title} onError={(e) => { e.target.style.display='none'; }} />
          <div>
            <h4>{campaign?.title}</h4>
            <p className="collab-partner">Partner: {partner?.name}</p>
          </div>
        </div>
        <div className="collab-status">
          <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
        </div>
      </div>
      <div className="collab-actions">
        {status === "Pending" && (
          <>
            <button onClick={() => onUpdateStatus(_id, "Accepted")} className="btn-accept">Accept</button>
            <button onClick={() => onUpdateStatus(_id, "Rejected")} className="btn-reject">Reject</button>
          </>
        )}
        {status === "Accepted" && (
          <button onClick={() => onUpdateStatus(_id, "Completed")} className="btn-complete">Mark as Completed</button>
        )}
        <button className="btn-message">Message Partner</button>
      </div>
    </div>
  );
}
