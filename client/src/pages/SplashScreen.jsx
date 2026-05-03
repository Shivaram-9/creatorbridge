import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(() => {
        navigate("/login");
      }, 500); // Wait for fade out animation
    }, 2500); // Show for 2.5 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh", 
        background: "var(--bg, #0f1419)", 
        color: "var(--text, #e8eef5)",
        opacity: fade ? 0 : 1,
        transition: "opacity 0.5s ease-in-out"
      }}
    >
      <h1 style={{ fontSize: "2.5rem", fontWeight: "bold", background: "linear-gradient(90deg, #5b8cff, #3dd68c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
        CreatorBridge
      </h1>
      <p style={{ marginTop: "1rem", color: "var(--muted, #8b9cb3)" }}>Connecting Creators & Brands</p>
    </div>
  );
}
