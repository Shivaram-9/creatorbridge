import "./Skeleton.css";

export function PostSkeleton() {
  return (
    <div className="skeleton-card card">
      <div className="skeleton-header">
        <div className="skeleton-circle" />
        <div className="skeleton-text-group">
          <div className="skeleton-line w-40" />
          <div className="skeleton-line w-20" />
        </div>
      </div>
      <div className="skeleton-body">
        <div className="skeleton-line w-full" />
        <div className="skeleton-line w-full" />
        <div className="skeleton-line w-3/4" />
      </div>
      <div className="skeleton-media" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="skeleton-profile container">
      <div className="skeleton-banner" />
      <div className="skeleton-profile-content">
        <div className="skeleton-circle-lg" />
        <div className="skeleton-line w-60 h-8" />
        <div className="skeleton-line w-40 h-4" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 5 }) {
  return (
    <div className="list-gap">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="skeleton-list-item">
          <div className="skeleton-circle-sm" />
          <div className="skeleton-line w-full" />
        </div>
      ))}
    </div>
  );
}
