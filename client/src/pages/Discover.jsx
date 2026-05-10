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
    <div className="discover-v2 slide-fade-in">

      <header className="page-header-block">
        <h1 className="page-title-main">Intelligent Search</h1>
        <p className="page-subtitle-main">Smart recommendations based on your behavior and interests.</p>
      </header>


      <ErrorBanner message={error} onDismiss={() => setError("")} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '2px', padding: '2px' }}>
          {discovery.trendingPosts.length > 0 ? (
            discovery.trendingPosts.map(post => (
              <div key={post._id} style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
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
              <div key={i} style={{ aspectRatio: '1/1', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}>
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
    </div>
  );
}
