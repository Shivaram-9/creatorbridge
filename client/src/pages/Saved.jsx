import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { BASE_URL } from "../config/api.js";
import PostCard from "../components/PostCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import VerifiedBadge from "../components/VerifiedBadge.jsx";

export default function Saved() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.users.saved();
        if (data?.error) {
          setError(data.error);
        } else {
          setPosts(Array.isArray(data) ? data : []);
        }
      } catch {
        setError("Failed to load saved posts");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatPost = (post) => {
    return {
      ...post,
      id: post._id,
      content: post.content || post.text,
      // PostCard already handles BASE_URL for media, so we just pass the raw data
      // but we need to ensure the structure is what PostCard expects if it's slightly different
    };
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Saved Posts</h1>
        <p className="subtitle">Your private collection of bookmarked creators.</p>
      </header>

      <div className="feed-container">
        <ErrorBanner message={error} onDismiss={() => setError("")} />

        {loading ? (
          <LoadingSpinner centered />
        ) : posts.length === 0 ? (
          <EmptyState 
            icon="🔖" 
            title="No saved posts yet" 
            description="When you save posts, they'll appear here for you to see later."
          />
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post._id} 
              post={formatPost(post)} 
              onDelete={() => setPosts(prev => prev.filter(p => p._id !== post._id))}
            />
          ))
        )}
      </div>
    </div>
  );
}
