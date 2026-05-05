import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { BASE_URL } from "../config/api.js";
import PostCard from "../components/PostCard.jsx";
import CreatePost from "../components/CreatePost.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import EmptyState from "../components/EmptyState.jsx";

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.posts.list();
      if (data?.error) {
        setError(data.error);
      } else {
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch {
      setError("We couldn't reach the server to load your feed. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleAddPost = async (newPostData) => {
    try {
      const formData = new FormData();
      formData.append("text", newPostData.content);
      if (newPostData.imageFile) {
        formData.append("image", newPostData.imageFile);
      }

      const res = await api.posts.create(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        setPosts(prev => [res, ...prev]);
      }
    } catch {
      setError("Failed to create post");
    }
  };

  const formatPost = (post) => {
    return {
      ...post,
      id: post._id,
      username: post.user?.username || post.user?.name || "User",
      avatar: post.user?.avatar || null,
      content: post.text,
      image: post.image ? (post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`) : null,
      time: new Date(post.createdAt).toLocaleString(),
      likes: 0,
      comments: 0
    };
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Feed</h1>
        <p className="subtitle">Explore the latest from your network.</p>
      </header>

      <div className="feed-container">
        <CreatePost onPost={handleAddPost} user={user} />
        
        <ErrorBanner message={error} onDismiss={() => setError("")} />

        {loading ? (
          <LoadingSpinner centered />
        ) : posts.length === 0 ? (
          <EmptyState 
            icon="📭" 
            title="Your feed is empty" 
            description="Start following creators or create your own post to see something here!"
          />
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={formatPost(post)} />
          ))
        )}
      </div>
    </div>
  );
}
