import React from 'react';

export default function AcceptProposalDialog({ proposalData, onClose, onConfirm }) {
  const data = proposalData || {};
  const currencySymbol = data.currency === 'INR' ? '₹' : (data.currency === 'USD' ? '$' : '€');
  const budget = data.budget ? `${currencySymbol}${data.budget}` : 'Negotiable';

  return (
    <div className="proposal-modal-overlay global-modal-overlay" onClick={onClose}>
      <div className="proposal-modal-content mobile-responsive-modal global-modal-dialog" onClick={e => e.stopPropagation()} style={{ height: 'auto', maxHeight: '90dvh' }}>
        <div className="proposal-modal-header global-modal-header">
          <h2>Accept Proposal</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="proposal-modal-body global-modal-body" style={{ flexDirection: 'column', padding: '24px 16px', overflowY: 'auto', textAlign: 'center' }}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--text-main)' }}>Confirm Acceptance</h3>
          <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: 'var(--text-muted)' }}>
            Are you sure you want to accept this collaboration proposal?
          </p>

          <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)', textAlign: 'left' }}>
            <div style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Campaign</span>
              <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{data.title || 'Content Campaign'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Timeline</span>
                <strong style={{ fontSize: '14px', color: 'var(--text-main)' }}>{data.timeline || 'Flexible'}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block' }}>Budget</span>
                <strong style={{ fontSize: '15px', color: '#10b981' }}>{budget}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="proposal-modal-footer global-modal-footer" style={{ flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button className="btn btn-outline" onClick={onClose} style={{ flex: 1, color: 'var(--text-muted)', border: '1px solid var(--border-light)', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', background: 'transparent' }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={onConfirm} style={{ flex: 1, background: '#10b981', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>
              Confirm Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
