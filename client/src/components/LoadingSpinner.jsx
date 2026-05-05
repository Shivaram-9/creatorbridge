export default function LoadingSpinner({ size = "md", color = "primary", centered = false }) {
  const sizeMap = {
    sm: "1.25rem",
    md: "2rem",
    lg: "3.5rem"
  };

  const spinnerStyle = {
    width: sizeMap[size],
    height: sizeMap[size],
    border: "3px solid rgba(0,0,0,0.1)",
    borderTop: `3px solid var(--${color})`,
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  };

  const containerStyle = centered ? {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem 0",
    width: "100%"
  } : {};

  return (
    <div style={containerStyle}>
      <div style={spinnerStyle} className="loading-spinner"></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
