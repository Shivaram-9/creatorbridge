import { Link } from "react-router-dom";

export default function EmptyState({ 
  icon = "ℹ️", 
  title = "No data found", 
  description, 
  actionLabel, 
  actionTo, 
  onAction 
}) {
  return (
    <div className="empty-state empty-state--hero" style={{ padding: "4rem 2rem" }}>
      <div className="empty-state__illustration" style={{ fontSize: "3.5rem", marginBottom: "1.5rem" }} aria-hidden="true">
        {icon}
      </div>
      <h2 className="empty-state__title" style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem" }}>
        {title}
      </h2>
      {description && (
        <p className="empty-state__text" style={{ maxWidth: "400px", margin: "0 auto 2rem", opacity: 0.7 }}>
          {description}
        </p>
      )}
      
      {(actionTo || onAction) && (
        <div className="empty-state__action">
          {actionTo ? (
            <Link to={actionTo} className="btn btn-primary">
              {actionLabel}
            </Link>
          ) : (
            <button onClick={onAction} className="btn btn-primary">
              {actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
