import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { CheckCircleIcon, XCircleIcon } from "./Icons.jsx";
import "./CollectionModal.css";

export default function CollectionModal({ postId, onClose }) {
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.users.collections();
        setCollections(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateAndAdd = async () => {
    if (!newCollectionName.trim()) return;
    setCreating(true);
    try {
      const updated = await api.users.createCollection(newCollectionName.trim());
      // The updated collections might have the new collection at the end
      const newCol = updated[updated.length - 1];
      await api.users.addToCollection(newCol._id, postId);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      alert("Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  const handleAddToExisting = async (colId) => {
    try {
      await api.users.addToCollection(colId, postId);
      setSuccess(true);
      setTimeout(onClose, 1500);
    } catch (err) {
      alert("Failed to add to collection");
    }
  };

  return (
    <div className="modal-overlay global-modal-overlay" onClick={onClose}>
      <div className="collection-modal slide-in global-modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header global-modal-header">
          <h3>Save to Collection</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        {success ? (
          <div className="success-state global-modal-body">
            <span className="success-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}><CheckCircleIcon /></span>
            <p>Saved to Collection!</p>
          </div>
        ) : (
          <div className="modal-body global-modal-body">
            <div className="new-collection-row">
              <input 
                type="text" 
                placeholder="New collection name..." 
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
              />
              <button 
                className="btn btn-primary btn-sm" 
                disabled={creating || !newCollectionName.trim()}
                onClick={handleCreateAndAdd}
              >
                {creating ? "..." : "Create"}
              </button>
            </div>

            <div className="collection-list">
              {loading ? <p>Loading collections...</p> : collections.map(c => (
                <button key={c._id} className="collection-item" onClick={() => handleAddToExisting(c._id)}>
                  <span className="folder-icon">📁</span>
                  <span className="col-name">{c.name}</span>
                  <span className="post-count">{c.posts?.length || 0} items</span>
                </button>
              ))}
              {!loading && collections.length === 0 && <p className="empty-msg">No collections yet.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
