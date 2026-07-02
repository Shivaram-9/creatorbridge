import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  
  const isOnboarding = searchParams.get('onboarding') === 'true';
  const roleToSet = searchParams.get('role');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="privacy-page-container">
      {error && <div style={{ marginBottom: '20px' }}><ErrorBanner message={error} onDismiss={() => setError('')} /></div>}
      <div className="privacy-content-card">
        <h1 className="privacy-title">Privacy Policy for Pactogram</h1>
        <div className="privacy-meta">
          <p><strong>Effective Date:</strong> July 01, 2026</p>
          <p><strong>Company:</strong> Auraon Technologies & Software Solutions</p>
        </div>

        <hr className="privacy-divider" />

        <section className="privacy-section">
          <h2>1. Introduction</h2>
          <p>
            Auraon Technologies & Software Solutions ("we," "our," or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Pactogram mobile application and website (collectively, the "Platform"). Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
          </p>
        </section>

        <section className="privacy-section">
          <h2>2. Information We Collect</h2>
          <p>We collect information that identifies, relates to, describes, or is reasonably capable of being associated with you ("Personal Data"). The types of data we collect include:</p>
          
          <h3>A. Personal Data You Provide to Us</h3>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, phone number, password, and profile picture.</li>
            <li><strong>Professional Information:</strong> Social media handles, follower metrics, brand affiliations, portfolio content, and collaboration history.</li>
            <li><strong>Financial Data:</strong> Payment processing information required for subscription tiers (e.g., Premium Verification). <em>Note: Payment data is processed securely via third-party gateways; we do not store full credit card numbers on our servers.</em></li>
          </ul>

          <h3>B. Data Collected Automatically</h3>
          <ul>
            <li><strong>Device Information:</strong> Operating system, device ID, browser type, and IP address.</li>
            <li><strong>Usage Data:</strong> Pages viewed, interactions with other users, features utilized, and session durations.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>3. How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Facilitate the creation of and secure your Pactogram account.</li>
            <li>Match influencers with appropriate brand collaboration opportunities.</li>
            <li>Process premium subscription payments and deliver verified badges.</li>
            <li>Monitor and analyze usage and trends to improve user experience.</li>
            <li>Send administrative notices, security alerts, and platform updates.</li>
            <li>Prevent fraudulent transactions, monitor against theft, and protect against criminal activity.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>4. Disclosure of Your Information</h2>
          <p>We may share information we have collected about you in certain situations:</p>
          <ul>
            <li><strong>With Other Users:</strong> When you interact on the platform, your public profile (name, category, portfolio, follower stats) is visible to other influencers and brands to facilitate collaborations.</li>
            <li><strong>Third-Party Service Providers:</strong> We may share your information with third parties that perform services for us or on our behalf, including payment processing, data analysis, email delivery, and hosting services.</li>
            <li><strong>Legal Obligations:</strong> If we believe the release of information about you is necessary to respond to legal process or to investigate potential violations of our policies.</li>
          </ul>
        </section>

        <section className="privacy-section">
          <h2>5. Security of Your Information</h2>
          <p>
            We use administrative, technical, and physical security measures to help protect your personal information. While we have taken reasonable steps to secure the personal information you provide to us (such as data encryption via HTTPS and secure database clusters), please be aware that despite our efforts, no security measures are perfect or impenetrable.
          </p>
        </section>

        <section className="privacy-section">
          <h2>6. Data Retention</h2>
          <p>
            We will only retain your personal information for as long as it is necessary for the purposes set out in this Privacy Policy, unless a longer retention period is required or permitted by law.
          </p>
        </section>

        <section className="privacy-section">
          <h2>7. Your Privacy Rights</h2>
          <p>Depending on your location, you may have the right to:</p>
          <ul>
            <li>Request access to your personal data.</li>
            <li>Request correction of incomplete or inaccurate data.</li>
            <li>Request deletion of your personal data ("Right to be Forgotten").</li>
            <li>Object to processing of your personal data.</li>
          </ul>
          <p><em>To exercise any of these rights, please contact us using the information provided below.</em></p>
        </section>

        <section className="privacy-section">
          <h2>8. Third-Party Websites and Services</h2>
          <p>
            The Pactogram application may contain links to third-party websites and applications of interest, including partner brands and social media platforms. We are not responsible for the privacy and security practices of any third-party websites or services.
          </p>
        </section>

        <section className="privacy-section">
          <h2>9. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Effective Date" of this Privacy Policy and, where appropriate, sending a notification within the app.
          </p>
        </section>

        <section className="privacy-section contact-section">
          <h2>10. Contact Us</h2>
          <p>If you have questions or comments about this Privacy Policy, please contact us at:</p>
          <div className="contact-details">
            <strong>Auraon Technologies & Software Solutions</strong><br />
            Email: auraon.software@gmail.com<br />
            Phone: 9963058111<br />
            Website: https://www.auraontechnologies.com/
          </div>
        </section>

        {isOnboarding && (
          <div className="privacy-onboarding-action" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #f1f5f9', textAlign: 'center' }}>
            <p style={{ marginBottom: '15px', color: '#64748b' }}>
              By clicking "I Agree", you acknowledge that you have read and accepted the Terms and Privacy Policy.
            </p>
            <button 
              className="btn btn-primary btn-block" 
              style={{ maxWidth: '300px', margin: '0 auto', fontSize: '18px', padding: '15px' }}
              onClick={async () => {
                if (!roleToSet) return;
                setSaving(true);
                setError('');
                try {
                  const updated = await api.users.updateMe({ role: roleToSet });
                  if (updated?.error) {
                    setError(typeof updated.error === 'string' ? updated.error : 'Something went wrong');
                  } else {
                    setUser(updated);
                    if (roleToSet === 'brand') navigate('/onboarding');
                    else navigate('/home', { replace: true });
                  }
                } catch {
                  setError('Failed to complete setup');
                } finally {
                  setSaving(false);
                }
              }}
              disabled={saving}
            >
              {saving ? 'Processing...' : 'I Agree & Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyPolicy;
