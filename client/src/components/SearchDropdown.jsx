import { Link } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import { BASE_URL } from "../config/api.js";

export default function SearchDropdown({ results, loading, onClose }) {
  if (!results && !loading) return null;

  return (
    <div className="search-dropdown slide-in" style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderRadius: '16px',
      marginTop: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
      zIndex: 1000,
      maxHeight: '480px',
      overflowY: 'auto',
      border: '1px solid rgba(0,0,0,0.05)',
      padding: '1rem'
    }}>
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
          <div className="spinner-sm" style={{ margin: '0 auto 10px' }}></div>
          <span style={{ fontSize: '14px', fontWeight: 500 }}>Searching marketplace...</span>
        </div>
      ) : (
        <div className="search-dropdown__content">
          {/* Users Section */}
          <section style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ 
              fontSize: '12px', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              color: '#999', 
              marginBottom: '0.75rem',
              fontWeight: 700,
              paddingLeft: '0.5rem'
            }}>Profiles</h3>
            
            {results.users?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {results.users.map((u) => (
                  <Link 
                    key={u._id} 
                    to={`/user/${u._id}`} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '12px', 
                      padding: '8px', 
                      borderRadius: '10px',
                      textDecoration: 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    onClick={onClose}
                  >
                    <Avatar user={u} size="sm" />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontWeight: 600, color: '#1a1a1a', fontSize: '14px' }}>{u.name || u.username}</span>
                        {u.isVerified && <VerifiedBadge size="xs" />}
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          backgroundColor: u.role === 'brand' ? '#eff6ff' : '#f0fdf4',
                          color: u.role === 'brand' ? '#2563eb' : '#16a34a',
                          fontWeight: 700,
                          textTransform: 'uppercase'
                        }}>
                          {u.role}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#666' }}>@{u.username} • {u.category || 'Creator'}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p style={{ padding: '0.5rem', color: '#999', fontSize: '13px' }}>No profiles found</p>
            )}
          </section>

          {results.posts?.length > 0 && (
            <>
              <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '0.5rem 0 1rem' }} />
              <section>
                <h3 style={{ 
                  fontSize: '12px', 
                  textTransform: 'uppercase', 
                  letterSpacing: '0.05em', 
                  color: '#999', 
                  marginBottom: '0.75rem',
                  fontWeight: 700,
                  paddingLeft: '0.5rem'
                }}>Content</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {results.posts.map((p) => (
                    <Link 
                      key={p._id} 
                      to="/home" 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px', 
                        padding: '8px', 
                        borderRadius: '10px',
                        textDecoration: 'none',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={onClose}
                    >
                      <div style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '6px', 
                        backgroundColor: '#f1f5f9',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {p.image ? (
                          <img src={p.image.startsWith('http') ? p.image : `${BASE_URL}${p.image}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ fontSize: '14px', color: '#94a3b8' }}>📄</div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: '13px', color: '#334155', lineHeight: 1.4 }}>{p.text?.slice(0, 40)}...</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>by @{p.user?.username}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}

