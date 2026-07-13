import React, { useState } from 'react';
import { X, CheckCircle, Briefcase, Send } from 'lucide-react';
import { CameraIcon } from './Icons.jsx';
import './ApplyCampaignModal.css';

export default function ApplyCampaignModal({ campaign, onClose, onSubmit, user }) {
  const [expectedPayment, setExpectedPayment] = useState(campaign?.budget ? campaign.budget.replace(/[^0-9]/g, '') : '');
  const [deliveryTime, setDeliveryTime] = useState('5 Days');
  const [message, setMessage] = useState('');
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!expectedPayment || !deliveryTime || !agreed) return;
    
    // Simulate API call and pass to parent
    if (onSubmit) {
      onSubmit({
        campaignId: campaign.id || campaign._id,
        expectedPayment,
        deliveryTime,
        message
      });
    }
  };

  return (
    <div className="global-modal-overlay">
      <div className="apply-modal-content">
        <div className="apply-modal-header">
          <h2>Apply to Campaign</h2>
          <button className="apply-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="apply-modal-campaign-info">
          <div className="apply-modal-campaign-logo">
            {campaign?.logo || 'N'}
          </div>
          <div className="apply-modal-campaign-details">
            <div className="apply-modal-brand-name">
              {campaign?.name || 'Nike'} <CheckCircle size={14} className="verified-badge-icon text-blue-500 ml-1" />
            </div>
            <div className="apply-modal-campaign-title">
              {campaign?.title || 'Instagram Reel for Nike'}
            </div>
            <div className="apply-modal-campaign-budget">
              {campaign?.budget || '₹40,000 Budget'}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="apply-modal-form">
          <div className="apply-form-group">
            <label>Expected Payment <span className="required">*</span></label>
            <div className="input-with-prefix">
              <span className="input-prefix">₹</span>
              <input 
                type="text" 
                placeholder="e.g. 5,000"
                value={expectedPayment}
                onChange={(e) => setExpectedPayment(e.target.value)}
                required
              />
            </div>
            <span className="input-helper">Enter the amount you expect for this collaboration.</span>
          </div>

          <div className="apply-form-group">
            <label>Delivery Time <span className="required">*</span></label>
            <div className="select-wrapper">
              <select 
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                required
              >
                <option value="2 Days">2 Days</option>
                <option value="3 Days">3 Days</option>
                <option value="5 Days">5 Days</option>
                <option value="7 Days">7 Days</option>
                <option value="10+ Days">10+ Days</option>
              </select>
            </div>
            <span className="input-helper">Select the time you need to deliver the content.</span>
          </div>

          <div className="apply-form-group">
            <label>Message <span className="optional">(Optional)</span></label>
            <textarea 
              placeholder="I'm a fitness content creator with high engagement and would love to collaborate with Nike."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={250}
              rows={3}
            ></textarea>
            <div className="textarea-footer">
              <span className="input-helper">You can tell the brand why you're a good fit.</span>
              <span className="char-count">{message.length}/250</span>
            </div>
          </div>

          <div className="apply-auto-attachments">
            <div className="auto-attachment-item">
              <div className="attachment-icon-wrapper portfolio-icon">
                <Briefcase size={18} />
              </div>
              <div className="attachment-details">
                <div className="attachment-title">Your Portfolio</div>
                <div className="attachment-desc">Your PACTOGRAM portfolio will be shared with the brand.</div>
              </div>
              <div className="attachment-status">
                <CheckCircle size={14} /> Attached
              </div>
            </div>

            <div className="auto-attachment-item">
              <div className="attachment-icon-wrapper social-icon">
                <CameraIcon />
              </div>
              <div className="attachment-details">
                <div className="attachment-title">Connected Account</div>
                <div className="attachment-desc-bold">Instagram</div>
                <div className="attachment-desc">@{user?.username || 'sai_balaji'}</div>
              </div>
              <div className="attachment-status-neutral">
                120K Followers
              </div>
            </div>
          </div>

          <div className="apply-terms-checkbox">
            <label className="checkbox-container">
              <input 
                type="checkbox" 
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />
              <span className="checkmark"></span>
              <span className="checkbox-text">I agree to deliver the content as discussed if selected.</span>
            </label>
          </div>

          <div className="apply-modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={!agreed || !expectedPayment}>
              Apply Now <Send size={16} />
            </button>
          </div>

          <div className="apply-modal-footer-note">
            <CheckCircle size={12} /> Your information is safe and secure with us.
          </div>
        </form>
      </div>
    </div>
  );
}
