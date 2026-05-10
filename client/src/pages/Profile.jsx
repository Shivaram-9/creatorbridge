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
import toast from "react-hot-toast";
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
      toast.error("Failed to copy link");
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
    <div className="profile-pro slide-up-fade">



      <header className="profile-pro-header">
        <div className="profile-pro-avatar">
          <Avatar user={user} size="xl" />
          <label className="avatar-edit-overlay">
            <input 
              type="file" 
              hidden 
              accept="image/*" 
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("avatar", file);
                try {
                  const res = await api.users.updateAvatar(fd);
                  if (!res.error) {
                    toast.success("Avatar updated!");
                    setUser(res);
                  }
                  else toast.error(res.error);
                } catch {
                  toast.error("Failed to upload avatar");
                }
              }} 
            />
            <span>Edit</span>
          </label>
        </div>
        <div className="profile-pro-info">
          <div className="profile-pro-top">
            <h1 className="pro-username">
              {user?.username}
              {(user?.isVerified || user?.isPremium) && <VerifiedBadge size="md" tier={user?.premiumTier} />}
            </h1>
            <div className="pro-actions">
              <button className="btn-pro" onClick={() => setIsEditing(true)}>Edit Profile</button>
              <button className="btn-pro" onClick={handleShare}>{copyStatus ? "Copied!" : "Share"}</button>
            </div>
          </div>
          <div className="pro-stats">
            <div className="pro-stat"><strong>{posts.length}</strong> posts</div>
            <div className="pro-stat clickable" onClick={() => navigate(`/user/${user._id}/followers`)}>
              <strong>{fmtFollowers(user?.followers?.length)}</strong> aligners
            </div>
            <div className="pro-stat clickable" onClick={() => navigate(`/user/${user._id}/following`)}>
              <strong>{fmtFollowers(user?.following?.length)}</strong> aligned
            </div>
          </div>
          <div className="pro-bio">
            <span className="pro-name">{user?.name}</span>
            <span className="pro-category">{user?.category}</span>
            <p className="pro-text">{user?.bio}</p>
            {user?.location && <span className="pro-location">📍 {user?.location}</span>}
          </div>
        </div>
      </header>


      <div className="profile-pro-tabs" style={{ display: 'flex', justifyContent: 'space-around', borderTop: '1px solid var(--border-light)', paddingTop: '12px', marginTop: '24px' }}>
        <button style={{ background: 'none', border: 'none', fontWeight: activeTab === 'posts' ? 'bold' : 'normal', color: activeTab === 'posts' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px' }} onClick={() => setActiveTab("posts")}>POSTS</button>
        <button style={{ background: 'none', border: 'none', fontWeight: activeTab === 'portfolio' ? 'bold' : 'normal', color: activeTab === 'portfolio' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px' }} onClick={() => setActiveTab("portfolio")}>PORTFOLIO</button>
        <button style={{ background: 'none', border: 'none', fontWeight: activeTab === 'tagged' ? 'bold' : 'normal', color: activeTab === 'tagged' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px' }} onClick={() => setActiveTab("tagged")}>TAGGED</button>
        <button style={{ background: 'none', border: 'none', fontWeight: activeTab === 'collabs' ? 'bold' : 'normal', color: activeTab === 'collabs' ? 'var(--text-main)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', letterSpacing: '1px' }} onClick={() => setActiveTab("collabs")}>COLLABS</button>
      </div>

      <div className="profile-pro-content" style={{ marginTop: '16px' }}>
        {activeTab === "posts" && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
            {posts.length > 0 ? (
              posts.map(p => (
                <div key={p._id} style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden', cursor: 'pointer', background: '#efefef' }}>
                  {p.media && p.media.length > 0 && (
                    <img 
                      src={p.media[0].startsWith('http') ? p.media[0] : `${api.BASE_URL}${p.media[0]}`} 
                      alt="" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  )}
                  {(!p.media || p.media.length === 0) && (
                    <div style={{ padding: '8px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
                      {p.content?.slice(0, 50)}...
                    </div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}
                       onMouseEnter={e => e.currentTarget.style.opacity = 1}
                       onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                    ❤️ {p.likes?.length || 0}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 20px', textAlign: 'center' }}>
                <div style={{ width: '64px', height: '64px', border: '2px solid var(--text-main)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg style={{ width: '32px', height: '32px', color: 'var(--text-main)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>Create your first post</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>Share photos and updates with your followers.</p>
                <button style={{ background: 'var(--primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 'var(--radius-md)', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => navigate('/home')}>
                  Create Post
                </button>
              </div>
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
