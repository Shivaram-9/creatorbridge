import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api.js";
import { BASE_URL } from "../config/api.js";
import Avatar from "./Avatar.jsx";
import VerifiedBadge from "./VerifiedBadge.jsx";

export default function StoryViewer({ groups, initialGroupIndex, onClose }) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const currentGroup = groups?.[groupIndex] || {};
  const currentStory = currentGroup?.stories?.[storyIndex];

  const nextStory = useCallback(() => {
    if (!currentGroup?.stories) return onClose();
    if (storyIndex < (currentGroup?.stories?.length || 0) - 1) {
      setStoryIndex(prev => prev + 1);
      setProgress(0);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIndex, currentGroup, groupIndex, groups, onClose]);

  const prevStory = useCallback(() => {
    if (!currentGroup?.stories) return;
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setProgress(0);
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      setStoryIndex((groups[groupIndex - 1]?.stories?.length || 0) - 1);
      setProgress(0);
    }
  }, [storyIndex, groupIndex, groups, currentGroup]);

  useEffect(() => {
    if (!currentStory?._id) return;

    // Mark as viewed safely
    if (api?.stories?.view) {
      api.stories.view(currentStory._id).catch(() => {});
    }

    // Auto progress
    const duration = 5000; // 5 seconds per story
    const intervalTime = 100;
    const step = (intervalTime / duration) * 100;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [currentStory?._id, nextStory]);

  if (!currentStory || !currentStory.media) return null;

  const mediaUrl = currentStory.media.startsWith("http") 
    ? currentStory.media 
    : `${BASE_URL}${currentStory.media}`;

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer-content" onClick={e => e.stopPropagation()}>
        {/* Progress Bars */}
        <div className="story-progress-bars">
          {(currentGroup.stories || []).map((_, idx) => (
            <div key={idx} className="story-progress-bar">
              <div 
                className="story-progress-fill" 
                style={{ 
                  width: idx < storyIndex ? '100%' : idx === storyIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="story-header">
          <div className="story-viewer-user-info">
            <Avatar user={currentGroup.user} size="sm" />
            <span>{currentGroup.user?.username || "User"}</span>
            {currentGroup.user?.isVerified && <VerifiedBadge size="xs" role={currentGroup.user?.role} />}
          </div>
        </div>

        <button className="story-close-btn" onClick={onClose}>✕</button>

        {/* Media */}
        <div className="story-media-container">
          {currentStory.mediaType === "video" ? (
            <video 
              src={mediaUrl} 
              autoPlay 
              playsInline 
              muted 
              className="story-media"
            />
          ) : (
            <img 
              src={mediaUrl} 
              alt="" 
              className="story-media" 
            />
          )}
        </div>

        {/* Navigation Areas */}
        <div className="story-nav-btn story-nav-btn--prev" onClick={prevStory} />
        <div className="story-nav-btn story-nav-btn--next" onClick={nextStory} />
      </div>
    </div>
  );
}
