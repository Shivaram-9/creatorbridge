import React from 'react';
import './ProposalWorkflow.css';

export default function AcceptConfirmation({ proposalData, onClose, onConfirm }) {
  const data = proposalData || {};
  const currencySymbol = data.currency === 'INR' ? '₹' : (data.currency === 'USD' ? '$' : '€');
  const budget = data.budget ? `${currencySymbol}${data.budget}` : 'Negotiable';

  return (
    <div className="pw-overlay" onClick={onClose}>
      <div className="pw-container-auto" onClick={e => e.stopPropagation()}>
        <div className="pw-header">
          <h2>Accept Proposal</h2>
          <button className="pw-close-btn" onClick={onClose}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="pw-body" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" fill="none" stroke="var(--pw-primary)" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--pw-text-main)' }}>Confirm Acceptance</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--pw-text-muted)' }}>
            Are you sure you want to accept this collaboration proposal?
          </p>

          <div className="pw-card" style={{ textAlign: 'left' }}>
            <div style={{ marginBottom: '8px' }}>
              <span className="pw-label">Campaign</span>
              <p className="pw-value">{data.title || 'Content Campaign'}</p>
            </div>
            <div className="pw-row">
              <div className="pw-col">
                <span className="pw-label">Timeline</span>
                <p className="pw-value">{data.timeline || 'Flexible'}</p>
              </div>
              <div className="pw-col" style={{ textAlign: 'right' }}>
                <span className="pw-label">Budget</span>
                <p className="pw-value" style={{ color: 'var(--pw-primary)' }}>{budget}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pw-footer">
          <div className="pw-footer-row">
            <button className="pw-btn pw-btn-outline" onClick={onClose}>Cancel</button>
            <button className="pw-btn pw-btn-accept" onClick={onConfirm}>Confirm Accept</button>
          </div>
        </div>
      </div>
    </div>
  );
}
