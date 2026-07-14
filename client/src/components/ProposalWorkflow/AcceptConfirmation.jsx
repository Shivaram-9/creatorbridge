import React from 'react';
import { formatCurrency } from "../../utils/formatters";
import './ProposalWorkflow.css';

export default function AcceptConfirmation({ proposalData, onClose, onConfirm }) {
  const data = proposalData || {};
  const currencySymbol = data.currency === 'INR' ? '₹' : (data.currency === 'USD' ? '$' : '€');
  const budget = data.budget ? `${currencySymbol}${data.budget}` : 'Negotiable';
  const deliverables = Array.isArray(data.deliverables) ? data.deliverables : (data.deliverables ? [data.deliverables] : ['1x Instagram Reel', '1x Instagram Story', '1x Instagram Post']);

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
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--pw-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="32" height="32" fill="none" stroke="#fff" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
            </div>
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: 'var(--pw-text-main)' }}>Accept this proposal?</h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--pw-text-muted)' }}>
            You are about to accept this collaboration proposal.
          </p>

          <div className="pw-card" style={{ textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--pw-border)', paddingBottom: '12px' }}>
              <span className="pw-label" style={{ marginBottom: 0 }}>Campaign</span>
              <span className="pw-value" style={{ fontWeight: '400' }}>{data.title || 'Content Campaign'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid var(--pw-border)', paddingBottom: '12px' }}>
              <span className="pw-label" style={{ marginBottom: 0 }}>Budget</span>
              <span className="pw-value text-budget-value">{formatCurrency(budget)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <span className="pw-label" style={{ marginBottom: 0 }}>Timeline</span>
              <span className="pw-value" style={{ fontWeight: '400' }}>{data.timeline || '3 Days'}</span>
            </div>
            
            <div>
              <span className="pw-label">Deliverables</span>
              <ul className="pw-list">
                {deliverables.map((item, i) => (
                  <li key={i}>{typeof item === 'string' ? item : `${item.qty || 1}x ${item.type || 'Deliverable'}`}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pw-warning-box" style={{ textAlign: 'left' }}>
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span style={{ lineHeight: '1.4' }}>Once accepted, both you and the brand can start working together.</span>
          </div>
        </div>

        <div className="pw-footer">
          <div className="pw-footer-row">
            <button className="pw-btn pw-btn-outline" onClick={onClose}>Cancel</button>
            <button className="pw-btn pw-btn-accept" onClick={onConfirm}>Yes, Accept</button>
          </div>
        </div>
      </div>
    </div>
  );
}
