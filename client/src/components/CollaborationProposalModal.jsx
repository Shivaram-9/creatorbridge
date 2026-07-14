import React, { useState } from 'react';
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

export default function CollaborationProposalModal({ onClose, onSend, partnerName }) {
  const [title, setTitle] = useState("Content Campaign");
  const [description, setDescription] = useState("");
  const [deliverables, setDeliverables] = useState([]);
  const [timelineMode, setTimelineMode] = useState("15 Days");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState("INR");
  const [budgetType, setBudgetType] = useState("Fixed");
  const [notes, setNotes] = useState("");

  const toggleDeliverable = (item) => {
    if (deliverables.find((d) => d.name === item)) {
      setDeliverables(deliverables.filter((d) => d.name !== item));
    } else {
      setDeliverables([...deliverables, { name: item, quantity: 1 }]);
    }
  };

  const updateQuantity = (item, qty) => {
    setDeliverables(
      deliverables.map((d) => (d.name === item ? { ...d, quantity: qty } : d))
    );
  };

  const handleSend = () => {
    if (!title || deliverables.length === 0 || !budgetAmount) {
      alert("Please fill in title, deliverables, and budget.");
      return;
    }

    let timeline = timelineMode;
    if (timelineMode === "Custom" && customStartDate && customEndDate) {
      timeline = `${customStartDate} to ${customEndDate}`;
    }

    const proposalData = {
      isProposal: true,
      title,
      description,
      deliverables,
      timeline,
      budget: budgetAmount,
      currency: budgetCurrency,
      budgetType,
      notes,
      status: "Pending"
    };

    onSend(proposalData);
  };

  return (
    <div className="proposal-modal-overlay global-modal-overlay">
      <div className="proposal-modal-content global-modal-dialog">
        <div className="proposal-modal-header global-modal-header">
          <h2>Create Collaboration Proposal</h2>
          <button className="proposal-close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="proposal-modal-body global-modal-body">
          {/* FORM SECTION */}
          <div className="proposal-form-section">
            <div className="proposal-form-group">
              <label>Campaign Title</label>
              <input
                className="proposal-form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Summer Reel Campaign"
              />
            </div>

            <div className="proposal-form-group">
              <label>Deliverables</label>
              <div className="proposal-deliverables-grid">
                {DELIVERABLE_OPTIONS.map((opt) => {
                  const selected = deliverables.find((d) => d.name === opt);
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

            <div className="proposal-row">
              <div className="proposal-form-group">
                <label>Timeline</label>
                <select
                  className="proposal-form-input"
                  value={timelineMode}
                  onChange={(e) => setTimelineMode(e.target.value)}
                >
                  {TIMELINE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                {timelineMode === "Custom" && (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input type="date" className="proposal-form-input" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)} />
                    <input type="date" className="proposal-form-input" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)} />
                  </div>
                )}
              </div>

              <div className="proposal-form-group">
                <label>Budget Type</label>
                <div className="proposal-radio-group" style={{ marginTop: '10px' }}>
                  <label className="proposal-radio-label">
                    <input type="radio" checked={budgetType === 'Fixed'} onChange={() => setBudgetType('Fixed')} /> Fixed
                  </label>
                  <label className="proposal-radio-label">
                    <input type="radio" checked={budgetType === 'Negotiable'} onChange={() => setBudgetType('Negotiable')} /> Negotiable
                  </label>
                </div>
              </div>
            </div>

            <div className="proposal-row">
              <div className="proposal-form-group" style={{ flex: 2 }}>
                <label>Budget Amount</label>
                <input
                  type="number"
                  className="proposal-form-input"
                  value={budgetAmount}
                  onChange={(e) => setBudgetAmount(e.target.value)}
                  placeholder="e.g. 15000"
                />
              </div>
              <div className="proposal-form-group" style={{ flex: 1 }}>
                <label>Currency</label>
                <select
                  className="proposal-form-input"
                  value={budgetCurrency}
                  onChange={(e) => setBudgetCurrency(e.target.value)}
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>
            </div>

            <div className="proposal-form-group">
              <label>Additional Notes (Optional)</label>
              <textarea
                className="proposal-form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any extra instructions or requirements..."
                rows="3"
              />
            </div>
          </div>

          {/* PREVIEW SECTION */}
          <div className="proposal-preview-section">
            <h3 style={{ color: 'var(--text-muted)', marginBottom: '20px', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Preview</h3>
            
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              width: '100%',
              maxWidth: '350px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ background: '#f59e0b', padding: '6px', borderRadius: '6px', display: 'flex' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                      <polyline points="14 2 14 8 20 8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Collaboration Proposal
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontWeight: '600', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.2)', padding: '2px 8px', borderRadius: '12px' }}>
                  Pending
                </span>
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 16px 0' }}>
                {title || 'Campaign Title'}
              </h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderTop: '1px solid rgba(245, 158, 11, 0.2)', paddingTop: '16px' }}>
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0', fontWeight: '500' }}>Deliverables</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, fontWeight: '600' }}>
                    {deliverables.length > 0 
                      ? deliverables.slice(0,2).map(d => `${d.quantity} ${d.name.split(' ')[1] || d.name}`).join(' + ') + (deliverables.length > 2 ? '...' : '')
                      : 'None selected'
                    }
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0', fontWeight: '500' }}>Timeline</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, fontWeight: '600' }}>
                    {timelineMode === 'Custom' ? 'Custom Date' : timelineMode}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 4px 0', fontWeight: '500' }}>Budget</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-main)', margin: 0, fontWeight: '600' }}>
                    <span className="text-budget-value">
                      {budgetAmount ? `${budgetCurrency === 'INR' ? '₹' : (budgetCurrency === 'USD' ? '$' : '€')}${budgetAmount}` : '---'}
                    </span>
                  </p>
                </div>
              </div>

              <button style={{ width: '100%', background: '#f59e0b', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
                View Proposal
              </button>
            </div>
          </div>
        </div>

        <div className="proposal-modal-footer global-modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSend}>Send Proposal</button>
        </div>
      </div>
    </div>
  );
}
