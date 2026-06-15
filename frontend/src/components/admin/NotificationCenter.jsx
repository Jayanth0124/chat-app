import { useState, useEffect, useMemo } from 'react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { BellRing, Send, Loader2, Clock, Globe, ShieldAlert, Users, History, Trash2, Smartphone, Monitor, ChevronRight, Activity, Radio, SignalHigh, CheckCircle2, Search, Filter } from 'lucide-react';
import { useConfirmStore } from '../../store/useConfirmStore';
import Select from '../ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../store/useChatStore';

export default function NotificationCenter() {
  const [audience, setAudience] = useState('All Users');
  const [message, setMessage] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const [targetUserId, setTargetUserId] = useState('');
  const [targetUserSearch, setTargetUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [users, setUsers] = useState([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  
  const [filter, setFilter] = useState('All'); // All, Active, Expired, Permanent
  const [searchQuery, setSearchQuery] = useState('');

  const { socket } = useChatStore();
  const [activeSessions, setActiveSessions] = useState(0);

  useEffect(() => {
    if (socket) {
      const handleStats = (stats) => {
        if (stats?.systemHealth?.activeConnections !== undefined) {
          setActiveSessions(stats.systemHealth.activeConnections);
        }
      };
      socket.on('admin:db_stats_update', handleStats);
      return () => socket.off('admin:db_stats_update', handleStats);
    }
  }, [socket]);

  const fetchHistory = async () => {
    try {
      const res = await axiosInstance.get('/admin/notifications/broadcast');
      setHistory(res.data);
    } catch (error) {
      console.error("Failed to fetch broadcast history:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (users.length > 0) return;
    setIsUsersLoading(true);
    try {
      const res = await axiosInstance.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchUsers();
    // Initial fetch for sessions
    axiosInstance.get('/admin/database-stats').then(res => {
      setActiveSessions(res.data?.systemHealth?.activeConnections || 0);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!targetUserSearch || targetUserId) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    setIsSearching(true);
    
    const debounceTimer = setTimeout(() => {
      const q = targetUserSearch.toLowerCase();
      const results = users.filter(u => 
        (u.displayName || '').toLowerCase().includes(q) || 
        (u.email || '').toLowerCase().includes(q) ||
        (u.username || '').toLowerCase().includes(q)
      ).slice(0, 5);
      
      setSearchResults(results);
      setIsSearching(false);
    }, 400);

    return () => clearTimeout(debounceTimer);
  }, [targetUserSearch, targetUserId, users]);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      return toast.error("Message content cannot be blank");
    }

    if (audience === 'Specific User' && !targetUserId) {
      return toast.error("Please select a target user");
    }

    setIsSending(true);
    try {
      const res = await axiosInstance.post('/admin/notifications/broadcast', {
        audience,
        message: message.trim(),
        isPermanent,
        targetUserId: audience === 'Specific User' ? targetUserId : null
      });
      toast.success(res.data.message || "Broadcast announcement dispatched!");
      setMessage('');
      if (audience === 'Specific User') {
        setTargetUserId('');
        setTargetUserSearch('');
      }
      fetchHistory(); // Refresh history immediately
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to dispatch broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteBroadcast = async (id) => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Terminate Broadcast",
      message: "Are you sure you want to terminate this broadcast? It will be removed from all active devices.",
      confirmText: "Terminate",
      danger: true
    });
    if (!confirmed) return;
    try {
      await axiosInstance.delete(`/admin/notifications/broadcast/${id}`);
      toast.success("Broadcast terminated successfully");
      fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to terminate broadcast");
    }
  };

  const getAudienceColor = (aud) => {
    if (aud.includes('Active')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    if (aud.includes('Specific')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    return 'bg-[#8C6DF0]/10 text-[#8C6DF0] border-[#8C6DF0]/20';
  };

  const getAudienceIcon = (aud) => {
    if (aud.includes('Active')) return <Clock size={12} />;
    if (aud.includes('Specific')) return <Users size={12} />;
    return <Globe size={12} />;
  };

  const totalUsers = users.length;
  const onlineUsers = users.filter(u => u.isOnline).length;
  const activeBroadcasts = history.filter(h => h.isPermanent || new Date(h.expiresAt) > new Date());
  const pendingNotifications = activeBroadcasts.length;

  const estimatedReach = useMemo(() => {
    if (audience === 'All Users') return totalUsers;
    if (audience === 'Active Users (Last 24h)') return Math.max(onlineUsers, Math.floor(totalUsers * 0.4)); // Rough estimate if 24h data not tracked
    if (audience === 'Specific User') return targetUserId ? 1 : 0;
    return 0;
  }, [audience, totalUsers, onlineUsers, targetUserId]);

  const filteredHistory = history.filter(item => {
    if (searchQuery && !item.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    const isActive = item.isPermanent || new Date(item.expiresAt) > new Date();
    if (filter === 'Active' && !isActive) return false;
    if (filter === 'Expired' && isActive) return false;
    if (filter === 'Permanent' && !item.isPermanent) return false;
    return true;
  });

  return (
    <div className="min-h-full bg-background font-sans text-on-surface">
      
      {/* Top Header Section */}
      <div className="bg-surface border-b border-outline-variant/30 sticky top-0 z-20 shadow-sm backdrop-blur-xl bg-surface/90">
        <div className="max-w-[1600px] mx-auto px-6 py-6 lg:py-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8C6DF0]/10 border border-[#8C6DF0]/20 flex items-center justify-center">
                <Radio className="text-[#8C6DF0]" size={22} />
              </div>
              Orbit Broadcast Command
            </h1>
            <p className="text-sm font-medium text-on-surface-variant/70 mt-2">
              Enterprise-grade real-time notification dispatch and telemetry.
            </p>
          </div>

          <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 min-w-[140px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                <Users size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Users</p>
                <p className="text-xl font-black text-white leading-none mt-1">{totalUsers.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 min-w-[140px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                <Activity size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Online</p>
                <p className="text-xl font-black text-white leading-none mt-1">{onlineUsers.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 min-w-[140px] flex items-center gap-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-[#8C6DF0]/5 to-transparent pointer-events-none" />
              <div className="w-10 h-10 rounded-full bg-[#8C6DF0]/10 flex items-center justify-center text-[#8C6DF0] shrink-0 relative z-10">
                <SignalHigh size={18} className="animate-pulse" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Sessions</p>
                <p className="text-xl font-black text-[#8C6DF0] leading-none mt-1">{activeSessions.toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 min-w-[140px] flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <BellRing size={18} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pending</p>
                <p className="text-xl font-black text-white leading-none mt-1">{pendingNotifications.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Composer (40%) */}
          <div className="xl:col-span-5 space-y-6">
            
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[2rem] p-6 lg:p-8 shadow-xl relative overflow-hidden group hover:border-[#8C6DF0]/30 transition-colors duration-500">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#8C6DF0]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50" />
              
              <h2 className="text-lg font-black text-white mb-6 tracking-tight flex items-center gap-2 relative z-10">
                <Send size={18} className="text-[#8C6DF0]" /> Dispatch Module
              </h2>

              <form onSubmit={handleSendBroadcast} className="space-y-6 relative z-10">
                
                {/* Audience Selection */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center justify-between">
                    <span>Target Audience</span>
                    <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-[9px]">
                      Est. Reach: {estimatedReach.toLocaleString()}
                    </span>
                  </label>
                  <Select
                    value={audience}
                    onChange={(val) => {
                      setAudience(val);
                      if (val !== 'Specific User') {
                        setTargetUserId('');
                        setTargetUserSearch('');
                      }
                    }}
                    options={[
                      'All Users',
                      'Active Users (Last 24h)',
                      'Specific User'
                    ]}
                    className="w-full bg-surface border-outline-variant/40 rounded-xl font-medium h-12"
                  />
                </div>

                {/* Specific User Search */}
                <AnimatePresence>
                  {audience === 'Specific User' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-visible"
                    >
                      <div className="space-y-2 pt-2">
                        <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Locate User</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Search alias or identifier..."
                            value={targetUserSearch}
                            onChange={(e) => {
                              setTargetUserSearch(e.target.value);
                              setTargetUserId('');
                            }}
                            className="w-full pl-4 pr-10 py-3.5 rounded-xl bg-surface border border-outline-variant/40 focus:ring-2 focus:ring-[#8C6DF0]/30 focus:border-[#8C6DF0] outline-none text-white text-sm transition-all shadow-inner"
                          />
                          {isSearching && (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#8C6DF0]" size={18} />
                          )}
                          
                          {targetUserSearch && !targetUserId && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-outline-variant/40 rounded-xl shadow-2xl max-h-56 overflow-y-auto z-30 p-1.5 backdrop-blur-xl">
                              {isSearching ? (
                                <div className="px-3 py-3 text-sm text-center text-on-surface-variant font-medium">
                                  Searching network...
                                </div>
                              ) : searchResults.length === 0 ? (
                                <div className="px-3 py-3 text-sm text-center text-on-surface-variant font-medium">
                                  No users found
                                </div>
                              ) : (
                                searchResults.map(u => (
                                  <button
                                    key={u._id}
                                    type="button"
                                    onClick={() => {
                                      setTargetUserId(u._id);
                                      setTargetUserSearch(u.displayName || u.username);
                                    }}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-surface-container-highest transition-colors flex items-center justify-between group cursor-pointer"
                                  >
                                    <div>
                                      <span className="text-sm font-bold text-white block">{u.displayName || u.username}</span>
                                      <span className="text-xs text-on-surface-variant font-medium">@{u.username}</span>
                                    </div>
                                    <ChevronRight size={16} className="text-on-surface-variant group-hover:text-white transition-colors" />
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                          {targetUserId && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 size={12} /> Verified
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expiry Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Broadcast Lifespan</label>
                  <div className="grid grid-cols-2 gap-3 bg-surface p-1.5 rounded-2xl border border-outline-variant/40">
                    <button
                      type="button"
                      onClick={() => setIsPermanent(false)}
                      className={`py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex justify-center items-center gap-2 ${
                        !isPermanent 
                          ? 'bg-surface-container-highest text-white shadow-md border border-white/5' 
                          : 'text-on-surface-variant hover:text-white hover:bg-surface-container-high border border-transparent'
                      }`}
                    >
                      <Clock size={14} className={!isPermanent ? 'text-amber-400' : ''} /> 24 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPermanent(true)}
                      className={`py-3 text-xs font-bold rounded-xl transition-all cursor-pointer flex justify-center items-center gap-2 ${
                        isPermanent 
                          ? 'bg-surface-container-highest text-white shadow-md border border-white/5' 
                          : 'text-on-surface-variant hover:text-white hover:bg-surface-container-high border border-transparent'
                      }`}
                    >
                      <Globe size={14} className={isPermanent ? 'text-[#8C6DF0]' : ''} /> Permanent
                    </button>
                  </div>
                </div>

                {/* Message Editor */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex justify-between items-center">
                    <span>Payload Content</span>
                    <span className={`text-[10px] ${message.length > 500 ? 'text-red-500' : 'text-on-surface-variant'}`}>
                      {message.length} / 500
                    </span>
                  </label>
                  <textarea 
                    rows="5" 
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 500))}
                    placeholder="Enter broadcast transmission..." 
                    className="w-full px-5 py-4 rounded-2xl bg-surface border border-outline-variant/40 focus:ring-2 focus:ring-[#8C6DF0]/30 focus:border-[#8C6DF0] outline-none text-white text-[15px] resize-none transition-all shadow-inner leading-relaxed" 
                    required
                  />
                </div>

                {/* Submit */}
                <button 
                  type="submit"
                  disabled={isSending || !message.trim()}
                  className="w-full flex items-center justify-center gap-2 h-14 bg-[#8C6DF0] text-white rounded-2xl font-black tracking-wide text-sm hover:bg-[#7a5ce6] transition-all shadow-[0_0_20px_rgba(140,109,240,0.3)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  {isSending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Transmitting...
                    </>
                  ) : (
                    <>
                      <Radio size={18} />
                      Initialize Broadcast
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Live Preview Section */}
            <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[2rem] p-6 shadow-sm overflow-hidden">
              <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-4 flex items-center gap-2">
                <Monitor size={14} /> Live Telemetry Preview
              </h3>
              
              <div className="bg-surface border border-outline-variant/30 rounded-xl p-4 shadow-inner relative">
                {message ? (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#8C6DF0]/20 flex items-center justify-center shrink-0 border border-[#8C6DF0]/30">
                      <BellRing size={14} className="text-[#8C6DF0]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white mb-0.5">System Announcement</p>
                      <p className="text-[13px] text-on-surface-variant leading-relaxed break-words line-clamp-3">
                        {message}
                      </p>
                      <p className="text-[10px] text-on-surface-variant/50 font-semibold mt-2">Just now</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-6">
                    <p className="text-sm font-medium text-on-surface-variant/50">Transmission preview will appear here</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: History Timeline (60%) */}
          <div className="xl:col-span-7 bg-surface-container-lowest border border-outline-variant/40 rounded-[2rem] p-6 lg:p-8 shadow-xl flex flex-col h-[85vh] sticky top-32">
            
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 shrink-0">
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <History size={18} className="text-on-surface-variant" /> Transmission Log
              </h2>
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
                  <input 
                    type="text" 
                    placeholder="Search logs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-[#8C6DF0]/50 transition-colors"
                  />
                </div>
                
                <div className="relative">
                  <Select
                    value={filter}
                    onChange={setFilter}
                    options={['All', 'Active', 'Expired', 'Permanent']}
                    className="bg-surface border-outline-variant/40 rounded-xl text-xs py-2 h-auto"
                  />
                </div>
              </div>
            </div>

            {/* Timeline Feed */}
            {isHistoryLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-[#8C6DF0]" size={32} />
                  <p className="text-sm font-semibold text-on-surface-variant">Syncing databanks...</p>
                </div>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-outline-variant/20 rounded-[1.5rem] bg-surface/30">
                <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4">
                  <History size={24} className="text-on-surface-variant/40" />
                </div>
                <p className="text-base font-bold text-white tracking-tight">No transmissions found</p>
                <p className="text-sm text-on-surface-variant mt-1.5 max-w-sm leading-relaxed">
                  Adjust your search filters or initialize a new broadcast to populate the timeline.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                <AnimatePresence>
                  {filteredHistory.map((item, index) => {
                    const isExpired = !item.isPermanent && new Date(item.expiresAt) <= new Date();
                    const statusText = item.isPermanent ? 'Permanent' : (isExpired ? 'Expired' : 'Active 24h');
                    const statusColor = item.isPermanent ? 'text-[#8C6DF0] bg-[#8C6DF0]/10 border-[#8C6DF0]/20' : (isExpired ? 'text-on-surface-variant bg-surface-container-high border-outline-variant/30' : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20');

                    return (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        key={item._id} 
                        className={`p-5 rounded-[1.5rem] border transition-all ${isExpired ? 'bg-surface border-outline-variant/20 opacity-75' : 'bg-surface-container-low border-outline-variant/40 hover:border-[#8C6DF0]/30 hover:shadow-lg'}`}
                      >
                        <div className="flex justify-between items-start gap-4 mb-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${getAudienceColor(item.audience)}`}>
                              {getAudienceIcon(item.audience)}
                              {item.audience}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${statusColor}`}>
                              {statusText}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[11px] font-bold text-on-surface-variant/70 flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-lg border border-outline-variant/20">
                              <Clock size={12} />
                              {new Date(item.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <button 
                              onClick={() => handleDeleteBroadcast(item._id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer border border-transparent hover:border-red-500/20"
                              title="Terminate Broadcast"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        
                        <p className={`text-[15px] leading-relaxed font-medium break-words ${isExpired ? 'text-on-surface-variant' : 'text-white'}`}>
                          {item.message}
                        </p>

                        <div className="mt-4 pt-3 border-t border-outline-variant/20 flex flex-wrap items-center justify-between text-[11px] font-semibold gap-2">
                          <div className="flex items-center gap-2 text-on-surface-variant">
                            <ShieldAlert size={12} />
                            <span>Authorized by: {item.sender?.displayName || item.sender?.username || 'System Admin'}</span>
                          </div>
                          <div className="text-on-surface-variant/50">
                            ID: {item._id.slice(-6).toUpperCase()}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
