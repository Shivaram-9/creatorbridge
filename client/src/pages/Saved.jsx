import { useEffect, useState } from "react";
import { api } from "../services/api.js";
import { BASE_URL } from "../config/api.js";
import PostCard from "../components/PostCard.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function Saved() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.posts.getSaved();
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
      username: post.user?.username || post.user?.name || "User",
      avatar: post.user?.avatar || null,
      content: post.text,
      image: post.image ? (post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`) : null,
      time: new Date(post.createdAt).toLocaleString(),
      likes: post.likes || [],
      comments: post.comments || []
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
