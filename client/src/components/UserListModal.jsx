import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import LoadingSpinner from "./LoadingSpinner.jsx";
import Avatar from "./Avatar.jsx";
import ErrorBanner from "./ErrorBanner.jsx";

export default function UserListModal({ userId, type = "following", onClose, onSelect }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const method = type === "followers" ? api.users.getFollowers : api.users.getFollowing;
        const data = await method(userId);
        if (data?.error) {
          setError(data.error);
        } else {
          setUsers(data || []);
          console.log("UserListModal: fetched users", data);
        }
      } catch (err) {
        setError("Failed to load list");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [userId, type]);

  const filteredUsers = users.filter(u => 
    (u.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: '#121212', color: 'white', borderRadius: '16px', width: '90%', maxWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #262626', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Share</h2>
          <button style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer' }} onClick={onClose}>✕</button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8e8e8e' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search" 
              style={{ width: '100%', background: '#262626', border: 'none', borderRadius: '8px', padding: '10px 10px 10px 36px', color: 'white', fontSize: '14px', outline: 'none' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {loading ? (
            <LoadingSpinner centered />
          ) : error ? (
            <ErrorBanner message={error} onDismiss={() => setError("")} />
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#8e8e8e', padding: '20px' }}>
              {searchQuery ? "No users found matching your search" : "You are not following anyone yet. Follow users to share profiles with them."}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              {filteredUsers.map(u => (
                <div 
                  key={u._id} 
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => onSelect && onSelect(u)}
                >
                  <Avatar user={u} size="lg" />
                  <span style={{ fontSize: '0.8rem', color: '#e4e6eb', marginTop: '6px', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.username || u.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
