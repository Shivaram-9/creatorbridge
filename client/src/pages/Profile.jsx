import { useEffect, useRef, useState } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES } from "../constants/categories.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import PortfolioGrid from "../components/PortfolioGrid.jsx";

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
  const { user, setUser } = useAuth();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [category, setCategory] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [avatar, setAvatar] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
  const [followers, setFollowers] = useState("");

  const [portfolio, setPortfolio] = useState([]);
  const [pfCaption, setPfCaption] = useState("");
  const [pfAdding, setPfAdding] = useState(false);
  const [pfError, setPfError] = useState("");

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");

  const fileRef = useRef(null);
  const pfFileRef = useRef(null);

  /* Populate fields from API */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await api.users.me();
        if (cancelled) return;
        if (me?.error) {
          setError(typeof me.error === "string" ? me.error : "Something went wrong");
        } else {
          setName(me.name || "");
          setUsername(me.username || "");
          setCategory(me.category || "");
          setBio(me.bio || "");
          setLocation(me.location || "");
          setAvatar(me.avatar || "");
          setInstagram(me.instagram || "");
          setYoutube(me.youtube || "");
          setFollowers(me.followers ? String(me.followers) : "");
          setPortfolio(Array.isArray(me.portfolio) ? me.portfolio : []);
          setUser(me);
        }
      } catch {
        setError("Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setUser]);

  /* Handle real image upload */
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        setShowPhotoOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  /* Handle portfolio url upload */
  async function handlePortfolioSubmit() {
    const url = pfFileRef.current?.value?.trim();
    if (!url) return;
    const isVideo = url.match(/\.(mp4|webm|ogg)$/i) || pfCaption.toLowerCase().includes("video");
    setPfAdding(true);
    setPfError("");
    try {
      const result = await api.users.addPortfolioItem({
        url,
        caption: pfCaption.trim(),
        mediaType: isVideo ? "video" : "image",
      });
      if (result?.error) {
        setPfError(typeof result.error === "string" ? result.error : "Something went wrong");
      } else {
        setPortfolio(Array.isArray(result.portfolio) ? result.portfolio : []);
        setUser(result);
        setPfCaption("");
        if (pfFileRef.current) pfFileRef.current.value = "";
      }
    } catch {
      setPfError("Something went wrong");
    } finally {
      setPfAdding(false);
    }
  }

  async function removePortfolioItem(itemId) {
    setPfError("");
    try {
      const result = await api.users.removePortfolioItem(itemId);
      if (result?.error) {
        setPfError(typeof result.error === "string" ? result.error : "Something went wrong");
      } else {
        setPortfolio(Array.isArray(result.portfolio) ? result.portfolio : []);
        setUser(result);
      }
    } catch {
      setPfError("Something went wrong");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const body = {
        name, username, category, bio, location, avatar, instagram, youtube,
        followers: followers ? Number(followers) : 0,
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

  if (loading) {
    return (
      <div className="container">
        <p className="loading-line">Loading profile</p>
      </div>
    );
  }

  const displayName = name || user?.email?.split('@')[0] || "User";

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
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            </div>
            <div className="vertical-field">
              <label>Username</label>
              <input className="input" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))} placeholder="Username" />
            </div>
            <div className="vertical-field">
              <label>Category</label>
              <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div className="vertical-field">
              <label>Location</label>
              <input className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
            </div>
            <div className="vertical-field">
              <label>Bio</label>
              <textarea className="input" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Bio" />
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
                {avatar ? (
                  <img src={avatar} alt="" className="profile-v2-avatar-img" />
                ) : (
                  <span className="profile-preview__avatar-initials" style={{ fontSize: '2rem' }}>{initials(name, user?.email)}</span>
                )}
              </div>
            </div>
            
            <div className="profile-v2-info-col">
              <div className="profile-v2-top-row">
                <h1 className="profile-v2-username">{username || displayName}</h1>
                <div className="profile-v2-actions">
                  <button className="profile-v2-btn" onClick={() => setIsEditing(true)}>Edit profile</button>
                  <button className="profile-v2-btn">Share profile</button>
                </div>
              </div>
              
              <div className="profile-v2-stats">
                <div className="profile-v2-stat"><strong>{portfolio.length}</strong> posts</div>
                <div className="profile-v2-stat"><strong>{fmtFollowers(user?.followers)}</strong> followers</div>
                <div className="profile-v2-stat"><strong>{Math.floor(Math.random() * 500) + 100}</strong> following</div>
              </div>
              
              <div className="profile-v2-bio-wrap">
                <span className="profile-v2-display-name">{displayName}</span>
                {category && <p className="muted" style={{ marginBottom: '0.25rem' }}>{category}</p>}
                {bio && <p style={{ whiteSpace: 'pre-wrap' }}>{bio}</p>}
                {location && <p className="muted" style={{ marginTop: '0.25rem' }}>📍 {location}</p>}
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
              <PortfolioGrid items={portfolio} />
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
            {avatar && (
              <button className="photo-option photo-option--danger" onClick={() => { setAvatar(""); setShowPhotoOptions(false); }}>Remove Current Photo</button>
            )}
            <button className="photo-option photo-option--cancel" onClick={() => setShowPhotoOptions(false)}>Cancel</button>
            <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>
      )}
    </div>
  );
}
