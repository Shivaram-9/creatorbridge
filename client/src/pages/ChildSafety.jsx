import React, { useEffect } from 'react';
import './PrivacyPolicy.css'; // Reusing privacy policy styling for consistency

const ChildSafety = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="privacy-page-container">
      <div className="privacy-content-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left' }}>
        <h1 className="privacy-title" style={{ fontSize: '2rem', marginBottom: '8px', color: 'var(--text-main)' }}>Child Safety Standards</h1>
        <div className="privacy-meta" style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
          <p><strong>Effective Date:</strong> July 2026</p>
        </div>

        <p style={{ lineHeight: '1.6', marginBottom: '24px', color: 'var(--text-main)' }}>
          PACTOGRAM is committed to maintaining a safe environment for all users. We have zero tolerance for
          child sexual abuse and exploitation (CSAE), child sexual abuse material (CSAM), grooming, trafficking, or
          any activity that endangers minors.
        </p>

        <h2 style={{ fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', color: 'var(--text-main)' }}>Our Standards</h2>
        <ul style={{ paddingLeft: '24px', marginBottom: '24px', color: 'var(--text-main)', lineHeight: '1.6', listStyleType: 'disc' }}>
          <li style={{ marginBottom: '8px' }}>Zero tolerance for child sexual abuse and exploitation.</li>
          <li style={{ marginBottom: '8px' }}>Content involving minors in sexual contexts is strictly prohibited.</li>
          <li style={{ marginBottom: '8px' }}>Users can report profiles, messages, posts, portfolios, and campaigns directly within the app.</li>
          <li style={{ marginBottom: '8px' }}>We investigate reports promptly and take appropriate action, including content removal and permanent account suspension.</li>
          <li style={{ marginBottom: '8px' }}>We cooperate with law enforcement where legally required.</li>
        </ul>

        <h2 style={{ fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', color: 'var(--text-main)' }}>Reporting</h2>
        <p style={{ marginBottom: '16px', color: 'var(--text-main)' }}>Users can report:</p>
        <ul style={{ paddingLeft: '24px', marginBottom: '16px', color: 'var(--text-main)', lineHeight: '1.6', listStyleType: 'disc' }}>
          <li style={{ marginBottom: '8px' }}>Profiles</li>
          <li style={{ marginBottom: '8px' }}>Messages</li>
          <li style={{ marginBottom: '8px' }}>Posts</li>
          <li style={{ marginBottom: '8px' }}>Campaigns</li>
          <li style={{ marginBottom: '8px' }}>Media uploads</li>
        </ul>
        <p style={{ marginBottom: '24px', color: 'var(--text-main)' }}>Reports are reviewed by our moderation team.</p>

        <h2 style={{ fontSize: '1.5rem', marginTop: '32px', marginBottom: '16px', color: 'var(--text-main)' }}>Enforcement</h2>
        <p style={{ lineHeight: '1.6', marginBottom: '24px', color: 'var(--text-main)' }}>
          Violations of these standards result in immediate and permanent account suspension. Furthermore, we report instances of CSAE and CSAM to the relevant national authorities and organizations dedicated to child protection, such as the National Center for Missing and Exploited Children (NCMEC), and cooperate fully with law enforcement investigations.
        </p>
      </div>
    </div>
  );
};

export default ChildSafety;
