import React from 'react';

export default function DeclineProposalDialog({ onClose, onConfirm }) {
  return (
    <div className="proposal-modal-overlay global-modal-overlay" onClick={onClose}>
      <div className="proposal-modal-content mobile-responsive-modal global-modal-dialog" onClick={e => e.stopPropagation()} style={{ height: 'auto', maxHeight: '90dvh' }}>
        <div className="proposal-modal-header global-modal-header">
          <h2>Decline Proposal</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="proposal-modal-body global-modal-body" style={{ flexDirection: 'column', padding: '32px 16px', overflowY: 'auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
            </div>
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-main)' }}>Decline Proposal</h3>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-muted)' }}>
            Are you sure you want to decline this collaboration proposal?
          </p>
        </div>

        <div className="proposal-modal-footer global-modal-footer" style={{ flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button className="btn btn-outline" onClick={onClose} style={{ flex: 1, color: 'var(--text-muted)', border: '1px solid var(--border-light)', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', background: 'transparent' }}>
              No
            </button>
            <button className="btn btn-primary" onClick={onConfirm} style={{ flex: 1, background: '#ef4444', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Yes, Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
