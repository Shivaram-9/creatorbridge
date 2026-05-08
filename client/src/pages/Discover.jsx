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
    <div className="discover-v2 slide-in">

      <header className="discover-header">
        <div className="header-badge">AI DISCOVERY ACTIVE</div>
        <h1>Intelligent Search</h1>
        <p>Smart recommendations based on your behavior and interests.</p>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div className="discover-content">
        
        {/* Trending Posts Milestone Section */}
        {discovery.trendingPosts.length > 0 && (
          <section className="discover-section">
            <div className="section-header">
              <h2>Trending Now</h2>
              <span className="trend-label">LIVE ENGAGEMENT</span>
            </div>
            <div className="trending-posts-grid">
              {discovery.trendingPosts.slice(0, 6).map(post => (
                <PostCard 
                  key={post._id} 
                  post={post} 
                  onDelete={() => {}} 
                  onUpdate={() => {}} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Suggested For You - Creators */}
        <section className="discover-section">
          <div className="section-header">
            <h2>Suggested Creators</h2>
            <p>Creators matching your niche and interests.</p>
          </div>
          <div className="user-grid">
            {discovery.suggestedCreators.map(u => <UserCard key={u._id} user={u} />)}
          </div>
        </section>

        {/* Suggested For You - Brands */}
        <section className="discover-section">
          <div className="section-header">
            <h2>Suggested Brands</h2>
            <p>Brands looking for creators like you.</p>
          </div>
          <div className="user-grid">
            {discovery.suggestedBrands.map(u => <UserCard key={u._id} user={u} />)}
          </div>
        </section>

        {/* Explore All with Filters */}
        <section className="explore-section">
          <div className="explore-header">
            <h2>Global Marketplace</h2>
            <div className="filter-bar">
              <select 
                className="filter-select" 
                value={activeCategory} 
                onChange={(e) => setActiveCategory(e.target.value)}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                className="filter-select" 
                value={activeRole} 
                onChange={(e) => setActiveRole(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="influencer">Influencers</option>
                <option value="brand">Brands</option>
              </select>

              <label className="verified-toggle">
                <input 
                  type="checkbox" 
                  checked={onlyVerified} 
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                />
                Verified Only
              </label>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="empty-results">
              <div className="icon">🔍</div>
              <h3>No creators found</h3>
              <p>Try adjusting your smart filters.</p>
            </div>
          ) : (
            <div className="user-grid">
              {filteredUsers.map(u => <UserCard key={u._id} user={u} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
