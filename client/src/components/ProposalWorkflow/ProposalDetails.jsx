import React, { useState, useEffect } from 'react';
import { formatCurrency } from "../../utils/formatters";
import './ProposalWorkflow.css';
import CounterOfferModal from './CounterOfferModal';
import AcceptConfirmation from './AcceptConfirmation';
import DeclineConfirmation from './DeclineConfirmation';

export default function ProposalDetails({ 
  proposalData, 
  onClose, 
  onAccept, 
  onDecline, 
  onCounterOffer, 
  isReceiver, 
  partnerName, 
  currentUserId,
  initialShowCounterForm = false
}) {
  const [actionState, setActionState] = useState(initialShowCounterForm ? 'counter' : null);

  const data = proposalData || {
    title: 'Content Campaign',
    description: 'Would you be interested in discussing a potential collaboration?',
    deliverables: [],
    timeline: 'Flexible',
    budget: null,
    notes: '',
    status: 'Pending'
  };

  const currentBudget = data.budget ? formatCurrency(data.budget, data.currency) : 'Negotiable';
  const originalBudget = data.originalBudget ? formatCurrency(data.originalBudget, data.currency) : currentBudget;

  let canAct = false;
  if (data.status === "Pending" && isReceiver) {
    canAct = true;
  } else if (data.status === "Counter Offered" && data.negotiationHistory && data.negotiationHistory.length > 0) {
    const lastHistory = data.negotiationHistory[data.negotiationHistory.length - 1];
    if (lastHistory.sender !== currentUserId) {
      canAct = true;
    }
  }

  if (actionState === 'counter') {
    return (
      <CounterOfferModal 
        proposalData={data} 
        partnerName={partnerName} 
        onClose={() => setActionState(null)} 
        onSubmit={(fields) => {
          onCounterOffer(fields);
          setActionState(null);
        }} 
      />
    );
  }

  if (actionState === 'accept') {
    return (
      <AcceptConfirmation 
        proposalData={data}
        onClose={() => setActionState(null)}
        onConfirm={() => {
          onAccept();
          setActionState(null);
        }}
      />
    );
  }

  if (actionState === 'decline') {
    return (
      <DeclineConfirmation 
        onClose={() => setActionState(null)}
        onConfirm={() => {
          onDecline("");
          setActionState(null);
        }}
      />
    );
  }

  return (
    <div className="pw-overlay" onClick={onClose}>
      <div className="pw-container" onClick={e => e.stopPropagation()}>
        <div className="pw-header">
          <h2>Proposal Details</h2>
          <button className="pw-close-btn" onClick={onClose}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="pw-body">
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--pw-text-muted)' }}>Status:</span>
            <span style={{ fontSize: '14px', fontWeight: '700', color: data.status === 'Accepted' ? 'var(--pw-primary)' : (data.status === 'Declined' ? 'var(--pw-danger)' : 'var(--pw-warning)') }}>
              {data.status || 'Pending'}
            </span>
          </div>

          <div>
            <label className="pw-label">Campaign Title</label>
            <p className="pw-value">{data.title || 'Content Campaign'}</p>
          </div>

          <div>
            <label className="pw-label">Description</label>
            <p className="pw-value" style={{ fontWeight: 'normal', fontSize: '14px', lineHeight: '1.6' }}>
              {data.description || 'No description provided.'}
            </p>
          </div>

          <div className="pw-card">
            <label className="pw-label">Deliverables</label>
            <ul style={{ paddingLeft: '20px', margin: '8px 0 0', fontSize: '14px', color: 'var(--pw-text-main)' }}>
              {data.deliverables && data.deliverables.length > 0 ? (
                data.deliverables.map((d, idx) => (
                  <li key={idx} style={{ marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--pw-warning)' }}>{d.quantity}x</strong> {d.name}
                  </li>
                ))
              ) : (
                <li>To Be Discussed</li>
              )}
            </ul>
          </div>

          <div className="pw-row">
            <div className="pw-col pw-card">
              <label className="pw-label">Timeline</label>
              <p className="pw-value">{data.timeline || 'Flexible'}</p>
            </div>
            
            <div className="pw-col pw-card">
              <label className="pw-label">Budget</label>
              <p className="pw-value text-budget-value">{currentBudget}</p>
              {data.originalBudget && data.originalBudget !== data.budget && (
                <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--pw-text-muted)' }}>
                  Original: <span style={{ textDecoration: 'line-through' }}>{originalBudget}</span>
                </p>
              )}
            </div>
          </div>

          {data.notes && (
            <div>
              <label className="pw-label">Additional Notes</label>
              <div className="pw-card" style={{ background: 'rgba(255,255,255,0.03)', fontStyle: 'italic', fontSize: '14px' }}>
                "{data.notes}"
              </div>
            </div>
          )}

          {data.negotiationHistory && data.negotiationHistory.length > 0 && (
            <div style={{ marginTop: '12px', borderTop: '1px solid var(--pw-border)', paddingTop: '16px' }}>
              <label className="pw-label" style={{ color: 'var(--pw-warning)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '12px' }}>Negotiation History</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                {data.negotiationHistory.map((history, idx) => (
                  <div key={idx} className="pw-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--pw-text-muted)' }}>
                        {new Date(history.timestamp).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--pw-text-main)' }}>
                        Offer: <span className="text-budget-value">{formatCurrency(history.budget, data.currency)}</span>
                      </span>
                    </div>
                    {history.message && (
                      <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--pw-text-muted)', fontStyle: 'italic' }}>
                        "{history.message}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pw-footer">
          {canAct ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <button className="pw-btn pw-btn-accept" onClick={() => setActionState('accept')}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Accept Proposal
              </button>
              <button className="pw-btn pw-btn-counter" onClick={() => setActionState('counter')}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Counter Offer
              </button>
              <button className="pw-btn pw-btn-decline" onClick={() => setActionState('decline')}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                Decline Proposal
              </button>
            </div>
          ) : (
            <button className="pw-btn pw-btn-outline" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
