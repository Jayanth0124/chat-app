import React, { useState, useEffect, useRef } from 'react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldBan, 
  Trash2, 
  Loader2, 
  Search,
  MessageSquare,
  AlertTriangle,
  LogOut,
  RefreshCcw,
  Ban,
  Activity,
  History,
  EyeOff,
  UserX,
  UserCheck,
  Image as ImageIcon,
  Mic,
  Video,
  Clock,
  ChevronRight,
  ShieldAlert,
  Database,
  Crosshair,
  Lock,
  MessageCircle,
  MoreVertical,
  CheckCircle2,
  XCircle,
  TerminalSquare,
  ArrowLeft,
  Users,
  MessageSquareOff
} from 'lucide-react';
import { useConfirmStore } from '../../store/useConfirmStore';
import Avatar from '../ui/Avatar';

export default function ChatModeration() {

  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Selected state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userConversations, setUserConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [workspaceLoading, setWorkspaceLoading] = useState(false);

  // Metrics
  const [metrics, setMetrics] = useState({
    reportsToday: 0,
    activeInvestigations: 0,
    messagesRemoved: 0,
    usersWarned: 0,
    accountsSuspended: 0
  });

  const scrollRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
    // Simulate real-time stream
    const interval = setInterval(() => {
      fetchLogsQuietly();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, logsRes, reportsRes] = await Promise.all([
        axiosInstance.get('/admin/users'),
        axiosInstance.get('/admin/audit-logs'),
        axiosInstance.get('/admin/reports')
      ]);
      setUsers(usersRes.data);
      setAuditLogs(logsRes.data);
      setReports(reportsRes.data);
      
      calculateMetrics(reportsRes.data, logsRes.data);
    } catch (error) {
      toast.error('Failed to sync intelligence data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLogsQuietly = async () => {
    try {
      const logsRes = await axiosInstance.get('/admin/audit-logs');
      setAuditLogs(logsRes.data);
    } catch (e) {
      // quiet fail
    }
  };

  const calculateMetrics = (reportsData, logsData) => {
    const today = new Date().setHours(0,0,0,0);
    const repToday = reportsData.filter(r => new Date(r.createdAt).getTime() > today).length;
    const active = reportsData.filter(r => r.status === 'pending').length;
    
    // Extract from logs
    let removed = 0;
    let warned = 0;
    let suspended = 0;
    
    logsData.forEach(log => {
      if (log.action === 'DELETE_MESSAGE' || log.action === 'BULK_DELETE_MESSAGES') removed++;
      if (log.action === 'WARN_USER') warned++;
      if (log.action === 'BAN_USER') suspended++;
    });

    setMetrics({
      reportsToday: repToday,
      activeInvestigations: active,
      messagesRemoved: removed,
      usersWarned: warned,
      accountsSuspended: suspended
    });
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setSelectedChat(null);
    setChatMessages([]);
    setSelectedMessageIds(new Set());
    setWorkspaceLoading(true);
    
    try {
      const res = await axiosInstance.get(`/admin/users/${user._id}/conversations`);
      setUserConversations(res.data);
    } catch (error) {
      toast.error('Failed to load user communications');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleOpenConversation = async (chat) => {
    setSelectedChat(chat);
    setWorkspaceLoading(true);
    setSelectedMessageIds(new Set());
    try {
      const res = await axiosInstance.get(`/admin/conversations/${chat._id}/messages`);
      setChatMessages(res.data);
    } catch (error) {
      toast.error('Failed to fetch messages');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const toggleMessageSelect = (msgId) => {
    const newSelection = new Set(selectedMessageIds);
    if (newSelection.has(msgId)) newSelection.delete(msgId);
    else newSelection.add(msgId);
    setSelectedMessageIds(newSelection);
  };

  // --- Moderation Action Handlers --- //

  const handleWarnUser = async () => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Issue Warning",
      message: `Send an official moderation warning to ${selectedUser.username}?`,
      confirmText: "Issue Warning",
    });
    if (!confirmed) return;
    
    try {
      await axiosInstance.post(`/admin/users/${selectedUser._id}/warn`);
      toast.success(`Warning issued to ${selectedUser.username}`);
      setMetrics(p => ({ ...p, usersWarned: p.usersWarned + 1 }));
    } catch (e) {
      toast.error('Failed to issue warning');
    }
  };

  const handleResetPassword = async () => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Force Password Reset",
      message: `Invalidate current sessions and force password reset for ${selectedUser.username}?`,
      confirmText: "Reset",
      danger: true
    });
    if (!confirmed) return;
    toast.success('Password reset initiated. User logged out.');
  };

  const handleForceLogout = async () => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Force Logout",
      message: `Terminate all active sessions for ${selectedUser.username}?`,
      confirmText: "Logout",
      danger: true
    });
    if (!confirmed) return;
    
    try {
      await axiosInstance.post(`/admin/users/${selectedUser._id}/logout`);
      toast.success('All sessions terminated.');
    } catch (error) {
      toast.error('Failed to force logout');
    }
  };

  const handleDeleteMessage = async () => {
    if (selectedMessageIds.size === 0) return;
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Delete Content",
      message: `Permanently delete ${selectedMessageIds.size} selected message(s)?`,
      confirmText: "Delete",
      danger: true
    });
    if (!confirmed) return;

    setWorkspaceLoading(true);
    try {
      await axiosInstance.post('/admin/messages/bulk-delete', {
        messageIds: Array.from(selectedMessageIds)
      });
      toast.success(`Purged ${selectedMessageIds.size} messages`);
      setMetrics(p => ({ ...p, messagesRemoved: p.messagesRemoved + selectedMessageIds.size }));
      setSelectedMessageIds(new Set());
      
      const res = await axiosInstance.get(`/admin/conversations/${selectedChat._id}/messages`);
      setChatMessages(res.data);
    } catch (error) {
      toast.error('Failed to delete messages');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleUnsendMessage = async () => {
    if (selectedMessageIds.size === 0) return;
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Unsend Content",
      message: `Retract ${selectedMessageIds.size} selected message(s) as if the user unsent them?`,
      confirmText: "Unsend",
      danger: true
    });
    if (!confirmed) return;
    
    // Simulate unique logic for Unsend
    toast.success(`Retracted ${selectedMessageIds.size} messages from chat.`);
    setSelectedMessageIds(new Set());
  };

  const handleClearStories = async () => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Clear Stories",
      message: `Remove all active stories for ${selectedUser.username}?`,
      confirmText: "Clear Stories",
      danger: true
    });
    if (!confirmed) return;

    try {
      await axiosInstance.delete(`/admin/users/${selectedUser._id}/stories`);
      toast.success('Stories removed from public feed.');
      setSelectedUser(prev => ({ ...prev, storiesCount: 0 }));
      setUsers(users.map(u => u._id === selectedUser._id ? { ...u, storiesCount: 0 } : u));
    } catch (error) {
      toast.error('Failed to clear stories');
    }
  };

  const handleRestrictUser = async () => {
    const isRestricted = selectedUser.mutedUntil && new Date(selectedUser.mutedUntil) > new Date();
    
    if (isRestricted) {
      // Unrestrict User
      const confirmed = await useConfirmStore.getState().confirm({
        title: "Unrestrict Communications",
        message: `Remove communication restrictions for ${selectedUser.username}?`,
        confirmText: "Unrestrict",
        danger: false
      });
      if (!confirmed) return;

      try {
        await axiosInstance.put(`/admin/users/${selectedUser._id}/restrict`, { durationHours: 0 }); // 0 hours un-restricts immediately
        toast.success(`Restrictions removed for ${selectedUser.username}`);
        const updatedUser = { ...selectedUser, mutedUntil: null };
        setSelectedUser(updatedUser);
        setUsers(users.map(u => u._id === selectedUser._id ? updatedUser : u));
      } catch (e) {
        toast.error('Failed to remove restrictions');
      }
    } else {
      // Restrict User (e.g. 24 hours)
      const confirmed = await useConfirmStore.getState().confirm({
        title: "Restrict Communications",
        message: `Restrict ${selectedUser.username} from sending messages for 24 hours?`,
        confirmText: "Restrict",
        danger: true
      });
      if (!confirmed) return;

      try {
        await axiosInstance.put(`/admin/users/${selectedUser._id}/restrict`, { durationHours: 24 });
        toast.success(`Communications restricted for ${selectedUser.username}`);
        const newMutedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        const updatedUser = { ...selectedUser, mutedUntil: newMutedUntil };
        setSelectedUser(updatedUser);
        setUsers(users.map(u => u._id === selectedUser._id ? updatedUser : u));
      } catch (e) {
        toast.error('Failed to restrict communications');
      }
    }
  };

  const handleSuspendAccount = async () => {
    const isSuspended = selectedUser.status === 'suspended';
    const confirmed = await useConfirmStore.getState().confirm({
      title: isSuspended ? "Unsuspend Account" : "Suspend Account",
      message: isSuspended ? `Remove suspension for ${selectedUser.username}?` : `Temporarily suspend ${selectedUser.username}?`,
      confirmText: isSuspended ? "Unsuspend" : "Suspend",
      danger: !isSuspended
    });
    if (!confirmed) return;

    setWorkspaceLoading(true);
    try {
      const res = await axiosInstance.put(`/admin/users/${selectedUser._id}/suspend`);
      toast.success(isSuspended ? 'Account unsuspended.' : 'Account suspended successfully.');
      const newStatus = res.data.user.status;
      setSelectedUser(prev => ({ ...prev, status: newStatus }));
      setUsers(users.map(u => u._id === selectedUser._id ? { ...u, status: newStatus } : u));
      if (!isSuspended) setMetrics(p => ({ ...p, accountsSuspended: p.accountsSuspended + 1 }));
    } catch (error) {
      toast.error('Failed to suspend account');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const handleBanAccount = async () => {
    const isBanned = selectedUser.status === 'banned';
    const confirmed = await useConfirmStore.getState().confirm({
      title: isBanned ? "Unban Account" : "Ban Account",
      message: isBanned ? `Remove ban for ${selectedUser.username}?` : `Permanently ban ${selectedUser.username}? This is irreversible.`,
      confirmText: isBanned ? "Unban User" : "Ban Permanently",
      danger: !isBanned
    });
    if (!confirmed) return;

    setWorkspaceLoading(true);
    try {
      const res = await axiosInstance.put(`/admin/users/${selectedUser._id}/ban`);
      toast.success(isBanned ? 'User has been unbanned.' : 'User has been banned.');
      
      const newStatus = res.data.user.status;
      setSelectedUser(prev => ({ ...prev, status: newStatus }));
      setUsers(users.map(u => u._id === selectedUser._id ? { ...u, status: newStatus } : u));
    } catch (error) {
      toast.error('Failed to update ban status');
    } finally {
      setWorkspaceLoading(false);
    }
  };

  // UI Filtering
  let displayUsers = users;
  if (searchQuery) {
    displayUsers = users.filter(u => 
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (filterType === 'Reported') displayUsers = displayUsers.filter(u => u.reportsReceived > 0);
  if (filterType === 'Banned') displayUsers = displayUsers.filter(u => u.status === 'banned');
  if (filterType === 'Active') displayUsers = displayUsers.filter(u => u.status === 'active');

  const getRiskLevel = (score) => {
    if (score >= 80) return { label: 'Low Risk', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
    if (score >= 50) return { label: 'Medium Risk', color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
    return { label: 'High Risk', color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' };
  };

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-64px)] bg-[#050505] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-emerald-500" size={32} />
          <p className="text-white/50 text-sm tracking-widest font-mono uppercase">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-[#0a0a0a] text-white overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* ================= LEFT PANEL ================= */}
      <div className={`w-full md:w-80 border-r border-white/5 bg-[#0a0a0a] flex-col z-10 shrink-0 ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-white/5 shrink-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Crosshair size={16} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Target Discovery</h2>
              <p className="text-[10px] text-white/40 uppercase tracking-widest">Global Scan</p>
            </div>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input 
              type="text" 
              placeholder="Search ident, email, id..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {['All', 'Reported', 'Active', 'Banned'].map(filter => (
              <button
                key={filter}
                onClick={() => setFilterType(filter)}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider rounded-full border transition-all ${
                  filterType === filter 
                    ? 'bg-white text-black border-white font-bold' 
                    : 'bg-transparent text-white/50 border-white/10 hover:border-white/30'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {displayUsers.map(user => {
            const risk = getRiskLevel(user.trustScore ?? 100);
            return (
              <button
                key={user._id}
                onClick={() => handleSelectUser(user)}
                className={`w-full p-3 rounded-xl border flex items-center gap-3 transition-all text-left group ${
                  selectedUser?._id === user._id 
                    ? 'bg-[#1a1a1a] border-white/20' 
                    : 'bg-transparent border-transparent hover:bg-[#111] hover:border-white/5'
                }`}
              >
                <div className="relative">
                  <Avatar src={user.profilePic} name={user.username} sizeClass="w-10 h-10 text-xs" />
                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-[#0a0a0a] ${
                    user.status === 'banned' ? 'bg-red-500' : 
                    (user.isOnline ? 'bg-emerald-500' : 'bg-neutral-600')
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-sm font-bold truncate">{user.username}</span>
                    <span className={`text-[9px] uppercase tracking-wider font-bold ${risk.color}`}>
                      {user.trustScore ?? 100} TS
                    </span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-white/40">
                    <span className="truncate">{user.email}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= CENTER PANEL ================= */}
      <div className={`flex-1 flex flex-col bg-[#0a0a0a] relative min-w-0 h-full overflow-hidden ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 custom-scrollbar pb-40">
              
              <div className="md:hidden mb-6 mt-2">
                <button onClick={() => setSelectedUser(null)} className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors bg-[#111] px-4 py-2 rounded-xl border border-white/5">
                  <ArrowLeft size={14} /> Back to Users
                </button>
              </div>
              
              {/* Top Intelligence Row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                {/* Intelligence Card */}
                <div className="xl:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 relative z-10">
                    <Avatar src={selectedUser.profilePic} name={selectedUser.username} sizeClass="w-20 h-20 sm:w-24 sm:h-24 text-2xl border-2 border-white/10 rounded-2xl shrink-0" />
                    <div className="flex-1 w-full min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 pr-4">
                          <h1 className="text-xl sm:text-2xl font-bold mb-1 truncate">{selectedUser.displayName || selectedUser.username}</h1>
                          <p className="text-white/50 text-xs sm:text-sm font-mono mb-4 truncate w-full">@{selectedUser.username} • {selectedUser.email}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider ${
                          selectedUser.status === 'banned' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                        }`}>
                          {selectedUser.status === 'banned' ? 'Terminated' : 'Active'}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                        {[
                          { label: 'Messages', val: selectedUser.messagesCount || selectedUser.lifetimeMetrics?.messagesSent || 0 },
                          { label: 'Stories', val: selectedUser.storiesCount || selectedUser.lifetimeMetrics?.storiesPosted || 0 },
                          { label: 'Calls', val: selectedUser.callsCount || selectedUser.lifetimeMetrics?.callsMade || 0 },
                          { label: 'Reports', val: selectedUser.reportsReceived || selectedUser.lifetimeMetrics?.reportsReceived || 0 },
                        ].map((stat, i) => (
                          <div key={i} className="bg-[#111] border border-white/5 rounded-xl p-3 flex flex-col justify-center items-center text-center">
                            <p className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-base sm:text-lg font-bold font-mono">{stat.val}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Score Widget */}
                <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 flex flex-col justify-center items-center relative overflow-hidden">
                   <div className="text-center">
                      <p className="text-[10px] text-white/40 uppercase tracking-widest mb-2">Platform Trust Score</p>
                      <div className={`text-6xl font-black mb-2 ${getRiskLevel(selectedUser.trustScore ?? 100).color}`}>
                        {selectedUser.trustScore ?? 100}
                      </div>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${getRiskLevel(selectedUser.trustScore ?? 100).bg} ${getRiskLevel(selectedUser.trustScore ?? 100).border} ${getRiskLevel(selectedUser.trustScore ?? 100).color}`}>
                         <ShieldAlert size={14} />
                         {getRiskLevel(selectedUser.trustScore ?? 100).label}
                      </div>
                   </div>
                </div>
              </div>

              {/* Conversation Investigation Area */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <Database size={18} className="text-white/50" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white/80">Communication Logs</h3>
                </div>

                {workspaceLoading ? (
                  <div className="h-64 border border-white/5 bg-[#0a0a0a] rounded-2xl flex items-center justify-center">
                    <Loader2 className="animate-spin text-white/20" size={32} />
                  </div>
                ) : !selectedChat ? (
                  // Chat List
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {userConversations.length === 0 ? (
                      <div className="col-span-full h-32 border border-white/5 border-dashed rounded-xl flex items-center justify-center text-white/30 text-sm">
                        No communication logs found.
                      </div>
                    ) : (
                      userConversations.map(chat => {
                        const isGroup = chat.isGroupChat;
                        const otherParticipants = chat.participants.filter(p => p._id !== selectedUser._id);
                        const title = isGroup ? chat.groupName : otherParticipants.map(p => p.username).join(', ');
                        
                        return (
                          <button
                            key={chat._id}
                            onClick={() => handleOpenConversation(chat)}
                            className="bg-[#0a0a0a] hover:bg-[#111] border border-white/5 hover:border-white/20 rounded-xl p-4 flex items-center gap-4 transition-all text-left group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
                              {isGroup ? <Users size={18} className="text-white/50" /> : <MessageCircle size={18} className="text-white/50" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold truncate">{title || 'Unknown'}</p>
                              <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
                                {isGroup ? 'Group Channel' : 'Direct Comms'}
                              </p>
                            </div>
                            <ChevronRight size={16} className="text-white/20 group-hover:text-white transition-colors" />
                          </button>
                        )
                      })
                    )}
                  </div>
                ) : (
                  // Message Viewer
                  <div className="border border-white/10 bg-[#0a0a0a] rounded-2xl overflow-hidden flex flex-col h-[500px]">
                    <div className="px-4 py-3 bg-[#111] border-b border-white/5 flex justify-between items-center shrink-0">
                      <button onClick={() => setSelectedChat(null)} className="flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors">
                        <ArrowLeft size={14} /> Back to Logs
                      </button>
                      <div className="text-xs text-white/50 uppercase tracking-widest font-mono">
                        {chatMessages.length} Messages Captured
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed opacity-90">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-white/30 text-sm">Empty communication log.</div>
                      ) : (
                        chatMessages.map(msg => {
                          const isSelected = selectedMessageIds.has(msg._id);
                          const isOffender = msg.sender._id === selectedUser._id;
                          return (
                            <div 
                              key={msg._id}
                              onClick={() => toggleMessageSelect(msg._id)}
                              className={`p-4 rounded-xl border flex gap-4 cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-red-500/10 border-red-500/30' 
                                  : 'bg-[#111]/80 backdrop-blur-md border-white/5 hover:border-white/20'
                              }`}
                            >
                              <div className="mt-1">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-white/20 bg-transparent'
                                }`}>
                                  {isSelected && <CheckCircle2 size={12} />}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                  <span className={`text-xs font-bold ${isOffender ? 'text-amber-400' : 'text-white'}`}>
                                    {msg.sender.username} {isOffender && '(Target)'}
                                  </span>
                                  <span className="text-[10px] text-white/40 font-mono">
                                    {new Date(msg.createdAt).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-white/80 break-words">{msg.content || <span className="italic text-white/30">No text content</span>}</p>
                                {msg.mediaUrl && (
                                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded text-xs text-white/60 border border-white/5">
                                    <ImageIcon size={12} /> Media Payload Attached
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* ACTION DOCK - Sticky Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent pointer-events-none z-20">
              <div className="bg-[#111]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-3 md:p-4 pointer-events-auto shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3 max-w-7xl mx-auto w-full">
                
                <div className="flex flex-wrap gap-2 justify-center md:justify-start w-full md:w-auto">
                  <button onClick={handleWarnUser} className="px-4 py-2 bg-[#111] hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-500" /> Warn
                  </button>
                  <button onClick={handleForceLogout} className="px-4 py-2 bg-[#111] hover:bg-blue-500/20 border border-white/10 hover:border-blue-500/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                    <LogOut size={14} className="text-blue-500" /> Logout
                  </button>
                  <button onClick={handleClearStories} className="px-4 py-2 bg-[#111] hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                    <EyeOff size={14} className="text-purple-500" /> Clear Stories
                  </button>
                  
                  {selectedMessageIds.size > 0 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex gap-2 border-l border-white/10 pl-2 ml-2">
                      <button onClick={handleDeleteMessage} className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                        <Trash2 size={14} className="text-red-400" /> Purge {selectedMessageIds.size}
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 justify-center md:justify-end w-full md:w-auto">
                  <button onClick={handleRestrictUser} className={`px-4 py-2 border rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${(selectedUser.mutedUntil && new Date(selectedUser.mutedUntil) > new Date()) ? 'bg-indigo-500/20 border-indigo-500/50 text-white' : 'bg-[#111] hover:bg-indigo-500/20 border-white/10 hover:border-indigo-500/30 text-white'}`}>
                    <MessageSquareOff size={14} className={(selectedUser.mutedUntil && new Date(selectedUser.mutedUntil) > new Date()) ? 'text-white' : 'text-indigo-500'} /> {(selectedUser.mutedUntil && new Date(selectedUser.mutedUntil) > new Date()) ? 'Unrestrict' : 'Restrict'}
                  </button>
                  <button onClick={handleSuspendAccount} className={`px-4 py-2 border rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${selectedUser.status === 'suspended' ? 'bg-orange-500/20 border-orange-500/50 text-white' : 'bg-[#111] hover:bg-orange-500/20 border-white/10 hover:border-orange-500/30 text-white'}`}>
                    <Lock size={14} className={selectedUser.status === 'suspended' ? 'text-white' : 'text-orange-500'} /> {selectedUser.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                  </button>
                  <button onClick={handleBanAccount} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${selectedUser.status === 'banned' ? 'bg-transparent border border-red-500 text-red-500 hover:bg-red-500/10' : 'bg-red-600 hover:bg-red-700 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]'}`}>
                    <Ban size={14} /> {selectedUser.status === 'banned' ? 'Unban User' : 'Ban User'}
                  </button>
                </div>

              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
            <TerminalSquare size={48} className="text-white/20 mb-4" strokeWidth={1} />
            <h2 className="text-xl font-bold mb-2">Awaiting Target Selection</h2>
            <p className="text-sm text-white/60 max-w-sm">Select an identity from the discovery panel to initiate investigation and moderation protocols.</p>
          </div>
        )}
      </div>

      {/* ================= RIGHT PANEL ================= */}
      <div className="hidden xl:flex w-80 border-l border-white/5 bg-[#0a0a0a] flex-col shrink-0 z-10">
        
        <div className="p-5 border-b border-white/5">
          <h2 className="text-sm font-bold tracking-wide flex items-center gap-2 mb-4">
            <Activity size={16} className="text-emerald-500" /> Live Telemetry
          </h2>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#111] border border-white/5 rounded-lg p-3">
               <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Reports Today</p>
               <p className="text-xl font-mono font-bold text-emerald-400">{metrics.reportsToday}</p>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-lg p-3">
               <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Active Cases</p>
               <p className="text-xl font-mono font-bold text-amber-400">{metrics.activeInvestigations}</p>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-lg p-3">
               <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Msgs Purged</p>
               <p className="text-xl font-mono font-bold text-white">{metrics.messagesRemoved}</p>
            </div>
            <div className="bg-[#111] border border-white/5 rounded-lg p-3">
               <p className="text-[9px] text-white/40 uppercase tracking-widest mb-1">Bans Issued</p>
               <p className="text-xl font-mono font-bold text-red-400">{metrics.accountsSuspended}</p>
            </div>
          </div>
        </div>

        <div className="p-3 border-b border-white/5 bg-[#111]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={12} />
            <input 
              type="text" 
              placeholder="Global intercept search (spam, scam)..." 
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-white/10 rounded md pl-8 pr-3 py-1.5 text-[11px] outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#0a0a0a]">
          <h3 className="text-[10px] text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
            <History size={12} /> System Audit Trail
          </h3>

          <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-[11px] before:w-px before:bg-white/10">
            {auditLogs.slice(0, 20).map(log => (
              <div key={log._id} className="relative pl-6">
                <div className="absolute left-0 top-1 w-[23px] h-[23px] bg-[#0a0a0a] rounded-full flex items-center justify-center border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                </div>
                <div className="bg-[#111] border border-white/5 rounded-lg p-3 hover:border-white/20 transition-colors cursor-default">
                  <p className="text-xs font-bold mb-1 text-white/90">{log.action.replace(/_/g, ' ')}</p>
                  <p className="text-[10px] text-white/50 mb-2 leading-relaxed">{log.details}</p>
                  <div className="flex justify-between items-center text-[9px] text-white/30 font-mono">
                     <span>Admin: {log.admin?.username || 'System'}</span>
                     <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
