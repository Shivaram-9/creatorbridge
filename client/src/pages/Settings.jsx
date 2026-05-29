import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api, getToken } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { BASE_URL } from "../config/api.js";
import "./Settings.css";
import { ShieldIcon, LockIcon, BadgeCheckIcon, BellIcon, ProfileIcon } from "../components/Icons.jsx";

export default function Settings() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("privacy");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Security options states
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showOtpForm, setShowOtpForm] = useState(false);
  const [otp, setOtp] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSuccess, setOtpSuccess] = useState("");

  const [settings, setSettings] = useState({
    allowMessagesFrom: "everyone",
    showActivityStatus: true,
    isDiscoverable: true,
    notifSettings: {
      likes: true,
      comments: true,
      follows: true,
      messages: true,
      campaigns: true
    }
  });

  const [sessions, setSessions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loadingBlocked, setLoadingBlocked] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [priv, sess, alrt, blocked] = await Promise.allSettled([
          api.privacy.getSettings(),
          api.security.getSessions(),
          api.security.getAlerts(),
          api.moderation.getBlocked()
        ]);
        
        if (!mounted) return;

        if (priv.status === 'fulfilled' && priv.value && !priv.value.error) {
          setSettings(prev => ({ 
            ...prev, 
            ...priv.value,
            notifSettings: { ...prev.notifSettings, ...(priv.value.notifSettings || {}) }
          }));
        }
        if (sess.status === 'fulfilled' && Array.isArray(sess.value)) {
          setSessions(sess.value);
        }
        if (alrt.status === 'fulfilled' && Array.isArray(alrt.value)) {
          setAlerts(alrt.value);
        }
        if (blocked.status === 'fulfilled' && Array.isArray(blocked.value)) {
          setBlockedUsers(blocked.value);
        }
      } catch (err) {
        console.error("Settings load error:", err);
        setError("Failed to load some settings");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, []);

  const handleUpdate = async (updates) => {
    try {
      const res = await api.privacy.updateSettings(updates);
      if (res.error) setError(res.error);
      else {
        setSettings(prev => ({ 
          ...prev, 
          ...res,
          notifSettings: { ...prev.notifSettings, ...(res.notifSettings || {}) }
        }));
        setSuccess("Settings updated successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Failed to update settings");
    }
  };

  const handleToggle = (key) => {
    const newVal = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newVal }));
    handleUpdate({ [key]: newVal });
  };

  const handleNotifToggle = (key) => {
    if (!settings.notifSettings) return;
    const newNotifs = { ...settings.notifSettings, [key]: !settings.notifSettings[key] };
    setSettings(prev => ({ ...prev, notifSettings: newNotifs }));
    handleUpdate({ notifSettings: newNotifs });
  };

  const revokeSession = async (id) => {
    try {
      await api.security.revokeSession(id);
      setSessions(prev => prev.filter(s => s._id !== id));
    } catch {
      setError("Failed to revoke session");
    }
  };

  const logoutOthers = async () => {
    try {
      await api.security.logoutOthers();
      const currentToken = getToken();
      setSessions(prev => prev.filter(s => s.token === currentToken));
      setSuccess("Logged out from all other devices");
    } catch {
      setError("Failed to logout from others");
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await api.moderation.unblock(userId);
      setBlockedUsers(prev => prev.filter(u => u._id !== userId));
      setSuccess("User unblocked successfully");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to unblock user");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    setActionLoading(true);
    setPasswordError("");
    setPasswordSuccess("");
    try {
      const res = await api.users.changePassword(currentPassword, newPassword);
      if (res.error) {
        setPasswordError(res.error);
      } else {
        setPasswordSuccess("Password updated successfully!");
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setTimeout(() => setPasswordSuccess(""), 4000);
      }
    } catch (err) {
      setPasswordError("Failed to change password");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!user?.email) return;
    setActionLoading(true);
    setOtpError("");
    setOtpSuccess("");
    try {
      const res = await api.auth.sendOtp(user.email);
      if (res.error) {
        setOtpError(res.error);
      } else {
        setShowOtpForm(true);
        setOtpSuccess(res.message || "Verification code sent to your email!");
        setTimeout(() => setOtpSuccess(""), res.code ? 15000 : 5000);
      }
    } catch (err) {
      setOtpError("Failed to send verification code");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setActionLoading(true);
    setOtpError("");
    setOtpSuccess("");
    try {
      const res = await api.auth.verifyOtp(user.email, otp);
      if (res.error) {
        setOtpError(res.error);
      } else {
        setOtpSuccess("Email verified successfully!");
        setShowOtpForm(false);
        setOtp("");
        if (refreshUser) await refreshUser();
        setTimeout(() => setOtpSuccess(""), 5000);
      }
    } catch (err) {
      setOtpError("Failed to verify code");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="settings-page container slide-in">
      <style>{`
        @media (max-width: 900px) {
          .settings-page { width: 100% !important; max-width: 100vw !important; overflow-x: hidden !important; box-sizing: border-box !important; padding: 0 !important; }
          .settings-layout { width: 100% !important; max-width: 100vw !important; box-sizing: border-box !important; }
          .settings-content { width: 100% !important; max-width: 100vw !important; padding: 20px 16px !important; box-sizing: border-box !important; overflow-x: hidden !important; margin: 0 !important; }
          .setting-item { display: flex !important; width: 100% !important; gap: 16px !important; box-sizing: border-box !important; justify-content: space-between !important; }
          .setting-item.vertical { flex-direction: column !important; align-items: flex-start !important; }
          .setting-info { flex: 1 1 auto !important; min-width: 0 !important; padding-right: 8px !important; }
          .setting-info p, .setting-info h4 { word-wrap: break-word !important; white-space: normal !important; overflow-wrap: break-word !important; }
          .settings-sidebar { width: 100% !important; box-sizing: border-box !important; padding: 16px 0 !important; }
          .settings-sidebar h2 { padding: 0 16px !important; }
          .settings-sidebar nav { display: flex !important; flex-direction: row !important; overflow-x: auto !important; width: 100% !important; box-sizing: border-box !important; flex-wrap: nowrap !important; padding: 4px 16px 12px !important; gap: 8px !important; -webkit-overflow-scrolling: touch !important; }
          .settings-sidebar nav::-webkit-scrollbar { display: none !important; }
          .settings-sidebar nav button { flex-shrink: 0 !important; white-space: nowrap !important; display: block !important; width: auto !important; }
          .settings-section .input, .settings-select { width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
          .toggle { flex-shrink: 0 !important; display: block !important; }
        }
      `}</style>
      <div className="settings-layout">
        <aside className="settings-sidebar">
          <h2>Settings</h2>
          <nav>
            <button className={activeTab === 'privacy' ? 'active' : ''} onClick={() => setActiveTab('privacy')}>
              Privacy
            </button>
            <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>
              Security & Sessions
            </button>
            <button className={activeTab === 'verification' ? 'active' : ''} onClick={() => setActiveTab('verification')}>
              Verification
            </button>
            <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>
              Notifications
            </button>
            <button className={activeTab === 'account' ? 'active' : ''} onClick={() => setActiveTab('account')}>
              Account Details
            </button>
          </nav>
        </aside>

        <main className="settings-content">
          <ErrorBanner message={error} onDismiss={() => setError("")} />
          {success && <div className="success-banner">{success}</div>}

          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h3>Privacy Settings</h3>
              <div className="settings-list">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Show Activity Status</h4>
                    <p>Allow accounts you follow and anyone you message to see when you were last active or are currently online.</p>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={!!settings.showActivityStatus} onChange={() => handleToggle('showActivityStatus')} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Profile Discoverability</h4>
                    <p>Allow your profile to be recommended to others in the Discover section.</p>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={!!settings.isDiscoverable} onChange={() => handleToggle('isDiscoverable')} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item vertical">
                  <div className="setting-info">
                    <h4>Direct Messaging</h4>
                    <p>Control who can start new conversations with you.</p>
                  </div>
                  <select 
                    value={settings.allowMessagesFrom || "everyone"} 
                    onChange={(e) => handleUpdate({ allowMessagesFrom: e.target.value })}
                    className="settings-select"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="following">People I Follow</option>
                    <option value="none">No one</option>
                  </select>
                </div>
              </div>

              <div className="blocked-users-section">
                <h4>Blocked Users</h4>
                <p className="subtitle">Manage the users you have blocked.</p>
                {blockedUsers.length > 0 ? (
                  <div className="blocked-list">
                    {blockedUsers.map(u => (
                      <div key={u._id} className="blocked-item">
                        <div className="blocked-user-info">
                          <img 
                            src={u.avatar?.startsWith('http') ? u.avatar : (u.avatar ? `${BASE_URL}${u.avatar}` : '/default-avatar.png')} 
                            alt={u.username} 
                            className="blocked-avatar" 
                          />
                          <div>
                            <p className="blocked-name">{u.name || u.username}</p>
                            <p className="blocked-username">@{u.username}</p>
                          </div>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => handleUnblock(u._id)}>
                          Unblock
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-text">You haven't blocked any users yet.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section">
              <h3>Security & Sessions</h3>
              
              <div className="sessions-list">
                <div className="section-header">
                  <h4>Active Sessions</h4>
                  <button className="btn-text danger" onClick={logoutOthers}>Logout from all other devices</button>
                </div>
                {Array.isArray(sessions) && sessions.map(sess => (
                  <div key={sess._id || Math.random()} className="session-item">
                    <div className="session-icon">
                      {sess.device?.type === 'mobile' ? '📱' : '💻'}
                    </div>
                    <div className="session-info">
                      <p className="device-name">
                        {sess.device?.os || 'Unknown OS'} • {sess.device?.browser || 'Unknown Browser'}
                      </p>
                      <p className="session-meta">
                        {sess.device?.ip || 'Unknown IP'} • Last active {sess.lastUsed ? new Date(sess.lastUsed).toLocaleString() : 'Recently'}
                      </p>
                      {sess.token === getToken() && <span className="current-badge">This device</span>}
                    </div>
                    {sess.token !== getToken() && (
                      <button className="btn-text danger" onClick={() => revokeSession(sess._id)}>Revoke</button>
                    )}
                  </div>
                ))}
                {(!sessions || sessions.length === 0) && <p className="empty-text">No active sessions found.</p>}
              </div>

              <div className="alerts-list">
                <h4>Security Alerts</h4>
                {!Array.isArray(alerts) || alerts.length === 0 ? (
                  <p className="empty-text">No recent security alerts.</p>
                ) : (
                  alerts.map(alert => (
                    <div key={alert._id || Math.random()} className={`alert-item ${alert.isRead ? '' : 'unread'}`}>
                      <div className="alert-content">
                        <p className="alert-msg">{alert.message || "Security update"}</p>
                        <p className="alert-date">{alert.createdAt ? new Date(alert.createdAt).toLocaleString() : 'Just now'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="settings-section verification-section">
              <div className="verification-content-wrapper">
                <div className="verification-info-col">
                  <h3 className="verification-title">Professional Verification</h3>
                  <p className="verification-subtitle">Get verified and build trust with brands.</p>
                  
                  <ul className="verification-benefits">
                    <li>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Verified badge on your profile
                    </li>
                    <li>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Appear more trustworthy to brands
                    </li>
                    <li>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Higher visibility in search & discovery
                    </li>
                    <li>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      Access to premium opportunities
                    </li>
                  </ul>
                </div>
                
                <div className="verification-pricing-card">
                  <div className="pricing-icon-wrapper">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 9 6-9"></path><path d="m6 9 6-6 6 6"></path><path d="M6 9h12"></path><path d="m12 3-3 6"></path><path d="m12 3 3 6"></path></svg>
                  </div>
                  <div className="pricing-amount">₹299</div>
                  <div className="pricing-badge">Lifetime Launch Access</div>
                  <div className="pricing-future">Future pricing: ₹1299 / year</div>
                  <button className="get-verified-action-btn" onClick={() => navigate('/apply-verification')}>
                    Get Verified
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h3>Notification Preferences</h3>
              <div className="settings-list">
                {settings.notifSettings && Object.entries(settings.notifSettings).map(([key, val]) => (
                  <div key={key} className="setting-item">
                    <div className="setting-info">
                      <h4 style={{ textTransform: 'capitalize' }}>{key} Notifications</h4>
                      <p>Receive push notifications for new {key}.</p>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={!!val} onChange={() => handleNotifToggle(key)} />
                      <span className="slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section account-settings-wrapper">
              <div className="settings-section-header">
                <h3>Account Details</h3>
                <p className="subtitle">Manage your core account information and security settings.</p>
              </div>

              <div className="account-preview-card">
                <div className="account-row">
                  <span>Username</span>
                  <strong className="text-highlight">@{user?.username || "N/A"}</strong>
                </div>
                <div className="account-row">
                  <span>Email</span>
                  <strong className="text-highlight">{user?.email || "N/A"}</strong>
                </div>
                <div className="account-row">
                  <span>Joined</span>
                  <strong>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Recently"}</strong>
                </div>
              </div>

              {/* Email Verification Section */}
              <div className="security-card-item">
                <div className="security-card-header">
                  <div className="security-card-title-group">
                    <div className="security-icon-circle email-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                    </div>
                    <div>
                      <h4>Email Verification</h4>
                      <p>Ensure your email address is verified for account security.</p>
                    </div>
                  </div>
                  <div className="security-badge-group">
                    {user?.isEmailVerified ? (
                      <span className="badge badge-success">✓ Verified</span>
                    ) : (
                      <span className="badge badge-warning">⚠️ Unverified</span>
                    )}
                  </div>
                </div>

                {otpError && <div style={{ marginTop: '15px' }}><ErrorBanner message={otpError} onDismiss={() => setOtpError("")} /></div>}
                {otpSuccess && <div className="success-banner" style={{ marginTop: '15px', marginBottom: '0' }}>{otpSuccess}</div>}

                {!user?.isEmailVerified && !showOtpForm && (
                  <div className="security-card-body animate-fade-in">
                    <button 
                      className="btn btn-primary" 
                      onClick={handleSendOtp} 
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Sending OTP..." : "Verify Email"}
                    </button>
                  </div>
                )}

                {showOtpForm && (
                  <div className="security-card-body otp-form-container slide-in">
                    <form onSubmit={handleVerifyOtp}>
                      <p className="form-tip">Please enter the 6-digit verification code sent to <strong>{user?.email}</strong></p>
                      <div className="field">
                        <input 
                          type="text" 
                          className="input otp-input-field" 
                          placeholder="000000" 
                          maxLength={6} 
                          required 
                          value={otp} 
                          onChange={(e) => setOtp(e.target.value)} 
                          disabled={actionLoading}
                        />
                      </div>
                      <div className="btn-group">
                        <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                          {actionLoading ? "Verifying..." : "Confirm Code"}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={handleSendOtp} disabled={actionLoading}>
                          Resend Code
                        </button>
                        <button type="button" className="btn btn-text danger" onClick={() => setShowOtpForm(false)} disabled={actionLoading}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Password Change Section */}
              <div className="security-card-item">
                <div className="security-card-header" onClick={() => setShowPasswordForm(!showPasswordForm)} style={{ cursor: 'pointer' }}>
                  <div className="security-card-title-group">
                    <div className="security-icon-circle key-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
                    </div>
                    <div>
                      <h4>Password & Security</h4>
                      <p>Update your password to keep your account safe.</p>
                    </div>
                  </div>
                  <button className="btn btn-text toggle-form-btn">
                    {showPasswordForm ? "Hide Form" : "Change Password"}
                  </button>
                </div>

                {passwordError && <div style={{ marginTop: '15px' }}><ErrorBanner message={passwordError} onDismiss={() => setPasswordError("")} /></div>}
                {passwordSuccess && <div className="success-banner" style={{ marginTop: '15px', marginBottom: '0' }}>{passwordSuccess}</div>}

                {showPasswordForm && (
                  <div className="security-card-body password-form-container slide-in">
                    <form onSubmit={handlePasswordChange}>
                      <div className="field">
                        <label>Current Password</label>
                        <input 
                          type="password" 
                          className="input" 
                          required 
                          value={currentPassword} 
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          disabled={actionLoading}
                        />
                      </div>
                      <div className="field">
                        <label>New Password <span>(At least 6 characters)</span></label>
                        <input 
                          type="password" 
                          className="input" 
                          required 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={actionLoading}
                        />
                      </div>
                      <div className="field">
                        <label>Confirm New Password</label>
                        <input 
                          type="password" 
                          className="input" 
                          required 
                          value={confirmNewPassword} 
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          disabled={actionLoading}
                        />
                      </div>
                      <div className="btn-group">
                        <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                          {actionLoading ? "Updating..." : "Update Password"}
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-outline" 
                          onClick={() => {
                            setShowPasswordForm(false);
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmNewPassword("");
                          }}
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
