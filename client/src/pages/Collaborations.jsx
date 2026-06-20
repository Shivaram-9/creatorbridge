import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import CollaborationCard from "../components/CollaborationCard.jsx";
import { HandshakeIcon } from "../components/Icons.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import "./Collaborations.css";

export default function Collaborations() {
  const { user } = useAuth();
  const [collabs, setCollabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchCollabs();
  }, []);

  async function fetchCollabs() {
    try {
      const data = await api.collaborations.list();
      setCollabs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.collaborations.updateStatus(id, status);
      setCollabs(prev => prev.map(c => c._id === id ? { ...c, status } : c));
    } catch (err) {
      alert("Status update failed");
    }
  };

  const filteredCollabs = collabs.filter(c => {
    if (activeTab === "all") return true;
    return c.status.toLowerCase() === activeTab;
  });

  if (loading) return <LoadingSpinner centered />;

  return (
    <div className="collaborations-page">
      <h1>Collaboration Dashboard</h1>
      
      <div className="tab-navigation">
        {["all", "pending", "accepted", "completed", "rejected"].map(tab => (
          <button 
            key={tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="collabs-list">
        {filteredCollabs.length > 0 ? (
          filteredCollabs.map(c => (
            <CollaborationCard 
              key={c._id} 
              collab={c} 
              currentUserId={user?._id}
              onUpdateStatus={handleUpdateStatus}
            />
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-icon"><HandshakeIcon style={{ width: '48px', height: '48px' }} /></div>
            <h3>No collaborations yet</h3>
            <p>You have no collaborations found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
