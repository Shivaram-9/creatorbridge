import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import UserCard from "../components/UserCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { INFLUENCER_CATEGORIES, BRAND_CATEGORIES, ALL_CATEGORIES } from "../constants/categories.js";
import "./Discover.css"; // Reuse discover CSS for grid layout

export default function CategorySearch() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedCity, setSelectedCity] = useState(searchParams.get("city") || "");
  
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const users = await api.users.list();
        setAllUsers(Array.isArray(users) ? users : []);
      } catch (err) {
        setError("Failed to load users");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedCity) params.set("city", selectedCity);
    setSearchParams(params, { replace: true });
  }, [selectedCategory, selectedCity, setSearchParams]);

  if (loading) return <LoadingSpinner centered />;

  // Cross-role discovery: Influencers find Brands, Brands find Influencers
  const targetRole = user?.role === "brand" ? "influencer" : "brand";
  const targetText = targetRole === "brand" ? "brands" : "influencers";
  
  // Dynamically extract unique cities from users of the target role
  const availableCities = Array.from(new Set(
    allUsers.filter(u => u.role === targetRole && u.location && u.location.trim() !== "").map(u => u.location.trim())
  )).sort();

  // Available categories to select based on user role
  const categoriesToSelect = targetRole === "brand" ? BRAND_CATEGORIES : INFLUENCER_CATEGORIES;

  // If the user hasn't actively selected a category, use their own profile category as the default for suggestions
  const activeCategory = selectedCategory || user?.category || user?.industry || "";

  const searchResults = allUsers.filter(u => {
    if (!u || u._id === user?._id) return false;
    
    // Exact match on role (brand looking for brand, influencer looking for influencer)
    if (u.role !== targetRole) return false;

    // Filter by city if selected
    if (selectedCity && u.location?.trim() !== selectedCity) return false;

    // Filter by category
    if (!activeCategory) return true; // Show all if no category selected and user has no category
    return (u.category || u.industry || "") === activeCategory;
  });

  return (
    <div className="discover-container fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={() => navigate('/discover')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)' }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Find Your Collab</h1>
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
            {availableCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="discover-section">
        <div className="discover-search-announcement" style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-main)', fontWeight: '500' }}>
          <p>The suggested {targetText} according to your category and city</p>
        </div>

        {searchResults.length === 0 ? (
          <div className="discover-empty">
            <span>🔍</span>
            <p>No {targetText} found.</p>
          </div>
        ) : (
          <div className="discover-user-grid">
            {searchResults.map(u => <UserCard key={u._id} user={u} layout="list" />)}
          </div>
        )}
      </div>
    </div>
  );
}
