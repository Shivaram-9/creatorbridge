import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api.js";
import LoadingSpinner from "./LoadingSpinner.jsx";

export default function UserListModal({ userId, type, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content slide-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="modal-header" style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, textTransform: 'capitalize' }}>{type}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body" style={{ padding: '1rem' }}>
          {loading ? (
            <LoadingSpinner centered />
          ) : error ? (
            <p className="error-text" style={{ textAlign: 'center' }}>{error}</p>
          ) : users.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.6, padding: '2rem 0' }}>No users found.</p>
          ) : (
            <div className="user-list">
              {users.map(u => (
                <div key={u._id} className="user-list-item" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
                  <Link to={`/user/${u._id}`} onClick={onClose}>
                    <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                      {u.avatar ? (
                        <img src={u.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                          {u.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="user-info">
                    <Link to={`/user/${u._id}`} onClick={onClose} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ fontWeight: 600 }}>{u.name || u.username}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.6 }}>@{u.username}</div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
