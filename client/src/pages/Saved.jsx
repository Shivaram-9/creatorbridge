import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import PostCard from "../components/PostCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import "./Saved.css";

export default function Saved() {
  const [posts, setPosts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // "all" or collectionId
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [p, c] = await Promise.all([
          api.users.saved(),
          api.users.collections()
        ]);
        setPosts(Array.isArray(p) ? p : []);
        setCollections(Array.isArray(c) ? c : []);
      } catch {
        setError("Failed to load saved items");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const displayedPosts = activeTab === "all" 
    ? posts 
    : collections.find(c => c._id === activeTab)?.posts || [];

  return (
    <div className="saved-page slide-in">

      <header className="page-header">
        <h1 className="page-title">Saved</h1>
        <p className="subtitle">Your private collections of inspiration.</p>
      </header>

      <div className="saved-tabs">
        <button className={activeTab === "all" ? "active" : ""} onClick={() => setActiveTab("all")}>All Posts</button>
        {collections.map(c => (
          <button key={c._id} className={activeTab === c._id ? "active" : ""} onClick={() => setActiveTab(c._id)}>
            📁 {c.name}
          </button>
        ))}
      </div>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {loading ? (
        <LoadingSpinner centered />
      ) : displayedPosts.length === 0 ? (
        <EmptyState 
          icon="🔖" 
          title="Nothing saved yet" 
          description="Save posts to see them here in your collections."
        />
      ) : (
        <div className="saved-grid">
          {displayedPosts.map((post) => (
            <PostCard 
              key={post._id} 
              post={post} 
              onDelete={() => setPosts(prev => prev.filter(p => p._id !== post._id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
