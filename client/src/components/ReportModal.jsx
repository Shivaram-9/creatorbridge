import { useState } from "react";
import { api } from "../services/api.js";
import { CheckCircleIcon } from "./Icons.jsx";
import "./ReportModal.css";

export default function ReportModal({ targetType, targetId, onClose }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const reasons = [
    "Spam or misleading",
    "Harassment or bullying",
    "Inappropriate content",
    "Hate speech",
    "Scam or fraud",
    "Intellectual property violation",
    "Other"
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;

    setLoading(true);
    try {
      const res = await api.moderation.report({
        targetType,
        targetId,
        reason,
        description
      });
      if (res.error) setError(res.error);
      else setSuccess(true);
    } catch {
      setError("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-modal-overlay global-modal-overlay">
      <div className="report-modal slide-up global-modal-dialog">
        <header className="report-modal-header global-modal-header">
          <h2>Report {targetType === 'user' ? 'Profile' : 'Content'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </header>

        {success ? (
          <div className="success-state global-modal-body">
            <span className="icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><CheckCircleIcon /></span>
            <h3>Report Submitted</h3>
            <p>We use these reports to keep Pactogram safe. Our moderation team will review this shortly.</p>
            <button className="btn btn-primary" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="global-modal-body">
            <p className="report-intro">Why are you reporting this {targetType}?</p>
            
            <div className="reason-grid">
              {reasons.map(r => (
                <div 
                  key={r} 
                  className={`reason-option ${reason === r ? 'active' : ''}`}
                  onClick={() => setReason(r)}
                >
                  {r}
                </div>
              ))}
            </div>

            <textarea 
              placeholder="Additional details (optional)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="report-textarea"
            />

            {error && <p className="error-text">{error}</p>}

            <div className="report-footer global-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading || !reason}>
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
