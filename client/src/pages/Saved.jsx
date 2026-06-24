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

  const displayedPosts = posts; // We'll filter below

  const isVideoPost = (post) => {
    const media = post.media && post.media.length > 0 ? post.media[0] : post.image;
    if (!media) return false;
    const src = media.toLowerCase();
    return !!src.split('?')[0].match(/\.(mp4|mov|webm|ogg|mkv|avi|m4v|3gp)$/) || src.includes('/video/') || src.includes('video/upload');
  };

  const filteredPosts = displayedPosts.filter(post => {
    if (activeTab === "videos") return isVideoPost(post);
    if (activeTab === "images") return !isVideoPost(post);
    if (activeTab === "all") return true;
    // Otherwise it's a collection ID
    const collection = collections.find(c => c._id === activeTab);
    if (collection) return collection.posts.some(p => p._id === post._id || p === post._id);
    return false;
  });

  return (
    <div className="saved-page slide-in">

      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Saved</h1>
          <p className="subtitle">Your private collections of inspiration.</p>
        </div>
        <div className="saved-filter-dropdown">
          <select 
            value={activeTab} 
            onChange={(e) => setActiveTab(e.target.value)}
            className="saved-select"
          >
            <option value="all">All Posts</option>
            <option value="videos">Videos</option>
            <option value="images">Images</option>
            {collections.map(c => (
              <option key={c._id} value={c._id}>📁 {c.name}</option>
            ))}
          </select>
        </div>
      </header>

      <ErrorBanner message={error} onDismiss={() => setError("")} />

      {loading ? (
        <LoadingSpinner centered />
      ) : filteredPosts.length === 0 ? (
        <EmptyState 
          icon={<BookmarkIcon style={{ width: '48px', height: '48px', color: '#94a3b8' }} />} 
          title="Nothing saved yet" 
          description="Save posts to see them here in your collections."
        />
      ) : (
        <div className="saved-grid">
          {filteredPosts.map((post) => (
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
