import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import "./Settings.css";

export default function Settings() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("privacy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [settings, setSettings] = useState({
    isPrivate: false,
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

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [priv, sess, alrt] = await Promise.all([
          api.privacy.getSettings(),
          api.security.getSessions(),
          api.security.getAlerts()
        ]);
        if (priv && !priv.error) setSettings(priv);
        if (sess && !sess.error) setSessions(sess);
        if (alrt && !alrt.error) setAlerts(alrt);
      } catch (err) {
        setError("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleUpdate = async (updates) => {
    setLoading(true);
    try {
      const res = await api.privacy.updateSettings(updates);
      if (res.error) setError(res.error);
      else {
        setSettings(res);
        setSuccess("Settings updated successfully");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch {
      setError("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    const newVal = !settings[key];
    setSettings(prev => ({ ...prev, [key]: newVal }));
    handleUpdate({ [key]: newVal });
  };

  const handleNotifToggle = (key) => {
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
      setSessions(prev => prev.filter(s => s.token === api.getToken()));
      setSuccess("Logged out from all other devices");
    } catch {
      setError("Failed to logout from others");
    }
  };

  if (loading && !settings) return <LoadingSpinner centered />;

  return (
    <div className="settings-page container slide-in">
      <div className="settings-layout">
        {/* Sidebar */}
        <aside className="settings-sidebar">
          <h2>Settings</h2>
          <nav>
            <button className={activeTab === 'privacy' ? 'active' : ''} onClick={() => setActiveTab('privacy')}>
              <span className="icon">🔒</span> Privacy
            </button>
            <button className={activeTab === 'security' ? 'active' : ''} onClick={() => setActiveTab('security')}>
              <span className="icon">🛡️</span> Security & Sessions
            </button>
            <button className={activeTab === 'notifications' ? 'active' : ''} onClick={() => setActiveTab('notifications')}>
              <span className="icon">🔔</span> Notifications
            </button>
            <button className={activeTab === 'account' ? 'active' : ''} onClick={() => setActiveTab('account')}>
              <span className="icon">👤</span> Account Details
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main className="settings-content">
          <ErrorBanner message={error} onDismiss={() => setError("")} />
          {success && <div className="success-banner">{success}</div>}

          {activeTab === 'privacy' && (
            <div className="settings-section">
              <h3>Privacy Settings</h3>
              <div className="settings-list">
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Private Account</h4>
                    <p>When your account is private, only people you approve can see your posts and content.</p>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={settings.isPrivate} onChange={() => handleToggle('isPrivate')} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Show Activity Status</h4>
                    <p>Allow accounts you follow and anyone you message to see when you were last active or are currently online.</p>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={settings.showActivityStatus} onChange={() => handleToggle('showActivityStatus')} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Profile Discoverability</h4>
                    <p>Allow your profile to be recommended to others in the Discover section.</p>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" checked={settings.isDiscoverable} onChange={() => handleToggle('isDiscoverable')} />
                    <span className="slider"></span>
                  </label>
                </div>

                <div className="setting-item vertical">
                  <div className="setting-info">
                    <h4>Direct Messaging</h4>
                    <p>Control who can start new conversations with you.</p>
                  </div>
                  <select 
                    value={settings.allowMessagesFrom} 
                    onChange={(e) => handleUpdate({ allowMessagesFrom: e.target.value })}
                    className="settings-select"
                  >
                    <option value="everyone">Everyone</option>
                    <option value="following">People I Follow</option>
                    <option value="none">No one</option>
                  </select>
                </div>
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
                {sessions.map(sess => (
                  <div key={sess._id} className="session-item">
                    <div className="session-icon">
                      {sess.device?.type === 'mobile' ? '📱' : '💻'}
                    </div>
                    <div className="session-info">
                      <p className="device-name">{sess.device?.os} • {sess.device?.browser}</p>
                      <p className="session-meta">{sess.device?.ip} • Last active {new Date(sess.lastUsed).toLocaleString()}</p>
                      {sess.token === api.getToken() && <span className="current-badge">This device</span>}
                    </div>
                    {sess.token !== api.getToken() && (
                      <button className="btn-text danger" onClick={() => revokeSession(sess._id)}>Revoke</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="alerts-list">
                <h4>Security Alerts</h4>
                {alerts.length === 0 ? (
                  <p className="empty-text">No recent security alerts.</p>
                ) : (
                  alerts.map(alert => (
                    <div key={alert._id} className={`alert-item ${alert.isRead ? '' : 'unread'}`}>
                      <div className="alert-content">
                        <p className="alert-msg">{alert.message}</p>
                        <p className="alert-date">{new Date(alert.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h3>Notification Preferences</h3>
              <div className="settings-list">
                {Object.entries(settings.notifSettings).map(([key, val]) => (
                  <div key={key} className="setting-item">
                    <div className="setting-info">
                      <h4 style={{ textTransform: 'capitalize' }}>{key} Notifications</h4>
                      <p>Receive push notifications for new {key}.</p>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={val} onChange={() => handleNotifToggle(key)} />
                      <span className="slider"></span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="settings-section">
              <h3>Account Details</h3>
              <p className="subtitle">Manage your core account information.</p>
              <div className="account-preview">
                <div className="account-row">
                  <span>Username</span>
                  <strong>@{user?.username}</strong>
                </div>
                <div className="account-row">
                  <span>Email</span>
                  <strong>{user?.email}</strong>
                </div>
                <div className="account-row">
                  <span>Joined</span>
                  <strong>{new Date(user?.createdAt).toLocaleDateString()}</strong>
                </div>
              </div>
              <button className="btn btn-outline" onClick={() => window.location.href = '/verify-email'}>
                Change Password / Re-verify Email
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
