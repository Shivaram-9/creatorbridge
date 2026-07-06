import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./SplashScreen.css";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    // We only proceed once AuthContext finishes loading
    if (loading) return;

    // Calculate how much time has passed since mount
    const elapsed = Date.now() - mountTimeRef.current;
    const minDisplayTime = 2500;
    
    // If loading was fast, wait the remaining time up to 2.5s
    // If loading was slow (e.g. 3s), delay will be 0 (redirect immediately)
    const delay = Math.max(0, minDisplayTime - elapsed);

    const timer = setTimeout(() => {
      if (user) {
        navigate("/home", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [navigate, user, loading]);


  return (
    <div className="splash-container">
      <video
        src="/mobile_splash.mp4"
        className="splash-video mobile-video"
        autoPlay
        muted
        playsInline
      />
      <video
        src="/desktop_splash.mp4"
        className="splash-video desktop-video"
        autoPlay
        muted
        playsInline
      />
    </div>
  );
}
