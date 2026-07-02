import React, { useEffect } from 'react';
import PrivacyPolicyContent from '../components/PrivacyPolicyContent.jsx';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="privacy-page-container">

      <div className="privacy-content-card">
        <h1 className="privacy-title">Privacy Policy for Pactogram</h1>
        <div className="privacy-meta">
          <p><strong>Effective Date:</strong> July 01, 2026</p>
          <p><strong>Company:</strong> Auraon Technologies & Software Solutions</p>
        </div>

        <hr className="privacy-divider" />

        <PrivacyPolicyContent />
      </div>
    </div>
  );
};

export default PrivacyPolicy;
