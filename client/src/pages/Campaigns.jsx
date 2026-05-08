import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import CampaignCard from "../components/CampaignCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import { Link } from "react-router-dom";
import "./Campaigns.css";

export default function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function fetchCampaigns() {
    try {
      const data = await api.campaigns.list();
      setCampaigns(data);
    } catch (err) {
      setError("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }

  const handleApply = async (id) => {
    try {
      const res = await api.campaigns.apply(id);
      if (res.error) alert(res.error);
      else alert("Application sent!");
    } catch (err) {
      alert("Application failed");
    }
  };

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="campaigns-page">
      <div className="page-header">
        <h1>Campaigns</h1>
        {user?.role === "brand" && (
          <Link to="/campaigns/create" className="btn-create">Create Campaign</Link>
        )}
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="campaign-grid">
        {campaigns.length > 0 ? (
          campaigns.map(c => (
            <CampaignCard 
              key={c._id} 
              campaign={c} 
              isInfluencer={user?.role === "influencer"} 
              onApply={handleApply}
            />
          ))
        ) : (
          <div className="empty-state">No campaigns available yet.</div>
        )}
      </div>
    </div>
  );
}
