import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import UserCard from "../components/UserCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { INFLUENCER_CATEGORIES, BRAND_CATEGORIES, ALL_CATEGORIES, getRelatedCategories } from "../constants/categories.js";
import { CITIES } from "../constants/cities.js";
import EmptyState from "../components/EmptyState.jsx";
import { SearchIcon, SparklesIcon } from "../components/Icons.jsx";
import "./Discover.css"; // Reuse discover CSS for grid layout

export default function CategorySearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  
  const [exactMatches, setExactMatches] = useState([]);
  const [relatedMatches, setRelatedMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const targetRole = user?.role === "brand" ? "influencer" : "brand";
  const targetText = targetRole === "brand" ? "brands" : "Creators";

  // Backend-driven filtering
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError("");
      try {
        // Fetch exact matches from backend
        const exact = await api.users.list({ category: selectedCategory, city: selectedCity, role: targetRole });
        setExactMatches(Array.isArray(exact) ? exact : []);

        // If a category is selected and we want related matches
        if (selectedCategory) {
          const relatedCats = getRelatedCategories(selectedCategory);
          if (relatedCats.length > 0) {
            // We can't easily fetch ALL related categories in one request with the current API unless we loop or modify backend.
            // For now, if exact matches are 0, we can show a hint, or we can fetch them.
            // We'll fetch them individually or let the empty state handle the suggestions visually.
            setRelatedMatches([]);
          } else {
            setRelatedMatches([]);
          }
        } else {
          setRelatedMatches([]);
        }
      } catch (err) {
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [selectedCategory, selectedCity, targetRole]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedCity) params.set("city", selectedCity);
    setSearchParams(params, { replace: true });
  }, [selectedCategory, selectedCity, setSearchParams]);

  if (loading) return <LoadingSpinner centered />;

  // Categories available for filtering
  const categoriesToSelect = targetRole === "brand" ? BRAND_CATEGORIES : INFLUENCER_CATEGORIES;
  const activeCategory = selectedCategory;

  return (
    <div className="discover-container fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => navigate('/discover')}
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', cursor: 'pointer', fontSize: '15px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', padding: '8px 16px', borderRadius: '100px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--hover-bg)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
        >
          <span>←</span> Back
        </button>
        <h1 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>Find Your Collab</h1>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div style={{ position: 'sticky', top: '70px', background: 'var(--bg-main)', zIndex: 10, paddingBottom: '16px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
        <div className="discover-filters" style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              fontSize: '15px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              width: '100%',
              maxWidth: '300px',
              outline: 'none',
              appearance: 'auto'
            }}
          >
            <option value="">All Categories {user?.category ? `(${user.category})` : ''}</option>
            {categoriesToSelect.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select 
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid var(--border-light)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              fontSize: '15px',
              fontFamily: 'inherit',
              cursor: 'pointer',
              width: '100%',
              maxWidth: '200px',
              outline: 'none',
              appearance: 'auto'
            }}
          >
            <option value="">All Cities</option>
            {CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="discover-section">
          {/* Alert banner for default view vs filtered view */}
          {!selectedCategory && !selectedCity && (
            <div style={{ background: 'var(--bg-secondary)', padding: '12px 20px', borderRadius: '12px', color: 'var(--text-main)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-light)', marginBottom: '24px' }}>
              <span style={{ color: 'var(--primary-color)' }}>✨</span> Showing all verified {targetText} in the network.
            </div>
          )}
          
          {(selectedCategory || selectedCity) && (
            <div style={{ background: '#e0f2fe', padding: '12px 20px', borderRadius: '12px', color: '#0369a1', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #bae6fd', marginBottom: '24px' }}>
              <span style={{ color: '#0ea5e9' }}>✨</span> Showing {targetText} matched to your selected filters.
            </div>
          )}

        {exactMatches.length === 0 ? (
          <EmptyState 
            icon={<SearchIcon />} 
            title={`No ${targetText} found`} 
            description={activeCategory ? `We couldn't find any exact matches for ${activeCategory}${selectedCity ? ` in ${selectedCity}` : ''}. You might want to try related categories like ${getRelatedCategories(activeCategory).slice(0, 3).join(', ')} or clear your city filter.` : "We couldn't find any matches. Try clearing your filters!"}
            actionText={selectedCategory || selectedCity ? "Clear Filters" : null}
            onAction={() => { setSelectedCategory(""); setSelectedCity(""); }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {exactMatches.length > 0 && (
              <div>
                {activeCategory && <h3 style={{ marginBottom: '16px', color: 'var(--text-main)', fontSize: '18px' }}>Exact Matches</h3>}
                <div className="discover-user-grid">
                  {exactMatches.map(u => <UserCard key={u._id} user={u} layout="list" />)}
                </div>
              </div>
            )}

            {relatedMatches.length > 0 && (
              <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SparklesIcon /> 
                  Related Suggestions (Categories like {getRelatedCategories(activeCategory).slice(0, 3).join(', ')}...)
                </h3>
                <div className="discover-user-grid">
                  {relatedMatches.map(u => <UserCard key={u._id} user={u} layout="list" />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
