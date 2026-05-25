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

    // Show splash screen for 2 seconds then redirect
    const timer = setTimeout(() => {
      if (user) {
        navigate("/home", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate, user, loading]);


  return (
    <div className="splash-container">
      <picture className="splash-picture">
        <source media="(min-width: 1024px)" srcSet="/desktop_splash.jpeg" />
        <img src="/mobile_splash.jpeg" alt="Pactogram" className="splash-full-image" />
      </picture>
    </div>
  );
}
