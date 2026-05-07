import React from "react";

export function Skeleton({ width, height, borderRadius = "4px", className = "" }) {
  return (
    <div 
      className={`skeleton-loader ${className}`}
      style={{ 
        width, 
        height, 
        borderRadius,
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite linear'
      }}
    />
  );
}

export function PostSkeleton() {
  return (
    <div className="card" style={{ marginBottom: '1rem', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
        <Skeleton width="42px" height="42px" borderRadius="50%" />
        <div>
          <Skeleton width="120px" height="14px" />
          <Skeleton width="60px" height="10px" className="mt-2" />
        </div>
      </div>
      <Skeleton width="100%" height="16px" className="mb-2" />
      <Skeleton width="80%" height="16px" className="mb-3" />
      <Skeleton width="100%" height="300px" borderRadius="12px" />
    </div>
  );
}
