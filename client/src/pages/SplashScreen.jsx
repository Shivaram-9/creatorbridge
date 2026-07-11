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
    // Try to play with sound first. If browser blocks it, fallback to muted so the animation still plays.
    const forcePlay = async (videoEl) => {
      if (!videoEl) return;
      try {
        videoEl.muted = false;
        await videoEl.play();
      } catch (err) {
        console.log("Unmuted autoplay blocked, falling back to muted:", err);
        videoEl.muted = true;
        videoEl.play().catch((e) => console.log("Muted autoplay also failed:", e));
      }
    };
    forcePlay(mobileVideoRef.current);
    forcePlay(desktopVideoRef.current);
  }, []);

  useEffect(() => {
    // We only proceed once AuthContext finishes loading
    if (loading) return;

    // Removed native bypass so the splash screen image shows for 4 seconds

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


  const isNative = window.Capacitor && window.Capacitor.isNativePlatform();

  return (
    <div className="splash-container">
      {isNative ? (
        <img
          src="/mobile_splash.jpeg"
          className="splash-video mobile-video"
          alt="Pactogram Splash"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <>
          <video
            ref={mobileVideoRef}
            src="/mobile_splash.mp4"
            className="splash-video mobile-video"
            autoPlay
            muted
            playsInline
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
            controls={false}
            preload="auto"
          />
        </>
      )}
    </div>
  );
}
