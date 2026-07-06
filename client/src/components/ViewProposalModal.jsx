import React from 'react';
import './CollaborationProposalModal.css';

export default function ViewProposalModal({ proposalData, onClose, onAccept, onDecline, isReceiver, partnerName }) {
  if (!proposalData) return null;

  return (
    <div className="proposal-modal-overlay" onClick={onClose}>
      <div className="proposal-modal-content" onClick={e => e.stopPropagation()}>
        <div className="proposal-modal-header">
          <h2>Collaboration Proposal</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="proposal-modal-body">
          <div className="form-group">
            <label>Title</label>
            <p style={{ margin: '4px 0', fontSize: '15px', fontWeight: '500', color: 'var(--text-main)' }}>
              {proposalData.title || 'Content Campaign'}
            </p>
          </div>

          <div className="form-group">
            <label>Description</label>
            <p style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
              {proposalData.description || 'No description provided.'}
            </p>
          </div>

          <div className="form-group">
            <label>Deliverables</label>
            <ul style={{ paddingLeft: '20px', margin: '4px 0', fontSize: '14px', color: 'var(--text-main)' }}>
              {proposalData.deliverables && proposalData.deliverables.length > 0 ? (
                proposalData.deliverables.map((d, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    <strong>{d.quantity}x</strong> {d.name}
                  </li>
                ))
              ) : (
                <li>To Be Discussed</li>
              )}
            </ul>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Timeline</label>
              <p style={{ margin: '4px 0', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>
                {proposalData.timeline === 'Custom' ? 'Custom Date' : (proposalData.timeline || 'Flexible')}
              </p>
            </div>
            
            <div className="form-group">
              <label>Budget</label>
              <p style={{ margin: '4px 0', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>
                {proposalData.budget 
                  ? `${proposalData.currency === 'INR' ? '₹' : (proposalData.currency === 'USD' ? '$' : '€')}${proposalData.budget} (${proposalData.budgetType || 'Fixed'})`
                  : 'Negotiable'}
              </p>
            </div>
          </div>

          {proposalData.notes && (
            <div className="form-group">
              <label>Additional Notes</label>
              <p style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                {proposalData.notes}
              </p>
            </div>
          )}
        </div>

        <div className="proposal-modal-footer">
          {isReceiver && proposalData.status === "Pending" ? (
            <>
              <button className="btn btn-outline" onClick={onDecline} style={{ color: 'var(--text-muted)', border: 'none' }}>Decline</button>
              <button className="btn btn-primary" onClick={onAccept} style={{ background: '#10b981', borderColor: '#10b981' }}>Accept Proposal</button>
            </>
          ) : (
            <button className="btn btn-outline" onClick={onClose} style={{ width: '100%' }}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}
