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
      <img src="/splash_exact.jpg" alt="CreatorBridge" className="splash-full-image" />
    </div>
  );
}
