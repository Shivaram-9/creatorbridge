/**
 * Reusable error banner — shows a styled error message with optional dismiss.
 *   <ErrorBanner message="Something went wrong" onDismiss={() => setError("")} />
 */
export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="error-banner" role="alert">
      <span className="error-banner__icon" aria-hidden="true">⚠️</span>
      <span className="error-banner__text">{message}</span>
      {onDismiss && (
        <button
          type="button"
          className="error-banner__close"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
