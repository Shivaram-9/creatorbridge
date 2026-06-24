import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import PostCard from "../components/PostCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { BookmarkIcon } from "../components/Icons.jsx";
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

  const isVideoPost = (post) => {
    const media = post.media && post.media.length > 0 ? post.media[0] : post.image;
    if (!media) return false;
    const src = media.toLowerCase();
    return !!src.split('?')[0].match(/\.(mp4|mov|webm|ogg|mkv|avi|m4v|3gp)$/) || src.includes('/video/') || src.includes('video/upload');
  };

  const savedVideos = displayedPosts.filter(isVideoPost);
  const savedImages = displayedPosts.filter(p => !isVideoPost(p));

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
          icon={<BookmarkIcon style={{ width: '48px', height: '48px', color: '#94a3b8' }} />} 
          title="Nothing saved yet" 
          description="Save posts to see them here in your collections."
        />
      ) : (
        <div className="saved-content">
          {savedVideos.length > 0 && (
            <div className="saved-section">
              <h2 className="saved-section-title">Saved Videos</h2>
              <div className="saved-grid">
                {savedVideos.map((post) => (
                  <PostCard 
                    key={post._id} 
                    post={post} 
                    onDelete={() => setPosts(prev => prev.filter(p => p._id !== post._id))}
                  />
                ))}
              </div>
            </div>
          )}

          {savedImages.length > 0 && (
            <div className="saved-section">
              <h2 className="saved-section-title">Saved Images</h2>
              <div className="saved-grid">
                {savedImages.map((post) => (
                  <PostCard 
                    key={post._id} 
                    post={post} 
                    onDelete={() => setPosts(prev => prev.filter(p => p._id !== post._id))}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
