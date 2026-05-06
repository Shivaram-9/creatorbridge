import { useState, useEffect, useRef } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import StoryViewer from "./StoryViewer.jsx";
import LoadingSpinner from "./LoadingSpinner.jsx";

export default function StoriesBar() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const data = await api.stories.feed();
      if (!data?.error) {
        setStoryGroups(data);
      }
    } catch (err) {
      console.error("Failed to fetch stories", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("media", file);

    try {
      setLoading(true);
      const res = await api.stories.upload(formData);
      if (!res?.error) {
        fetchStories();
      } else {
        alert(res.error);
      }
    } catch (err) {
      alert("Failed to upload story");
    } finally {
      setLoading(false);
    }
  };

  const isGroupViewed = (group) => {
    if (!user) return true;
    return group.stories.every(s => s.viewers?.includes(user._id));
  };

  if (loading && storyGroups.length === 0) return <div className="stories-bar"><LoadingSpinner size="sm" /></div>;

  return (
    <>
      <div className="stories-bar">
        {/* Add Story Button */}
        <div className="story-item" onClick={() => fileInputRef.current.click()}>
          <div className="story-ring viewed">
            <div className="story-avatar-wrap add-story-btn">
              <Avatar user={user} size="lg" />
              <div className="add-story-icon">+</div>
            </div>
          </div>
          <span className="story-username">Your Story</span>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            hidden 
            accept="image/*,video/*" 
          />
        </div>

        {/* Other Stories */}
        {storyGroups.map((group, idx) => (
          <div 
            key={group.user._id} 
            className="story-item"
            onClick={() => setSelectedGroupIndex(idx)}
          >
            <div className={`story-ring ${isGroupViewed(group) ? 'viewed' : ''}`}>
              <div className="story-avatar-wrap">
                <Avatar user={group.user} size="lg" />
              </div>
            </div>
            <span className="story-username">{group.user.username}</span>
          </div>
        ))}
      </div>

      {selectedGroupIndex !== null && (
        <StoryViewer 
          groups={storyGroups} 
          initialGroupIndex={selectedGroupIndex}
          onClose={() => {
            setSelectedGroupIndex(null);
            fetchStories(); // Refresh to update viewed status
          }}
        />
      )}
    </>
  );
}
