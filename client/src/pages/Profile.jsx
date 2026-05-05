import { useEffect, useRef, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES } from "../constants/categories.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import PortfolioGrid from "../components/PortfolioGrid.jsx";

import { ShareIcon } from "../components/Icons.jsx";

/** Generate initials from name or email */
function initials(name, email) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  }
  return email ? email.slice(0, 2).toUpperCase() : "?";
}

/** Format followers count nicely */
function fmtFollowers(n) {
  if (!n || n <= 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export default function Profile() {
  const { 
    user, setUser, 
    userPosts, setUserPosts,
    refreshUser
  } = useAuth();

  // Local state for editing to prevent side effects on actual data
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [copyStatus, setCopyStatus] = useState(false);

  const fileRef = useRef(null);

  /* Populate edit fields from user data */
  useEffect(() => {
    if (user) {
      setEditName(user.name || "");
      setEditUsername(user.username || "");
      setEditCategory(user.category || "");
      setEditBio(user.bio || "");
      setEditLocation(user.location || "");
      setEditAvatar(user.avatar || "");
      setLoading(false);
    }
  }, [user, isEditing]);

  /* Handle real image upload */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result);
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleShareProfile = async () => {
    const shareData = {
      title: "CreatorBridge Profile",
      text: `Check out ${user?.name || user?.username || 'this profile'} on CreatorBridge!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 2000);
      }
    } catch (err) {
      // If user cancels share, we don't need to show error
      if (err.name !== 'AbortError') {
        // Fallback to clipboard if share fails
        await navigator.clipboard.writeText(window.location.href);
        setCopyStatus(true);
        setTimeout(() => setCopyStatus(false), 2000);
      }
    }
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const body = {
        name: editName,
        username: editUsername,
        category: editCategory,
        bio: editBio,
        location: editLocation,
        avatar: editAvatar,
      };
      const me = await api.users.updateMe(body);
      if (me?.error) {
        setError(typeof me.error === "string" ? me.error : "Something went wrong");
      } else {
        setUser(me);
        setSaved(true);
        setTimeout(() => setIsEditing(false), 800);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !user) {
    return (
      <div className="container">
        <p className="loading-line">Loading profile</p>
      </div>
    );
  }

  const displayName = user?.name || user?.email?.split('@')[0] || "User";

  return (
    <div className="profile-v2">
      {isEditing ? (
        <div className="edit-profile-v2 slide-in">
          <div className="header-inner container" style={{ padding: '0 0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="profile-preview__name">Edit Profile</h2>
            <button className="btn btn-ghost" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="vertical-field">
              <label>Name</label>
              <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Name" />
            </div>
            <div className="vertical-field">
              <label>Username</label>
              <input className="input" value={editUsername} onChange={(e) => setEditUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))} placeholder="Username" />
            </div>
            <div className="vertical-field">
              <label>Category</label>
              <select className="input" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div className="vertical-field">
              <label>Location</label>
              <input className="input" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="Location" />
            </div>
            <div className="vertical-field">
              <label>Bio</label>
              <textarea className="input" value={editBio} onChange={(e) => setEditBio(e.target.value)} rows={3} placeholder="Bio" />
            </div>

            <ErrorBanner message={error} onDismiss={() => setError("")} />
            {saved && <div className="success-banner">Profile updated.</div>}
            
            <button type="submit" className="btn btn-primary w-full" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <header className="profile-v2-header">
            <div className="profile-v2-avatar-col">
              <div className="profile-v2-avatar" onClick={() => setShowPhotoOptions(true)}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="" className="profile-v2-avatar-img" />
                ) : (
                  <span className="profile-preview__avatar-initials" style={{ fontSize: '2rem' }}>{initials(user?.name, user?.email)}</span>
                )}
              </div>
            </div>
            
            <div className="profile-v2-info-col">
              <div className="profile-v2-top-row">
                <h1 className="profile-v2-username">{user?.username || displayName}</h1>
                <div className="profile-v2-actions">
                  <button className="profile-v2-btn" onClick={() => setIsEditing(true)}>Edit profile</button>
                  <button 
                    className={`profile-v2-btn ${copyStatus ? 'btn-success' : ''}`} 
                    onClick={handleShareProfile}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', transition: 'transform 0.1s' }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <ShareIcon />
                    {copyStatus ? "Copied!" : "Share profile"}
                  </button>
                </div>
              </div>
              
              <div className="profile-v2-stats">
                <div className="profile-v2-stat"><strong>{userPosts.length}</strong> posts</div>
                <div className="profile-v2-stat"><strong>{fmtFollowers(user?.followers?.length)}</strong> followers</div>
                <div className="profile-v2-stat"><strong>{fmtFollowers(user?.following?.length)}</strong> following</div>
              </div>
              
              <div className="profile-v2-bio-wrap">
                <span className="profile-v2-display-name">{displayName}</span>
                {user?.category && <p className="muted" style={{ marginBottom: '0.25rem' }}>{user.category}</p>}
                {user?.bio && <p style={{ whiteSpace: 'pre-wrap' }}>{user.bio}</p>}
                {user?.location && <p className="muted" style={{ marginTop: '0.25rem' }}>📍 {user.location}</p>}
              </div>
            </div>
          </header>

          <div className="profile-v2-tabs">
            <div className={`profile-v2-tab ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab("posts")}>
              <span>POSTS</span>
            </div>
            <div className={`profile-v2-tab ${activeTab === 'tagged' ? 'active' : ''}`} onClick={() => setActiveTab("tagged")}>
              <span>MEDIA</span>
            </div>
          </div>

          <div className="profile-v2-content">
            {activeTab === 'posts' ? (
              <PortfolioGrid items={userPosts} />
            ) : (
              <div className="empty-state" style={{ padding: '4rem 0' }}>
                <div className="empty-state__illustration">🖼?️</div>
                <p className="empty-state__text">No tagged media yet.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Photo Options Modal */}
      {showPhotoOptions && (
        <div className="modal-overlay" onClick={() => setShowPhotoOptions(false)}>
          <div className="photo-options-modal slide-in" onClick={e => e.stopPropagation()}>
            <div className="dropdown-header" style={{ textAlign: 'center', padding: '1.5rem', fontSize: '1rem' }}>Change Profile Photo</div>
            <button className="photo-option" style={{ color: 'var(--accent)', fontWeight: 700 }} onClick={() => fileRef.current.click()}>Upload Photo</button>
            <button className="photo-option" onClick={() => setShowPhotoOptions(false)}>Import from WhatsApp</button>
            <button className="photo-option" onClick={() => setShowPhotoOptions(false)}>Take Photo</button>
            {user?.avatar && (
              <button className="photo-option photo-option--danger" onClick={() => { setUser({ ...user, avatar: "" }); setShowPhotoOptions(false); }}>Remove Current Photo</button>
            )}
            <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>
      )}
    </div>
  );
}
