import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import UserCard from "../components/UserCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import { INFLUENCER_CATEGORIES, BRAND_CATEGORIES, ALL_CATEGORIES, getRelatedCategories } from "../constants/categories.js";
import EmptyState from "../components/EmptyState.jsx";
import { SearchIcon, SparklesIcon } from "../components/Icons.jsx";
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
  const targetText = targetRole === "brand" ? "brands" : "Creators";
  
  // Comprehensive list of Indian cities
  const availableCities = [
    "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", 
    "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara", 
    "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut", "Rajkot", "Kalyan-Dombivli", "Vasai-Virar", "Varanasi", 
    "Srinagar", "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Ranchi", "Howrah", "Coimbatore", "Jabalpur", 
    "Gwalior", "Vijayawada", "Jodhpur", "Madurai", "Raipur", "Kota", "Guwahati", "Chandigarh", "Solapur", "Hubli-Dharwad",
    "Bareilly", "Moradabad", "Mysore", "Gurgaon", "Aligarh", "Jalandhar", "Tiruchirappalli", "Bhubaneswar", "Salem", "Mira-Bhayandar",
    "Warangal", "Thiruvananthapuram", "Bhiwandi", "Saharanpur", "Guntur", "Amravati", "Bikaner", "Noida", "Jamshedpur", "Bhilai",
    "Cuttack", "Firozabad", "Kochi", "Nellore", "Bhavnagar", "Dehradun", "Durgapur", "Asansol", "Rourkela", "Nanded",
    "Kolhapur", "Ajmer", "Akola", "Gulbarga", "Jamnagar", "Ujjain", "Loni", "Siliguri", "Jhansi", "Ulhasnagar",
    "Nellore", "Jammu", "Sangli-Miraj & Kupwad", "Mangalore", "Erode", "Belgaum", "Ambattur", "Tirunelveli", "Malegaon", "Gaya",
    "Jalgaon", "Udaipur", "Maheshtala", "Davanagere", "Kozhikode", "Kurnool", "Rajpur Sonarpur", "Rajahmundry", "Bokaro", "South Dumdum",
    "Bellary", "Patiala", "Gopalpur", "Agartala", "Bhagalpur", "Muzaffarnagar", "Bhatpara", "Panihati", "Latur", "Dhule",
    "Tirupati", "Rohtak", "Korba", "Bhilwara", "Berhampur", "Muzaffarpur", "Ahmednagar", "Mathura", "Kollam", "Avadi",
    "Kadapa", "Kamarhati", "Sambalpur", "Bilaspur", "Shahjahanpur", "Satara", "Bijapur", "Rampur", "Shivamogga", "Chandrapur",
    "Junagadh", "Thrissur", "Alwar", "Bardhaman", "Kulti", "Kakinada", "Nizamabad", "Parbhani", "Tumkur", "Khammam",
    "Ozhukarai", "Bihar Sharif", "Panipat", "Darbhanga", "Bally", "Aizawl", "Dewas", "Ichalkaranji", "Karnal", "Bathinda",
    "Jalna", "Eluru", "Barasat", "Kirari Suleman Nagar", "Purnia", "Satna", "Mau", "Sonipat", "Farrukhabad", "Sagar",
    "Rourkela", "Durg", "Imphal", "Ratlam", "Hapur", "Arrah", "Karimnagar", "Anantapur", "Etawah", "Ambernath",
    "North Dumdum", "Bharatpur", "Begusarai", "New Delhi", "Gandhidham", "Baranagar", "Tiruvottiyur", "Puducherry", "Sikar", "Thoothukudi",
    "Rewa", "Mirzapur", "Raichur", "Pali", "Ramagundam", "Haridwar", "Vijayanagaram", "Katihar", "Nagarcoil", "Sri Ganganagar",
    "Karawal Nagar", "Mango", "Thanjavur", "Bulandshahr", "Uluberia", "Murwara", "Rajpur Sonarpur", "Haldia", "Khandwa", "Nandyal",
    "Morena", "Amroha", "Anand", "Bhind", "Bhalswa Jahangir Pur", "Madhyamgram", "Bhiwani", "Navi Mumbai Panvel Raigad", "Baharampur", "Ambala",
    "Morvi", "Fatehpur", "Rae Bareli", "Khora", "Chittoor", "Bhusawal", "Orai", "Bahraich", "Phusro", "Vellore",
    "Mehsana", "Raiganj", "Sirsa", "Danapur", "Serampore", "Sultan Pur Majra", "Guna", "Jaunpur", "Panvel", "Shivpuri",
    "Surendranagar Dudhrej", "Unnao", "Chinsurah", "Alappuzha", "Kottayam", "Machilipatnam", "Shimla", "Adoni", "Udupi", "Kalyani"
  ].sort();

  // Available categories to select based on user role
  const categoriesToSelect = targetRole === "brand" ? BRAND_CATEGORIES : INFLUENCER_CATEGORIES;

  const activeCategory = selectedCategory;

  const exactMatches = [];
  const relatedMatches = [];

  allUsers.forEach(u => {
    if (!u || u._id === user?._id) return;
    if (u.role !== targetRole) return;
    
    // Filter by city if selected
    if (selectedCity && (!u.location || !u.location.toLowerCase().includes(selectedCity.toLowerCase()))) return;

    if (!activeCategory) {
      exactMatches.push(u);
      return;
    }

    const userCategory = (u.category || u.industry || "");
    if (userCategory === activeCategory) {
      exactMatches.push(u);
    } else {
      const related = getRelatedCategories(activeCategory);
      if (related.includes(userCategory)) {
        relatedMatches.push(u);
      }
    }
  });

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
            {availableCities.map(city => (
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

        {exactMatches.length === 0 && relatedMatches.length === 0 ? (
          <EmptyState 
            icon={<SearchIcon />} 
            title={`No ${targetText} found`} 
            description="We couldn't find any exact matches or related suggestions for these filters. Try clearing your city or checking back later!" 
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
