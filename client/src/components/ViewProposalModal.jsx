import React, { useState } from 'react';
import './CollaborationProposalModal.css';

export default function ViewProposalModal({ proposalData, onClose, onAccept, onDecline, onCounterOffer, isReceiver, partnerName, currentUserId }) {
  const [showCounterForm, setShowCounterForm] = useState(false);
  const [counterBudget, setCounterBudget] = useState('');
  const [counterMessage, setCounterMessage] = useState('');

  const data = proposalData || {
    title: 'Content Campaign',
    description: 'Would you be interested in discussing a potential collaboration?',
    deliverables: [],
    timeline: 'Flexible',
    budget: null,
    notes: 'This is a legacy text-based proposal.',
    status: 'Pending'
  };

  const currencySymbol = data.currency === 'INR' ? '₹' : (data.currency === 'USD' ? '$' : '€');
  const currentBudget = data.budget ? `${currencySymbol}${data.budget}` : 'Negotiable';
  const originalBudget = data.originalBudget ? `${currencySymbol}${data.originalBudget}` : currentBudget;

  const handleCounterSubmit = () => {
    if (!counterBudget) return;
    onCounterOffer(Number(counterBudget), counterMessage);
    setShowCounterForm(false);
  };

  // Determine if the current user can take action (Accept/Decline/Counter)
  let canAct = false;
  if (data.status === "Pending" && isReceiver) {
    canAct = true;
  } else if (data.status === "Counter Offered" && data.negotiationHistory && data.negotiationHistory.length > 0) {
    const lastHistory = data.negotiationHistory[data.negotiationHistory.length - 1];
    if (lastHistory.sender !== currentUserId) {
      canAct = true;
    }
  }

  return (
    <div className="proposal-modal-overlay" onClick={onClose}>
      <div className="proposal-modal-content" onClick={e => e.stopPropagation()}>
        <div className="proposal-modal-header">
          <h2>Collaboration Proposal</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="proposal-modal-body" style={{ flexDirection: 'column', padding: '24px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Status:</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: data.status === 'Accepted' ? '#10b981' : (data.status === 'Declined' ? '#ef4444' : '#f59e0b') }}>
              {data.status || 'Pending'}
            </span>
          </div>

          <div className="proposal-form-group">
            <label>Title</label>
            <p style={{ margin: '4px 0', fontSize: '15px', fontWeight: '500', color: 'var(--text-main)' }}>
              {data.title || 'Content Campaign'}
            </p>
          </div>

          <div className="proposal-form-group">
            <label>Description</label>
            <p style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
              {data.description || 'No description provided.'}
            </p>
          </div>

          <div className="proposal-form-group">
            <label>Deliverables</label>
            <ul style={{ paddingLeft: '20px', margin: '4px 0', fontSize: '14px', color: 'var(--text-main)' }}>
              {data.deliverables && data.deliverables.length > 0 ? (
                data.deliverables.map((d, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    <strong>{d.quantity}x</strong> {d.name}
                  </li>
                ))
              ) : (
                <li>To Be Discussed</li>
              )}
            </ul>
          </div>

          <div className="proposal-row">
            <div className="proposal-form-group">
              <label>Timeline</label>
              <p style={{ margin: '4px 0', fontSize: '14px', fontWeight: '500', color: 'var(--text-main)' }}>
                {data.timeline === 'Custom' ? 'Custom Date' : (data.timeline || 'Flexible')}
              </p>
            </div>
            
            <div className="proposal-form-group">
              <label>Budget</label>
              <p style={{ margin: '4px 0', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>
                {currentBudget} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>({data.budgetType || 'Fixed'})</span>
              </p>
              {data.originalBudget && data.originalBudget !== data.budget && (
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Original: <span style={{ textDecoration: 'line-through' }}>{originalBudget}</span>
                </p>
              )}
            </div>
          </div>

          {data.notes && (
            <div className="proposal-form-group">
              <label>Additional Notes</label>
              <p style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.5', color: 'var(--text-muted)' }}>
                {data.notes}
              </p>
            </div>
          )}

          {data.negotiationHistory && data.negotiationHistory.length > 0 && (
            <div className="proposal-form-group" style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
              <label style={{ color: '#f59e0b' }}>Negotiation History</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {data.negotiationHistory.map((history, idx) => (
                  <div key={idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(history.timestamp).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                        Offer: {currencySymbol}{history.budget}
                      </span>
                    </div>
                    {history.message && (
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        "{history.message}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {data.declineReason && (
            <div className="proposal-form-group" style={{ marginTop: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
              <label style={{ color: '#ef4444' }}>Decline Reason</label>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-main)' }}>{data.declineReason}</p>
            </div>
          )}

          {showCounterForm && (
            <div className="proposal-form-group" style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', color: 'var(--text-main)' }}>Make a Counter Offer</h3>
              
              <div className="proposal-form-group">
                <label>New Budget ({currencySymbol})</label>
                <input 
                  type="number" 
                  className="proposal-form-input" 
                  placeholder="e.g. 25000" 
                  value={counterBudget}
                  onChange={(e) => setCounterBudget(e.target.value)}
                />
              </div>

              <div className="proposal-form-group">
                <label>Message (Optional)</label>
                <textarea 
                  className="proposal-form-input" 
                  placeholder="Explain your counter offer..." 
                  rows="2"
                  value={counterMessage}
                  onChange={(e) => setCounterMessage(e.target.value)}
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button className="btn btn-outline" onClick={() => setShowCounterForm(false)} style={{ border: 'none', color: 'var(--text-muted)', padding: '10px 16px', borderRadius: '8px', fontWeight: '500', cursor: 'pointer', background: 'transparent' }}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCounterSubmit} disabled={!counterBudget} style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Send Counter Offer</button>
              </div>
            </div>
          )}
        </div>

        <div className="proposal-modal-footer">
          {canAct ? (
             (!showCounterForm ? (
                <>
                  <button className="btn btn-outline" onClick={() => onDecline("")} style={{ color: '#ef4444', borderColor: 'transparent', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', background: 'transparent' }}>Decline</button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline" onClick={() => setShowCounterForm(true)} style={{ borderColor: 'var(--border-color)', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', background: 'var(--bg-main)', color: 'var(--text-main)' }}>Counter Offer</button>
                    <button className="btn btn-primary" onClick={onAccept} style={{ background: '#10b981', borderColor: '#10b981', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Accept</button>
                  </div>
                </>
             ) : null)
          ) : (
            <button className="btn btn-outline" onClick={onClose} style={{ width: '100%', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}
