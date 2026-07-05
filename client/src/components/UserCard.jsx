import { memo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import VerifiedPill from "./VerifiedPill.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { getSocket } from "../services/socket.js";

const UserCard = memo(({ user, minimal, layout = "card" }) => {
  if (!user) return null;

  const navigate = useNavigate();
  const { user: me } = useAuth();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);

  // Initialize follow status
  useEffect(() => {
    if (me) {
      setIsFollowing(!!user.isFollowing);
    }
    if (user.isRequested) {
      setHasRequested(true);
    }
  }, [me, user._id, user.isRequested]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user._id) return;

    const onAccepted = (data) => {
      if (data.receiverId === user._id) {
        setIsFollowing(true);
        setHasRequested(false);
      }
    };

    const onDeclined = (data) => {
      if (data.receiverId === user._id) {
        setIsFollowing(false);
        setHasRequested(false);
      }
    };

    socket.on("align_request_accepted", onAccepted);
    socket.on("align_request_declined", onDeclined);

    return () => {
      socket.off("align_request_accepted", onAccepted);
      socket.off("align_request_declined", onDeclined);
    };
  }, [user._id]);

  const isOwn = me?._id === user._id;

  const handleAlign = async (e) => {
    e.stopPropagation(); // Prevent navigating to profile
    if (!me) {
      navigate('/login');
      return;
    }
    
    if (isOwn) {
      navigate('/profile/edit');
      return;
    }

    setActionBusy(true);
    try {
      if (isFollowing) {
        const result = await api.users.unfollow(user._id);
        if (!result.error) setIsFollowing(false);
      } else {
        const result = await api.users.follow(user._id);
        if (result.error) {
          import("react-hot-toast").then(m => m.default.error(result.error));
        } else {
          setHasRequested(true);
          import("react-hot-toast").then(m => m.default.success("Request pending"));
        }
      }
    } catch (err) {
      console.error("Action failed", err);
    } finally {
      setActionBusy(false);
    }
  };

  if (layout === "list") {
    return (
      <div 
        className="user-list-item"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: 'transparent',
          borderBottom: '1px solid var(--border-light)',
          cursor: 'pointer',
          width: '100%',
          transition: 'background-color 0.2s',
          gap: '12px'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        onClick={() => navigate(`/user/${user._id}`)}
      >
        <div style={{ flexShrink: 0 }}>
          <Avatar user={user} size="lg" />
        </div>
        
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div className="text-slate-900 dark:text-white" style={{ 
            fontSize: '15px', 
            fontWeight: '600', 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px' 
          }}>
            {user.name || user.username}
            {user.isVerified && <VerifiedBadge size="sm" tier={user.premiumTier} role={user.role} />}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            @{user.username}
          </div>
          {(user.isVerified || user.isPremium) && (
            <div style={{ marginTop: '4px', width: '100%' }}>
              <VerifiedPill user={user} />
              <div className="w-full h-px bg-[#E5E5E5] dark:bg-[#2A2A2A] mt-2 mb-1" />
            </div>
          )}
        </div>

        <div style={{ flexShrink: 0 }}>
          <button 
            onClick={handleAlign}
            disabled={actionBusy || hasRequested}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              backgroundColor: hasRequested ? 'var(--bg-secondary)' : isFollowing ? 'var(--bg-secondary)' : 'var(--primary)',
              color: hasRequested ? 'var(--text-muted)' : isFollowing ? 'var(--text-main)' : 'white',
              border: 'none',
              fontSize: '13px',
              fontWeight: 600,
              cursor: (actionBusy || hasRequested) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {actionBusy ? "..." : isOwn ? "Edit" : hasRequested ? "Requested" : isFollowing ? "Connected" : "Connect"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="user-card-premium slide-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.25rem',
        backgroundColor: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border-light)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
        width: '100%',
        maxWidth: '100%',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.06)';
        e.currentTarget.style.borderColor = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
        e.currentTarget.style.borderColor = 'var(--border-light)';
      }}
      onClick={() => navigate(`/user/${user._id}`)}
    >
      <div style={{ marginBottom: '1rem', position: 'relative', display: 'inline-block' }}>
        <Avatar user={user} size="xl" />
      </div>

      <div style={{ width: '100%' }}>
        <h3 className="text-slate-900 dark:text-white" style={{ 
          margin: 0,
          fontSize: '16px', 
          fontWeight: 700, 
          color: 'var(--text-main)', 
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px'
        }}>
          {user.name || user.username}
          {user.isVerified && <VerifiedBadge size="sm" tier={user.premiumTier} role={user.role} />}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>@{user.username}</p>
        {(user.isVerified || user.isPremium) && (
          <div style={{ marginBottom: '12px', width: '100%' }}>
            <VerifiedPill user={user} />
            <div className="w-full h-px bg-[#E5E5E5] dark:bg-[#2A2A2A] mt-2" />
          </div>
        )}
        
        {!minimal && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.25rem' }}>
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 800, 
              textTransform: 'uppercase', 
              padding: '4px 10px', 
              borderRadius: '6px',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-light)'
            }}>
              {user.role}
            </span>
            {user.category && (
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 700, 
                padding: '4px 10px', 
                borderRadius: '6px',
                backgroundColor: 'var(--bg-main)',
                color: '#475569',
                border: '1px solid var(--border-light)'
              }}>
                {user.category}
              </span>
            )}
          </div>
        )}

        {!minimal && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px',
            padding: '12px 0',
            borderTop: '1px solid #f8fafc',
            marginBottom: '1rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>{user.followers?.length || 0}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Alliances</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)' }}>{user.profileViews || 0}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Reach</div>
            </div>
          </div>
        )}

        <button 
          onClick={handleAlign}
          disabled={actionBusy || hasRequested}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '12px',
            backgroundColor: hasRequested ? 'var(--bg-secondary)' : isFollowing ? 'var(--bg-secondary)' : 'var(--text-main)',
            color: hasRequested ? 'var(--text-muted)' : isFollowing ? 'var(--text-main)' : 'var(--bg-main)',
            border: isFollowing ? '1px solid var(--border-light)' : 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: (actionBusy || hasRequested) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {actionBusy ? "..." : isOwn ? "Edit Profile" : hasRequested ? "Request pending" : isFollowing ? "Connected" : "Connect"}
        </button>
      </div>
    </div>
  );
});

export default UserCard;
