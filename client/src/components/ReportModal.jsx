import { useState } from "react";
import { api } from "../services/api.js";

export default function ReportModal({ targetUser, targetPost, onClose }) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setLoading(true);

    try {
      await api.reports.submit({
        targetUser,
        targetPost,
        reason,
        description
      });
      setSuccess(true);
      setTimeout(onClose, 2000);
    } catch (err) {
      alert("Failed to submit report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 4000 }}>
      <div className="modal-content slide-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <h2 className="modal-title">Report Content</h2>
        
        {success ? (
          <div className="success-state" style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <p>Thank you for your report. Our moderators will review it shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="vertical-field">
              <label>Reason</label>
              <select 
                className="input" 
                value={reason} 
                onChange={e => setReason(e.target.value)}
                required
              >
                <option value="">Select a reason</option>
                <option value="Spam">Spam</option>
                <option value="Abuse">Abuse / Harassment</option>
                <option value="Fake account">Fake account</option>
                <option value="Inappropriate content">Inappropriate content</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            <div className="vertical-field">
              <label>Additional Details (Optional)</label>
              <textarea 
                className="input" 
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Help us understand the issue..."
              />
            </div>
            
            <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '1.5rem' }}>
              <button type="button" className="btn btn-ghost flex-1" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary flex-1" disabled={loading || !reason}>
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
