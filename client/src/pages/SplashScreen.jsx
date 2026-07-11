import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import "./SplashScreen.css";

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  const mobileVideoRef = useRef(null);
  const desktopVideoRef = useRef(null);
  const mountTimeRef = useRef(Date.now());

  useEffect(() => {
    // Strictly enforce muted state on the DOM nodes and force play to bypass WebView blocking
    const forceSilentPlay = (videoEl) => {
      if (!videoEl) return;
      videoEl.defaultMuted = true;
      videoEl.muted = true;
      videoEl.play().catch((e) => console.log("Silent autoplay failed:", e));
    };
    forceSilentPlay(mobileVideoRef.current);
    forceSilentPlay(desktopVideoRef.current);
  }, []);

  useEffect(() => {
    // We only proceed once AuthContext finishes loading
    if (loading) return;

    // Calculate how much time has passed since mount
    const elapsed = Date.now() - mountTimeRef.current;
    const minDisplayTime = 4000;
    
    // If loading was fast, wait the remaining time up to 4s
    // If loading was slow (e.g. 5s), delay will be 0 (redirect immediately)
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
        ref={mobileVideoRef}
        src="/mobile_splash.mp4"
        className="splash-video mobile-video"
        autoPlay
        muted
        playsInline
        loop
        controls={false}
        preload="auto"
      />
      <video
        ref={desktopVideoRef}
        src="/desktop_splash.mp4"
        className="splash-video desktop-video"
        autoPlay
        muted
        playsInline
        loop
        controls={false}
        preload="auto"
      />
    </div>
  );
}
