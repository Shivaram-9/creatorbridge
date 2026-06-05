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
  return (
    <div className="bg-blue-600 rounded-2xl p-8 mb-8 text-white shadow-lg relative overflow-hidden">
      <div className="relative z-10 max-w-2xl">
        <h1 className="text-3xl font-extrabold mb-3 tracking-tight">Discover Top Creators & Projects</h1>
        <p className="text-blue-100 text-lg mb-6 leading-relaxed">
          The premium network for builders, designers, and innovators. Showcase your portfolio and connect with verified professionals.
        </p>
        <div className="flex gap-4">
          <button className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-bold shadow hover:bg-blue-50 transition-colors">
            Post a Project
          </button>
          <button className="bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold border border-blue-500 hover:bg-blue-800 transition-colors">
            Explore Directory
          </button>
        </div>
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-blue-500 to-transparent opacity-50 hidden md:block"></div>
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

        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center justify-between">
            Featured Creators
            <span className="text-xs text-blue-600 normal-case hover:underline cursor-pointer">View all</span>
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex flex-col items-center gap-2 min-w-[80px] cursor-pointer group">
                <div className="w-16 h-16 rounded-full bg-slate-200 border-2 border-white shadow-sm group-hover:ring-2 ring-blue-500 transition-all"></div>
                <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600 truncate max-w-[80px]">Creator {i}</span>
              </div>
            ))}
          </div>
        </div>

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

