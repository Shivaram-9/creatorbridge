import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES } from "../constants/categories.js";
import { BASE_URL } from "../config/api.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import PortfolioGrid from "../components/PortfolioGrid.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import UserListModal from "../components/UserListModal.jsx";
import Avatar from "../components/Avatar.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";

import { ShareIcon } from "../components/Icons.jsx";



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
    refreshUser
  } = useAuth();

  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  const loadPosts = useCallback(async () => {
    if (!user?._id) return;
    setLoadingPosts(true);
    try {
      const data = await api.posts.userPosts(user._id);
      if (!data?.error) {
        const formatted = (data || []).map(p => ({
          ...p,
          id: p._id,
          url: p.image ? (p.image.startsWith('http') ? p.image : `${BASE_URL}${p.image}`) : null,
          mediaType: "image"
        }));
        setUserPosts(formatted);
      }
    } catch (err) {
      console.error("Failed to load posts", err);
    } finally {
      setLoadingPosts(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Local state for editing
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
  const [showListModal, setShowListModal] = useState(false);
  const [listType, setListType] = useState("followers");

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
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // 1. Show instant preview using base64 (local only)
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result);
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);

      // 2. Upload to server
      try {
        const formData = new FormData();
        formData.append("avatar", file);
        const res = await api.users.updateAvatar(formData);
        if (res?.error) {
          setError(res.error);
        } else {
          setUser(res); // Update global user state
        }
      } catch (err) {
        setError("Failed to upload avatar");
      }
    }
  };

  const handleShareProfile = async () => {
    const shareData = {
      title: "CreatorBridge Profile",
      text: `Check out ${user?.name || user?.username || 'this profile'} on CreatorBridge!`,
      url: `${window.location.origin}/user/${user?._id}`,
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
      <div className="profile-v2">
        <header className="profile-v2-header" style={{ opacity: 0.5 }}>
          <div className="profile-v2-avatar-col">
            <div className="profile-v2-avatar skeleton" style={{ backgroundColor: '#e5e7eb' }}></div>
          </div>
          <div className="profile-v2-info-col">
            <div className="skeleton" style={{ height: '2rem', width: '200px', backgroundColor: '#e5e7eb', marginBottom: '1rem' }}></div>
            <div className="skeleton" style={{ height: '1rem', width: '150px', backgroundColor: '#e5e7eb' }}></div>
          </div>
        </header>
        <LoadingSpinner centered />
      </div>
    );
  }

  const displayName = user?.name || user?.email?.split('@')[0] || "User";

  const handleDeletePost = async (postId) => {
    try {
      const res = await api.posts.remove(postId);
      if (res?.error) {
        alert(res.error);
      } else {
        setUserPosts(prev => prev.filter(p => p._id !== postId && p.id !== postId));
      }
    } catch {
      alert("Failed to delete post");
    }
  };

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
              {saving ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <LoadingSpinner size="sm" color="white" /> Saving...
                </div>
              ) : "Save Changes"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <header className="profile-v2-header">
            <div className="profile-v2-avatar-col">
              <Avatar 
                user={isEditing ? { ...user, avatar: editAvatar } : user} 
                size="xl" 
                className="profile-v2-avatar" 
                onClick={() => setShowPhotoOptions(true)} 
              />
            </div>
            
            <div className="profile-v2-info-col">
              <div className="profile-v2-top-row">
                <h1 className="profile-v2-username">
                  {user?.username || displayName}
                  {user?.isVerified && <VerifiedBadge size="md" />}
                </h1>
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
                <div 
                  className="profile-v2-stat" 
                  onClick={() => { setListType("followers"); setShowListModal(true); }}
                  style={{ cursor: 'pointer' }}
                >
                  <strong>{fmtFollowers(user?.followers?.length)}</strong> aligners
                </div>
                <div 
                  className="profile-v2-stat" 
                  onClick={() => { setListType("following"); setShowListModal(true); }}
                  style={{ cursor: 'pointer' }}
                >
                  <strong>{fmtFollowers(user?.following?.length)}</strong> aligned
                </div>
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
              <PortfolioGrid items={userPosts} onDelete={handleDeletePost} />
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

      {showListModal && (
        <UserListModal 
          userId={user._id} 
          type={listType} 
          onClose={() => setShowListModal(false)} 
        />
      )}
    </div>
  );
}
