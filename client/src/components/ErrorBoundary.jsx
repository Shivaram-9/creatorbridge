import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PLATFORM CRASH RECOVERED:", error, errorInfo);
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
          <p style={{ color: '#64748b', marginBottom: '2rem', maxWidth: '400px' }}>
            The platform encountered an unexpected error. We've been notified and are working on it.
          </p>
          <button 
            className="btn btn-primary" 
            onClick={() => window.location.href = '/home'}
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
