import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./SplashScreen.css";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Wait for auth state to initialize
    if (loading) return;

    // Show splash screen for 1 second then redirect
    const timer = setTimeout(() => {
      if (user) {
        navigate("/home", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [navigate, user, loading]);


  return (
    <div className="splash-container">
      <div className="splash-background">
        <img src="/splash_bg.png" alt="Background" className="bg-image" />
        <div className="bg-overlay"></div>
      </div>
      
      <div className="splash-content">
        <img src="/splash_logo.png" alt="CreatorBridge" className="splash-logo" />
        <h1 className="splash-title">Creators bridge</h1>
        <div className="splash-divider"></div>
        <p className="splash-subtitle">Connect. Collaborate. Grow.</p>
      </div>
    </div>
  );
}
