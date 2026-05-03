import { useEffect, useState } from "react";

/**
 * Shows a full-width banner when the device goes offline.
 * Auto-dismisses when back online.
 */
export default function OfflineBanner() {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="offline-banner" role="alert">
      <span className="offline-banner__icon" aria-hidden="true">📡</span>
      <span>No internet connection</span>
    </div>
  );
}
