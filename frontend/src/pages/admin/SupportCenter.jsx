import React, { useState, useEffect, useRef } from 'react';
import { 
  LifeBuoy, 
  Search, 
  MessageSquare, 
  Clock, 
  User, 
  Folder, 
  AlertCircle, 
  CheckCircle, 
  Archive, 
  Send, 
  Image as ImageIcon, 
  ExternalLink, 
  RefreshCw, 
  Tag, 
  UserCheck, 
  ChevronRight, 
  Filter,
  FileText,
  CornerDownRight,
  ArrowLeft,
  Mail,
  Shield,
  Calendar
} from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import { useChatStore } from '../../store/useChatStore';
import toast from 'react-hot-toast';
import Select from '../../components/ui/Select';

export default function SupportCenter() {
  const { socket } = useChatStore();
  
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState('tickets');
  
  // State for data
  const [tickets, setTickets] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [stats, setStats] = useState({ openTickets: 0, inProgressTickets: 0, resolvedTickets: 0, openBugs: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Selected item detail state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedBug, setSelectedBug] = useState(null);

  // Form states for details panel
  const [replyText, setReplyText] = useState('');
  const [ticketStatusVal, setTicketStatusVal] = useState('');
  const [bugStatusVal, setBugStatusVal] = useState('');
  const [bugAdminNotes, setBugAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket, selectedBug]);

  // Fetch all support desk data
  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [ticketsRes, bugsRes, statsRes] = await Promise.all([
        axiosInstance.get('/support/admin/tickets'),
        axiosInstance.get('/support/admin/bugs'),
        axiosInstance.get('/support/admin/stats')
      ]);
      
      setTickets(ticketsRes.data);
      setBugs(bugsRes.data);
      setStats(statsRes.data);
      
      if (selectedTicket) {
        const updatedTk = ticketsRes.data.find(t => t._id === selectedTicket._id);
        if (updatedTk) setSelectedTicket(updatedTk);
      }
      if (selectedBug) {
        const updatedBg = bugsRes.data.find(b => b._id === selectedBug._id);
        if (updatedBg) {
          setSelectedBug(updatedBg);
          if (!silent) setBugAdminNotes(updatedBg.adminNotes || '');
        }
      }
    } catch (err) {
      console.error("Error fetching support center data:", err);
      toast.error("Failed to load support center data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (socket) {
      const handleAdminAlert = () => fetchData(true);
      socket.on('adminNotification', handleAdminAlert);
      return () => socket.off('adminNotification', handleAdminAlert);
    }
  }, [socket]);

  // Handle ticket reply
  const handleSendTicketReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;
    setActionLoading(true);
    try {
      const payload = { response: replyText, status: ticketStatusVal || selectedTicket.status };
      const res = await axiosInstance.post(`/support/admin/tickets/${selectedTicket._id}/reply`, payload);
      setReplyText('');
      setSelectedTicket(res.data);
      setTickets(prev => prev.map(t => t._id === res.data._id ? res.data : t));
      
      const statsRes = await axiosInstance.get('/support/admin/stats');
      setStats(statsRes.data);
      scrollToBottom();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error submitting reply");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle bug reply
  const handleSendBugReply = async (e) => {
    if (e) e.preventDefault();
    if (!replyText.trim()) return;
    setActionLoading(true);
    try {
      const payload = { response: replyText, status: bugStatusVal || selectedBug.status };
      const res = await axiosInstance.post(`/support/admin/bugs/${selectedBug._id}/reply`, payload);
      setReplyText('');
      setSelectedBug(res.data);
      setBugs(prev => prev.map(b => b._id === res.data._id ? res.data : b));
      
      const statsRes = await axiosInstance.get('/support/admin/stats');
      setStats(statsRes.data);
      scrollToBottom();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error submitting reply");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Bug Update (Admin Notes & Status)
  const handleUpdateBug = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await axiosInstance.put(`/support/admin/bugs/${selectedBug._id}`, {
        status: bugStatusVal || selectedBug.status,
        adminNotes: bugAdminNotes
      });
      toast.success("Bug report details updated");
      setSelectedBug(res.data);
      setBugs(prev => prev.map(b => b._id === res.data._id ? res.data : b));
      
      const statsRes = await axiosInstance.get('/support/admin/stats');
      setStats(statsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Error updating bug report");
    } finally {
      setActionLoading(false);
    }
  };

  // Standalone Status Change Helper
  const handleStandaloneStatusChange = async (type, newStatus) => {
    setActionLoading(true);
    try {
      if (type === 'ticket') {
        setTicketStatusVal(newStatus);
        const res = await axiosInstance.put(`/support/admin/tickets/${selectedTicket._id}`, { status: newStatus });
        setSelectedTicket(res.data);
        setTickets(prev => prev.map(t => t._id === res.data._id ? res.data : t));
      } else {
        setBugStatusVal(newStatus);
        const res = await axiosInstance.put(`/support/admin/bugs/${selectedBug._id}`, { status: newStatus });
        setSelectedBug(res.data);
        setBugs(prev => prev.map(b => b._id === res.data._id ? res.data : b));
      }
      toast.success(`Status updated to ${newStatus}`);
      const statsRes = await axiosInstance.get('/support/admin/stats');
      setStats(statsRes.data);
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const selectItem = (item) => {
    if (item.$type === 'ticket') {
      setSelectedTicket(item);
      setTicketStatusVal(item.status);
      setSelectedBug(null);
    } else {
      setSelectedBug(item);
      setBugStatusVal(item.status);
      setBugAdminNotes(item.adminNotes || '');
      setSelectedTicket(null);
    }
    setReplyText('');
  };

  useEffect(() => {
    setSelectedTicket(null);
    setSelectedBug(null);
    setReplyText('');
  }, [activeTab]);

  const getFilteredItems = () => {
    let rawTickets = [...tickets];
    let rawBugs = [...bugs];

    if (activeTab === 'tickets') {
      rawTickets = rawTickets.filter(t => ['Open', 'In Progress', 'Waiting For User'].includes(t.status));
      rawBugs = [];
    } else if (activeTab === 'bugs') {
      rawBugs = rawBugs.filter(b => ['Open', 'Investigating', 'Fixed', 'Duplicate'].includes(b.status));
      rawTickets = [];
    } else if (activeTab === 'resolved') {
      rawTickets = rawTickets.filter(t => t.status === 'Resolved');
      rawBugs = rawBugs.filter(b => b.status === 'Resolved');
    } else if (activeTab === 'archived') {
      rawTickets = rawTickets.filter(t => t.status === 'Closed');
      rawBugs = rawBugs.filter(b => b.status === 'Closed');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rawTickets = rawTickets.filter(t => 
        t.ticketId?.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q) || t.user?.displayName?.toLowerCase().includes(q)
      );
      rawBugs = rawBugs.filter(b => 
        b.reportId?.toLowerCase().includes(q) || b.title?.toLowerCase().includes(q) || b.user?.displayName?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== 'All' && activeTab === 'tickets') {
      rawTickets = rawTickets.filter(t => t.category === categoryFilter);
    }

    const combined = [
      ...rawTickets.map(t => ({ ...t, $type: 'ticket' })),
      ...rawBugs.map(b => ({ ...b, $type: 'bug' }))
    ];

    combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return combined;
  };

  const filteredList = getFilteredItems();

  const getStatusBadge = (status) => {
    const map = {
      'Open': 'bg-blue-500/20 text-blue-400',
      'In Progress': 'bg-yellow-500/20 text-yellow-400',
      'Investigating': 'bg-yellow-500/20 text-yellow-400',
      'Waiting For User': 'bg-orange-500/20 text-orange-400',
      'Fixed': 'bg-green-500/20 text-green-400',
      'Resolved': 'bg-green-500/20 text-green-400',
      'Duplicate': 'bg-purple-500/20 text-purple-400',
      'Closed': 'bg-neutral-500/20 text-neutral-400'
    };
    return (
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${map[status]?.split(' ')[0].replace('/20', '')}`} />
        <span className={`text-[10px] font-black uppercase tracking-wider ${map[status]?.split(' ')[1]}`}>
          {status}
        </span>
      </div>
    );
  };

  const handleTextareaKeyDown = (e, isBug) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (isBug) handleSendBugReply();
      else handleSendTicketReply();
    }
  };

  if (loading) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <RefreshCw className="animate-spin w-8 h-8 text-primary" />
          <p className="text-sm font-medium">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  const activeItem = selectedTicket || selectedBug;
  const isTicket = !!selectedTicket;
  
  return (
    <div className="h-full flex flex-col bg-background text-on-surface font-sans">
      {/* Header */}
      <div className="px-6 py-4 border-b border-outline-variant/30 shrink-0 bg-surface/40 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(var(--color-primary),0.1)]">
            <LifeBuoy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-on-surface">Support Desk Workspace</h1>
            <p className="text-[11px] font-semibold text-on-surface-variant">Manage tickets & bug reports</p>
          </div>
        </div>
        <button 
          onClick={() => fetchData(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-bold text-on-surface transition-all shadow-sm"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin text-primary" : ""} />
          Refresh
        </button>
      </div>

      {/* Workspace Split Layout */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        
        {/* LEFT PANEL - LIST VIEW */}
        <div className={`w-full md:w-[350px] shrink-0 border-r border-outline-variant/30 flex flex-col bg-surface-container-lowest transition-transform duration-300 ${activeItem ? '-translate-x-full md:translate-x-0 absolute md:relative inset-y-0 left-0 z-20' : ''}`}>
          
          {/* List Header (Tabs & Search) */}
          <div className="shrink-0 flex flex-col border-b border-outline-variant/30 bg-surface/50">
            <div className="flex px-3 pt-3 gap-1 overflow-x-auto scrollbar-none">
              {['tickets', 'bugs', 'resolved', 'archived'].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 text-[11px] font-black uppercase tracking-wider rounded-t-lg transition-colors border-b-2 ${
                    activeTab === t 
                      ? 'border-primary text-primary bg-primary/5' 
                      : 'border-transparent text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            
            <div className="p-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant w-3.5 h-3.5" />
                <input 
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/40 rounded-lg py-1.5 pl-8 pr-3 text-[11px] font-bold text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center gap-3 text-on-surface-variant/60">
                <Archive size={32} strokeWidth={1} />
                <p className="text-xs font-semibold">No items found</p>
              </div>
            ) : (
              <div className="divide-y divide-outline-variant/10">
                {filteredList.map((item) => {
                  const isSelected = activeItem?._id === item._id;
                  return (
                    <div
                      key={item._id}
                      onClick={() => selectItem(item)}
                      className={`p-4 cursor-pointer transition-all hover:bg-surface-container group relative ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md" />}
                      
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-black text-on-surface-variant tracking-wider uppercase">
                          {item.ticketId || item.reportId}
                        </span>
                        {getStatusBadge(item.status)}
                      </div>
                      
                      <h3 className={`text-xs font-bold leading-tight mb-2 line-clamp-1 ${isSelected ? 'text-primary' : 'text-on-surface group-hover:text-primary transition-colors'}`}>
                        {item.subject || item.title}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-md bg-surface-container-high border border-outline-variant/30 overflow-hidden shrink-0">
                            <img src={item.user?.profilePic || '/logo.png'} alt="" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[11px] font-semibold text-on-surface-variant truncate max-w-[120px]">
                            {item.user?.displayName}
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-on-surface-variant/60">
                          {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL - WORKSPACE */}
        <div className={`flex-1 bg-surface flex flex-col transition-transform duration-300 md:translate-x-0 ${!activeItem ? 'hidden md:flex' : 'absolute md:relative inset-y-0 right-0 w-full z-30'}`}>
          {!activeItem ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-l border-outline-variant/20 bg-[url('/noise.png')] bg-repeat opacity-[0.98]">
              <div className="w-16 h-16 rounded-3xl bg-surface-container flex items-center justify-center mb-6 shadow-xl border border-outline-variant/10">
                <MessageSquare className="w-6 h-6 text-on-surface-variant" />
              </div>
              <h2 className="text-xl font-black text-on-surface tracking-tight mb-2">Select a conversation</h2>
              <p className="text-sm font-medium text-on-surface-variant max-w-sm">
                Choose a ticket or bug report from the left panel to view details and reply to the user.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 relative">
              {/* Mobile Back Header */}
              <div className="md:hidden flex items-center px-4 py-3 border-b border-outline-variant/20 bg-surface/80 backdrop-blur-md">
                <button 
                  onClick={() => { setSelectedTicket(null); setSelectedBug(null); }}
                  className="flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-on-surface"
                >
                  <ArrowLeft size={16} /> Back to List
                </button>
              </div>

              {/* Bento User Card Header */}
              <div className="p-5 border-b border-outline-variant/20 bg-surface/50 shrink-0">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-surface-container-high border border-outline-variant/30 overflow-hidden shadow-sm">
                        <img src={activeItem.user?.profilePic || '/logo.png'} alt="" className="w-full h-full object-cover" />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-on-surface leading-tight flex items-center gap-2">
                        {activeItem.user?.displayName}
                        <span className="px-1.5 py-0.5 rounded-md bg-surface-container-high text-[9px] uppercase tracking-widest font-black text-on-surface-variant border border-outline-variant/30">
                          User
                        </span>
                      </h2>
                      <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-on-surface-variant">
                        <span className="flex items-center gap-1"><Mail size={12}/> {activeItem.user?.email || 'N/A'}</span>
                        <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(activeItem.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</span>
                      <Select
                        value={isTicket ? ticketStatusVal : bugStatusVal}
                        onChange={(val) => handleStandaloneStatusChange(isTicket ? 'ticket' : 'bug', val)}
                        disabled={actionLoading}
                        options={
                          isTicket 
                            ? ['Open', 'In Progress', 'Waiting For User', 'Resolved', 'Closed']
                            : ['Open', 'Investigating', 'Fixed', 'Duplicate', 'Resolved', 'Closed']
                        }
                        className="w-[140px]"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase">
                       <span className="text-on-surface-variant/60">{isTicket ? 'Ticket ID:' : 'Report ID:'}</span>
                       <span className={isTicket ? 'text-primary' : 'text-red-400'}>{activeItem.ticketId || activeItem.reportId}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Timeline / Details Workspace */}
              <div className="flex-1 overflow-y-auto p-6 bg-[url('/noise.png')] bg-repeat space-y-8 scrollbar-thin">
                
                {/* Initial Post (First Bubble) */}
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant/20 overflow-hidden shrink-0 mt-1">
                    <img src={activeItem.user?.profilePic || '/logo.png'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 max-w-[85%]">
                    <div className="flex items-baseline gap-2 mb-1.5">
                      <span className="text-sm font-bold text-on-surface">{activeItem.user?.displayName}</span>
                      <span className="text-[10px] font-semibold text-on-surface-variant">Original Post • {new Date(activeItem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    
                    <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl rounded-tl-sm p-4 text-sm text-on-surface shadow-sm relative">
                      <h3 className="font-black text-base mb-2 pb-2 border-b border-outline-variant/20">{activeItem.subject || activeItem.title}</h3>
                      
                      {isTicket ? (
                        <div className="whitespace-pre-wrap leading-relaxed opacity-90">{activeItem.description}</div>
                      ) : (
                        <div className="space-y-4 opacity-90">
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1">Reproduction Steps</h4>
                            <p className="whitespace-pre-wrap leading-relaxed">{activeItem.reproductionSteps || activeItem.stepsToReproduce}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-green-500/5 p-3 rounded-xl border border-green-500/10">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-green-500/80 mb-1">Expected Behavior</h4>
                              <p className="text-xs leading-relaxed">{activeItem.expectedBehavior}</p>
                            </div>
                            <div className="bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500/80 mb-1">Actual Behavior</h4>
                              <p className="text-xs leading-relaxed">{activeItem.actualBehavior}</p>
                            </div>
                          </div>
                          {activeItem.screenshot && (
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-1 flex items-center gap-1"><ImageIcon size={12}/> Screenshot Attached</h4>
                              <a href={activeItem.screenshot} target="_blank" rel="noreferrer" className="inline-block mt-1 relative group rounded-lg overflow-hidden border border-outline-variant/30">
                                <img src={activeItem.screenshot} alt="Bug" className="max-w-[200px] h-auto object-cover group-hover:opacity-80 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 transition-opacity">
                                  <ExternalLink size={20} className="text-white" />
                                </div>
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bug Specific Admin Box (Hidden inside timeline for cleanliness, or kept below) */}
                {!isTicket && (
                  <div className="ml-12 border-l-2 border-outline-variant/20 pl-6 py-2">
                    <form onSubmit={handleUpdateBug} className="bg-surface/60 border border-outline-variant/30 rounded-xl p-4 flex flex-col gap-3 relative">
                      <div className="absolute -left-[27px] top-4 w-6 border-b-2 border-outline-variant/20 rounded-bl-xl" />
                      <div className="flex items-center gap-2 text-on-surface-variant">
                        <Shield size={14} className="text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Internal Engineering Notes</span>
                      </div>
                      <textarea
                        rows={2}
                        value={bugAdminNotes}
                        onChange={(e) => setBugAdminNotes(e.target.value)}
                        placeholder="Add private technical notes, PR links, etc. Users cannot see this."
                        className="bg-background/50 border border-outline-variant/20 rounded-lg p-2.5 text-xs font-medium text-on-surface focus:outline-none focus:border-primary/40 resize-none"
                      />
                      <button type="submit" disabled={actionLoading} className="self-end px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 rounded-lg text-[11px] font-bold transition-all disabled:opacity-50">
                        {actionLoading ? 'Saving...' : 'Save Notes'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Timeline Replies */}
                {activeItem.replies?.map((reply, idx) => {
                  const isStaff = reply.sender?.role === 'admin';
                  return (
                    <div key={reply._id || idx} className={`flex gap-4 ${isStaff ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant/20 overflow-hidden shrink-0 mt-1">
                        {reply.sender?.profilePic ? (
                          <img src={reply.sender.profilePic} alt="" className="w-full h-full object-cover" />
                        ) : isStaff ? (
                          <div className={`w-full h-full flex items-center justify-center text-xs font-black uppercase text-white bg-primary`}>
                            <Shield size={14} />
                          </div>
                        ) : (
                          <img src="/logo.png" alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className={`flex-1 max-w-[80%] ${isStaff ? 'flex flex-col items-end' : ''}`}>
                        <div className={`flex items-baseline gap-2 mb-1.5 ${isStaff ? 'flex-row-reverse' : ''}`}>
                          <span className="text-sm font-bold text-on-surface">{reply.sender?.displayName}</span>
                          <span className="text-[10px] font-semibold text-on-surface-variant">
                            {isStaff && <span className="text-primary mr-1 border border-primary/20 bg-primary/10 px-1 rounded uppercase tracking-wider">Staff</span>}
                            {new Date(reply.createdAt).toLocaleDateString()} {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className={`p-3.5 text-sm leading-relaxed whitespace-pre-wrap shadow-sm relative ${
                          isStaff 
                            ? 'bg-primary text-white rounded-2xl rounded-tr-sm' 
                            : 'bg-surface-container-low border border-outline-variant/30 text-on-surface rounded-2xl rounded-tl-sm'
                        }`}>
                          {reply.response}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} className="h-2" />
              </div>

              {/* Support Composer */}
              <div className="p-4 bg-surface border-t border-outline-variant/20 shrink-0 z-10 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
                <div className="max-w-4xl mx-auto">
                  <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-2xl shadow-sm focus-within:border-primary/50 focus-within:shadow-[0_0_0_3px_rgba(var(--color-primary),0.1)] transition-all overflow-hidden flex flex-col">
                    <textarea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => handleTextareaKeyDown(e, !isTicket)}
                      placeholder="Type a reply... (Cmd/Ctrl + Enter to send)"
                      className="w-full bg-transparent p-4 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none resize-none"
                    />
                    
                    <div className="bg-surface-container/50 px-4 py-2 border-t border-outline-variant/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Set Status</span>
                        <Select
                          value={isTicket ? ticketStatusVal : bugStatusVal}
                          onChange={(val) => isTicket ? setTicketStatusVal(val) : setBugStatusVal(val)}
                          options={
                            isTicket 
                              ? ['Open', 'In Progress', 'Waiting For User', 'Resolved', 'Closed']
                              : ['Open', 'Investigating', 'Fixed', 'Duplicate', 'Resolved', 'Closed']
                          }
                          className="w-[140px] bg-transparent border-transparent shadow-none hover:bg-surface focus:ring-0"
                        />
                      </div>
                      
                      <button
                        onClick={isTicket ? handleSendTicketReply : handleSendBugReply}
                        disabled={actionLoading || !replyText.trim()}
                        className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/95 active:scale-95 disabled:bg-surface-container-high disabled:text-on-surface-variant/50 text-white text-xs font-bold shadow-md transition-all disabled:cursor-not-allowed"
                      >
                        {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                        Send Reply
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}
