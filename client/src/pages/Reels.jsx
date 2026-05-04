export default function Reels() {
  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="empty-state">
        <div className="empty-state__icon" aria-hidden="true">🎬</div>
        <h2 className="empty-state__title">Reels Coming Soon</h2>
        <p className="empty-state__text">We're working on something exciting. Stay tuned!</p>
      </div>
    </div>
  );
}
