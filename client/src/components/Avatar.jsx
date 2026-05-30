import { BASE_URL } from "../config/api.js";

/**
 * Reusable Avatar component with consistent fallback logic.
 * @param {Object} user - User object containing avatar, name, and email.
 * @param {string} size - Size of the avatar (xs, sm, md, lg, xl).
 * @param {string} className - Additional CSS classes.
 */
export default function Avatar({ user, size = "md", className = "", showOnline = false, ...props }) {
  const getInitials = (name, email) => {
    if (name && name.trim()) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.trim().slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return "CB"; // Pactogram fallback
  };

  const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    if (path.startsWith("data:")) return path; // Allow base64 for instant preview
    return `${BASE_URL}${path}`;
  };

  const avatarUrl = getFullUrl(user?.avatar);
  const initials = getInitials(user?.name, user?.email);

  const sizeClasses = {
    xs: "avatar-xs", // 24px
    sm: "avatar-sm", // 32px
    md: "avatar-md", // 40px
    lg: "avatar-lg", // 64px
    xl: "avatar-xl", // 120px
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;

  const renderContent = () => {
    if (avatarUrl) {
      return (
        <>
          <img 
            src={avatarUrl} 
            alt={user?.name || "User avatar"} 
            className="avatar-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.classList.add('avatar-fallback-active');
            }}
          />
          <span className="avatar-initials-fallback">{initials}</span>
        </>
      );
    }
    return <div className="avatar-initials-content">{initials}</div>;
  };

  return (
    <div 
      className={`avatar-container ${selectedSizeClass} ${avatarUrl ? '' : 'avatar-initials'} ${className}`}
      onClick={props.onClick}
      style={{ cursor: props.onClick ? "pointer" : "default", ...props.style }}
    >
      {renderContent()}
      {showOnline && user?.isOnline && <span className="online-dot" title="Online" />}
      {(user?.isVerified || user?.isPremium) && (
        <div
          title={user.role === 'brand' ? 'Verified Brand' : 'Verified Creator'}
          style={{
            position: 'absolute',
            bottom: '0px',
            right: '0px',
            width: '28%',
            height: '28%',
            minWidth: '16px',
            minHeight: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'white',
            borderRadius: '50%',
            padding: '2px',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }}
        >
          <svg viewBox="0 0 24 24" fill="#0284c7" style={{ width: '100%', height: '100%' }}>
            <path d="M2.5 8.5L12 21.5 21.5 8.5 17 3H7L2.5 8.5z" />
          </svg>
        </div>
      )}
    </div>
  );
}
