import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("App crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ paddingTop: "2rem", textAlign: "center" }}>
          <div className="empty-state empty-state--hero">
            <div className="empty-state__illustration" aria-hidden="true">⚠️</div>
            <h2 className="empty-state__title">Something went wrong</h2>
            <p className="empty-state__text">
              We encountered an unexpected error. Please try reloading the app.
            </p>
            <div className="empty-state__action">
              <button
                className="btn btn-primary"
                onClick={() => window.location.reload()}
              >
                Reload app
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
