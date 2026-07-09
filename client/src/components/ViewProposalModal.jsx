import React, { useState, useEffect } from 'react';
import './CollaborationProposalModal.css';

const DELIVERABLE_OPTIONS = [
  "Instagram Reel", "Instagram Story", "Instagram Post",
  "YouTube Video", "YouTube Shorts", "Facebook Post",
  "LinkedIn Post", "X (Twitter) Post", "Product Review",
  "Unboxing", "Event Coverage", "Brand Mention",
  "Giveaway", "Live Session", "Podcast", "Blog Article"
];

const TIMELINE_OPTIONS = [
  { label: "3 Days", value: "3 Days" },
  { label: "7 Days", value: "7 Days" },
  { label: "15 Days", value: "15 Days" },
  { label: "30 Days", value: "30 Days" },
  { label: "Custom", value: "Custom" }
];

export default function ViewProposalModal({ 
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
  const [showCounterForm, setShowCounterForm] = useState(initialShowCounterForm);
  
  const data = proposalData || {
    title: 'Content Campaign',
    description: 'Would you be interested in discussing a potential collaboration?',
    deliverables: [],
    timeline: 'Flexible',
    budget: null,
    notes: '',
    status: 'Pending'
  };

  // State for Counter Offer
  const [counterBudget, setCounterBudget] = useState(data.budget || '');
  const [counterDeliverables, setCounterDeliverables] = useState(data.deliverables || []);
  const [counterTimelineMode, setCounterTimelineMode] = useState(
    (data.timeline && TIMELINE_OPTIONS.some(o => o.value === data.timeline)) 
      ? data.timeline 
      : (data.timeline ? 'Custom' : '15 Days')
  );
  const [counterCustomTimeline, setCounterCustomTimeline] = useState(data.timeline || '');
  const [counterNotes, setCounterNotes] = useState('');

  useEffect(() => {
    if (initialShowCounterForm) setShowCounterForm(true);
  }, [initialShowCounterForm]);

  const toggleDeliverable = (item) => {
    if (counterDeliverables.find((d) => d.name === item)) {
      setCounterDeliverables(counterDeliverables.filter((d) => d.name !== item));
    } else {
      setCounterDeliverables([...counterDeliverables, { name: item, quantity: 1 }]);
    }
  };

  const updateQuantity = (item, qty) => {
    setCounterDeliverables(
      counterDeliverables.map((d) => (d.name === item ? { ...d, quantity: qty } : d))
    );
  };

  const currencySymbol = data.currency === 'INR' ? '₹' : (data.currency === 'USD' ? '$' : '€');
  const currentBudget = data.budget ? `${currencySymbol}${data.budget}` : 'Negotiable';
  const originalBudget = data.originalBudget ? `${currencySymbol}${data.originalBudget}` : currentBudget;

  const handleCounterSubmit = () => {
    if (!counterBudget) return;
    
    let finalTimeline = counterTimelineMode;
    if (counterTimelineMode === 'Custom' && counterCustomTimeline) {
      finalTimeline = counterCustomTimeline;
    }

    onCounterOffer({
      budget: Number(counterBudget),
      deliverables: counterDeliverables,
      timeline: finalTimeline,
      message: counterNotes,
      notes: counterNotes || data.notes
    });
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
      <div className="proposal-modal-content mobile-responsive-modal" onClick={e => e.stopPropagation()}>
        <div className="proposal-modal-header">
          <h2>{showCounterForm ? 'Counter Offer' : 'Collaboration Proposal'}</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="proposal-modal-body" style={{ flexDirection: 'column', padding: '16px', overflowY: 'auto' }}>
          
          {!showCounterForm ? (
            <>
              {/* VIEW PROPOSAL MODE */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>Status:</span>
                <span style={{ fontSize: '14px', fontWeight: '700', color: data.status === 'Accepted' ? '#10b981' : (data.status === 'Declined' ? '#ef4444' : '#f59e0b') }}>
                  {data.status || 'Pending'}
                </span>
              </div>

              <div className="proposal-form-group">
                <label>Campaign Title</label>
                <p style={{ margin: '4px 0', fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                  {data.title || 'Content Campaign'}
                </p>
              </div>

              <div className="proposal-form-group">
                <label>Description</label>
                <p style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
                  {data.description || 'No description provided.'}
                </p>
              </div>

              <div className="proposal-form-group" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <label>Deliverables</label>
                <ul style={{ paddingLeft: '20px', margin: '8px 0 0', fontSize: '14px', color: 'var(--text-main)' }}>
                  {data.deliverables && data.deliverables.length > 0 ? (
                    data.deliverables.map((d, idx) => (
                      <li key={idx} style={{ marginBottom: '6px' }}>
                        <strong style={{ color: '#f59e0b' }}>{d.quantity}x</strong> {d.name}
                      </li>
                    ))
                  ) : (
                    <li>To Be Discussed</li>
                  )}
                </ul>
              </div>

              <div className="proposal-row" style={{ marginTop: '16px' }}>
                <div className="proposal-form-group" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', flex: 1 }}>
                  <label>Timeline</label>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>
                    {data.timeline || 'Flexible'}
                  </p>
                </div>
                
                <div className="proposal-form-group" style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-light)', flex: 1 }}>
                  <label>Budget</label>
                  <p style={{ margin: '4px 0 0', fontSize: '16px', fontWeight: '700', color: '#10b981' }}>
                    {currentBudget}
                  </p>
                  {data.originalBudget && data.originalBudget !== data.budget && (
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                      Original: <span style={{ textDecoration: 'line-through' }}>{originalBudget}</span>
                    </p>
                  )}
                </div>
              </div>

          {data.notes && (
                <div className="proposal-form-group" style={{ marginTop: '16px' }}>
                  <label>Additional Notes</label>
                  <p style={{ margin: '4px 0', fontSize: '14px', lineHeight: '1.5', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px' }}>
                    "{data.notes}"
                  </p>
                </div>
              )}

              {canAct && !showCounterForm && (
                <div style={{ marginTop: '24px', background: 'rgba(245, 158, 11, 0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <svg width="18" height="18" fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <span style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '600' }}>How it works?</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, paddingLeft: '26px' }}>
                    Accept, Counter or Decline this proposal to continue.
                  </p>
                </div>
              )}

              {data.negotiationHistory && data.negotiationHistory.length > 0 && (
                <div className="proposal-form-group" style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
                  <label style={{ color: '#f59e0b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Negotiation History</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                    {data.negotiationHistory.map((history, idx) => (
                      <div key={idx} style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {new Date(history.timestamp).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            Offer: {currencySymbol}{history.budget}
                          </span>
                        </div>
                        {history.message && (
                          <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            "{history.message}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* COUNTER OFFER FORM MODE */}
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0 }}>
                  Adjust the terms below to propose a Counter Offer to {partnerName}.
                </p>
              </div>

              <div className="proposal-form-group">
                <label>Budget ({currencySymbol})</label>
                <input 
                  type="number" 
                  className="proposal-form-input" 
                  placeholder="Enter counter budget" 
                  value={counterBudget}
                  onChange={(e) => setCounterBudget(e.target.value)}
                  style={{ fontSize: '16px', fontWeight: 'bold' }}
                />
              </div>

              <div className="proposal-form-group">
                <label>Timeline</label>
                <select
                  className="proposal-form-input"
                  value={counterTimelineMode}
                  onChange={(e) => setCounterTimelineMode(e.target.value)}
                >
                  {TIMELINE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {counterTimelineMode === "Custom" && (
                  <input 
                    type="text" 
                    className="proposal-form-input" 
                    style={{ marginTop: '8px' }}
                    placeholder="e.g. Oct 10 to Oct 20"
                    value={counterCustomTimeline} 
                    onChange={e => setCounterCustomTimeline(e.target.value)} 
                  />
                )}
              </div>

              <div className="proposal-form-group">
                <label>Deliverables</label>
                <div className="proposal-deliverables-grid">
                  {DELIVERABLE_OPTIONS.map((opt) => {
                    const selected = counterDeliverables.find((d) => d.name === opt);
                    return (
                      <div
                        key={opt}
                        className={`deliverable-chip ${selected ? 'selected' : ''}`}
                        onClick={() => toggleDeliverable(opt)}
                      >
                        {opt}
                        {selected && (
                          <input
                            type="number"
                            className="deliverable-qty-input"
                            min="1"
                            value={selected.quantity}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => updateQuantity(opt, parseInt(e.target.value) || 1)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="proposal-form-group">
                <label>Message / Additional Notes</label>
                <textarea 
                  className="proposal-form-input" 
                  placeholder="Explain your counter offer..." 
                  rows="3"
                  value={counterNotes}
                  onChange={(e) => setCounterNotes(e.target.value)}
                ></textarea>
              </div>
            </>
          )}
        </div>

        <div className="proposal-modal-footer" style={{ flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--bg-card)' }}>
          {canAct && !showCounterForm ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
              <button onClick={onAccept} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', background: '#28C76F', color: '#fff', border: 'none', padding: '14px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                Accept Proposal
              </button>
              <button onClick={() => setShowCounterForm(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', border: '1px solid #FF9F1C', color: '#FF9F1C', padding: '14px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', background: 'transparent', fontSize: '15px' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Counter Offer
              </button>
              <button onClick={() => onDecline("")} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', background: '#EA5455', color: '#fff', border: 'none', padding: '14px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '15px' }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                Decline Proposal
              </button>
            </div>
          ) : showCounterForm ? (
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button className="btn btn-outline" onClick={() => setShowCounterForm(false)} style={{ flex: 1, color: 'var(--text-muted)', border: '1px solid var(--border-light)', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', background: 'transparent' }}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCounterSubmit} disabled={!counterBudget} style={{ flex: 2, background: '#f59e0b', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', opacity: !counterBudget ? 0.6 : 1 }}>
                Send Counter Offer
              </button>
            </div>
          ) : (
            <button className="btn btn-outline" onClick={onClose} style={{ width: '100%', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', background: 'var(--bg-secondary)', color: 'var(--text-main)', border: '1px solid var(--border-light)' }}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
