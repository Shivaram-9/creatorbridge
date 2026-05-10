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

  const demoPosts = [
    {
      _id: "demo1",
      user: {
        _id: "demo_user_1",
        name: "CreatorBridge Official",
        username: "creatorbridge",
        avatar: "https://ui-avatars.com/api/?name=Creator+Bridge&background=0095f6&color=fff",
        isVerified: true
      },
      content: "Welcome to CreatorBridge! 🚀 This is a sample post. Start following other creators and brands to fill your feed with amazing content.",
      likes: ["1", "2", "3", "4", "5"],
      comments: [
        { _id: "c1", user: { name: "User1", username: "user1" }, text: "Welcome!" }
      ],
      createdAt: new Date().toISOString()
    },
    {
      _id: "demo2",
      user: {
        _id: "demo_user_2",
        name: "Photography Hub",
        username: "photo.hub",
        avatar: "https://ui-avatars.com/api/?name=Photo+Hub&background=10b981&color=fff"
      },
      content: "Capturing the golden hour perfectly. 🌅 What's your favorite time to shoot? #photography #goldenhour",
      media: ["https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80"],
      likes: ["1", "2"],
      comments: [],
      createdAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
    }
  ];

  return (
    <div style={{ paddingBottom: '80px', paddingTop: '16px' }}>
      <StoriesBar />
      <CreatePost onPost={handleAddPost} user={user} />

      {loading ? (
        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      ) : (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(posts.length > 0 ? posts : demoPosts).map((post) => (
            <PostCard 
              key={post._id} 
              post={formatPost(post)} 
              onDelete={(id) => setPosts(prev => prev.filter(p => p._id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

