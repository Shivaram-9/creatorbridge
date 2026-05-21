import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES } from "../constants/categories.js";
import Avatar from "../components/Avatar.jsx";
import toast from "react-hot-toast";
import "./EditProfile.css";

export default function EditProfile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showAdjuster, setShowAdjuster] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const [form, setForm] = useState({
    name: "",
    username: "",
    bio: "",
    category: "",
    location: "",
    website: "",
    portfolioLink: "",
    socialMediaLink: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        username: user.username || "",
        bio: user.bio || "",
        category: user.category || "",
        location: user.location || "",
        website: user.website || "",
        portfolioLink: user.portfolioLink || "",
        socialMediaLink: user.socialMediaLink || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setTempAvatar(reader.result);
      setShowAdjuster(true);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;
    setAvatarUploading(true);
    setShowAdjuster(false);
    
    const fd = new FormData();
    fd.append("avatar", selectedFile);
    // Note: In a full implementation, we'd send crop coordinates too.
    // For now, we'll just send the file and use the zoom/preview for UX.
    
    try {
      const res = await api.users.updateAvatar(fd);
      if (!res.error) {
        setUser(res);
        toast.success("Profile photo updated!");
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setAvatarUploading(false);
      setTempAvatar(null);
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.users.updateMe(form);
      if (res.error) {
        toast.error(res.error);
      } else {
        setUser(res);
        toast.success("Profile saved!");
        navigate("/profile");
      }
    } catch {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="edit-profile-page">
      <div className="ep-container">
        {/* Header */}
        <div className="ep-header">
          <button className="ep-back-btn" onClick={() => navigate("/profile")}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="ep-title">Edit Profile</h1>
          <button
            className="ep-save-btn"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Saving..." : "Done"}
          </button>
        </div>

        {/* Avatar Section */}
        <div className="ep-avatar-section">
          <div className="ep-avatar-wrap">
            <Avatar user={user} size="xl" />
            {avatarUploading && (
              <div className="ep-avatar-loading">
                <div className="ep-spinner" />
              </div>
            )}
          </div>
          <div className="ep-avatar-info">
            <label className="ep-change-photo-btn">
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={onFileSelect}
              />
              Change profile photo
            </label>
          </div>
        </div>

      {/* Adjustment Modal */}
      {showAdjuster && (
        <div className="ep-adjust-modal">
          <div className="ep-adjust-content">
            <h3>Adjust Profile Photo</h3>
            <div className="ep-adjust-preview">
              <div className="ep-preview-circle">
                <img 
                  src={tempAvatar} 
                  alt="Preview" 
                  style={{ 
                    transform: `scale(${zoom})`,
                    transition: 'transform 0.1s'
                  }} 
                />
              </div>
            </div>
            <div className="ep-adjust-controls">
              <span>Zoom</span>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.01" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))} 
              />
            </div>
            <div className="ep-adjust-actions">
              <button className="ep-btn-cancel" onClick={() => setShowAdjuster(false)}>Cancel</button>
              <button className="ep-btn-save" onClick={handleAvatarUpload}>Upload</button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form className="ep-form" onSubmit={handleSubmit}>
        <div className="ep-field-group">
          <div className="ep-field">
            <label className="ep-label">Name</label>
            <input
              className="ep-input"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
              autoComplete="off"
            />
          </div>

          <div className="ep-field">
            <label className="ep-label">Username</label>
            <input
              className="ep-input"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="Username"
              autoComplete="off"
            />
          </div>

          <div className="ep-field">
            <label className="ep-label">Bio</label>
            <textarea
              className="ep-input ep-textarea"
              name="bio"
              value={form.bio}
              onChange={handleChange}
              placeholder="Write a short bio..."
              rows={4}
            />
          </div>

          <div className="ep-field">
            <label className="ep-label">Category</label>
            <select
              className="ep-input ep-select"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="ep-field">
            <label className="ep-label">Location</label>
            <input
              className="ep-input"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="City, Country"
            />
          </div>

          <div className="ep-field">
            <label className="ep-label">Website</label>
            <input
              className="ep-input"
              name="website"
              value={form.website}
              onChange={handleChange}
              placeholder="https://yourwebsite.com"
              type="text"
            />
          </div>

          <div className="ep-field">
            <label className="ep-label">Portfolio</label>
            <input
              className="ep-input"
              name="portfolioLink"
              value={form.portfolioLink}
              onChange={handleChange}
              placeholder="https://yourportfolio.com"
              type="text"
            />
          </div>

          <div className="ep-field">
            <label className="ep-label">LinkedIn</label>
            <input
              className="ep-input"
              name="socialMediaLink"
              value={form.socialMediaLink}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/yourhandle"
              type="text"
            />
          </div>
        </div>

        <div className="ep-divider">
          <span>Personal information</span>
        </div>

        <p className="ep-hint">
          Provide your personal information, even if the account used for a business, a pet or something else. This won't be a part of your public profile.
        </p>
      </form>
      </div>
    </div>
  );
}
