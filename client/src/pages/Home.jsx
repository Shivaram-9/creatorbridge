import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { BASE_URL } from "../config/api.js";
import PostCard from "../components/PostCard.jsx";
import CreatePost from "../components/CreatePost.jsx";
import StoriesBar from "../components/StoriesBar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import toast from "react-hot-toast";

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.posts.list({ _t: Date.now() });
      if (data?.error) {
        // Silence the "invalid response" toast as it's confusing and often transient
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
    // Auto-refresh feed every 2 minutes for real-time feel
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
        // Refresh feed immediately to show new post
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

  const demoPosts = [
    {
      _id: "demo1",
      user: {
        _id: "demo_user_1",
        name: "CreatorBridge Official",
        username: "creatorbridge",
        avatar: "https://ui-avatars.com/api/?name=Creator+Bridge&background=0095f6&color=fff",
        isVerified: true
      },
      content: "Welcome to CreatorBridge! 🚀 This is a sample post. Start following other creators and brands to fill your feed with amazing content.",
      likes: ["1", "2", "3", "4", "5"],
      comments: [
        { _id: "c1", user: { name: "User1", username: "user1" }, text: "Welcome!" }
      ],
      createdAt: new Date().toISOString()
    },
    {
      _id: "demo2",
      user: {
        _id: "demo_user_2",
        name: "Photography Hub",
        username: "photo.hub",
        avatar: "https://ui-avatars.com/api/?name=Photo+Hub&background=10b981&color=fff"
      },
      content: "Capturing the golden hour perfectly. 🌅 What's your favorite time to shoot? #photography #goldenhour",
      media: ["https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80"],
      likes: ["1", "2"],
      comments: [],
      createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    }
  ];

  return (
    <div style={{ paddingBottom: '80px', paddingTop: '16px' }}>
      <StoriesBar />
      <CreatePost onPost={handleAddPost} user={user} />

      {loading ? (
        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : (
        <>
        <div className="home-feed-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '20px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Alliance Feed</h2>
          <button 
            onClick={loadPosts} 
            disabled={loading}
            style={{ 
              background: 'white', 
              border: '1px solid #e2e8f0', 
              padding: '6px 12px', 
              borderRadius: '20px', 
              fontSize: '12px', 
              fontWeight: '600', 
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
          >
            <svg style={{ width: '14px', height: '14px', transform: loading ? 'rotate(360deg)' : 'none', transition: 'transform 0.5s linear' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? "Refreshing..." : "Refresh Feed"}
          </button>
        </div>

        {posts.length > 0 ? (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {posts.map((post) => (
            <PostCard 
              key={post._id} 
              post={formatPost(post)} 
              onDelete={(id) => setPosts(prev => prev.filter(p => p._id !== id))}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state" style={{ 
          marginTop: '60px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤝</div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginBottom: '8px' }}>Welcome! Your Alliance Feed is Empty</h2>
          <p style={{ color: '#64748b', maxWidth: '300px', margin: '0 auto 24px' }}>
            Align with creators and brands to see their latest posts here!
          </p>
          <button 
            className="btn btn-primary" 
            style={{ 
              marginTop: '8px',
              padding: '10px 24px',
              borderRadius: '8px',
              fontWeight: '600'
            }}
            onClick={() => navigate("/discover")}
          >
            Discover Creators
          </button>
        </div>
        </>
      )}
    </div>
  );
}

