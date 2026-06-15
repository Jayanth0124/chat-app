import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Clock, Search, ShieldAlert, Loader2,
  ArrowRight, ShieldCheck, History, Zap, MessageSquare, UserRound, ArrowDown
} from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';

export default function UsernameRequests() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // 'all', 'pending', 'approved', 'rejected'
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Review Modal State
  const [adminNotes, setAdminNotes] = useState('');
  const [grantedChanges, setGrantedChanges] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admin/username-requests');
      setRequests(res.data);
    } catch (error) {
      toast.error('Failed to fetch username requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      await axiosInstance.put(`/admin/username-requests/${selectedRequest._id}`, {
        status,
        adminNotes,
        grantedChanges: parseInt(grantedChanges)
      });
      
      toast.success(`Identity request ${status}`);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(req => {
    if (filter !== 'all' && req.status !== filter) return false;
    if (search) {
      const s = search.toLowerCase();
      return req.requestedUsername.toLowerCase().includes(s) || 
             req.userId?.username?.toLowerCase().includes(s) ||
             req.userId?.email?.toLowerCase().includes(s);
    }
    return true;
  });

  const counts = {
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const StatusBadge = ({ status, small = false }) => {
    const config = {
      pending: { color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', icon: Clock },
      approved: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', icon: CheckCircle2 },
      rejected: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', icon: XCircle }
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <span className={`flex items-center gap-1.5 ${small ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'} font-bold rounded-full ${c.bg} ${c.color} border ${c.border} tracking-wide uppercase`}>
        <Icon size={small ? 10 : 12} /> {status}
      </span>
    );
  };

  return (
    <div className="flex h-full bg-[#050505] text-white font-sans overflow-hidden selection:bg-blue-500/30">
      
      {/* ═══════════════════════════════════ LEFT SIDEBAR INBOX ═══════════════════════════════════ */}
      <div className={`w-full lg:w-[400px] xl:w-[450px] flex-col border-r border-white/5 bg-[#0a0a0a] z-10 shrink-0 ${selectedRequest ? 'hidden lg:flex' : 'flex'}`}>
        
        {/* Header & Counters */}
        <div className="p-6 border-b border-white/5 shrink-0">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <ShieldCheck size={16} className="text-blue-400" />
            </div>
            Identity Review
          </h1>

          <div className="flex items-center gap-2 mb-6 p-1 bg-[#111] rounded-xl border border-white/5">
            {['pending', 'approved', 'rejected'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filter === f 
                    ? 'bg-[#1a1a1a] text-white shadow-sm border border-white/10' 
                    : 'text-white/40 hover:text-white/70 border border-transparent'
                }`}
              >
                <span className="capitalize">{f}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filter === f ? 'bg-white/10 text-white' : 'bg-transparent text-white/30'}`}>
                  {counts[f]}
                </span>
              </button>
            ))}
          </div>

          <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 transition-colors" />
            <input 
              type="text"
              placeholder="Search identities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#111] rounded-xl text-sm font-medium focus:outline-none border border-white/5 focus:border-blue-500/30 focus:bg-[#151515] transition-all placeholder:text-white/20"
            />
          </div>
        </div>

        {/* Request List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30">
              <Loader2 size={24} className="animate-spin text-blue-500" />
              <p className="text-xs font-mono uppercase tracking-widest">Syncing Records...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#111] border border-white/5 flex items-center justify-center mb-4">
                <CheckCircle2 size={32} className="opacity-20" />
              </div>
              <h3 className="font-bold text-white/70 mb-1">Queue Empty</h3>
              <p className="text-xs">No identity requests found.</p>
            </div>
          ) : (
            filteredRequests.map(req => {
              const isSelected = selectedRequest?._id === req._id;
              return (
                <button
                  key={req._id}
                  onClick={() => {
                    setSelectedRequest(req);
                    setAdminNotes(req.adminNotes || '');
                    setGrantedChanges(1);
                  }}
                  className={`w-full text-left p-4 rounded-2xl transition-all border relative overflow-hidden group ${
                    isSelected 
                      ? 'bg-[#151515] border-blue-500/50 shadow-[0_4px_20px_rgba(59,130,246,0.1)]' 
                      : 'bg-transparent border-transparent hover:bg-[#111] hover:border-white/5'
                  }`}
                >
                  {isSelected && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,1)]" />}
                  
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-[#050505] border border-white/10 shrink-0">
                        <img src={req.userId?.profilePic || '/logo.png'} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate max-w-[120px]">{req.userId?.displayName || 'Unknown'}</h4>
                        </div>
                        <p className="text-xs font-medium text-white/40 truncate">@{req.userId?.username || 'unknown'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={req.status} small />
                      <span className="text-[10px] text-white/30 font-mono">{new Date(req.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${isSelected ? 'bg-blue-500/5 border-blue-500/10' : 'bg-[#0a0a0a] border-white/5'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase tracking-wider text-white/40 font-bold mb-0.5">Requested</p>
                      <p className={`text-sm font-black truncate ${isSelected ? 'text-blue-400' : 'text-white/90'}`}>@{req.requestedUsername}</p>
                    </div>
                    <ArrowRight size={14} className={isSelected ? 'text-blue-500/50' : 'text-white/20'} />
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════ MAIN REVIEW PANEL ═══════════════════════════════════ */}
      <div className={`flex-1 flex flex-col bg-[#050505] min-w-0 h-full overflow-hidden ${!selectedRequest ? 'hidden lg:flex' : 'flex'}`}>
        {!selectedRequest ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-white/30">
            <div className="w-24 h-24 rounded-3xl bg-[#0a0a0a] border border-white/5 flex items-center justify-center mb-6 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
              <UserRound size={32} className="text-white/10" />
            </div>
            <h2 className="text-xl font-bold text-white/50 mb-2">Identity Review Center</h2>
            <p className="max-w-md text-sm leading-relaxed">Select a request from the inbox to review identity history, verify availability, and issue administrative decisions.</p>
          </div>
        ) : (
          <>
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar relative">
              <div className="max-w-4xl w-full mx-auto p-6 md:p-10 pb-10 space-y-8">
                
                {/* Mobile Back Button */}
                <button 
                  onClick={() => setSelectedRequest(null)}
                  className="lg:hidden flex items-center gap-2 text-xs font-bold text-white/50 hover:text-white transition-colors bg-[#111] px-4 py-2 rounded-xl border border-white/5 mb-6 w-fit"
                >
                  <ArrowRight size={14} className="rotate-180" /> Back to Inbox
                </button>

                {/* Header Profile Section */}
                <div className="flex flex-col md:flex-row items-start gap-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl overflow-hidden bg-[#111] border border-white/10 shadow-2xl shrink-0">
                      <img src={selectedRequest.userId?.profilePic || '/logo.png'} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  
                  <div className="flex-1 w-full min-w-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-3xl font-black text-white tracking-tight mb-1">{selectedRequest.userId?.displayName || 'Unknown User'}</h2>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <span className="font-mono text-white/60 bg-white/5 px-2 py-0.5 rounded-md border border-white/10">@{selectedRequest.userId?.username}</span>
                          <span className="text-white/40">{selectedRequest.userId?.email}</span>
                        </div>
                      </div>
                      <StatusBadge status={selectedRequest.status} />
                    </div>
                  </div>
                </div>

                {/* Identity Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex flex-col justify-between group hover:bg-[#0c0c0c] transition-colors">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Changes Used</span>
                      <History size={14} className="text-white/20" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-white">{selectedRequest.userId?.usernameChangesUsed || 0}</span>
                      <span className="text-sm font-bold text-white/30"> / {selectedRequest.userId?.usernameChangeLimit || 3}</span>
                    </div>
                  </div>
                  
                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex flex-col justify-between group hover:bg-[#0c0c0c] transition-colors">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Account Age</span>
                      <Clock size={14} className="text-white/20" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-white">
                        {Math.floor((Date.now() - new Date(selectedRequest.userId?.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) || 0}
                      </span>
                      <span className="text-sm font-bold text-white/30"> Days</span>
                    </div>
                  </div>

                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex flex-col justify-between group hover:bg-[#0c0c0c] transition-colors">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Request Age</span>
                      <Clock size={14} className="text-white/20" />
                    </div>
                    <div>
                      <span className="text-2xl font-black text-white">
                        {Math.floor((Date.now() - new Date(selectedRequest.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
                      </span>
                      <span className="text-sm font-bold text-white/30"> Days</span>
                    </div>
                  </div>

                  <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-4 flex flex-col justify-between group hover:bg-[#0c0c0c] transition-colors relative overflow-hidden">
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Last Updated</span>
                      <Clock size={14} className="text-white/20" />
                    </div>
                    <span className="text-lg font-black text-white relative z-10">{new Date(selectedRequest.updatedAt || selectedRequest.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* ═══════════════════════════════════ USERNAME COMPARISON SECTION ═══════════════════════════════════ */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
                  
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-8 flex items-center gap-2">
                    <Zap size={14} className="text-blue-500" /> Identity Comparison
                  </h3>

                  <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
                    
                    {/* Current */}
                    <div className="flex-1 w-full bg-[#050505] border border-white/10 rounded-2xl p-6 text-center shadow-inner relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-white/10"></div>
                      <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3 block">Current Assignment</span>
                      <p className="text-2xl font-mono text-white/70">@{selectedRequest.userId?.username}</p>
                    </div>

                    {/* Arrow Indicator */}
                    <div className="shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-[#111] border border-white/5 shadow-xl md:rotate-[-90deg]">
                      <ArrowDown size={20} className="text-blue-400" />
                    </div>

                    {/* Requested */}
                    <div className="flex-1 w-full bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6 text-center shadow-[0_0_30px_rgba(59,130,246,0.1)] relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                      <span className="text-[10px] uppercase tracking-widest text-blue-400/80 font-bold mb-3 block">Target Identity</span>
                      <p className="text-2xl font-mono text-white font-bold tracking-wide">@{selectedRequest.requestedUsername}</p>
                    </div>
                  </div>
                </div>

                {/* ═══════════════════════════════════ REQUEST JUSTIFICATION ═══════════════════════════════════ */}
                <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative shadow-xl">
                  <div className="absolute top-6 right-8 text-right">
                    <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold font-mono">ID: {selectedRequest._id.slice(-8).toUpperCase()}</p>
                    <p className="text-[10px] text-white/20 font-mono mt-1">{new Date(selectedRequest.createdAt).toLocaleString()}</p>
                  </div>
                  
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
                    <MessageSquare size={14} /> Official Justification
                  </h3>

                  <div className="relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50 rounded-full"></div>
                    <p className="pl-6 text-lg text-white/90 leading-relaxed font-medium">
                      "{selectedRequest.reason}"
                    </p>
                  </div>
                </div>

                {/* ═══════════════════════════════════ IDENTITY HISTORY ═══════════════════════════════════ */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-6 px-2 flex items-center gap-2">
                    <History size={14} /> Identity Timeline
                  </h3>
                  <div className="relative pl-6 space-y-8 border-l-2 border-white/5 ml-4">
                    
                    <div className="relative">
                      <div className="absolute -left-[35px] top-1 w-4 h-4 bg-[#0a0a0a] border-2 border-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                      <span className="text-[10px] font-mono text-blue-400 font-bold tracking-widest block mb-1">CURRENT</span>
                      <p className="text-sm font-bold text-white">Requested <span className="text-blue-400">@{selectedRequest.requestedUsername}</span></p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[35px] top-1 w-4 h-4 bg-[#0a0a0a] border-2 border-white/20 rounded-full"></div>
                      <span className="text-[10px] font-mono text-white/30 font-bold tracking-widest block mb-1">{new Date().getFullYear()}</span>
                      <p className="text-sm text-white/70">Changed username to <span className="text-white font-mono">@{selectedRequest.userId?.username}</span></p>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-[35px] top-1 w-4 h-4 bg-[#0a0a0a] border-2 border-white/10 rounded-full"></div>
                      <span className="text-[10px] font-mono text-white/20 font-bold tracking-widest block mb-1">{new Date(selectedRequest.userId?.createdAt || Date.now()).getFullYear()}</span>
                      <p className="text-sm text-white/40">Account originated as <span className="text-white/50 font-mono">@user_{selectedRequest.userId?._id?.slice(-4)}</span></p>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* ═══════════════════════════════════ ADMIN DECISION AREA (FIXED BOTTOM SIBLING) ═══════════════════════════════════ */}
            {selectedRequest.status === 'pending' ? (
              <div className="flex-none w-full bg-[#050505]/95 backdrop-blur-2xl border-t border-white/10 p-6 md:p-8 z-30">
                <div className="max-w-4xl mx-auto flex flex-col xl:flex-row gap-8">
                  
                  {/* Internal Configuration */}
                  <div className="flex-1 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                      <ShieldAlert size={14} /> Resolution Protocol
                    </h3>
                    
                    <input 
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal audit notes (optional)..."
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-[#111] transition-all placeholder:text-white/20"
                    />

                    <div className="flex items-center gap-4 bg-[#0a0a0a] border border-white/5 rounded-xl p-3">
                      <div className="flex-1 min-w-0 px-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Replenish Limit</p>
                        <p className="text-xs text-white/60 truncate">Grant additional changes after approval</p>
                      </div>
                      <div className="flex items-center gap-3 bg-[#111] rounded-lg border border-white/10 px-3 py-1">
                        <button 
                          onClick={() => setGrantedChanges(Math.max(0, grantedChanges - 1))}
                          className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                        >-</button>
                        <span className="text-sm font-mono font-bold w-4 text-center">{grantedChanges}</span>
                        <button 
                          onClick={() => setGrantedChanges(grantedChanges + 1)}
                          className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                        >+</button>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full xl:w-[400px] flex gap-4 xl:mt-8">
                    <button 
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={isSubmitting}
                      className="flex-1 h-14 rounded-2xl font-bold text-sm bg-transparent border-2 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <XCircle size={18} /> Reject
                    </button>
                    <button 
                      onClick={() => handleStatusUpdate('approved')}
                      disabled={isSubmitting}
                      className="flex-[1.5] h-14 rounded-2xl font-bold text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CheckCircle2 size={18} /> Approve Identity
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              <div className="flex-none w-full bg-[#050505]/95 backdrop-blur-2xl border-t border-white/10 p-6 z-30">
                <div className="max-w-4xl mx-auto">
                  <div className={`p-6 rounded-2xl border ${selectedRequest.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${selectedRequest.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {selectedRequest.status === 'approved' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                      </div>
                      <div>
                        <h3 className={`text-base font-bold mb-1 ${selectedRequest.status === 'approved' ? 'text-emerald-400' : 'text-red-400'}`}>
                          Identity Request {selectedRequest.status === 'approved' ? 'Approved' : 'Rejected'}
                        </h3>
                        <p className="text-sm text-white/60 mb-3">
                          This request was processed. 
                          {selectedRequest.status === 'approved' && selectedRequest.grantedChanges > 0 && (
                            <span className="text-white ml-1">The user was granted <strong className="text-emerald-400">+{selectedRequest.grantedChanges}</strong> extra username changes.</span>
                          )}
                        </p>
                        {selectedRequest.adminNotes && (
                          <div className="bg-[#050505] border border-white/5 p-4 rounded-xl">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30 block mb-2">Audit Log / Note</span>
                            <p className="text-sm font-mono text-white/70">"{selectedRequest.adminNotes}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
