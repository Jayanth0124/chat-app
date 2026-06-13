import React, { useEffect, useState } from 'react';
import { Plus, Camera, Image as ImageIcon, CircleDashed, Flame, Eye, TrendingUp, Trophy, ChevronRight, RotateCcw, Activity, Trash2 } from 'lucide-react';
import useStoryStore from '../store/useStoryStore';
import { useAuthStore } from '../store/useAuthStore';
import MediaCropModal from '../components/modals/MediaCropModal';
import StoryViewer from '../components/stories/StoryViewer';
import StoryPrivacyModal from '../components/modals/StoryPrivacyModal';
import Avatar from '../components/ui/Avatar';
import toast from 'react-hot-toast';

export default function Stories() {
  const { 
    stories, fetchStories, createStory, deleteStory,
    storyStats, fetchStoryStats, 
    addOptimisticStory, removeOptimisticStory, markOptimisticStoryFailed 
  } = useStoryStore();
  const { user } = useAuthStore();
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [pendingStoryData, setPendingStoryData] = useState(null);
  
  // Viewer state
  const { activeStoryGroups, activeStoryGroupIndex, openStoryViewer } = useStoryStore();

  useEffect(() => {
    fetchStories();
    fetchStoryStats();
  }, [fetchStories, fetchStoryStats]);

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
    setIsCropModalOpen(false);
    setSelectedImage(null);
    setPendingStoryData({ mediaUrl: croppedDataUrl, caption });
    setShowPrivacyModal(true);
  };

  const handleConfirmPrivacy = async (privacySettings) => {
    setShowPrivacyModal(false);
    
    if (!pendingStoryData) return;

    const { mediaUrl, caption } = pendingStoryData;
    const { privacy, allowedUsers, showBadge } = privacySettings;

    const tempId = `temp_${Date.now()}`;
    const optimisticStory = {
      _id: tempId,
      user: user,
      mediaUrl: mediaUrl,
      mediaType: 'image',
      caption: caption,
      privacy,
      allowedUsers,
      showBadge,
      createdAt: new Date().toISOString(),
      views: [],
      reactions: [],
      isOptimistic: true,
      uploadFailed: false
    };

    addOptimisticStory(optimisticStory);

    try {
      await createStory({
        mediaUrl: mediaUrl,
        mediaType: 'image',
        caption: caption,
        privacy,
        allowedUsers,
        showBadge
      }, tempId);
    } catch (error) {
      console.error(error);
      // store marks it as failed
    } finally {
      setPendingStoryData(null);
    }
  };

  const handleRetryUpload = async (story) => {
    removeOptimisticStory(story._id);
    setPendingStoryData({ mediaUrl: story.mediaUrl, caption: story.caption });
    setShowPrivacyModal(true);
  };

  const getRankInfo = (total) => {
    if (total <= 10) return { name: 'Explorer', min: 0, max: 10, next: 'Navigator', color: '#0A84FF' };
    if (total <= 25) return { name: 'Navigator', min: 11, max: 25, next: 'Voyager', color: '#10B981' };
    if (total <= 50) return { name: 'Voyager', min: 26, max: 50, next: 'Pioneer', color: '#8B5CF6' };
    if (total <= 100) return { name: 'Pioneer', min: 51, max: 100, next: 'Commander', color: '#F59E0B' };
    if (total <= 250) return { name: 'Commander', min: 101, max: 250, next: 'Legend', color: '#EF4444' };
    return { name: 'Legend', min: 251, max: 251, next: null, color: '#EAB308' };
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
    const isUploading = isMyStory && latestStory?.isOptimistic && !latestStory?.uploadFailed;
    const hasFailed = isMyStory && latestStory?.uploadFailed;
    
    return (
      <div 
        key={group.user._id} 
        className={`relative w-28 h-40 sm:w-32 sm:h-48 md:w-36 md:h-56 rounded-2xl overflow-hidden shrink-0 group transition-all duration-300 ring-1 ring-white/5 hover:ring-[#0A84FF]/50 shadow-xl ${hasFailed ? 'ring-red-500/50' : ''} ${!isUploading && !hasFailed ? 'cursor-pointer' : ''}`}
      >
        {/* Preview Background */}
        <div className="absolute inset-0 bg-neutral-900">
          <img 
            src={latestStory?.mediaUrl || group.user.profilePic} 
            alt="Story Preview" 
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100 ${isUploading ? 'blur-sm scale-105' : ''}`}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/90" />
        </div>

        {/* Uploading State */}
        {isUploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/40 backdrop-blur-[2px]">
            <div className="w-8 h-8 border-2 border-[#0A84FF] border-t-transparent rounded-full animate-spin mb-2 shadow-[0_0_10px_rgba(10,132,255,0.5)]"></div>
            <p className="text-[10px] font-bold text-white tracking-widest uppercase">Posting</p>
          </div>
        )}

        {/* Failed State */}
        {hasFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/60 backdrop-blur-[2px]">
            <button 
              onClick={(e) => { e.stopPropagation(); handleRetryUpload(latestStory); }}
              className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center mb-2 hover:scale-110 transition-transform shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            >
              <RotateCcw className="text-white" size={20} />
            </button>
            <p className="text-[10px] font-bold text-white tracking-widest uppercase">Failed</p>
          </div>
        )}

        {/* Top left Orbit Ring & Profile */}
        <div className={`absolute top-3 left-3 flex items-center justify-center ${isUploading || hasFailed ? 'opacity-30' : ''}`}>
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[2px] shadow-lg backdrop-blur-sm ${hasUnseen ? 'bg-gradient-to-tr from-[#0A84FF] to-purple-500' : 'bg-white/20'}`}>
            <Avatar 
              src={group.user.profilePic} 
              name={group.user.displayName || group.user.username}
              sizeClass="w-full h-full"
              className="border-[1.5px] border-black"
            />
          </div>
        </div>

        {/* Top Right Story Count */}
        {group.stories.length > 1 && !isUploading && !hasFailed && (
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
            <span className="text-[10px] font-bold text-white">{group.stories.length}</span>
          </div>
        )}

        {/* Bottom Username & Timestamp */}
        <div className={`absolute bottom-3 left-3 right-3 flex flex-col ${isUploading || hasFailed ? 'opacity-30' : ''}`}>
          <p className="text-[12px] sm:text-[13px] font-semibold text-white truncate drop-shadow-md">
            {isMyStory ? 'Your Story' : group.user.displayName}
          </p>
          {!isMyStory && latestStory && !latestStory.isOptimistic && (
            <p className="text-[10px] sm:text-[11px] text-white/70 font-medium truncate drop-shadow-md mt-0.5">
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
    <div className="h-full w-full flex flex-col xl:flex-row bg-[#050505] text-white overflow-y-auto xl:overflow-hidden relative custom-scrollbar">
      
      {/* Left / Main Content */}
      <div className="flex-none xl:flex-1 flex flex-col xl:overflow-y-auto custom-scrollbar p-0 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto w-full pt-4 sm:pt-0 pl-4 sm:pl-0">
          <div className="flex items-center justify-between mb-6 sm:mb-8 pr-4 sm:pr-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-1">Stories</h1>
              <p className="text-xs sm:text-sm text-white/50">Share your moments, securely.</p>
            </div>
          </div>

          {/* === DESKTOP LAYOUT (Hidden on mobile) === */}
          <div className="hidden sm:flex flex-col space-y-8 pr-4 sm:pr-0">
            {/* First Row: Create Story & My Story */}
            <div className="flex gap-4">
              {/* Add Story Card */}
              <div className="relative w-28 h-40 sm:w-32 sm:h-48 md:w-36 md:h-56 rounded-2xl overflow-hidden cursor-pointer shrink-0 group transition-all duration-300 bg-neutral-900 border border-white/10 hover:border-[#0A84FF]/50 hover:shadow-lg hover:shadow-[#0A84FF]/10">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                  onChange={handleFileChange}
                />
                {user?.profilePic ? (
                  <img src={user.profilePic} alt="me" className="w-full h-full object-cover opacity-30 group-hover:opacity-20 transition-opacity" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0A84FF] to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(10,132,255,0.4)] mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Plus className="text-white" size={24} />
                  </div>
                  <p className="text-[12px] font-bold text-white">Create Story</p>
                </div>
              </div>

              {myGroup && (
                <div onClick={() => handleOpenViewer([myGroup], 0)}>
                  {renderStoryCard(myGroup, true)}
                </div>
              )}
            </div>

            {/* Second Row: Friends Stories */}
            {(recentGroups.length > 0 || viewedGroups.length > 0) && (
              <div className="flex flex-wrap gap-4">
                {recentGroups.map((group, idx) => (
                  <div key={group.user._id} onClick={() => handleOpenViewer(recentGroups, idx)}>
                    {renderStoryCard(group)}
                  </div>
                ))}
                {viewedGroups.map((group, idx) => (
                  <div key={group.user._id} onClick={() => handleOpenViewer(viewedGroups, idx)} className="opacity-60 hover:opacity-100">
                    {renderStoryCard(group)}
                  </div>
                ))}
              </div>
            )}
            
            {recentGroups.length === 0 && viewedGroups.length === 0 && !myGroup && (
              <div className="flex flex-col items-center justify-center h-40 text-neutral-500 bg-white/[0.02] rounded-3xl border border-white/5 border-dashed max-w-[400px]">
                <p className="text-white/80 font-medium">No stories yet.</p>
                <p className="text-sm mt-1">Be the first to share an update!</p>
              </div>
            )}
          </div>

          {/* === MOBILE LAYOUT (Hidden on desktop) === */}
          <div className="sm:hidden flex gap-3 overflow-x-auto pb-6 scrollbar-hide snap-x pr-4 -mx-4 px-4">
            {/* Add Story Card */}
            <div className="snap-start shrink-0 relative w-28 h-40 rounded-2xl overflow-hidden bg-neutral-900 border border-white/10">
              <input 
                type="file" 
                accept="image/*" 
                className="absolute inset-0 opacity-0 cursor-pointer z-20" 
                onChange={handleFileChange}
              />
              {user?.profilePic ? (
                <img src={user.profilePic} alt="me" className="w-full h-full object-cover opacity-30" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0A84FF] to-blue-600 flex items-center justify-center mb-2">
                  <Plus className="text-white" size={20} />
                </div>
                <p className="text-[11px] font-bold text-white">Create Story</p>
              </div>
            </div>

            {/* My Story Card */}
            {myGroup && (
              <div className="snap-start shrink-0" onClick={() => handleOpenViewer([myGroup], 0)}>
                {renderStoryCard(myGroup, true)}
              </div>
            )}

            {/* Friends Stories */}
            {recentGroups.map((group, idx) => (
              <div className="snap-start shrink-0" key={group.user._id} onClick={() => handleOpenViewer(recentGroups, idx)}>
                {renderStoryCard(group)}
              </div>
            ))}
            {viewedGroups.map((group, idx) => (
              <div className="snap-start shrink-0 opacity-60" key={group.user._id} onClick={() => handleOpenViewer(viewedGroups, idx)}>
                {renderStoryCard(group)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Orbit Rank Panel */}
      <div className="w-full xl:w-[380px] 2xl:w-[420px] flex-none shrink-0 xl:border-l border-t xl:border-t-0 border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col xl:overflow-y-auto custom-scrollbar relative">
        <div className="flex items-center gap-2 mb-8 text-white/90">
          <Activity size={18} className="text-[#0A84FF]" />
          <span className="text-sm font-bold tracking-wide">Your Orbit Rank</span>
        </div>
        
        {/* Main Rank Display */}
        {storyStats ? (() => {
          const rank = getRankInfo(storyStats.totalStories);
          const progressPercent = rank.next ? ((storyStats.totalStories - rank.min) / (rank.max - rank.min)) * 100 : 100;
          
          return (
            <div className="relative z-10 flex flex-col items-center mb-8 w-full max-w-sm mx-auto">
              <h2 
                className="text-[26px] font-bold text-center mb-4 tracking-wide transition-colors duration-1000"
                style={{ color: rank.color, textShadow: `0 0 15px ${rank.color}66` }}
              >
                {rank.name}
              </h2>
              
              {/* Circular Logo & Arc */}
              <div className="relative w-full aspect-[5/3] flex items-end justify-center mb-4">
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="xMidYMax meet">
                  {/* Background track */}
                  <path d="M 20 110 A 80 80 0 1 1 180 110" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" strokeLinecap="round" />
                  {/* Progress track */}
                  <path 
                    d="M 20 110 A 80 80 0 1 1 180 110" 
                    fill="transparent" 
                    stroke="url(#progressGradient)" 
                    strokeWidth="6" 
                    strokeLinecap="round" 
                    strokeDasharray="252"
                    strokeDashoffset={252 - (252 * progressPercent) / 100}
                    className="transition-all duration-1000 ease-out"
                    style={{ filter: `drop-shadow(0 0 8px ${rank.color}CC)` }}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="100%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={rank.color} />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                </svg>
                <img src="/logo.svg" alt="Orbit Rank" className="relative z-10 w-32 h-32 md:w-36 md:h-36 mb-1 animate-pulse transition-all duration-1000" style={{ filter: `drop-shadow(0 0 25px ${rank.color}66)` }} />
              </div>
              
              <div className="text-center mb-1">
                <span className="text-[#d946ef] text-[13px] font-bold tracking-wide">
                  {storyStats.totalStories} / {rank.next ? rank.max : 'MAX'} XP
                </span>
              </div>
              <p className="text-center text-[11px] text-white/50 font-medium">Keep sharing stories to level up!</p>
            </div>
          );
        })() : (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Stats List Box */}
        {storyStats && (
          <div className="bg-[#111111] rounded-2xl p-4 sm:p-5 mb-6 border border-white/5 w-full max-w-sm mx-auto shadow-xl">
            <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
              {/* Total Stories */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white/80">
                  <div className="w-7 h-7 rounded-lg bg-[#0A84FF]/20 flex items-center justify-center text-[#0A84FF]">
                    <ImageIcon size={14} />
                  </div>
                  <span className="text-xs font-semibold">Total Stories</span>
                </div>
                <span className="text-sm font-bold text-white">{storyStats.totalStories}</span>
              </div>
              
              {/* Total Views */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white/80">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                    <Eye size={14} />
                  </div>
                  <span className="text-xs font-semibold">Total Views</span>
                </div>
                <span className="text-sm font-bold text-white">{storyStats.totalStoryViews}</span>
              </div>
              
              {/* Current Streak */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white/80">
                  <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                    <Flame size={14} />
                  </div>
                  <span className="text-xs font-semibold">Current Streak</span>
                </div>
                <span className="text-sm font-bold text-white">{storyStats.currentStreak} days</span>
              </div>
              
              {/* Longest Streak */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-white/80">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                    <Trophy size={14} />
                  </div>
                  <span className="text-xs font-semibold">Longest Streak</span>
                </div>
                <span className="text-sm font-bold text-white">{storyStats.longestStreak} days</span>
              </div>
            </div>
          </div>
        )}

        {/* Rank Progress Bar */}
        {storyStats && (() => {
          const rank = getRankInfo(storyStats.totalStories);
          const ranks = ['Explorer', 'Navigator', 'Voyager', 'Pioneer', 'Commander', 'Legend'];
          
          return (
            <div className="bg-[#111111] rounded-2xl p-4 sm:p-5 border border-white/5 w-full max-w-sm mx-auto shadow-xl">
              <h3 className="text-xs font-bold text-white/90 mb-5 tracking-wide">Rank Progress</h3>
              <div className="flex items-center justify-between relative px-2">
                {/* connecting line */}
                <div className="absolute top-[14px] left-6 right-6 h-[2px] bg-white/5 -translate-y-1/2" />
                
                {ranks.map((r) => {
                  const isActive = rank.name === r;
                  const isPast = ranks.indexOf(r) <= ranks.indexOf(rank.name);
                  
                  return (
                    <div key={r} className="relative flex flex-col items-center gap-2 z-10 bg-[#111111] px-0.5">
                      <div 
                        className={`w-7 h-7 rounded-full flex items-center justify-center border-[1.5px] transition-all duration-500 ${isActive ? 'scale-110' : 'border-white/10 bg-black'}`}
                        style={isActive ? { borderColor: rank.color, backgroundColor: `${rank.color}33`, boxShadow: `0 0 10px ${rank.color}80` } : isPast ? { borderColor: `${getRankInfo(ranks.findIndex(x => x === r) * 20).color}66`, backgroundColor: `${getRankInfo(ranks.findIndex(x => x === r) * 20).color}1A` } : {}}
                      >
                        {isActive ? (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: rank.color }} />
                        ) : isPast ? (
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getRankInfo(ranks.findIndex(x => x === r) * 20).color }} />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                        )}
                      </div>
                      <span 
                        className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-wider`}
                        style={{ color: isActive ? rank.color : isPast ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.3)' }}
                      >
                        {r}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

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

      {showPrivacyModal && (
        <StoryPrivacyModal 
          onClose={() => {
            setShowPrivacyModal(false);
            setPendingStoryData(null);
          }}
          onConfirm={handleConfirmPrivacy}
        />
      )}

      {/* Story Viewer Overlay */}
      {activeStoryGroups && (
        <StoryViewer 
          groups={activeStoryGroups} 
          initialGroupIndex={activeStoryGroupIndex}
          onClose={() => {
            useStoryStore.getState().closeStoryViewer();
          }}
        />
      )}
    </div>
  );
}
