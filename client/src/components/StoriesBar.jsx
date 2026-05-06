import { useState, useEffect } from "react";
import { api } from "../services/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { BASE_URL } from "../config/api.js";
import LoadingSpinner from "./LoadingSpinner.jsx";
import StoryViewer from "./StoryViewer.jsx";
import Avatar from "./Avatar.jsx";

export default function StoriesBar() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(null);

  useEffect(() => {
    const loadStories = async () => {
      try {
        const stories = await api.stories.feed();
        if (!Array.isArray(stories)) {
          setLoading(false);
          return;
        }
        
        const groupedStories = stories.reduce((acc, story) => {
          const userId = story.user?._id?.toString();
          if (!userId) return acc;
          if (!acc[userId]) {
            acc[userId] = { user: story.user, stories: [] };
          }
          acc[userId].stories.push(story);
          return acc;
        }, {});
        
        setStoryGroups(Object.values(groupedStories));
      } catch (err) {
        console.error("Failed to load stories", err);
      } finally {
        setLoading(false);
      }
    };
    loadStories();
  }, []);

  const isGroupViewed = (group) => {
    if (!user || !group?.stories) return true;
    return group.stories.every(s => s.viewers?.includes(user._id));
  };

  if (loading && storyGroups.length === 0) return (
    <div className="stories-bar" style={{ display: 'flex', gap: '1rem', padding: '1rem 0', overflowX: 'auto' }}>
      {[1,2,3,4].map(i => <div key={i} className="story-item skeleton" style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eee' }} />)}
    </div>
  );

  if (!loading && storyGroups.length === 0) return null;

  return (
    <div className="stories-bar-container" style={{ marginBottom: '1.5rem' }}>
      <div className="stories-bar" style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {storyGroups.map((group, index) => (
          <div 
            key={group.user?._id || index} 
            className="story-item"
            onClick={() => setSelectedGroupIndex(index)}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              minWidth: '70px'
            }}
          >
            <div style={{ 
              padding: '3px', 
              borderRadius: '50%', 
              background: isGroupViewed(group) ? '#eee' : 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              transition: 'transform 0.2s'
            }}>
              <div style={{ 
                background: 'white', 
                padding: '2px', 
                borderRadius: '50%',
                display: 'flex'
              }}>
                <Avatar user={group.user} size="lg" />
              </div>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 500, color: '#666', maxWidth: '64px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {group.user?.username || "User"}
            </span>
          </div>
        ))}
      </div>

      {selectedGroupIndex !== null && (
        <StoryViewer 
          groups={storyGroups} 
          initialGroupIndex={selectedGroupIndex} 
          onClose={() => setSelectedGroupIndex(null)} 
        />
      )}
    </div>
  );
}
