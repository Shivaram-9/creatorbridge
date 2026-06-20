import "./EmptyState.css";
import { SparklesIcon } from "./Icons.jsx";

export default function EmptyState({ icon, title, description, actionText, onAction }) {
  return (
    <div className="empty-state-card card slide-in">
      <div className="empty-icon" style={{ display: 'flex', justifyContent: 'center' }}>{icon || <SparklesIcon />}</div>
      <h3 className="empty-title">{title || "Nothing here yet"}</h3>
      <p className="empty-desc">{description || "Check back later or try a different filter."}</p>
      {actionText && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
}
