import React from 'react';
import useStoryStore from '../../store/useStoryStore';
import { useAuthStore } from '../../store/useAuthStore';
import Avatar from '../ui/Avatar';

const StoryRing = ({ user, size = 48, className = '', textClass = '', onClick }) => {
  const { stories } = useStoryStore();
  const { user: authUser } = useAuthStore();

  if (!user || !authUser) return null;

  // Find all unexpired stories for this specific user
  const userStories = Array.isArray(stories) 
    ? stories.filter(s => s.user?._id === user._id && new Date(s.expiresAt) > new Date())
    : [];

  const hasStories = userStories.length > 0;
  
  // Calculate how many stories have been viewed by the current logged-in user
  const unviewedCount = userStories.filter(s => !s.views?.some(v => v.user === authUser._id || v.user?._id === authUser._id)).length;
  const allViewed = hasStories && unviewedCount === 0;

  // Determine stroke color
  const strokeColor = !hasStories ? 'transparent' : (allViewed ? '#555555' : '#0A84FF');
  const VIEW_SIZE = 100;
  const strokeWidth = hasStories ? 5 : 0; // 5% of 100
  const gapSize = userStories.length > 1 ? 4 : 0; // Fixed gap in viewBox units
  const radius = (VIEW_SIZE / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;
  
  // Segment math
  const segmentLength = userStories.length > 0 ? (circumference / userStories.length) - gapSize : circumference;

  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent touch issues
    if (onClick) {
      onClick(e);
    } else {
      useStoryStore.getState().openStoryForUser(user._id);
    }
  };

  const containerStyle = typeof size === 'number' 
    ? { width: size, height: size } 
    : { width: '100%', height: '100%' };

  return (
    <div 
      className={`relative flex items-center justify-center shrink-0 ${hasStories ? 'cursor-pointer' : ''} ${className}`}
      style={containerStyle}
      onClick={hasStories ? handleClick : undefined}
      onMouseDown={hasStories ? (e) => e.stopPropagation() : undefined}
      onMouseUp={hasStories ? (e) => e.stopPropagation() : undefined}
      onTouchStart={hasStories ? (e) => e.stopPropagation() : undefined}
      onTouchEnd={hasStories ? (e) => {
        handleClick(e);
      } : undefined}
    >
      {/* SVG Ring */}
      {hasStories && (
        <svg 
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" 
          viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`}
        >
          {userStories.map((story, index) => {
            const isViewed = story.views?.some(v => v.user === authUser._id || v.user?._id === authUser._id);
            const segmentColor = isViewed ? '#555555' : '#0A84FF';
            const strokeDasharray = `${segmentLength} ${circumference - segmentLength}`;
            const strokeDashoffset = -(index * (circumference / userStories.length));

            return (
              <circle
                key={story._id}
                cx={VIEW_SIZE / 2}
                cy={VIEW_SIZE / 2}
                r={radius}
                fill="none"
                stroke={segmentColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>
      )}

      {/* Profile Picture */}
      <div 
        className="relative z-10 flex items-center justify-center rounded-full overflow-hidden border border-black"
        style={{ 
          width: hasStories ? `calc(100% - ${strokeWidth * 2.5}%)` : '100%', 
          height: hasStories ? `calc(100% - ${strokeWidth * 2.5}%)` : '100%' 
        }}
      >
        <Avatar 
          src={user.profilePic} 
          name={user.displayName || user.username}
          sizeClass="w-full h-full"
          textClass={textClass}
          roundedClass="rounded-none"
        />
      </div>
    </div>
  );
};

export default StoryRing;
