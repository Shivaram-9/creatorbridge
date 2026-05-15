import { memo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Avatar from "./Avatar.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { getSocket } from "../services/socket.js";

const UserCard = memo(({ user }) => {
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

  return (
    <div 
      className="user-card-premium slide-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1.25rem',
        backgroundColor: 'white',
        borderRadius: '24px',
        border: '1px solid #f1f5f9',
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
        e.currentTarget.style.borderColor = '#e2e8f0';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
        e.currentTarget.style.borderColor = '#f1f5f9';
      }}
      onClick={() => navigate(`/user/${user._id}`)}
    >
      <div style={{ marginBottom: '1rem', position: 'relative' }}>
        <Avatar user={user} size="xl" />
        {(user.isVerified || user.isPremium) && (
          <div style={{ 
            position: 'absolute', 
            bottom: '4px', 
            right: '4px', 
            backgroundColor: 'white', 
            borderRadius: '50%', 
            padding: '2px' 
          }}>
            <VerifiedBadge size="sm" tier={user.premiumTier} />
          </div>
        )}
      </div>

      <div style={{ width: '100%' }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 700, 
          color: '#1a1a1a', 
          marginBottom: '4px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {user.name || user.username}
        </h3>
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>@{user.username}</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '1.25rem' }}>
          <span style={{ 
            fontSize: '10px', 
            fontWeight: 800, 
            textTransform: 'uppercase', 
            padding: '4px 10px', 
            borderRadius: '6px',
            backgroundColor: user.role === 'brand' ? '#eff6ff' : '#f0fdf4',
            color: user.role === 'brand' ? '#2563eb' : '#16a34a'
          }}>
            {user.role}
          </span>
          {user.category && (
            <span style={{ 
              fontSize: '10px', 
              fontWeight: 700, 
              padding: '4px 10px', 
              borderRadius: '6px',
              backgroundColor: '#f8fafc',
              color: '#475569',
              border: '1px solid #f1f5f9'
            }}>
              {user.category}
            </span>
          )}
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '8px',
          padding: '12px 0',
          borderTop: '1px solid #f8fafc',
          marginBottom: '1rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a1a' }}>{user.followers?.length || 0}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Connections</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1a1a1a' }}>{user.profileViews || 0}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>Reach</div>
          </div>
        </div>

        <button 
          onClick={handleAlign}
          disabled={actionBusy || hasRequested}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '12px',
            backgroundColor: hasRequested ? '#f1f5f9' : isFollowing ? '#f8fafc' : '#1a1a1a',
            color: hasRequested ? '#64748b' : isFollowing ? '#1a1a1a' : 'white',
            border: isFollowing ? '1px solid #e2e8f0' : 'none',
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
