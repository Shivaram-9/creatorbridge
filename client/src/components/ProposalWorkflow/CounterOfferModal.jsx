import React, { useState } from 'react';
import './ProposalWorkflow.css';

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

export default function CounterOfferModal({ proposalData, partnerName, onClose, onSubmit }) {
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
    <div className="pw-overlay" onClick={onClose}>
      <div className="pw-container" onClick={e => e.stopPropagation()}>
        <div className="pw-header">
          <h2>Counter Offer</h2>
          <button className="pw-close-btn" onClick={onClose}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="pw-body">
          <div className="pw-card" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--pw-text-main)' }}>
              Adjust the terms below to propose a Counter Offer to {partnerName}.
            </p>
          </div>

          <div>
            <label className="pw-label">Budget ({currencySymbol})</label>
            <input 
              type="number" 
              className="pw-input" 
              placeholder="Enter counter budget" 
              value={counterBudget}
              onChange={(e) => setCounterBudget(e.target.value)}
              style={{ fontWeight: 'bold' }}
            />
          </div>

          <div>
            <label className="pw-label">Timeline</label>
            <select
              className="pw-input"
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
                className="pw-input" 
                style={{ marginTop: '8px' }}
                placeholder="e.g. Oct 10 to Oct 20"
                value={counterCustomTimeline} 
                onChange={e => setCounterCustomTimeline(e.target.value)} 
              />
            )}
          </div>

          <div>
            <label className="pw-label">Deliverables</label>
            <div className="pw-deliverables-grid">
              {DELIVERABLE_OPTIONS.map((opt) => {
                const selected = counterDeliverables.find((d) => d.name === opt);
                return (
                  <div
                    key={opt}
                    className={`pw-chip ${selected ? 'selected' : ''}`}
                    onClick={() => toggleDeliverable(opt)}
                  >
                    {opt}
                    {selected && (
                      <input
                        type="number"
                        className="pw-chip-input"
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

          <div>
            <label className="pw-label">Message / Additional Notes</label>
            <textarea 
              className="pw-input" 
              placeholder="Explain your counter offer..." 
              rows="3"
              value={counterNotes}
              onChange={(e) => setCounterNotes(e.target.value)}
            ></textarea>
          </div>
        </div>

        <div className="pw-footer">
          <div className="pw-footer-row">
            <button className="pw-btn pw-btn-outline" onClick={onClose}>Cancel</button>
            <button 
              className="pw-btn pw-btn-counter" 
              onClick={handleCounterSubmit} 
              disabled={!counterBudget}
              style={{ background: 'var(--pw-warning)', color: '#fff', opacity: !counterBudget ? 0.6 : 1 }}
            >
              Submit Counter Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
