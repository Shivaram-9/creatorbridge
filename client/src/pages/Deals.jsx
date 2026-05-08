import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import Avatar from "../components/Avatar.jsx";
import "./Deals.css";

export default function Deals() {
  const { user } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadDeals() {
      try {
        const data = await api.deals.list();
        setDeals(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDeals();
  }, []);

  const filteredDeals = deals.filter(d => {
    if (filter === "all") return true;
    return d.status === filter;
  });

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="deals-page slide-up-fade">
      <header className="page-header-block">
        <h1 className="page-title-main">{user.role === "brand" ? "Campaign Deals" : "Collaboration Offers"}</h1>
        <p className="page-subtitle-main">Manage your professional business relationships and contracts.</p>
      </header>


      <div className="deals-filters">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All Deals</button>
        <button className={filter === "offered" ? "active" : ""} onClick={() => setFilter("offered")}>Offers</button>
        <button className={filter === "active" ? "active" : ""} onClick={() => setFilter("active")}>Active</button>
        <button className={filter === "completed" ? "active" : ""} onClick={() => setFilter("completed")}>Completed</button>
      </div>

      {filteredDeals.length === 0 ? (
        <div className="empty-deals">
          <div className="icon">🤝</div>
          <h3>No deals found</h3>
          <p>Offers and collaborations will appear here once initiated.</p>
          {user.role === "brand" && (
            <Link to="/discover" className="btn btn-primary">Find Creators</Link>
          )}
        </div>
      ) : (
        <div className="deals-grid">
          {filteredDeals.map(deal => (
            <Link key={deal._id} to={`/deals/${deal._id}`} className="deal-card">
              <div className="deal-card-header">
                <span className={`status-badge ${deal.status}`}>{deal.status}</span>
                <span className="deal-date">{new Date(deal.createdAt).toLocaleDateString()}</span>
              </div>
              
              <h3 className="deal-title">{deal.title}</h3>
              
              <div className="deal-party">
                <Avatar user={user.role === "brand" ? deal.influencer : deal.brand} size="sm" />
                <div className="party-info">
                  <span className="role-label">{user.role === "brand" ? "Influencer" : "Brand"}</span>
                  <span className="party-name">
                    {user.role === "brand" ? (deal.influencer?.name || deal.influencer?.username) : (deal.brand?.name || deal.brand?.username)}
                  </span>
                </div>
              </div>

              <div className="deal-meta">
                <div className="meta-item">
                  <span className="meta-lbl">Budget</span>
                  <span className="meta-val highlight">${deal.budget}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-lbl">Progress</span>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${deal.progress || 0}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="deal-footer">
                <span>View Details →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
