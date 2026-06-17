import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import UserCard from "../components/UserCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { INFLUENCER_CATEGORIES, BRAND_CATEGORIES, ALL_CATEGORIES } from "../constants/categories.js";
import "./Discover.css";

const EXPLORE_PHOTOS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=80",
  "https://images.unsplash.com/photo-1682685797365-41f45b562c0a?w=300&q=80",
  "https://images.unsplash.com/photo-1682686580391-615b1f28e5ee?w=300&q=80",
  "https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=300&q=80",
  "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=80",
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300&q=80",
  "https://images.unsplash.com/photo-1495147466023-ac5c588e2e94?w=300&q=80",
  "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=300&q=80",
  "https://images.unsplash.com/photo-1526779259212-939e64788e3c?w=300&q=80",
  "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=300&q=80",
  "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=300&q=80",
];

export default function Discover() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  // Update searchQuery if URL changes
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Filters
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeRole, setActiveRole] = useState("all");

  useEffect(() => {
    async function loadDiscoverData() {
      const cached = localStorage.getItem("cb_discovery_cache");
      const cachedTime = localStorage.getItem("cb_discovery_time");
      if (cached && cachedTime && (Date.now() - parseInt(cachedTime)) < 300000) {
        setDiscovery(JSON.parse(cached));
        setLoading(false);
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
        setError("Failed to load discovery data.");
      } finally {
        setLoading(false);
      }
    }
    loadDiscoverData();
  }, []);

  const filteredUsers = allUsers.filter(u => {
    if (!u) return false;
    const q = searchQuery.toLowerCase();
    const name = (u.name || "").toLowerCase();
    const username = (u.username || "").toLowerCase();
    const bio = (u.bio || "").toLowerCase();
    
    const matchSearch = !q || (name.includes(q) || username.includes(q) || bio.includes(q));
    const matchCategory = activeCategory === "All" || u.category === activeCategory;
    const matchRole = activeRole === "all" || u.role === activeRole;
    return matchSearch && matchCategory && matchRole;
  });

  const displayCategories = activeRole === "influencer" 
    ? INFLUENCER_CATEGORIES 
    : activeRole === "brand" 
      ? BRAND_CATEGORIES 
      : ALL_CATEGORIES;

  if (loading) return <LoadingSpinner centered />;

  const exploreGrid = discovery.trendingPosts.length > 0
    ? discovery.trendingPosts
    : null;

  return (
    <div className="discover-v2 slide-fade-in">
      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {/* Search Bar */}
      <div className="discover-search-wrap">
        <div className="discover-search-inner">
          <svg className="discover-search-icon" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="discover-search-input"
            placeholder="Search creators, brands..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="discover-search-clear" onClick={() => setSearchQuery("")}>✕</button>
          )}
        </div>
      </div>

      {/* If user is searching, show search results */}
      {searchQuery ? (
        <div className="discover-section">
          <h2 className="discover-section-title">Results for "{searchQuery}"</h2>
          {filteredUsers.length === 0 ? (
            <div className="discover-empty">
              <span>🔍</span>
              <p>No creators found. Try a different search.</p>
            </div>
          ) : (
            <div className="discover-user-grid">
              {filteredUsers.map(u => <UserCard key={u._id} user={u} layout="list" />)}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Featured Sections */}
          <div className="discover-featured-sections">
            {/* Trending Creators Carousel */}
            {discovery.suggestedCreators.length > 0 && (
              <div className="discover-featured-row">
                <div className="discover-featured-header">
                  <h3>Featured Creators</h3>
                  <button onClick={() => { setActiveRole("influencer"); window.scrollTo(0, 500); }}>See All</button>
                </div>
                <div className="discover-user-grid">
                  {discovery.suggestedCreators.map(u => (
                    <UserCard key={u._id} user={u} layout="list" />
                  ))}
                </div>
              </div>
            )}

            {/* Trending Brands Carousel */}
            {discovery.suggestedBrands.length > 0 && (
              <div className="discover-featured-row">
                <div className="discover-featured-header">
                  <h3>Featured Brands</h3>
                  <button onClick={() => { setActiveRole("brand"); window.scrollTo(0, 500); }}>See All</button>
                </div>
                <div className="discover-user-grid">
                  {discovery.suggestedBrands.map(u => (
                    <UserCard key={u._id} user={u} layout="list" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Explore Grid (Trending Posts) */}
          {exploreGrid && exploreGrid.length > 0 && (
            <div className="discover-section">
              <h2 className="discover-section-title">Trending Now</h2>
              <div className="discover-explore-grid">
                {exploreGrid.slice(0, 9).map((post, i) => {
                  const media = post.media && post.media.length > 0 ? post.media[0] : post.image;
                  const src = media?.startsWith("http") ? media : `${api.getResolvedApiOrigin()}${media}`;
                  
                  // if no media, fallback to placeholder
                  const bgImage = src || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=400";
                  const isVideoUrl = !!bgImage.toLowerCase().split('?')[0].match(/\.(mp4|mov|webm|ogg|mkv|avi|m4v|3gp)$/) || bgImage.toLowerCase().includes('/video/') || bgImage.toLowerCase().includes('video/upload');

                  return (
                    <div 
                      key={post._id} 
                      className={`discover-grid-item ${i % 5 === 0 ? 'large' : ''}`}
                      onClick={() => navigate(`/post/${post._id}`)}
                    >
                      {isVideoUrl ? (
                        <video src={`${bgImage}#t=0.001`} className="discover-grid-img" preload="metadata" muted playsInline />
                      ) : (
                        <img src={bgImage} className="discover-grid-img" alt="Trending" />
                      )}
                      <div className="discover-grid-overlay">
                        <span>❤️ {post.likes?.length || 0}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Global Marketplace Section */}
          <div className="discover-marketplace-section">
            <div className="discover-marketplace-header">
              <h2 className="discover-marketplace-title">Global Directory</h2>
              <div className="discover-filters">
                <select
                  className="discover-filter-select"
                  value={activeCategory}
                  onChange={e => setActiveCategory(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  {displayCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select
                  className="discover-filter-select"
                  value={activeRole}
                  onChange={e => {
                    setActiveRole(e.target.value);
                    setActiveCategory("All");
                  }}
                >
                  <option value="all">All Roles</option>
                  <option value="influencer">Creators</option>
                  <option value="brand">Brands</option>
                </select>
              </div>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="discover-empty">
                <p>No users found for this filter.</p>
              </div>
            ) : (
              <div className="discover-user-grid">
                {filteredUsers.map(u => <UserCard key={u._id} user={u} layout="list" />)}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
