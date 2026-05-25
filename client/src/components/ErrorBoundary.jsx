import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PLATFORM CRASH RECOVERED:", error, errorInfo);
    
    // Auto-recovery for Vite dynamic import chunk failures after deployments
    const errorStr = error ? error.toString() : "";
    if (
      errorStr.includes("Failed to fetch dynamically imported module") ||
      errorStr.includes("ChunkLoadError") ||
      errorStr.includes("Loading chunk")
    ) {
      const lastReload = sessionStorage.getItem("last_chunk_reload");
      const now = Date.now();
      // Only auto-reload once every 10 seconds to avoid infinite loops if offline
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem("last_chunk_reload", now.toString());
        console.warn("Detected chunk load failure. Reloading app to get fresh version...");
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-screen" style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f8fafc',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</h1>
          <h2 style={{ fontSize: '1.5rem', color: '#1e293b' }}>Something went wrong.</h2>
          <p style={{ color: '#64748b', marginBottom: '1rem', maxWidth: '400px' }}>
            The platform encountered an unexpected error.
          </p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre style={{ textAlign: 'left', fontSize: '10px', background: '#eee', padding: '10px', borderRadius: '4px', overflow: 'auto', maxWidth: '90vw' }}>
              {this.state.error.toString()}
            </pre>
          )}
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.href = '/home'}
            style={{ marginTop: '1rem' }}
          >
            Back to Home
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
