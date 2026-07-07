import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import UserCard from "../components/UserCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
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
  const [nearbyMatches, setNearbyMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const targetRole = user?.role === "brand" ? "influencer" : "brand";
  const targetText = targetRole === "brand" ? "brands" : "Creators";

  // Category Dropdown State
  const [dbCategories, setDbCategories] = useState([]);
  const [categorySearchQuery, setCategorySearchQuery] = useState(selectedCategory);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Fetch all categories (master + subcategories) to support search
    async function loadCategories() {
      try {
        const res = await fetch("/api/categories/onboarding");
        const data = await res.json();
        // Robust fallback in case data is array of strings (legacy) or objects
        const parsed = data.map(c => typeof c === 'string' ? { name: c, parent: null } : c);
        setDbCategories(parsed);
      } catch (err) {
        console.error("Failed to load categories:", err);
      }
    }
    loadCategories();
  }, []);

  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery || categorySearchQuery === selectedCategory) {
      // Show ALL categories (matching onboarding)
      return dbCategories.map(c => c.name);
    }
    // Show ALL matching categories when searching
    const query = categorySearchQuery.toLowerCase();
    const matched = dbCategories
      .filter(c => c.name.toLowerCase().includes(query))
      .map(c => c.name);
      
    // Sort so categories starting with the query appear first
    return matched.sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(query);
      const bStarts = b.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });
  }, [categorySearchQuery, dbCategories, selectedCategory]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
        setCategorySearchQuery(selectedCategory); // Reset search text to selected
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [selectedCategory]);

  // Backend-driven filtering
  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError("");
      try {
        // Fetch exact matches from backend
        const exact = await api.users.list({ category: selectedCategory, city: selectedCity, role: targetRole });
        setExactMatches(Array.isArray(exact) ? exact : []);

        // Fetch intelligent related/nearby suggestions if exact is empty
        if ((!exact || exact.length === 0) && (selectedCategory || selectedCity)) {
          if (selectedCategory) {
            const related = await api.users.list({ category: selectedCategory, role: targetRole });
            setRelatedMatches(Array.isArray(related) ? related.filter(r => r.location !== selectedCity) : []);
          }
          if (selectedCity && !selectedCategory) {
            const nearby = await api.users.list({ city: selectedCity, role: targetRole });
            setNearbyMatches(Array.isArray(nearby) ? nearby : []);
          }
        } else {
          setRelatedMatches([]);
          setNearbyMatches([]);
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
        <div className="discover-filters" style={{ padding: '8px 0', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          
          <div ref={dropdownRef} style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search Category..."
                value={categorySearchQuery}
                onFocus={() => {
                  setShowCategoryDropdown(true);
                  setCategorySearchQuery(""); // Clear on focus for easy searching
                }}
                onChange={(e) => {
                  setCategorySearchQuery(e.target.value);
                  setShowCategoryDropdown(true);
                }}
                style={{
                  padding: '12px 36px 12px 16px', // Extra right padding for chevron
                  borderRadius: '8px',
                  border: '1px solid var(--border-light)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-main)',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  width: '100%',
                  outline: 'none',
                  cursor: 'text'
                }}
              />
              {/* Native-looking dropdown chevron */}
              <div 
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCategoryDropdown(prev => !prev);
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
            
            {showCategoryDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-light)',
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                <div 
                  onClick={() => {
                    setSelectedCategory("");
                    setCategorySearchQuery("");
                    setShowCategoryDropdown(false);
                  }}
                  style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', color: selectedCategory === "" ? 'var(--primary-color)' : 'var(--text-main)', background: selectedCategory === "" ? 'var(--hover-bg)' : 'transparent' }}
                >
                  All Categories
                </div>
                {filteredCategories.map(cat => (
                  <div 
                    key={cat} 
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCategorySearchQuery(cat);
                      setShowCategoryDropdown(false);
                    }}
                    style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', color: selectedCategory === cat ? 'var(--primary-color)' : 'var(--text-main)', background: selectedCategory === cat ? 'var(--hover-bg)' : 'transparent' }}
                  >
                    {cat}
                  </div>
                ))}
                {filteredCategories.length === 0 && (
                   <div style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '14px' }}>No matching categories found.</div>
                )}
              </div>
            )}
          </div>

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

        {exactMatches.length === 0 && relatedMatches.length === 0 && nearbyMatches.length === 0 ? (
          <EmptyState 
            icon={<SearchIcon />} 
            title={`No ${targetText} found`} 
            description={`We couldn't find any exact matches for your filters. Try clearing your search and exploring different categories.`}
            actionText={selectedCategory || selectedCity ? "Clear Filters" : null}
            onAction={() => { setSelectedCategory(""); setSelectedCity(""); setCategorySearchQuery(""); }}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {exactMatches.length > 0 && (
              <div>
                {(selectedCategory || selectedCity) && <h3 style={{ marginBottom: '16px', color: 'var(--text-main)', fontSize: '18px' }}>Exact Matches</h3>}
                <div className="discover-user-grid">
                  {exactMatches.map(u => <UserCard key={u._id} user={u} layout="list" />)}
                </div>
              </div>
            )}

            {exactMatches.length === 0 && relatedMatches.length > 0 && (
              <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SparklesIcon /> 
                  Related {targetText === "brands" ? "Brands" : "Creators"} in {selectedCategory}
                </h3>
                <div className="discover-user-grid">
                  {relatedMatches.map(u => <UserCard key={u._id} user={u} layout="list" />)}
                </div>
              </div>
            )}

            {exactMatches.length === 0 && relatedMatches.length === 0 && nearbyMatches.length > 0 && (
              <div>
                <h3 style={{ marginBottom: '16px', color: 'var(--text-muted)', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SparklesIcon /> 
                  Nearby {targetText === "brands" ? "Brands" : "Creators"} in {selectedCity}
                </h3>
                <div className="discover-user-grid">
                  {nearbyMatches.map(u => <UserCard key={u._id} user={u} layout="list" />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

