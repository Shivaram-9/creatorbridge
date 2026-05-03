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
  if (!n || n <= 0) return null;
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

  /* Handle avatar file → base64 */
  function handleAvatarFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512_000) {
      setError("Image must be under 500 KB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  }

  /* Handle portfolio file upload */
  function handlePortfolioFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      setPfError("File must be under 2 MB");
      return;
    }
    const isVideo = file.type.startsWith("video/");
    setPfAdding(true);
    setPfError("");

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await api.users.addPortfolioItem({
          url: reader.result,
          caption: pfCaption.trim(),
          mediaType: isVideo ? "video" : "image",
        });
        if (result?.error) {
          setPfError(typeof result.error === "string" ? result.error : "Something went wrong");
        } else {
          setPortfolio(Array.isArray(result.portfolio) ? result.portfolio : []);
          setUser(result);
          setPfCaption("");
        }
      } catch {
        setPfError("Something went wrong");
      } finally {
        setPfAdding(false);
        if (pfFileRef.current) pfFileRef.current.value = "";
      }
    };
    reader.readAsDataURL(file);
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

  const displayName = name || user?.email || "User";
  const roleName = user?.role || "influencer";
  const roleClass = roleName === "brand" ? "badge-brand" : "badge-influencer";
  const followerLabel = fmtFollowers(user?.followers);

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="subtitle">Your public details appear in discovery and connection lists.</p>
      </header>

      {/* ── Profile Preview Card ── */}
      <div className="profile-preview">
        <div className="profile-preview__avatar-wrap">
          {avatar ? (
            <img src={avatar} alt="" className="profile-preview__avatar-img" />
          ) : (
            <span className="profile-preview__avatar-initials">{initials(name, user?.email)}</span>
          )}
        </div>
        <div className="profile-preview__info">
          <h2 className="profile-preview__name">{displayName}</h2>
          {username && <p className="profile-preview__username">@{username}</p>}
          <div className="profile-preview__tags">
            <span className={`badge ${roleClass}`}>{roleName}</span>
            {category && <span className="profile-preview__cat">{category}</span>}
          </div>
          {bio && <p className="profile-preview__bio">{bio}</p>}
          <div className="profile-preview__details">
            {location && (
              <span className="profile-preview__detail">
                <span aria-hidden="true">📍</span> {location}
              </span>
            )}
            {followerLabel && (
              <span className="profile-preview__detail">
                <span aria-hidden="true">👥</span> {followerLabel} followers
              </span>
            )}
          </div>
          {(instagram || youtube) && (
            <div className="profile-preview__socials">
              {instagram && (
                <a
                  href={instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link social-link--ig"
                >
                  <span aria-hidden="true">📸</span> Instagram
                </a>
              )}
              {youtube && (
                <a
                  href={youtube.startsWith("http") ? youtube : `https://youtube.com/@${youtube.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-link social-link--yt"
                >
                  <span aria-hidden="true">▶️</span> YouTube
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Portfolio Section ── */}
      <div className="card portfolio-section">
        <div className="portfolio-section__header">
          <h2 className="portfolio-section__title">Portfolio</h2>
          <span className="portfolio-section__count">{portfolio.length} / 10</span>
        </div>

        <PortfolioGrid items={portfolio} />

        {/* Manage items */}
        {portfolio.length > 0 && (
          <div className="portfolio-manage">
            <p className="portfolio-manage__label">Remove items</p>
            <div className="portfolio-manage__chips">
              {portfolio.map((item, i) => (
                <button
                  key={item._id}
                  type="button"
                  className="portfolio-manage__chip"
                  onClick={() => removePortfolioItem(item._id)}
                  title={item.caption || `Item ${i + 1}`}
                >
                  <span className="portfolio-manage__chip-preview">
                    {item.mediaType === "video" ? "▶" : (
                      <img src={item.url} alt="" className="portfolio-manage__chip-img" />
                    )}
                  </span>
                  <span className="portfolio-manage__chip-x">✕</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Add new item */}
        {portfolio.length < 10 && (
          <div className="portfolio-add">
            <div className="portfolio-add__row">
              <input
                className="input"
                value={pfCaption}
                onChange={(e) => setPfCaption(e.target.value)}
                placeholder="Caption (optional)"
                maxLength={300}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => pfFileRef.current?.click()}
                disabled={pfAdding}
              >
                {pfAdding ? "Uploading…" : "＋ Add"}
              </button>
              <input
                ref={pfFileRef}
                type="file"
                accept="image/*,video/*"
                className="sr-only"
                onChange={handlePortfolioFile}
              />
            </div>
            <span className="muted" style={{ fontSize: "0.75rem" }}>Max 2 MB per file · Images and short videos</span>
          </div>
        )}

        <ErrorBanner message={pfError} onDismiss={() => setPfError("")} />
      </div>

      {/* ── Edit Form ── */}
      <div className="card profile-form-card">
        <h2 className="profile-form-card__title">Edit profile</h2>
        <form onSubmit={handleSubmit}>
          {/* Avatar upload */}
          <div className="field">
            <label>Profile photo</label>
            <div className="avatar-upload-row">
              <div className="avatar-upload-thumb">
                {avatar ? (
                  <img src={avatar} alt="" className="avatar-upload-thumb__img" />
                ) : (
                  <span className="avatar-upload-thumb__empty">📷</span>
                )}
              </div>
              <div className="avatar-upload-actions">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
                  Choose image
                </button>
                {avatar && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAvatar("")}>
                    Remove
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarFile} aria-label="Upload profile photo" />
                <span className="muted" style={{ fontSize: "0.75rem" }}>Max 500 KB · JPG, PNG</span>
              </div>
            </div>
          </div>

          <div className="profile-form-grid">
            <div className="field">
              <label htmlFor="pf-name">Name</label>
              <input id="pf-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            </div>
            <div className="field">
              <label htmlFor="pf-username">Username</label>
              <input id="pf-username" className="input" value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))} placeholder="e.g. john_doe" maxLength={60} />
            </div>
            <div className="field">
              <label htmlFor="pf-category">Category</label>
              <select id="pf-category" className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="">Select…</option>
                {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="pf-location">Location</label>
              <input id="pf-location" className="input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" />
            </div>
          </div>

          <div className="field">
            <label htmlFor="pf-bio">Bio</label>
            <textarea id="pf-bio" className="input" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={2000} placeholder="Write a short bio about yourself…" />
          </div>

          <div className="profile-form-section-label">Social links</div>
          <div className="profile-form-grid">
            <div className="field">
              <label htmlFor="pf-ig">Instagram</label>
              <input id="pf-ig" className="input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="@username or full URL" />
            </div>
            <div className="field">
              <label htmlFor="pf-yt">YouTube</label>
              <input id="pf-yt" className="input" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="@channel or full URL" />
            </div>
          </div>

          <div className="field" style={{ maxWidth: 240 }}>
            <label htmlFor="pf-followers">Followers count <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
            <input id="pf-followers" className="input" type="number" min="0" value={followers} onChange={(e) => setFollowers(e.target.value)} placeholder="e.g. 10000" />
          </div>

          <ErrorBanner message={error} onDismiss={() => setError("")} />
          {saved && (
            <div className="success-banner" role="status">Profile updated successfully.</div>
          )}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
