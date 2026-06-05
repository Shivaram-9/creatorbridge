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

function HeroBanner({ user }) {
  const navigate = useNavigate();
  return (
    <div className="mb-8 pt-4 px-2 md:px-0">
      <div className="max-w-2xl">
        <h1 className="text-2xl md:text-3xl font-extrabold mb-3 text-slate-900 tracking-tight">Discover Top Creators & Brands</h1>
        <p className="text-slate-600 text-base md:text-lg mb-6 leading-relaxed">
          The premium network for builders, designers, and innovators. Showcase your portfolio and connect with verified professionals.
        </p>
      </div>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState("All Feed");
  const [showVerificationBanner, setShowVerificationBanner] = useState(true);
  const [showFeedDropdown, setShowFeedDropdown] = useState(false);

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




        <HeroBanner user={user} />

        {/* New Post Box */}
        <CreatePost onPost={handleAddPost} user={user} />

        {/* Feed Tabs */}
        {/* Feed Tabs Dropdown */}
        <div className="feed-tabs-container">
          <div className="feed-dropdown-wrapper">
            <button 
              className="feed-dropdown-toggle"
              onClick={() => setShowFeedDropdown(!showFeedDropdown)}
            >
              <span className="active-tab-label">{activeTab}</span>
              <svg className="dropdown-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            
            {showFeedDropdown && (
              <>
                <div className="dropdown-overlay" onClick={() => setShowFeedDropdown(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }} />
                <div className="feed-dropdown-menu">
                  {["All Feed", "Trending", "Recently Launched", "Following"].map(tab => (
                    <button 
                      key={tab}
                      className={`feed-dropdown-item ${activeTab === tab ? "active" : ""}`}
                      onClick={() => {
                        setActiveTab(tab);
                        setShowFeedDropdown(false);
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </>
            )}
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
    </div>
  );
}

