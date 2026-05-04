import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import PostCard from "../components/PostCard.jsx";
import CreatePost from "../components/CreatePost.jsx";

const DUMMY_POSTS = [
  {
    id: 1,
    username: "alex_creator",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
    content: "Just finished a amazing collaboration with @urbanstyle! The new summer collection is fire. #creator #collab",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=1000",
    time: "2h ago",
    likes: 124,
    comments: 12
  },
  {
    id: 2,
    username: "urbanstyle",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Urban",
    content: "We are looking for travel influencers for our upcoming campaign in Bali! DM if interested.",
    time: "5h ago",
    likes: 89,
    comments: 45
  },
  {
    id: 3,
    username: "fitness_junkie",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Fitness",
    content: "New workout routine is live on my profile! Check it out. #fitness #workout",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=1000",
    time: "8h ago",
    likes: 210,
    comments: 34
  },
  {
    id: 4,
    username: "tech_reviews",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tech",
    content: "The new M3 MacBooks are absolute beasts. Full review coming tomorrow!",
    time: "1d ago",
    likes: 567,
    comments: 89
  },
  {
    id: 5,
    username: "chef_mario",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chef",
    content: "Homemade pasta from scratch! It's easier than you think.",
    image: "https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&q=80&w=1000",
    time: "2d ago",
    likes: 432,
    comments: 67
  }
];

export default function Home() {
  const { user, userPosts, addPost } = useAuth();

  const handleAddPost = (newPostData) => {
    const newPost = {
      id: Date.now(),
      _id: Date.now(), // For portfolio grid compatibility
      username: user?.name || user?.email?.split('@')[0] || "You",
      avatar: user?.avatar || null,
      url: newPostData.image, // For portfolio grid compatibility
      content: newPostData.content,
      caption: newPostData.content, // For portfolio grid compatibility
      image: newPostData.image,
      mediaType: "image",
      time: "Just now",
      likes: 0,
      comments: 0
    };
    addPost(newPost);
  };

  const combinedPosts = useMemo(() => {
    return [...userPosts, ...DUMMY_POSTS];
  }, [userPosts]);

  return (
    <div className="container">
      <header className="page-header">
        <h1 className="page-title">Feed</h1>
        <p className="subtitle">Explore the latest from your network.</p>
      </header>

      <div className="feed-container">
        <CreatePost onPost={handleAddPost} user={user} />
        {combinedPosts.map((post) => (
          <PostCard key={post.id || post._id} post={post} />
        ))}
      </div>
    </div>
  );
}
