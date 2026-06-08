import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useChatStore } from '../store/useChatStore';
import { useFriendStore } from '../store/useFriendStore';
import { useConfirmStore } from '../store/useConfirmStore';
import { axiosInstance } from '../lib/axios';
import { 
  Phone, PhoneOff, PhoneCall, PhoneIncoming, PhoneOutgoing,
  Loader2, Search, Clock, UserPlus, PhoneForwarded, 
  BarChart2, Star, Activity, Users, MessageSquare, Video, VideoOff, Trash2, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Calls() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeCall, setActiveCall } = useLayoutStore();
  const { socket, onlineUsers } = useChatStore();
  const { friends, getFriends, isLoading: isFriendsLoading } = useFriendStore();
  const { confirm } = useConfirmStore();

  const [callHistory, setCallHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('recent'); // 'recent', 'new_call'
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mobile specific states
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [selectedCall, setSelectedCall] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchCallHistory();
    getFriends();
  }, []);

  // Re-fetch call history when a call ends to update instantly
  useEffect(() => {
    if (!activeCall && !historyLoading) {
      fetchCallHistory();
    }
  }, [activeCall]);

  const fetchCallHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axiosInstance.get('/calls');
      setCallHistory(res.data);
    } catch (e) {
      console.error('Error fetching call history:', e);
      toast.error('Failed to load call history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStartCall = async (otherUser, isVideo = false) => {
    if (!otherUser) return;
    setShowBottomSheet(false);
    toast(`Initiating ${isVideo ? 'video' : 'voice'} call to ${otherUser.displayName}...`, { icon: isVideo ? '📹' : '📞' });

    try {
      const res = await axiosInstance.post('/calls', {
        receiverId: otherUser._id,
        type: isVideo ? 'video' : 'voice'
      });
      const callRecord = res.data;

      setActiveCall({
        callId: callRecord._id,
        name: otherUser.displayName,
        pic: otherUser.profilePic,
        type: isVideo ? 'video' : 'voice',
        status: 'dialing',
        receiverId: otherUser._id,
        direction: 'outgoing'
      });

      if (socket) {
        socket.emit('call:offer', {
          to: otherUser._id,
          callData: {
            callId: callRecord._id,
            callerId: user._id,
            callerName: user.displayName,
            callerPic: user.profilePic,
            type: isVideo ? 'video' : 'voice'
          }
        });
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Could not initiate call');
    }
  };

  const handleDeleteCallLog = async (callId) => {
    const isConfirmed = await confirm({
      title: 'Delete Call Log?',
      message: 'This removes the call record from your history.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true
    });

    if (isConfirmed) {
      setCallHistory(prev => prev.filter(c => c._id !== callId));
      setShowBottomSheet(false);
      try {
        await axiosInstance.delete(`/calls/${callId}`);
        toast.success('Call log deleted');
      } catch (error) {
        console.error('Failed to delete call log:', error);
      }
    }
  };

  // Touch Handlers for Long Press
  const handleTouchStart = (call) => {
    if (window.innerWidth >= 768) return; // Only for mobile
    timerRef.current = setTimeout(() => {
      if ('vibrate' in navigator) navigator.vibrate(50);
      setSelectedCall(call);
      setShowBottomSheet(true);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const formatDuration = (s) => {
    if (!s) return '0s';
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  // --- Statistics & Derived Data ---
  const filteredHistory = callHistory.filter(c => {
    if (!searchQuery) return true;
    const other = c.caller?._id === user?._id ? c.receiver : c.caller;
    return other?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           other?.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const missedCallsCount = callHistory.filter(c => c.status === 'missed' && c.caller?._id !== user?._id).length;
  const todaysCallsCount = callHistory.filter(c => new Date(c.createdAt) >= todayStart).length;

  const contactCounts = {};
  const recentContactIds = new Set();
  const recentContacts = [];

  callHistory.forEach(c => {
    const otherId = c.caller?._id === user?._id ? c.receiver?._id : c.caller?._id;
    const other = c.caller?._id === user?._id ? c.receiver : c.caller;
    if (otherId && other) {
      if (!contactCounts[otherId]) contactCounts[otherId] = { count: 0, user: other, lastCall: c.createdAt };
      contactCounts[otherId].count += 1;
      
      if (!recentContactIds.has(otherId) && recentContacts.length < 5) {
        recentContactIds.add(otherId);
        recentContacts.push(other);
      }
    }
  });

  const mostContacted = Object.values(contactCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map(c => c.user);

  const onlineFriends = (friends || []).filter(f => onlineUsers?.includes(f._id));
  const filteredFriends = (friends || []).filter(f => {
    if (!searchQuery) return true;
    return f.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
           f.username?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // --- Animation Variants ---
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="flex flex-col h-full w-full bg-background overflow-hidden relative">
      
      {/* Premium Header */}
      <div className="shrink-0 h-[72px] bg-surface/80 backdrop-blur-xl border-b border-outline-variant/30 flex items-center justify-between px-4 md:px-10 z-20 sticky top-0">
        
        {/* Mobile Search State */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-30 bg-surface flex items-center px-4 gap-3 md:hidden"
            >
              <div className="flex-1 flex items-center gap-2 bg-surface shadow-xl rounded-xl px-4 py-3 border border-outline-variant/30">
                <Search size={18} className="text-primary" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search calls or contacts..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-base font-medium w-full text-on-surface placeholder:text-on-surface-variant/50"
                />
              </div>
              <button 
                onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }}
                className="p-2 text-on-surface hover:text-primary bg-surface shadow-sm rounded-xl border border-outline-variant/30"
              >
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Phone size={20} className="fill-primary/20" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-on-surface">Calls Workspace</h1>
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-3 py-2 w-64 focus-within:border-primary/50 transition-colors">
            <Search size={16} className="text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="Search calls or friends..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium w-full text-on-surface placeholder:text-on-surface-variant/50"
            />
          </div>
          <div className="flex bg-surface-container-low p-1 rounded-xl">
            <button onClick={() => setActiveTab('recent')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'recent' ? 'bg-surface shadow-sm text-on-surface' : 'text-on-surface-variant hover:text-on-surface'}`}>Recent</button>
            <button onClick={() => setActiveTab('new_call')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'new_call' ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>Start Call</button>
          </div>
        </div>

        {/* Mobile Header Actions */}
        <div className="flex md:hidden items-center gap-1.5">
          <button onClick={() => setIsMobileSearchOpen(true)} className="p-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant">
            <Search size={20} />
          </button>
          <button onClick={() => navigate('/')} className="p-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant">
            <MessageSquare size={20} />
          </button>
          <button onClick={() => setActiveTab('new_call')} className={`p-2.5 rounded-xl ${activeTab === 'new_call' ? 'bg-primary/20 text-primary' : 'bg-surface-container-lowest text-on-surface-variant'}`}>
            <UserPlus size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'recent' ? (
            <motion.div 
              key="recent" 
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 flex"
            >
              {/* LEFT PANE: Feed */}
              <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-[13px] font-black tracking-widest uppercase text-on-surface-variant">Call History</h2>
                    {historyLoading && <Loader2 size={16} className="animate-spin text-primary" />}
                  </div>

                  {!historyLoading && filteredHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-outline-variant/50 rounded-3xl bg-surface-container-lowest">
                      <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-4">
                        <Clock size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-on-surface">No recent calls</h3>
                      <p className="text-sm text-on-surface-variant/70 mt-1 max-w-sm">Calls you make or receive will appear here. Start a new call to connect with friends.</p>
                    </div>
                  ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
                      {filteredHistory.map((call) => {
                        const callerId = String(call.caller?._id || call.caller);
                        const receiverId = String(call.receiver?._id || call.receiver);
                        const currentUserId = String(user?._id);
                        
                        const isOutgoing = callerId === currentUserId;
                        const other = isOutgoing ? call.receiver : call.caller;
                        const isMissed = call.status === 'missed' || call.status === 'rejected';
                        const callDate = new Date(call.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                        const callTime = new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                        let isVideo = call.type === 'video';
                        let StatusIcon = isVideo ? Video : PhoneIncoming;
                        let statusColor = 'text-green-500';
                        let statusBg = 'bg-green-500/10';
                        let label = isVideo ? 'Incoming Video' : 'Incoming';

                        if (isMissed) {
                          if (isOutgoing) {
                            StatusIcon = isVideo ? Video : PhoneOutgoing;
                            statusColor = 'text-on-surface-variant';
                            statusBg = 'bg-surface-container-high';
                            label = isVideo ? 'Unanswered Video' : 'Unanswered';
                          } else {
                            StatusIcon = isVideo ? VideoOff : PhoneOff;
                            statusColor = 'text-red-500';
                            statusBg = 'bg-red-500/10';
                            label = isVideo ? 'Missed Video' : 'Missed Call';
                          }
                        } else if (isOutgoing) {
                          StatusIcon = isVideo ? Video : PhoneOutgoing;
                          statusColor = 'text-on-surface-variant';
                          statusBg = 'bg-surface-container-high';
                          label = isVideo ? 'Outgoing Video' : 'Outgoing';
                        }

                        return (
                          <motion.div 
                            variants={itemVariants}
                            key={call._id}
                            onTouchStart={() => handleTouchStart(call)}
                            onTouchEnd={handleTouchEnd}
                            onTouchMove={handleTouchEnd}
                            onClick={() => {
                              if (window.innerWidth < 768 && other) handleStartCall(other);
                            }}
                            className="group flex items-center justify-between p-4 bg-surface rounded-3xl border border-transparent hover:border-outline-variant/30 hover:shadow-lg transition-all active:scale-[0.98] md:active:scale-100 cursor-pointer md:cursor-default"
                          >
                            <div className="flex items-center gap-4">
                              <div className="relative shrink-0">
                                <img
                                  src={other?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.displayName || '?')}`}
                                  alt={other?.displayName}
                                  className="w-14 h-14 rounded-2xl object-cover shadow-sm pointer-events-none"
                                />
                                <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center ${statusBg} ${statusColor} border-2 border-surface`}>
                                  <StatusIcon size={12} strokeWidth={3} />
                                </div>
                              </div>
                              
                              <div className="flex flex-col justify-center">
                                <h3 className={`text-[15px] font-bold ${isMissed ? 'text-red-500' : 'text-on-surface'}`}>
                                  {other?.displayName || 'Unknown User'}
                                </h3>
                                <div className="flex flex-wrap items-center gap-1 md:gap-2 mt-1">
                                  <span className="text-[11px] font-bold tracking-wider uppercase text-on-surface-variant/60">
                                    {label}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-on-surface-variant/30 hidden md:block"></span>
                                  <span className="text-[12px] font-semibold text-on-surface-variant/80">
                                    {callDate} at {callTime}
                                  </span>
                                  {call.duration > 0 && (
                                    <>
                                      <span className="w-1 h-1 rounded-full bg-on-surface-variant/30"></span>
                                      <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md">
                                        {formatDuration(call.duration)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              {other && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleStartCall(other); }}
                                  className="w-10 h-10 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex items-center justify-center shadow-sm active:scale-95 md:active:scale-100"
                                  title="Call Back"
                                >
                                  <Phone size={16} className="fill-current" />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* RIGHT PANE: Dashboard Widgets */}
              <div className="hidden xl:flex w-96 bg-surface-container-lowest border-l border-outline-variant/30 flex-col p-8 overflow-y-auto">
                <h2 className="text-[12px] font-black tracking-widest uppercase text-on-surface-variant mb-6 flex items-center gap-2">
                  <Activity size={14} /> Quick Stats
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-surface rounded-2xl p-5 border border-outline-variant/20 shadow-sm flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mb-3"><PhoneOff size={14} strokeWidth={2.5} /></div>
                    <p className="text-3xl font-black text-on-surface">{missedCallsCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 mt-1">Missed Calls</p>
                  </div>
                  <div className="bg-surface rounded-2xl p-5 border border-outline-variant/20 shadow-sm flex flex-col justify-between">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3"><PhoneForwarded size={14} strokeWidth={2.5} /></div>
                    <p className="text-3xl font-black text-on-surface">{todaysCallsCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70 mt-1">Calls Today</p>
                  </div>
                </div>

                {mostContacted.length > 0 && (
                  <>
                    <h2 className="text-[12px] font-black tracking-widest uppercase text-on-surface-variant mb-4 mt-2 flex items-center gap-2">
                      <Star size={14} /> Top Contacts
                    </h2>
                    <div className="flex flex-col gap-3 mb-8">
                      {mostContacted.map(contact => (
                        <div key={`top-${contact._id}`} className="flex items-center gap-3 bg-surface p-3 rounded-2xl border border-outline-variant/20 cursor-pointer hover:border-primary/30 transition-colors" onClick={() => handleStartCall(contact)}>
                          <img src={contact.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.displayName)}`} className="w-10 h-10 rounded-xl object-cover" alt=""/>
                          <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-on-surface truncate">{contact.displayName}</p>
                            <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">@{contact.username}</p>
                          </div>
                          <button className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center"><Phone size={12} className="fill-current"/></button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="new_call" 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="absolute inset-0 overflow-y-auto px-4 md:px-10 py-6 md:py-8 custom-scrollbar"
            >
              <div className="max-w-6xl mx-auto">
                {/* Active Sections Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-10">
                  
                  {/* Recently Contacted Bento */}
                  <div className="bg-surface rounded-3xl md:rounded-[2rem] p-5 md:p-6 border border-outline-variant/30 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                    <h2 className="text-[12px] font-black tracking-widest uppercase text-on-surface-variant mb-5 flex items-center gap-2 relative z-10">
                      <Clock size={14} /> Recently Contacted
                    </h2>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 relative z-10">
                      {recentContacts.length === 0 ? (
                        <p className="text-xs text-on-surface-variant/50 font-medium">No recent contacts.</p>
                      ) : (
                        recentContacts.map(contact => (
                          <div key={`recent-${contact._id}`} onClick={() => handleStartCall(contact)} className="flex flex-col items-center gap-2 cursor-pointer group shrink-0">
                            <div className="relative">
                              <img src={contact.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.displayName)}`} className="w-14 h-14 md:w-16 md:h-16 rounded-full object-cover border-2 border-surface shadow-md group-hover:scale-105 transition-transform" alt=""/>
                              <div className="absolute inset-0 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <Phone size={20} className="text-white fill-current shadow-lg" />
                              </div>
                            </div>
                            <p className="text-[11px] md:text-xs font-bold text-on-surface w-16 text-center truncate">{contact.displayName.split(' ')[0]}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Online Friends Bento */}
                  <div className="bg-surface rounded-3xl md:rounded-[2rem] p-5 md:p-6 border border-outline-variant/30 shadow-sm relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/5 rounded-full blur-3xl pointer-events-none"></div>
                    <h2 className="text-[12px] font-black tracking-widest uppercase text-on-surface-variant mb-5 flex items-center gap-2 relative z-10">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> Online Now
                    </h2>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 relative z-10">
                      {onlineFriends.length === 0 ? (
                        <p className="text-xs text-on-surface-variant/50 font-medium">No friends online right now.</p>
                      ) : (
                        onlineFriends.map(friend => (
                          <div key={`online-${friend._id}`} onClick={() => handleStartCall(friend)} className="flex flex-col items-center gap-2 cursor-pointer group shrink-0">
                            <div className="relative">
                              <img src={friend.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName)}`} className="w-14 h-14 md:w-16 md:h-16 rounded-[1rem] md:rounded-[1.25rem] object-cover border-2 border-surface shadow-md group-hover:scale-105 transition-transform" alt=""/>
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-surface"></div>
                              <div className="absolute inset-0 bg-green-500/20 rounded-[1rem] md:rounded-[1.25rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <Phone size={20} className="text-white fill-current shadow-lg" />
                              </div>
                            </div>
                            <p className="text-[11px] md:text-xs font-bold text-on-surface w-16 text-center truncate">{friend.displayName.split(' ')[0]}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>

                {/* All Friends List */}
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-[12px] font-black tracking-widest uppercase text-on-surface-variant flex items-center gap-2">
                    <Users size={14} /> Directory
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-outline-variant/30 to-transparent"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant bg-surface-container px-2 py-1 rounded-md">{filteredFriends.length} Friends</span>
                </div>

                {isFriendsLoading ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
                ) : filteredFriends.length === 0 ? (
                  <div className="text-center py-20 bg-surface rounded-3xl border border-outline-variant/30">
                    <UserPlus className="mx-auto text-on-surface-variant/30 mb-4" size={48} />
                    <p className="text-lg font-bold text-on-surface">Your directory is empty</p>
                    <p className="text-sm text-on-surface-variant/70 mt-2">Add more friends to your network to start calling them instantly.</p>
                  </div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filteredFriends.map((friend) => (
                      <motion.div
                        variants={itemVariants}
                        key={`dir-${friend._id}`}
                        className="flex items-center justify-between p-4 bg-surface rounded-3xl border border-outline-variant/40 hover:border-primary/30 hover:shadow-md transition-all group cursor-pointer"
                        onClick={() => handleStartCall(friend)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="relative shrink-0">
                            <img
                              src={friend.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName)}`}
                              alt={friend.displayName}
                              className="w-12 h-12 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform"
                            />
                            {onlineUsers?.includes(friend._id) && (
                              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-surface"></div>
                            )}
                          </div>
                          <div className="flex flex-col justify-center">
                            <p className="font-bold text-[14px] text-on-surface line-clamp-1">{friend.displayName}</p>
                            <p className="text-[11px] font-semibold text-on-surface-variant tracking-wider uppercase mt-0.5">@{friend.username}</p>
                          </div>
                        </div>
                        <button
                          className="w-10 h-10 shrink-0 rounded-2xl bg-surface-container text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center shadow-sm"
                          title="Start Voice Call"
                        >
                          <Phone size={16} className="group-hover:fill-current" />
                        </button>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* MOBILE BOTTOM SHEET FOR CALL ACTIONS */}
      <AnimatePresence>
        {showBottomSheet && selectedCall && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
              onClick={() => setShowBottomSheet(false)}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              drag="y" dragConstraints={{ top: 0 }} dragElastic={0.2}
              onDragEnd={(e, info) => { if (info.offset.y > 100) setShowBottomSheet(false) }}
              className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest rounded-t-[32px] z-[101] md:hidden flex flex-col shadow-[0_-20px_40px_rgba(0,0,0,0.5)] border-t border-outline-variant/20 overflow-hidden"
            >
              <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 rounded-full bg-outline-variant/50"></div>
              </div>
              
              <div className="px-6 pb-10 flex flex-col">
                {(() => {
                  const callerId = String(selectedCall.caller?._id || selectedCall.caller);
                  const currentUserId = String(user?._id);
                  const isOutgoing = callerId === currentUserId;
                  const otherUser = isOutgoing ? selectedCall.receiver : selectedCall.caller;
                  
                  return (
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        <img 
                          src={otherUser?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.displayName || '?')}`} 
                          className="w-16 h-16 rounded-2xl object-cover shadow-md" alt=""
                        />
                        <div>
                          <h2 className="text-xl font-bold text-on-surface tracking-tight">{otherUser?.displayName || 'Unknown User'}</h2>
                          <p className="text-sm font-semibold text-on-surface-variant uppercase tracking-wider mt-0.5">@{otherUser?.username || 'unknown'}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <button onClick={() => handleStartCall(otherUser, false)} className="flex items-center gap-4 p-4 rounded-2xl bg-surface hover:bg-surface-container transition-colors font-bold text-on-surface">
                          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0"><Phone size={18} className="fill-current"/></div>
                          Voice Call
                        </button>
                        <button onClick={() => handleStartCall(otherUser, true)} className="flex items-center gap-4 p-4 rounded-2xl bg-surface hover:bg-surface-container transition-colors font-bold text-on-surface">
                          <div className="w-10 h-10 rounded-full bg-[#0A84FF]/10 text-[#0A84FF] flex items-center justify-center shrink-0"><Video size={18} className="fill-current"/></div>
                          Video Call
                        </button>
                        <button onClick={() => { setShowBottomSheet(false); navigate(`/user-profile/${otherUser?._id}`); }} className="flex items-center gap-4 p-4 rounded-2xl bg-surface hover:bg-surface-container transition-colors font-bold text-on-surface">
                          <div className="w-10 h-10 rounded-full bg-surface-container-high text-on-surface flex items-center justify-center shrink-0"><Users size={18}/></div>
                          View Contact
                        </button>
                        <div className="w-full h-px bg-outline-variant/30 my-2"></div>
                        <button onClick={() => handleDeleteCallLog(selectedCall._id)} className="flex items-center gap-4 p-4 rounded-2xl bg-red-500/10 hover:bg-red-500/20 transition-colors font-bold text-red-500">
                          <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0"><Trash2 size={18}/></div>
                          Delete Call Log
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
