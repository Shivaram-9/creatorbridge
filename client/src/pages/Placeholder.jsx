export default function Placeholder({ title }) {
  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">{title}</h1>
        <p className="subtitle">This feature is coming soon!</p>
      </div>
      <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
        <p>We are working hard to bring you {title}. Stay tuned!</p>
      </div>
    </div>
  );
}
