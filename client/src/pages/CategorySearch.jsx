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
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  
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

  // Update URL when search or category changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    setSearchParams(params, { replace: true });
  }, [searchQuery, selectedCategory, setSearchParams]);

  if (loading) return <LoadingSpinner centered />;

  // The client requested: "getting the same category brands to brands and influencers to influencers"
  const targetRole = user?.role || "influencer"; // fallback if no user
  const targetText = targetRole === "brand" ? "brands" : "influencers";

  // Available categories to select based on user role
  const categoriesToSelect = targetRole === "brand" ? BRAND_CATEGORIES : INFLUENCER_CATEGORIES;

  // If the user hasn't actively selected a category, use their own profile category as the default for suggestions
  const activeCategory = selectedCategory || user?.category || user?.industry || "";

  const searchResults = allUsers.filter(u => {
    if (!u || u._id === user?._id) return false;
    
    // Exact match on role (brand looking for brand, influencer looking for influencer)
    if (u.role !== targetRole) return false;

    // Filter by text query if exists
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (u.name || "").toLowerCase();
      const username = (u.username || "").toLowerCase();
      const bio = (u.bio || "").toLowerCase();
      const cat = (u.category || u.industry || "").toLowerCase();
      
      return name.includes(q) || username.includes(q) || bio.includes(q) || cat.includes(q);
    }

    // Otherwise, filter by category
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
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Category Search</h1>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      <div style={{ position: 'sticky', top: '70px', background: 'var(--bg-main)', zIndex: 10, paddingBottom: '16px', borderBottom: '1px solid var(--border-light)', marginBottom: '24px' }}>
        <div className="discover-search-wrap" style={{ marginBottom: '16px' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="discover-search-input"
            placeholder={`Search ${targetText}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className="discover-filters" style={{ padding: 0 }}>
          <button 
            className={`filter-pill ${!selectedCategory ? 'active' : ''}`}
            onClick={() => setSelectedCategory("")}
          >
            My Category {user?.category ? `(${user.category})` : ''}
          </button>
          {categoriesToSelect.map(cat => (
            <button
              key={cat}
              className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="discover-section">
        <div className="discover-search-announcement" style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', color: 'var(--text-main)', fontWeight: '500' }}>
          {searchQuery ? (
            <p>Showing {targetText} matching "{searchQuery}"</p>
          ) : (
            <p>The suggested {targetText} according to your category or categories</p>
          )}
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
