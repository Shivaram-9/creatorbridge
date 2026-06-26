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
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const method = type === "followers" ? api.users.getFollowers : api.users.getFollowing;
        const data = await method(userId);
        if (data?.error) {
          setError(data.error);
        } else {
          setUsers(data || []);
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

  const handleSend = () => {
    if (selectedUserId) {
      const selectedUser = users.find(u => u._id === selectedUserId);
      if (selectedUser && onSelect) {
        onSelect(selectedUser);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', color: 'var(--text-main)', borderRadius: '16px', width: '90%', maxWidth: '400px', maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
        
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0 }}>Share</h2>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.2rem', cursor: 'pointer' }} onClick={onClose}>✕</button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8e8e8e' }}>🔍</span>
            <input 
              type="text" 
              placeholder="Search" 
              style={{ width: '100%', background: '#f5f5f5', border: 'none', borderRadius: '8px', padding: '10px 10px 10px 36px', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
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
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
                  onClick={() => setSelectedUserId(u._id)}
                >
                  <div style={{ position: 'relative' }}>
                    <Avatar user={u} size="lg" />
                    {selectedUserId === u._id && (
                      <div style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#6366f1', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                        ✓
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', marginTop: '6px', textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.username || u.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Send Button */}
        <div style={{ padding: '16px', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'center' }}>
          <button 
            style={{ 
              width: '100%', 
              background: selectedUserId ? '#6366f1' : '#a5a6f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              padding: '12px', 
              fontWeight: 600, 
              cursor: selectedUserId ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s'
            }} 
            onClick={handleSend}
            disabled={!selectedUserId}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
