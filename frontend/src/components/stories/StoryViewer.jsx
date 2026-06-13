import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, MessageCircle, Eye, Trash2, MoreVertical, Send, Loader2, User, Share, Download, Archive, Link as LinkIcon, Star } from 'lucide-react';
import useStoryStore from '../../store/useStoryStore';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import Avatar from '../ui/Avatar';
import StoryPrivacyModal from '../modals/StoryPrivacyModal';

const STORY_DURATION = 5000;

export default function StoryViewer({ groups, initialGroupIndex, onClose }) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(initialGroupIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const orbitVariants = {
    enter: (direction) => ({
      scale: direction > 0 ? 0.85 : 1.15,
      opacity: 0,
      rotateY: direction > 0 ? -12 : 12,
      z: direction > 0 ? -100 : 100,
      filter: "blur(15px)",
    }),
    center: {
      scale: 1,
      opacity: 1,
      rotateY: 0,
      z: 0,
      filter: "blur(0px)",
    },
    exit: (direction) => ({
      scale: direction > 0 ? 1.15 : 0.85,
      opacity: 0,
      rotateY: direction > 0 ? 12 : -12,
      z: direction > 0 ? 100 : -100,
      filter: "blur(15px)",
    }),
  };
  
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  const [showInsights, setShowInsights] = useState(false);
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showEditPrivacy, setShowEditPrivacy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
  
  const videoRef = useRef(null);
  const activeBarRef = useRef(null);
  const animationRef = useRef(null);
  const pausedProgressRef = useRef(0);
  const lastUpdateRef = useRef(Date.now());
  const isClosingRef = useRef(false);
  
  const { user } = useAuthStore();
  const { stories, viewStory, reactToStory, deleteStory, updateStoryPrivacy } = useStoryStore();
  const { sendReplyToStory } = useChatStore.getState();

  // Compute LIVE group and story data so websocket updates reflect instantly!
  const staticGroup = groups[currentGroupIndex];
  const currentGroup = staticGroup ? {
    ...staticGroup,
    stories: staticGroup.stories.map(s => stories.find(live => live._id === s._id)).filter(Boolean)
  } : null;
  
  const currentStory = currentGroup?.stories[currentStoryIndex];
  const isOwner = currentStory?.user?._id === user?._id;

  // Deduplicate views based on user ID to handle any legacy dirty data correctly
  const rawViews = currentStory?.views || [];
  const uniqueViewsMap = new Map();
  rawViews.forEach(v => {
    const uId = v.user?._id ? v.user._id.toString() : v.user?.toString();
    if (!uId) return;
    if (uniqueViewsMap.has(uId)) {
      const existing = uniqueViewsMap.get(uId);
      existing.viewCount = (existing.viewCount || 1) + (v.viewCount || 1);
      if (new Date(v.lastViewedAt) > new Date(existing.lastViewedAt)) existing.lastViewedAt = v.lastViewedAt;
      if (new Date(v.firstViewedAt) < new Date(existing.firstViewedAt)) existing.firstViewedAt = v.firstViewedAt;
    } else {
      uniqueViewsMap.set(uId, { ...v });
    }
  });
  const dedupedViews = Array.from(uniqueViewsMap.values());
  const totalViews = dedupedViews.reduce((sum, v) => sum + (v.viewCount || 1), 0);
  const uniqueViewers = dedupedViews.length;
  const repeatedViews = Math.max(0, totalViews - uniqueViewers);

  // Track viewed stories to prevent duplicate views on re-renders or socket updates
  const viewedStoriesRef = useRef(new Set());

  useEffect(() => {
    if (currentStory && !isOwner) {
      if (!viewedStoriesRef.current.has(currentStory._id)) {
        viewStory(currentStory._id);
        viewedStoriesRef.current.add(currentStory._id);
      }
    }
  }, [currentStory?._id, isOwner]);

  useEffect(() => {
    pausedProgressRef.current = 0;
    if (activeBarRef.current) {
      activeBarRef.current.style.width = '0%';
    }
  }, [currentStoryIndex, currentGroupIndex]);

  useEffect(() => {
    if (isPaused || showInsights || showOwnerMenu || isReplying || showEditPrivacy || showDeleteConfirm) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (videoRef.current) videoRef.current.pause();
      return;
    }
    
    if (currentStory?.mediaType === 'video' && videoRef.current) {
      videoRef.current.play().catch(e => console.log("Video play interrupted:", e));
    }

    lastUpdateRef.current = Date.now();

    const animate = () => {
      if (isClosingRef.current) return;
      const now = Date.now();
      const dt = now - lastUpdateRef.current;
      lastUpdateRef.current = now;

      let newProgress = pausedProgressRef.current;
      
      if (currentStory?.mediaType === 'video') {
        if (videoRef.current && videoRef.current.readyState >= 1) {
          const duration = videoRef.current.duration || 1;
          newProgress = (videoRef.current.currentTime / duration) * 100;
          pausedProgressRef.current = newProgress;
        }
      } else {
        newProgress += (dt / STORY_DURATION) * 100;
        pausedProgressRef.current = newProgress;
      }
      
      if (activeBarRef.current) {
        activeBarRef.current.style.width = `${Math.min(newProgress, 100)}%`;
      }

      if (newProgress >= 100) {
        handleNext();
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [currentStoryIndex, currentGroupIndex, isPaused, showInsights, showOwnerMenu, isReplying, currentStory]);

  const handleNext = () => {
    if (isClosingRef.current) return;
    
    setDirection(1);
    if (currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      isClosingRef.current = true;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      onClose();
    }
  };

  const handlePrev = () => {
    setDirection(-1);
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      setCurrentStoryIndex(groups[currentGroupIndex - 1].stories.length - 1);
    }
  };

  const handleTap = (e) => {
    if (e.target.closest('.story-controls')) return;
    
    const { clientX } = e.touches ? e.touches[0] : e;
    const { innerWidth } = window;
    
    if (clientX > innerWidth / 2) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  const handleDelete = () => {
    setShowOwnerMenu(false);
    setShowDeleteConfirm(true);
    setIsPaused(true);
  };

  const confirmDelete = async () => {
    if (!currentStory || isDeleting) return;
    setIsDeleting(true);
    
    try {
      await deleteStory(currentStory._id);
      if (currentGroup.stories.length === 1) {
        if (groups.length === 1) onClose();
        else handleNext();
      } else {
        if (currentStoryIndex === currentGroup.stories.length - 1) {
          handlePrev();
        }
      }
    } finally {
      setShowDeleteConfirm(false);
      setIsPaused(false);
      setIsDeleting(false);
    }
  };

  const handleReaction = (e, emoji) => {
    e.stopPropagation();
    reactToStory(currentStory._id, emoji);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    try {
      setIsPaused(true);
      const chatStore = useChatStore.getState();
      const chat = await chatStore.accessChat(currentStory.user._id);
      
      chatStore.sendMessage({
        chatId: chat._id,
        content: replyText,
        messageType: 'story_reply',
        mediaUrl: currentStory.mediaUrl
      });
      setReplyText('');
      setIsReplying(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPaused(false);
    }
  };

  const handlePanEnd = (e, info) => {
    // Swipe Down to Close
    if (info.offset.y > 100) {
      onClose();
      return;
    }
    // Swipe Left to Next
    if (info.offset.x < -50) {
      handleNext();
      return;
    }
    // Swipe Right to Prev
    if (info.offset.x > 50) {
      handlePrev();
      return;
    }
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-[#0a0a0a] text-white flex flex-col items-center justify-center overflow-hidden touch-none select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      
      {/* Dynamic Blurred Background - Reduced blur by 50% */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-black">
        <img src={currentStory.mediaUrl} alt="" className="w-full h-full object-cover blur-[20px] scale-125 brightness-[0.3]" />
      </div>

      {/* Main Viewer Container - Fixed constraints for Desktop vs Mobile */}
      <motion.div 
        className="w-full h-full sm:w-[420px] sm:h-[85vh] relative shadow-[0_30px_100px_rgba(0,0,0,0.8)] flex flex-col z-10 sm:rounded-[32px] overflow-hidden bg-black border border-white/5"
        onPanStart={() => setIsPaused(true)}
        onPanEnd={(e, info) => {
          setIsPaused(false);
          handlePanEnd(e, info);
        }}
        onMouseDown={(e) => !e.target.closest('.story-controls') && setIsPaused(true)}
        onMouseUp={(e) => !e.target.closest('.story-controls') && setIsPaused(false)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={(e) => !e.target.closest('.story-controls') && setIsPaused(true)}
        onTouchEnd={(e) => !e.target.closest('.story-controls') && setIsPaused(false)}
        onClick={handleTap}
        onDoubleClick={(e) => {
          if (!isOwner && !e.target.closest('.story-controls')) {
            handleReaction('❤️');
          }
        }}
      >
        
        {/* Media Content - Orbit Stack Animation */}
        <div className="absolute inset-0 z-0 bg-[#0a0a0a] overflow-hidden" style={{ perspective: '1200px' }}>
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={currentStory._id}
              custom={direction}
              variants={orbitVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                duration: 0.4,
                ease: [0.32, 0.72, 0, 1]
              }}
              style={{ transformStyle: 'preserve-3d' }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none shadow-2xl"
            >
              {currentStory.mediaType === 'video' ? (
                <video 
                  ref={videoRef}
                  src={currentStory.mediaUrl} 
                  autoPlay 
                  playsInline 
                  muted 
                  onEnded={() => handleNext()}
                  className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              ) : (
                <img 
                  src={currentStory.mediaUrl} 
                  alt="story" 
                  className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_0_25px_rgba(0,0,0,0.5)]"
                  draggable={false}
                  onContextMenu={(e) => e.preventDefault()}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Orbit Rail & Header - Floating cleanly over the gradient */}
        <div className="absolute top-0 left-0 right-0 z-50 flex flex-col px-4 pt-4 pb-12 bg-gradient-to-b from-black/80 via-black/30 to-transparent story-controls pointer-events-none">
          
          {/* Orbit Rail */}
          <div className="flex items-center w-full mb-4 px-1">
            {currentGroup.stories.map((story, idx) => (
              <React.Fragment key={`${story._id || 'story'}-${idx}`}>
                <div 
                  className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${
                    idx === currentStoryIndex 
                      ? 'bg-[#0A84FF] shadow-[0_0_10px_rgba(10,132,255,0.9)] scale-125' 
                      : idx < currentStoryIndex 
                        ? 'bg-white' 
                        : 'bg-white/30'
                  }`}
                />
                <div className="flex-1 h-[2px] bg-white/20 mx-1.5 overflow-hidden rounded-full">
                  <div 
                    ref={idx === currentStoryIndex ? activeBarRef : null}
                    className="h-full bg-white"
                    style={{ 
                      width: idx < currentStoryIndex ? '100%' : '0%' 
                    }}
                  />
                </div>
              </React.Fragment>
            ))}
          </div>

          {/* Minimal Header */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-3 drop-shadow-md">
              <Avatar 
                src={currentGroup.user.profilePic} 
                name={currentGroup.user.displayName || currentGroup.user.username}
                sizeClass="w-10 h-10"
                className="border border-white/10"
              />
              <div className="flex flex-col">
                <span className="font-bold text-[14px] text-white flex items-center gap-2">
                  {currentGroup.user.displayName}
                  {isOwner && <span className="bg-white/20 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">OWNER</span>}
                  {currentStory.privacy === 'custom' && currentStory.showBadge !== false && (
                    <span className="bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                      <Star size={10} className="fill-current" /> Close Friends
                    </span>
                  )}
                </span>
                <span className="text-[11px] text-white/70 font-medium tracking-wide">
                  {formatTime(new Date(currentStory.createdAt))}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {isOwner && (
                <button onClick={() => setShowOwnerMenu(true)} className="p-2 hover:bg-white/10 rounded-full transition text-white">
                  <MoreVertical size={20} />
                </button>
              )}
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-white">
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-20 left-4 right-4 z-40 pointer-events-none flex flex-col justify-end">
            <span className="text-[14px] font-medium text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {currentStory.caption}
            </span>
          </div>
        )}

        {/* Bottom Dock attached directly to bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent story-controls z-40 flex justify-center pointer-events-none">
          {isOwner ? (
            <div className="pointer-events-auto flex w-full">
              <button 
                onClick={() => setShowInsights(true)}
                className="w-full flex items-center justify-center gap-2 text-sm font-bold bg-white/10 backdrop-blur-md border border-white/10 py-3.5 rounded-full hover:bg-white/20 transition text-white"
              >
                <Eye size={18} className="text-[#0A84FF]" />
                {uniqueViewers} Views
              </button>
            </div>
          ) : (
            <div className="w-full pointer-events-auto">
              {isReplying ? (
                <motion.form 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  onSubmit={handleSendReply} 
                  className="w-full flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/15 rounded-full p-1 pl-4"
                >
                  <input 
                    type="text" 
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onFocus={() => setIsPaused(true)}
                    onBlur={() => setIsPaused(false)}
                    placeholder="Reply to story..." 
                    autoFocus
                    className="flex-1 bg-transparent text-[14px] text-white placeholder-white/50 focus:outline-none"
                  />
                  <button type="button" onClick={() => setIsReplying(false)} className="p-2 text-white/50 hover:text-white transition">
                    <X size={18} />
                  </button>
                  <button type="submit" className="p-2.5 bg-[#0A84FF] text-white rounded-full transition hover:scale-105 active:scale-95">
                    <Send size={16} className="ml-0.5" />
                  </button>
                </motion.form>
              ) : (
                <div className="flex items-center gap-3 w-full">
                  <button onClick={() => setIsReplying(true)} className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-full py-3.5 px-5 text-[14px] font-medium text-white/90 transition flex items-center gap-2">
                    <MessageCircle size={18} /> Reply...
                  </button>
                  <button onClick={(e) => handleReaction(e, '❤️')} className={`w-12 h-12 flex items-center justify-center backdrop-blur-md border border-white/10 rounded-full transition-colors group shrink-0 ${currentStory.reactions?.some(r => (r.user?._id || r.user)?.toString() === user?._id) ? 'bg-red-500/20 text-red-500' : 'bg-white/10 hover:bg-white/20 text-white hover:text-red-500'}`}>
                    <Heart size={20} className={`group-hover:scale-110 transition-transform ${currentStory.reactions?.some(r => (r.user?._id || r.user)?.toString() === user?._id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>



        {/* Owner Menu Bottom Sheet */}
        <AnimatePresence>
          {showOwnerMenu && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 story-controls"
                onClick={() => setShowOwnerMenu(false)}
              />
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 bg-[#151515] rounded-t-[32px] z-50 p-6 pb-safe story-controls border-t border-white/10"
              >
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8 shrink-0" />
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition text-white/90">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><Download size={20} /></div>
                    <span className="font-semibold text-[15px]">Save Photo</span>
                  </button>
                  <button onClick={() => { setShowOwnerMenu(false); setShowEditPrivacy(true); }} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 transition text-white/90">
                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"><Star size={20} /></div>
                    <span className="font-semibold text-[15px]">Edit Privacy</span>
                  </button>

                  <button onClick={handleDelete} className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 transition text-red-500 mt-2 border border-red-500/20 bg-red-500/5">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center"><Trash2 size={20} /></div>
                    <span className="font-semibold text-[15px]">Delete Story</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Insights Bottom Sheet */}
        <AnimatePresence>
          {showInsights && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 story-controls"
                onClick={() => setShowInsights(false)}
              />
              <motion.div 
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="absolute bottom-0 left-0 right-0 bg-[#151515] rounded-t-[32px] z-50 p-6 pb-safe story-controls max-h-[85vh] flex flex-col border-t border-white/10"
              >
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 shrink-0 tracking-tight">
                  <Eye className="text-[#0A84FF]" size={24} /> Story Performance
                </h3>
                
                {(() => {
                  const sortedViews = [...dedupedViews].sort((a, b) => {
                    const timeA = new Date(a.lastViewedAt || new Date()).getTime();
                    const timeB = new Date(b.lastViewedAt || new Date()).getTime();
                    if (timeB !== timeA) return timeB - timeA;
                    return (b.viewCount || 1) - (a.viewCount || 1);
                  });

                  return (
                    <>
                      <div className="grid grid-cols-2 gap-3 mb-6 shrink-0">
                        <div className="bg-[#0A84FF]/10 border border-[#0A84FF]/20 rounded-2xl p-4 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-[#0A84FF] tracking-tight">{uniqueViewers}</span>
                          <span className="text-[11px] text-[#0A84FF]/80 font-bold uppercase mt-1">Unique Viewers</span>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-purple-400 tracking-tight">{repeatedViews}</span>
                          <span className="text-[11px] text-purple-400/80 font-bold uppercase mt-1">Repeat Views</span>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar pr-2">
                        <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest mb-4 sticky top-0 bg-[#151515] py-2 z-10 border-b border-white/5">VIEWER CARDS</h4>
                        {sortedViews.length > 0 ? (
                          <div className="space-y-2 pb-4">
                            {sortedViews.map((view, i) => {
                              const viewCount = view.viewCount || 1;
                              const lastViewed = view.lastViewedAt ? new Date(view.lastViewedAt) : new Date();
                              const firstViewed = view.firstViewedAt ? new Date(view.firstViewedAt) : lastViewed;
                              // Combine user ID and index for safe key in case old duplicate data exists
                              const safeKey = view.user?._id ? `${view.user._id}-${i}` : i;
                              // Check if this viewer has reacted
                              const userReaction = currentStory.reactions?.find(r => 
                                (r.user?._id ? r.user._id.toString() : r.user?.toString()) === 
                                (view.user?._id ? view.user._id.toString() : view.user?.toString())
                              );

                              return (
                                <div key={safeKey} className="flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl hover:bg-white/10 transition relative">
                                  <div className="relative">
                                    {view.user?.profilePic ? (
                                      <img src={view.user.profilePic} alt={view.user.displayName} className="w-12 h-12 rounded-full object-cover shrink-0" />
                                    ) : (
                                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                                        <User size={20} className="text-white/50" />
                                      </div>
                                    )}
                                    {userReaction && (
                                      <div className="absolute -bottom-1 -right-1 bg-[#151515] rounded-full p-0.5 z-10">
                                        <div className="bg-white/10 w-5 h-5 rounded-full flex items-center justify-center text-[10px]">
                                          {userReaction.emoji}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="font-bold text-[14px] truncate text-white">
                                        {view.user?.displayName || 'Unknown User'}
                                      </span>
                                      {viewCount > 1 && (
                                        <span className="bg-[#0A84FF]/20 text-[#0A84FF] text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 border border-[#0A84FF]/30">
                                          x{viewCount}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-col text-[12px] text-white/40">
                                      <span>First View: {firstViewed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      <span>Last View: {lastViewed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-center text-white/30 text-sm py-12 flex flex-col items-center gap-3">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                              <Eye size={24} className="opacity-50" />
                            </div>
                            No viewers yet
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </motion.div>

      {showEditPrivacy && (
        <StoryPrivacyModal 
          isEditing={true}
          initialPrivacy={currentStory?.privacy}
          initialAllowedUsers={currentStory?.allowedUsers}
          initialShowBadge={currentStory?.showBadge}
          onClose={() => setShowEditPrivacy(false)}
          onConfirm={async (privacyData) => {
            await updateStoryPrivacy(currentStory._id, privacyData);
            setShowEditPrivacy(false);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1C1C1E] border border-white/10 w-full max-w-[320px] rounded-[24px] overflow-hidden shadow-2xl flex flex-col p-6 items-center text-center"
            >
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                <Trash2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Delete Story?</h3>
              <p className="text-sm text-white/60 mb-6">
                This story will be permanently removed. This action cannot be undone.
              </p>
              
              <div className="flex gap-3 w-full">
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setIsPaused(false);
                  }}
                  className="flex-1 py-3 rounded-xl font-bold text-[14px] bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className={`flex-1 py-3 rounded-xl font-bold text-[14px] text-white shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 ${isDeleting ? 'bg-red-500/50 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin" /> : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
