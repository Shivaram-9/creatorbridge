import React from 'react';
import './ProposalWorkflow.css';

export default function DeclineConfirmation({ onClose, onConfirm }) {
  return (
    <div className="pw-overlay" onClick={onClose}>
      <div className="pw-container-auto" onClick={e => e.stopPropagation()}>
        <div className="pw-header">
          <h2>Decline Proposal</h2>
          <button className="pw-close-btn" onClick={onClose}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="pw-body" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--pw-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--pw-text-main)' }}>Decline this proposal?</h3>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--pw-text-muted)' }}>
            Are you sure you want to decline this collaboration proposal?
          </p>

          <div className="pw-danger-box" style={{ textAlign: 'left' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            <span style={{ lineHeight: '1.4' }}>This action cannot be undone.</span>
          </div>
        </div>

        <div className="pw-footer">
          <div className="pw-footer-row">
            <button className="pw-btn pw-btn-outline" onClick={onClose}>No, Go Back</button>
            <button className="pw-btn pw-btn-decline" onClick={onConfirm}>Yes, Decline</button>
          </div>
        </div>
      </div>
    </div>
  );
}
