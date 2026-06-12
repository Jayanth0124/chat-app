import React, { useEffect, useState } from 'react';
import { Plus, Camera, Image as ImageIcon, CircleDashed } from 'lucide-react';
import useStoryStore from '../store/useStoryStore';
import { useAuthStore } from '../store/useAuthStore';
import MediaCropModal from '../components/modals/MediaCropModal';
import StoryViewer from '../components/stories/StoryViewer';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';

export default function Stories() {
  const { stories, fetchStories, createStory, isFetchingStories } = useStoryStore();
  const { user } = useAuthStore();
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  
  // Viewer state
  const { openStoryViewer } = useStoryStore();

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only images are supported currently');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  const handleSendStory = async (croppedDataUrl, caption) => {
    try {
      await createStory({
        mediaUrl: croppedDataUrl,
        mediaType: 'image',
        caption: caption
      });
      setIsCropModalOpen(false);
      setSelectedImage(null);
    } catch (error) {
      console.error(error);
    }
  };

  // Group stories by user
  const safeStories = Array.isArray(stories) ? stories : [];
  
  // 1. Deduplicate by _id
  // 2. Sort explicitly by oldest first to ensure strict chronological viewer ordering (A -> B -> C)
  const dedupedStories = Array.from(new Map(safeStories.map(s => [s._id, s])).values())
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const groupedStories = dedupedStories.reduce((acc, story) => {
    const userId = story.user._id;
    if (!acc[userId]) {
      acc[userId] = {
        user: story.user,
        stories: [],
        lastUpdated: new Date(story.createdAt)
      };
    }
    acc[userId].stories.push(story);
    if (new Date(story.createdAt) > acc[userId].lastUpdated) {
      acc[userId].lastUpdated = new Date(story.createdAt);
    }
    return acc;
  }, {});

  const allGroups = Object.values(groupedStories).sort((a, b) => b.lastUpdated - a.lastUpdated);
  
  const myGroup = allGroups.find(g => g.user._id === user?._id);
  const othersGroups = allGroups.filter(g => g.user._id !== user?._id);
  
  const recentGroups = othersGroups.filter(g => g.stories.some(s => !s.views?.some(v => v.user === user?._id)));
  const viewedGroups = othersGroups.filter(g => !g.stories.some(s => !s.views?.some(v => v.user === user?._id)));

  const handleOpenViewer = (groups, index) => {
    openStoryViewer(groups, index);
  };

  const renderStoryCard = (group, isMyStory = false) => {
    // The latest story is now at the end of the array since it's sorted chronologically
    const latestStory = group.stories[group.stories.length - 1];
    const hasUnseen = isMyStory ? false : group.stories.some(s => !s.views?.some(v => v.user === user?._id));
    
    return (
      <div 
        key={group.user._id} 
        className="relative w-28 h-40 sm:w-32 sm:h-48 rounded-2xl overflow-hidden cursor-pointer shrink-0 group transition-all duration-300"
      >
        {/* Preview Background */}
        <div className="absolute inset-0 bg-neutral-800">
          <img 
            src={latestStory?.mediaUrl || group.user.profilePic} 
            alt="Story Preview" 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
        </div>

        {/* Top left Orbit Ring & Profile */}
        <div className="absolute top-2 left-2 flex items-center justify-center">
          <div className={`w-8 h-8 rounded-full p-[2px] ${hasUnseen ? 'bg-gradient-to-tr from-[#0A84FF] to-purple-500' : 'bg-white/30'}`}>
            <Avatar 
              src={group.user.profilePic} 
              name={group.user.displayName || group.user.username}
              sizeClass="w-full h-full"
              className="border border-black"
            />
          </div>
        </div>

        {/* Top Right Story Count */}
        {group.stories.length > 1 && (
          <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/10">
            <span className="text-[9px] font-bold text-white">{group.stories.length}</span>
          </div>
        )}

        {/* Bottom Username & Timestamp */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-col">
          <p className="text-[11px] font-semibold text-white truncate drop-shadow-md">
            {isMyStory ? 'Your Story' : group.user.displayName}
          </p>
          {!isMyStory && latestStory && (
            <p className="text-[9px] text-white/70 font-medium truncate drop-shadow-md">
              {formatTime(new Date(latestStory.createdAt))}
            </p>
          )}
        </div>
      </div>
    );
  };
  
  const formatTime = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "y ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + "m ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "d ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "h ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "m ago";
    return Math.floor(seconds) + "s ago";
  };

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-white p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Stories</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* My Story Section */}
        <div className="mb-8">
          <h2 className="text-[11px] font-bold text-white/40 mb-3 px-2 uppercase tracking-wider">My Story</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 px-2 custom-scrollbar">
            {/* Add Story Card */}
            <div className="relative w-28 h-40 sm:w-32 sm:h-48 rounded-2xl overflow-hidden cursor-pointer shrink-0 group transition-all duration-300 bg-neutral-900 border border-white/5">
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                onChange={handleFileChange}
              />
              {user?.profilePic ? (
                <img src={user.profilePic} alt="me" className="w-full h-full object-cover opacity-40 group-hover:opacity-30 transition-opacity" />
              ) : (
                <div className="w-full h-full bg-neutral-800" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-[#0A84FF] flex items-center justify-center shadow-[0_0_15px_rgba(10,132,255,0.4)] mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="text-white" size={20} />
                </div>
                <p className="text-[11px] font-bold text-white">Create Story</p>
              </div>
            </div>

            {myGroup && (
              <div onClick={() => handleOpenViewer([myGroup], 0)}>
                {renderStoryCard(myGroup, true)}
              </div>
            )}
          </div>
        </div>

        {/* Recent Stories */}
        {recentGroups.length > 0 && (
          <div className="mb-8">
            <h2 className="text-[11px] font-bold text-[#0A84FF] mb-3 px-2 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0A84FF] animate-pulse" />
              Recent Updates
            </h2>
            <div className="flex gap-3 overflow-x-auto pb-4 px-2 custom-scrollbar">
              {recentGroups.map((group, idx) => (
                <div key={group.user._id} onClick={() => handleOpenViewer(recentGroups, idx)}>
                  {renderStoryCard(group)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Viewed Stories */}
        {viewedGroups.length > 0 && (
          <div className="mb-8 opacity-70">
            <h2 className="text-[11px] font-bold text-white/40 mb-3 px-2 uppercase tracking-wider">Viewed Updates</h2>
            <div className="flex gap-3 overflow-x-auto pb-4 px-2 custom-scrollbar">
              {viewedGroups.map((group, idx) => (
                <div key={group.user._id} onClick={() => handleOpenViewer(viewedGroups, idx)}>
                  {renderStoryCard(group)}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {recentGroups.length === 0 && viewedGroups.length === 0 && !myGroup && (
          <div className="flex flex-col items-center justify-center h-64 text-neutral-500">
            <CircleDashed size={48} className="mb-4 opacity-20" />
            <p>No stories yet.</p>
            <p className="text-sm">Be the first to share an update!</p>
          </div>
        )}
      </div>

      {isCropModalOpen && selectedImage && (
        <MediaCropModal
          imageSrc={selectedImage}
          isSnap={true}
          onClose={() => {
            setIsCropModalOpen(false);
            setSelectedImage(null);
          }}
          onSend={handleSendStory}
        />
      )}
    </div>
  );
}
