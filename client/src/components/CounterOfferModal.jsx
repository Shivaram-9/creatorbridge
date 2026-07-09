import React, { useState } from 'react';

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

export default function CounterOfferModal({ 
  proposalData, 
  partnerName, 
  onClose, 
  onSubmit 
}) {
  const data = proposalData || {};

  const [counterBudget, setCounterBudget] = useState(data.budget || '');
  const [counterDeliverables, setCounterDeliverables] = useState(data.deliverables || []);
  const [counterTimelineMode, setCounterTimelineMode] = useState(
    (data.timeline && TIMELINE_OPTIONS.some(o => o.value === data.timeline)) 
      ? data.timeline 
      : (data.timeline ? 'Custom' : '15 Days')
  );
  const [counterCustomTimeline, setCounterCustomTimeline] = useState(data.timeline || '');
  const [counterNotes, setCounterNotes] = useState('');

  const currencySymbol = data.currency === 'INR' ? '₹' : (data.currency === 'USD' ? '$' : '€');

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

  const handleCounterSubmit = () => {
    if (!counterBudget) return;
    
    let finalTimeline = counterTimelineMode;
    if (counterTimelineMode === 'Custom' && counterCustomTimeline) {
      finalTimeline = counterCustomTimeline;
    }

    onSubmit({
      budget: Number(counterBudget),
      deliverables: counterDeliverables,
      timeline: finalTimeline,
      message: counterNotes,
      notes: counterNotes || data.notes
    });
  };

  return (
    <div className="proposal-modal-overlay global-modal-overlay" onClick={onClose}>
      <div className="proposal-modal-content mobile-responsive-modal global-modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="proposal-modal-header global-modal-header">
          <h2>Counter Offer</h2>
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="proposal-modal-body global-modal-body" style={{ flexDirection: 'column', padding: '16px', overflowY: 'auto' }}>
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
        </div>

        <div className="proposal-modal-footer global-modal-footer" style={{ flexDirection: 'column', gap: '12px', padding: '16px', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
            <button className="btn btn-outline" onClick={onClose} style={{ flex: 1, color: 'var(--text-muted)', border: '1px solid var(--border-light)', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', background: 'transparent' }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCounterSubmit} disabled={!counterBudget} style={{ flex: 2, background: '#f59e0b', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', opacity: !counterBudget ? 0.6 : 1 }}>
              Send Counter Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
