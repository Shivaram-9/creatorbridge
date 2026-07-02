import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';
import ErrorBanner from '../components/ErrorBanner.jsx';
import PrivacyPolicyContent from '../components/PrivacyPolicyContent.jsx';
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

        <PrivacyPolicyContent />

        {isOnboarding && (
          <div className="privacy-onboarding-action" style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #f1f5f9', textAlign: 'center' }}>
            <p style={{ marginBottom: '15px', color: '#64748b' }}>
              By clicking "I Agree", you acknowledge that you have read and accepted the Terms and Privacy Policy.
            </p>
            <button 
              className="privacy-agree-btn" 
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
