export default function Messages() {
  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div className="empty-state">
        <div className="empty-state__icon" aria-hidden="true">💬</div>
        <h2 className="empty-state__title">Messages Coming Soon</h2>
        <p className="empty-state__text">Direct messaging is on its way. Keep connecting!</p>
      </div>
    </div>
  );
}
