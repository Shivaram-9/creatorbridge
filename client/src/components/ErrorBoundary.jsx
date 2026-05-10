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
