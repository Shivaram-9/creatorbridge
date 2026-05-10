import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import UserCard from "../components/UserCard.jsx";
import PostCard from "../components/PostCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { CATEGORIES } from "../constants/categories.js";
import "./Discover.css";

export default function Discover() {
  const [discovery, setDiscovery] = useState({
    suggestedCreators: [],
    suggestedBrands: [],
    trendingPosts: [],
    trendingCreators: [],
    trendingBrands: []
  });
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeRole, setActiveRole] = useState("all");
  const [onlyVerified, setOnlyVerified] = useState(false);

  useEffect(() => {
    async function loadDiscoverData() {
      // Caching logic (Prompt-7)
      const cached = localStorage.getItem("cb_discovery_cache");
      const cachedTime = localStorage.getItem("cb_discovery_time");
      if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < 300000) { // 5 mins
        setDiscovery(JSON.parse(cached));
        setLoading(false);
        // Still fetch all users as it might change more frequently or for search
        const all = await api.users.list();
        setAllUsers(Array.isArray(all) ? all : []);
        return;
      }

      setLoading(true);
      try {
        const [suggested, trending, all] = await Promise.all([
          api.discovery.getSuggested(),
          api.discovery.getTrending(),
          api.users.list()
        ]);
        
        const data = {
          suggestedCreators: suggested.suggestedCreators || [],
          suggestedBrands: suggested.suggestedBrands || [],
          trendingPosts: trending.trendingPosts || [],
          trendingCreators: trending.trendingCreators || [],
          trendingBrands: trending.trendingBrands || []
        };
        setDiscovery(data);
        setAllUsers(Array.isArray(all) ? all : []);
        
        localStorage.setItem("cb_discovery_cache", JSON.stringify(data));
        localStorage.setItem("cb_discovery_time", Date.now().toString());
      } catch (err) {
        setError("Failed to load discovery data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadDiscoverData();
  }, []);

  const filteredUsers = allUsers.filter(u => {
    const matchCategory = activeCategory === "All" || u.category === activeCategory;
    const matchRole = activeRole === "all" || u.role === activeRole;
    const matchVerified = !onlyVerified || u.isVerified;
    return matchCategory && matchRole && matchVerified;
  });

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="discover-v2 slide-fade-in" style={{ width: '100%', maxWidth: '935px', margin: '0 auto', paddingTop: '20px' }}>
      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div style={{ padding: '0 10px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Intelligent Search</h1>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Smart recommendations based on your behavior and interests.</p>
          </div>
          <div style={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <input 
              type="text" 
              placeholder="Search..." 
              style={{ width: '100%', padding: '10px 16px', borderRadius: '20px', border: '1px solid #dbdbdb', outline: 'none', background: '#fafafa' }} 
            />
          </div>
        </div>
        
        <h2 style={{ fontSize: '1.2rem', fontWeight: '600', margin: '24px 0 12px 0' }}>Global Marketplace</h2>
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <select 
            value={activeCategory} 
            onChange={(e) => setActiveCategory(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #dbdbdb', outline: 'none', background: 'white', fontWeight: '500' }}
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={activeRole} 
            onChange={(e) => setActiveRole(e.target.value)}
            style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #dbdbdb', outline: 'none', background: 'white', fontWeight: '500' }}
          >
            <option value="all">All Roles</option>
            <option value="influencer">Influencers</option>
            <option value="brand">Brands</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '4px', padding: '0 10px' }}>
        {discovery.trendingPosts.length > 0 ? (
          discovery.trendingPosts.map(post => (
            <div key={post._id} style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden', cursor: 'pointer', background: '#efefef' }}>
              <img 
                src={post.media?.[0]?.startsWith('http') ? post.media[0] : `${api.BASE_URL}${post.media?.[0] || '/default-post.jpg'}`} 
                alt="" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=300&q=80" }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}
                   onMouseEnter={e => e.currentTarget.style.opacity = 1}
                   onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                ❤️ {post.likes?.length || 0}
              </div>
            </div>
          ))
        ) : (
          // Demo Instagram-style explore grid items
          [1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
            <div key={i} style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden', cursor: 'pointer', background: '#efefef' }}>
              <img 
                src={`https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&w=300&q=80`} 
                alt="Explore" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
