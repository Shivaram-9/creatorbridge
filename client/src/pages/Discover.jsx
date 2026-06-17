import { useState, useEffect, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api.js";
import SmartDiscoverCard from "../components/SmartDiscoverCard.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { AuthContext } from "../context/AuthContext.jsx";
import { INFLUENCER_CATEGORIES, BRAND_CATEGORIES, ALL_CATEGORIES } from "../constants/categories.js";
import "./Discover.css";

// Loading Skeleton Component
const SkeletonCard = () => (
  <div className="smart-skeleton-card">
    <div className="smart-skeleton-header">
      <div className="smart-skeleton-avatar"></div>
      <div className="smart-skeleton-info">
        <div className="smart-skeleton-line short"></div>
        <div className="smart-skeleton-line"></div>
      </div>
    </div>
    <div className="smart-skeleton-metrics"></div>
    <div className="smart-skeleton-actions">
      <div className="smart-skeleton-btn"></div>
      <div className="smart-skeleton-btn"></div>
    </div>
  </div>
);

export default function Discover() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: currentUser } = useContext(AuthContext);
  
  const [discovery, setDiscovery] = useState({
    suggestedCreators: [],
    suggestedBrands: [],
    trendingCreators: [],
    trendingBrands: [],
  });
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");

  // Advanced Filters
  const isBrandViewer = currentUser?.role === "brand";
  const defaultTargetRole = isBrandViewer ? "influencer" : "brand";
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeRole, setActiveRole] = useState(defaultTargetRole);
  const [minMatchScore, setMinMatchScore] = useState(50);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Load Base Discovery Data
  useEffect(() => {
    async function loadDiscoverData() {
      setLoading(true);
      try {
        const [suggested, trending] = await Promise.all([
          api.discovery.getSuggested(),
          api.discovery.getTrending(),
        ]);

        setDiscovery({
          suggestedCreators: suggested.suggestedCreators || [],
          suggestedBrands: suggested.suggestedBrands || [],
          trendingCreators: trending.trendingCreators || [],
          trendingBrands: trending.trendingBrands || [],
        });
      } catch (err) {
        setError("Failed to load discovery engine data.");
      } finally {
        setLoading(false);
      }
    }
    loadDiscoverData();
  }, []);

  // Real-time Search & Filter Execution
  useEffect(() => {
    async function executeSearch() {
      if (!searchQuery && activeCategory === "All" && !verifiedOnly && minMatchScore <= 50) {
        setSearchResults([]);
        return;
      }
      
      setSearchLoading(true);
      try {
        const results = await api.users.search(searchQuery, { 
          role: activeRole,
          category: activeCategory !== "All" ? activeCategory : "",
          verified: verifiedOnly ? "true" : ""
        });
        
        let filtered = results.results || [];
        
        // Frontend filter for match score if backend didn't do it
        if (minMatchScore > 50) {
          filtered = filtered.filter(u => (u.matchScore || 0) >= minMatchScore);
        }

        setSearchResults(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setSearchLoading(false);
      }
    }
    
    // Debounce
    const timer = setTimeout(() => {
      executeSearch();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, activeRole, activeCategory, verifiedOnly, minMatchScore]);

  const displayCategories = activeRole === "influencer" ? INFLUENCER_CATEGORIES : BRAND_CATEGORIES;

  const isSearching = searchQuery || activeCategory !== "All" || verifiedOnly || minMatchScore > 50;

  return (
    <div className="smart-discover-container slide-fade-in">
      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div className="smart-discover-header">
        <div className="smart-header-text">
          <h1>Smart Discovery Engine</h1>
          <p>AI-powered matchmaking to find your perfect collaboration partners.</p>
        </div>
      </div>

      <div className="smart-discover-layout">
        
        {/* Left Sidebar: Advanced Filters */}
        <aside className="smart-discover-sidebar">
          <div className="smart-filter-group">
            <div className="smart-search-wrap">
              <svg className="smart-search-icon" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="smart-search-input"
                placeholder={`Search ${activeRole}s...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="smart-filter-group">
            <h4>Target Partner</h4>
            <div className="smart-toggle-pills">
              <button 
                className={`smart-pill ${activeRole === 'influencer' ? 'active' : ''}`}
                onClick={() => { setActiveRole('influencer'); setActiveCategory("All"); }}
              >
                Creators
              </button>
              <button 
                className={`smart-pill ${activeRole === 'brand' ? 'active' : ''}`}
                onClick={() => { setActiveRole('brand'); setActiveCategory("All"); }}
              >
                Brands
              </button>
            </div>
          </div>

          <div className="smart-filter-group">
            <h4>Industry / Niche</h4>
            <select
              className="smart-select"
              value={activeCategory}
              onChange={e => setActiveCategory(e.target.value)}
            >
              <option value="All">Any Industry</option>
              {displayCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="smart-filter-group">
            <h4>Minimum AI Match Score</h4>
            <div className="smart-range-wrap">
              <span>{minMatchScore}%</span>
              <input 
                type="range" 
                min="50" max="95" step="5" 
                value={minMatchScore} 
                onChange={e => setMinMatchScore(parseInt(e.target.value))} 
                className="smart-range-slider"
              />
            </div>
          </div>

          <div className="smart-filter-group">
            <label className="smart-checkbox-label">
              <input 
                type="checkbox" 
                checked={verifiedOnly} 
                onChange={e => setVerifiedOnly(e.target.checked)} 
              />
              <span className="smart-checkbox-text">Verified Partners Only</span>
            </label>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="smart-discover-main">
          
          {isSearching ? (
            <div className="smart-section">
              <h2 className="smart-section-title">Search Results</h2>
              {searchLoading ? (
                <div className="smart-grid">
                  {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="smart-empty-state">
                  <span className="smart-empty-icon">🔍</span>
                  <h3>No matches found</h3>
                  <p>Try adjusting your filters or lowering the required Match Score.</p>
                </div>
              ) : (
                <div className="smart-grid">
                  {searchResults.map(u => <SmartDiscoverCard key={u._id} user={u} />)}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Dynamic Suggested Section based on Viewer Role */}
              <div className="smart-section">
                <h2 className="smart-section-title">
                  {isBrandViewer ? '🔥 Trending Creators for Your Campaigns' : '💼 New Brand Opportunities'}
                </h2>
                <p className="smart-section-subtitle">High-performing partners heavily matching your profile</p>
                
                {loading ? (
                  <div className="smart-carousel">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                  </div>
                ) : (
                  <div className="smart-carousel">
                    {(isBrandViewer ? discovery.suggestedCreators : discovery.suggestedBrands).slice(0, 8).map(u => (
                      <div key={u._id} className="smart-carousel-item">
                        <SmartDiscoverCard user={u} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Secondary Section */}
              <div className="smart-section">
                <h2 className="smart-section-title">
                  {isBrandViewer ? '🏆 Top Rated Brands (Competitors)' : '✨ Trending Creators (Inspiration)'}
                </h2>
                
                {loading ? (
                  <div className="smart-carousel">
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                  </div>
                ) : (
                  <div className="smart-carousel">
                    {(isBrandViewer ? discovery.trendingBrands : discovery.trendingCreators).slice(0, 8).map(u => (
                      <div key={u._id} className="smart-carousel-item">
                        <SmartDiscoverCard user={u} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </>
          )}

        </main>
      </div>
    </div>
  );
}
