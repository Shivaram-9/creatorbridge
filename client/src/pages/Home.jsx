import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../services/api.js";
import { BASE_URL } from "../config/api.js";
import PostCard from "../components/PostCard.jsx";
import CreatePost from "../components/CreatePost.jsx";
import StoriesBar from "../components/StoriesBar.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { PostSkeleton } from "../components/Skeleton.jsx";
import toast from "react-hot-toast";

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
        toast.error(data.error);
      } else {
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch {
      toast.error("We couldn't load your feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleAddPost = async (formData) => {
    try {
      const res = await api.posts.create(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Post published!");
        setPosts(prev => [res, ...prev]);
      }
    } catch {
      toast.error("Failed to create post");
    }
  };

  const formatPost = (post) => {
    if (!post) return null;
    return {
      ...post,
      username: post.user?.username || post.user?.name || "User",
      avatar: post.user?.avatar || null,
      isVerified: post.user?.isVerified || false,
    };
  };

  return (
    <div className="container slide-in">
      <header className="page-header">
        <h1 className="page-title">Feed</h1>
        <p className="subtitle">Explore the latest from your network.</p>
      </header>

      <div className="feed-container">
        <StoriesBar />
        <CreatePost onPost={handleAddPost} user={user} />

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
