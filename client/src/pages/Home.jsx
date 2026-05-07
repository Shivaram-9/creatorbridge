import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { BASE_URL } from "../config/api.js";
import PostCard from "../components/PostCard.jsx";
import CreatePost from "../components/CreatePost.jsx";
import StoriesBar from "../components/StoriesBar.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";

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
    if (!post) return null;
    const author = post.user || {};
    return {
      ...post,
      id: post._id,
      username: author.username || author.name || post.username || "User",
      avatar: author.avatar || post.avatar || null,
      isVerified: author.isVerified || post.isVerified || false,
      content: post.text || post.content || "",
      image: post.image ? (post.image.startsWith('http') ? post.image : `${BASE_URL}${post.image}`) : null,
      time: post.createdAt ? new Date(post.createdAt).toLocaleString() : "Just now",
      likes: Array.isArray(post.likes) ? post.likes : [],
      comments: Array.isArray(post.comments) ? post.comments : []
    };
  };

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Feed</h1>
        <p className="subtitle">Explore the latest from your network.</p>
      </header>

      <div className="feed-container">
        <StoriesBar />
        <CreatePost onPost={handleAddPost} user={user} />

        <ErrorBanner message={error} onDismiss={() => setError("")} />

        {loading ? (
          <div className="list-gap">
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </div>
        ) : posts.length === 0 ? (
          <EmptyState 
            icon="📭" 
            title="Your feed is empty" 
            description="Start following creators or create your own post to see something here!"
          />
        ) : (
          posts.map((post) => (
            <PostCard 
              key={post._id} 
              post={formatPost(post)} 
              onDelete={(id) => setPosts(prev => prev.filter(p => p._id !== id))}
            />
          ))
        )}
      </div>
    </div>
  );
}
