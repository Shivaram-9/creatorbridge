import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import CampaignCard from "../components/CampaignCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ApplyCampaignModal from "../components/ApplyCampaignModal.jsx";
import { Link } from "react-router-dom";
import "./Campaigns.css";

export default function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState(null);

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
              user={user}
              onApply={() => setSelectedCampaign(c)}
            />
          ))
        ) : (
          <div className="empty-state">No campaigns available yet.</div>
        )}
      </div>

      {selectedCampaign && (
        <ApplyCampaignModal 
          campaign={selectedCampaign} 
          onClose={() => setSelectedCampaign(null)} 
          onSubmit={async (data) => {
            try {
              await api.campaigns.apply(selectedCampaign._id, data);
              setSelectedCampaign(null);
              // Need to import toast
              alert("Application submitted!");
              fetchCampaigns();
            } catch (err) {
              alert(err.message || "Failed to apply");
            }
          }}
        />
      )}
    </div>
  );
}
