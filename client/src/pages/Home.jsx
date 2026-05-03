import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Hello{user?.name ? `, ${user.name}` : ""}</h1>
        <p className="subtitle">
          CreatorBridge connects influencers and brands for collaborations. Discover partners, connect, and chat in one
          place.
        </p>
      </header>

      <div className="hero-actions">
        <Link to="/discover" className="btn btn-primary">
          Discover creators & brands
        </Link>
        <Link to="/connections" className="btn btn-secondary">
          Manage connections
        </Link>
      </div>

      <div className="card card--feature">
        <h2 className="feature-card__title">Complete your profile</h2>
        <p className="feature-card__text">
          Add your category, bio, and location so others can find you.
        </p>
        <Link to="/profile" className="btn btn-secondary btn-sm">
          Edit profile
        </Link>
      </div>
    </div>
  );
}
