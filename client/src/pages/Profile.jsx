import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { CATEGORIES } from "../constants/categories.js";
import ErrorBanner from "../components/ErrorBanner.jsx";
import PortfolioGrid from "../components/PortfolioGrid.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Avatar from "../components/Avatar.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";
import { ShareIcon, BriefcaseIcon } from "../components/Icons.jsx";
import "./Profile.css";

function fmtFollowers(n) {
  if (!n || n <= 0) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [collabs, setCollabs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    username: "",
    category: "",
    bio: "",
    location: "",
  });

  const loadData = useCallback(async () => {
    if (!user?._id) return;
    setLoadingData(true);
    try {
      const [postsRes, collabsRes] = await Promise.all([
        api.posts.userPosts(user._id),
        api.collaborations.list()
      ]);
      if (!postsRes.error) setPosts(postsRes);
      if (!collabsRes.error) setCollabs(collabsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  }, [user?._id]);

  useEffect(() => {
    loadData();
    if (user) {
      setEditForm({
        name: user.name || "",
        username: user.username || "",
        category: user.category || "",
        bio: user.bio || "",
        location: user.location || "",
      });
    }
  }, [loadData, user]);

  const handleUpdate = (updatedPost) => {
    setPosts(prev => prev.map(p => p._id === updatedPost._id ? updatedPost : p));
  };

  const handleDelete = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId));
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/user/${user._id}`);
      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    } catch {
      alert("Failed to copy link");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.users.updateMe(editForm);
      if (res.error) setError(res.error);
      else {
        setUser(res);
        setIsEditing(false);
      }
    } catch {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) return <LoadingSpinner centered />;

  return (
    <div className="profile-pro">
      <header className="profile-pro-header">
        <div className="profile-pro-avatar">
          <Avatar user={user} size="xl" />
        </div>
        <div className="profile-pro-info">
          <div className="profile-pro-top">
            <h1 className="pro-username">
              {user?.username}
              {user?.isVerified && <VerifiedBadge size="md" />}
            </h1>
            <div className="pro-actions">
              <button className="btn-pro" onClick={() => setIsEditing(true)}>Edit Profile</button>
              <button className="btn-pro" onClick={handleShare}>{copyStatus ? "Copied!" : "Share"}</button>
            </div>
          </div>
          <div className="pro-stats">
            <div className="pro-stat"><strong>{posts.length}</strong> posts</div>
            <div className="pro-stat"><strong>{fmtFollowers(user?.followers?.length)}</strong> aligners</div>
            <div className="pro-stat"><strong>{fmtFollowers(user?.following?.length)}</strong> aligned</div>
          </div>
          <div className="pro-bio">
            <span className="pro-name">{user?.name}</span>
            <span className="pro-category">{user?.category}</span>
            <p className="pro-text">{user?.bio}</p>
            {user?.location && <span className="pro-location">📍 {user?.location}</span>}
          </div>
        </div>
      </header>

      <div className="profile-pro-tabs">
        <button className={activeTab === "posts" ? "active" : ""} onClick={() => setActiveTab("posts")}>POSTS</button>
        <button className={activeTab === "portfolio" ? "active" : ""} onClick={() => setActiveTab("portfolio")}>PORTFOLIO</button>
        <button className={activeTab === "collabs" ? "active" : ""} onClick={() => setActiveTab("collabs")}>COLLABS</button>
      </div>

      <div className="profile-pro-content">
        {activeTab === "posts" && (
          <div className="pro-posts-list">
            {posts.map(p => <PortfolioGrid key={p._id} items={[p]} onDelete={handleDelete} onUpdate={handleUpdate} />)}
          </div>
        )}
        {activeTab === "portfolio" && (
          <div className="pro-portfolio-grid">
            {posts.filter(p => p.category === "Portfolio").length > 0 ? (
                <PortfolioGrid items={posts.filter(p => p.category === "Portfolio")} onDelete={handleDelete} />
            ) : (
                <div className="empty-state">No portfolio projects yet.</div>
            )}
          </div>
        )}
        {activeTab === "collabs" && (
          <div className="pro-collabs-list">
            {collabs.length > 0 ? (
                collabs.map(c => (
                    <div key={c._id} className="pro-collab-item">
                        <img src={c.campaign?.banner} alt="" />
                        <div>
                            <h4>{c.campaign?.title}</h4>
                            <span>Status: {c.status}</span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="empty-state">No collaborations yet.</div>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="modal-overlay">
          <div className="edit-modal slide-in">
            <h2>Edit Profile</h2>
            <form onSubmit={handleSubmit}>
              <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} placeholder="Name" />
              <input value={editForm.username} onChange={e => setEditForm({...editForm, username: e.target.value})} placeholder="Username" />
              <select value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})}>
                <option value="">Category</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} placeholder="Bio" />
              <input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} placeholder="Location" />
              <div className="modal-actions">
                <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" disabled={saving}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
