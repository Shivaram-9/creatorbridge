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
        <img 
          src="/diamond.png" 
          alt="Verified" 
          className="verified-avatar-badge"
          title={user.role === 'brand' ? 'Verified Brand' : 'Verified Creator'}
        />
      )}
    </div>
  );
}
