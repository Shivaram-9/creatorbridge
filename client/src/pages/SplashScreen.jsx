import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SplashScreen.css";

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    // Show splash screen for 2.5 seconds then redirect to login
    const timer = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-container">
      <h1 className="splash-title">CreatorBridge</h1>
      <p className="splash-subtitle">Connecting Creators & Brands</p>
    </div>
  );
}
