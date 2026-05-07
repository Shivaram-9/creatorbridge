import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import UserCard from "../components/UserCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { CATEGORIES } from "../constants/categories.js";

export default function Discover() {
  const [trending, setTrending] = useState([]);
  const [verified, setVerified] = useState([]);
  const [brands, setBrands] = useState([]);
  const [suggested, setSuggested] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filters
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeRole, setActiveRole] = useState("all");
  const [onlyVerified, setOnlyVerified] = useState(false);

  useEffect(() => {
    async function loadDiscoverData() {
      setLoading(true);
      try {
        const [t, v, b, s, a] = await Promise.all([
          api.users.getTrending(),
          api.users.getVerified(),
          api.users.getBrands(),
          api.users.getSuggested(),
          api.users.list()
        ]);
        
        setTrending(Array.isArray(t) ? t : []);
        setVerified(Array.isArray(v) ? v : []);
        setBrands(Array.isArray(b) ? b : []);
        setSuggested(Array.isArray(s) ? s : []);
        setAllUsers(Array.isArray(a) ? a : []);
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
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', color: '#1a1a1a', marginBottom: '0.5rem' }}>Discover</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Find your next collaboration partner in the marketplace.</p>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {/* Discovery Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
        
        {/* Trending */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a1a' }}>Trending Creators</h2>
            <div style={{ width: '40px', height: '2px', backgroundColor: '#e2e8f0' }}></div>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {trending.map(u => <UserCard key={u._id} user={u} />)}
          </div>
        </section>

        {/* Verified Marketplace */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a1a' }}>Verified Marketplace</h2>
            <div style={{ width: '40px', height: '2px', backgroundColor: '#e2e8f0' }}></div>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {verified.map(u => <UserCard key={u._id} user={u} />)}
          </div>
        </section>

        {/* Brands */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a1a' }}>Popular Brands</h2>
            <div style={{ width: '40px', height: '2px', backgroundColor: '#e2e8f0' }}></div>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {brands.map(u => <UserCard key={u._id} user={u} />)}
          </div>
        </section>

        {/* Suggested */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1a1a1a' }}>Suggested For You</h2>
            <div style={{ width: '40px', height: '2px', backgroundColor: '#e2e8f0' }}></div>
          </div>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {suggested.map(u => <UserCard key={u._id} user={u} />)}
          </div>
        </section>

        {/* Explore All with Filters */}
        <section style={{ borderTop: '1px solid #f1f5f9', paddingTop: '4rem' }}>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '1.5rem' }}>Explore Marketplace</h2>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <select 
                className="filter-select" 
                value={activeCategory} 
                onChange={(e) => setActiveCategory(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                className="filter-select" 
                value={activeRole} 
                onChange={(e) => setActiveRole(e.target.value)}
                style={{ padding: '10px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', outline: 'none', fontWeight: 600 }}
              >
                <option value="all">All Roles</option>
                <option value="influencer">Influencers</option>
                <option value="brand">Brands</option>
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  checked={onlyVerified} 
                  onChange={(e) => setOnlyVerified(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                Verified Only
              </label>
            </div>
          </div>

          {filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h3>No users match your filters</h3>
              <p>Try broadening your search criteria.</p>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
              gap: '1.5rem' 
            }}>
              {filteredUsers.map(u => <UserCard key={u._id} user={u} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
