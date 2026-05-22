import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { BASE_URL } from "../config/api.js";
import PostCard from "../components/PostCard.jsx";
import CreatePost from "../components/CreatePost.jsx";
import StoriesBar from "../components/StoriesBar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import toast from "react-hot-toast";
import "./Home.css";

function VerificationBanner({ onClose, onVerify }) {
  return (
    <div className="verification-banner-mobile">
      <div className="banner-icon">💎</div>
      <div className="banner-text">
        <h3>Get verified and unlock more opportunities</h3>
        <p>Build trust and stand out to brands.</p>
      </div>
      <button className="banner-action-btn" onClick={onVerify}>Get Verified</button>
      <button className="banner-close-btn" onClick={onClose}>✕</button>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifiedCreators, setVerifiedCreators] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("All Feed");
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);

  const calculateProfileStrength = () => {
    if (!user) return { score: 0, tasks: [] };
    let score = 0;
    const tasks = [
      { id: 'portfolio', label: 'Add portfolio', done: user.portfolio?.length > 0 || !!user.portfolioLink, bonus: 25 },
      { id: 'social', label: 'Add social links', done: !!(user.website || user.socialLinks?.length > 0 || user.socialMediaLink || user.instagram || user.youtube), bonus: 25 },
      { id: 'experience', label: 'Add work experience', done: !!(user.experience?.length > 0), bonus: 25 },
      { id: 'verify', label: 'Get verified', done: !!user.isVerified, bonus: 25 }
    ];
    tasks.forEach(t => { if (t.done) score += t.bonus; });
    return { score, tasks };
  };
  const { score: profileScore, tasks: profileTasks } = calculateProfileStrength();

  const loadSidebarData = useCallback(async () => {
    try {
      const discoverRes = await api.search.discover();
      if (!discoverRes.error) {
        setSuggestedUsers(discoverRes.creators?.slice(0, 5) || []);
        setVerifiedCreators(discoverRes.creators?.filter(u => u.isVerified).slice(0, 5) || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.posts.list({ _t: Date.now() });
      if (data?.error) {
        if (!data.error.includes("invalid response")) {
          toast.error(data.error);
        }
      } else {
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("We couldn't load your feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
    const interval = setInterval(loadPosts, 120000);
    return () => clearInterval(interval);
  }, [loadPosts]);

  const handleAddPost = async (formData) => {
    try {
      const res = await api.posts.create(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Post published!");
        loadPosts();
      }
    } catch (err) {
      console.error("Alliance feed error:", err);
      toast.error("Failed to create post");
    }
  };

  const formatPost = (post) => {
    if (!post) return null;
    return {
      ...post,
      username: post.user?.username || post.user?.name || "User",
      avatar: post.user?.avatar || null,
      isVerified: post.user?.isVerified || false,
    };
  };

  const filteredPosts = posts.filter(post => {
    if (activeTab === "All Feed") return true;
    if (activeTab === "Following") {
      // Assuming user object has following array with user ids
      if (!user?.following) return true; // fallback
      return user.following.includes(post.user?._id || post.user);
    }
    if (activeTab === "For You") return true; // maybe sort by likes? fallback to all
    if (activeTab === "Projects") return post.content?.toLowerCase().includes("project");
    if (activeTab === "Announcements") return post.content?.toLowerCase().includes("announce");
    return true;
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="home-grid">
      {/* Main Feed Column */}
      <div className="feed-col">
        <div className="home-header-greeting">
          <h1>{getGreeting()}, {user?.name?.split(' ')[0] || user?.username || 'Creator'}! 👋</h1>
          <p>Explore, connect and grow your creator network.</p>
        </div>

        {/* People you may want to connect with (Carousel) */}
        <div className="carousel-container">
          <div className="carousel-header-flex">
            <h2 className="carousel-title">People you may want to connect with</h2>
            <button className="carousel-view-all" onClick={() => navigate('/discover')}>View all</button>
          </div>
          <div className="carousel-items">
            {suggestedUsers.length === 0 ? (
              <div style={{ color: '#71839B', fontSize: '0.85rem', padding: '20px 0' }}>No suggestions at the moment.</div>
            ) : (
              suggestedUsers.map(u => (
                <div key={u._id} className="carousel-item" onClick={() => navigate(`/user/${u._id}`)}>
                  <div className="carousel-avatar-wrap">
                    <img src={u.avatar ? (u.avatar.startsWith('http') ? u.avatar : `${BASE_URL}${u.avatar}`) : "/placeholder_avatar.png"} alt={u.username} className="carousel-avatar" />
                  </div>
                  <div className="carousel-info">
                    <span className="carousel-name">
                      {u.name || u.username}
                      {u.isVerified && <span className="verified-icon">💎</span>}
                    </span>
                    <span className="carousel-role">{u.role === 'brand' ? 'Brand' : u.category || 'Creator'}</span>
                  </div>
                  <button className="carousel-btn btn-outline-primary" onClick={(e) => { e.stopPropagation(); navigate(`/user/${u._id}`); }}>
                    {u.role === 'brand' ? 'Follow' : 'Connect'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Verification Banner (Mobile only) */}
        {!user?.isVerified && showVerificationBanner && (
          <VerificationBanner 
            onClose={() => setShowVerificationBanner(false)} 
            onVerify={() => navigate('/apply-verification')} 
          />
        )}

        {/* New Post Box */}
        <CreatePost onPost={handleAddPost} user={user} />

        {/* Feed Tabs */}
        <div className="feed-tabs-container">
          <div className="feed-tabs">
            {["All Feed", "Following"].map(tab => (
              <button 
                key={tab}
                className={`feed-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="feed-filter-btn" onClick={loadPosts} disabled={loading}>
            <span className="icon">≡</span> Latest
          </button>
        </div>

        {/* Feed Posts */}
        {loading ? (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : (
          <>
            <div className="home-feed-posts">

            {filteredPosts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {filteredPosts.map((post) => (
                  <PostCard 
                    key={post._id} 
                    post={formatPost(post)} 
                    onDelete={(id) => setPosts(prev => prev.filter(p => p._id !== id))}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                title="Welcome! Your Alliance Feed is Empty"
                message="Connect with creators and brands to see their latest posts here!"
                actionText="Discover Creators"
                onAction={() => navigate("/discover")}
                icon="🤝"
              />
            )}
            </div>
          </>
        )}
      </div>

      {/* Right Sidebar Column */}
      <div className="home-sidebar-col">
        {/* Profile Strength Card */}
        <div className="sidebar-card" style={{ cursor: 'pointer' }} onClick={() => {
          toast.success("Profile section opened");
          navigate('/profile/edit');
        }}>
          <div className="profile-strength-header">
            <h2 className="card-title">Your Profile Strength</h2>
          </div>
          <div className="strength-content">
            <div className="strength-circle">
              <svg viewBox="0 0 36 36" className={`circular-chart ${profileScore === 100 ? 'green' : 'blue'}`}>
                <path className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path className="circle"
                  strokeDasharray={`${profileScore}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">{profileScore}%</text>
              </svg>
            </div>
            <div className="strength-text-block">
              <p>
                {profileScore === 100 
                  ? "Outstanding! Your profile is fully complete and stands out." 
                  : "Great job! Complete your profile to increase your visibility."}
              </p>
            </div>
          </div>
          <ul className="strength-checklist">
            {profileTasks.map(task => {
              const linkTarget = task.id === 'verify' ? '/apply-verification' : '/profile/edit';
              return (
                <li key={task.id} className={task.done ? "done" : "pending"}>
                  <a 
                    href={linkTarget} 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      if (!task.done) toast.success("Pending info complete");
                      navigate(linkTarget); 
                    }}
                    style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}
                  >
                    <span className="icon">{task.done ? "✓" : "○"}</span> {task.label} {task.id === 'verify' && <span className="icon-blue">💎</span>}
                  </a>
                </li>
              );
            })}
          </ul>
          <a href="/profile/edit" className="complete-profile-link" onClick={(e) => { e.preventDefault(); navigate('/profile/edit'); }}>Complete Profile →</a>
        </div>

        {/* Verified Creators Card */}
        <div className="sidebar-card">
          <div className="card-header-flex">
            <h2 className="card-title">Verified Creators</h2>
            <a href="/discover" className="view-all-link">View all</a>
          </div>
          <div className="creator-list">
            {verifiedCreators.length === 0 ? (
              <div style={{ color: '#71839B', fontSize: '0.85rem' }}>No verified creators found.</div>
            ) : (
              verifiedCreators.map(c => (
                <div key={c._id} className="creator-item">
                  <img src={c.avatar ? (c.avatar.startsWith('http') ? c.avatar : `${BASE_URL}${c.avatar}`) : "/placeholder_avatar.png"} alt={c.username} className="creator-avatar" />
                  <div className="creator-info">
                    <span className="creator-name">{c.name || c.username} <span className="verified-icon">💎</span></span>
                    <span className="creator-category">{c.category || "Creator"}</span>
                  </div>
                  <button className="creator-btn btn-outline-primary" onClick={() => navigate(`/user/${c._id}`)}>Follow</button>
                </div>
              ))
            )}
          </div>
        </div>


      </div>
    </div>
  );
}

