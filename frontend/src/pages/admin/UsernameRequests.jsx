import React, { useState, useEffect } from 'react';
import { 
  UserRound, CheckCircle2, XCircle, Clock, Search, ExternalLink, 
  ShieldAlert, Loader2, AlertCircle
} from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import Select from '../../components/ui/Select';

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
      
      toast.success(`Request ${status} successfully`);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update request');
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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': return <span className="px-2 py-1 text-xs font-bold rounded-md bg-yellow-500/20 text-yellow-500 flex items-center gap-1 w-fit"><Clock size={12}/> Pending</span>;
      case 'approved': return <span className="px-2 py-1 text-xs font-bold rounded-md bg-green-500/20 text-green-500 flex items-center gap-1 w-fit"><CheckCircle2 size={12}/> Approved</span>;
      case 'rejected': return <span className="px-2 py-1 text-xs font-bold rounded-md bg-red-500/20 text-red-500 flex items-center gap-1 w-fit"><XCircle size={12}/> Rejected</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-6 border-b border-outline-variant/20 bg-surface gap-4">
        <div>
          <h1 className="text-2xl font-black text-on-surface flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShieldAlert size={20} />
            </div>
            Username Requests
          </h1>
          <p className="text-sm font-medium text-on-surface-variant mt-1">Manage user identity limit appeals</p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input 
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-surface-container rounded-xl text-sm font-medium focus:outline-none border border-transparent focus:border-primary/30 transition-colors"
            />
          </div>
          <div className="w-36">
            <Select 
              value={filter}
              onChange={(val) => setFilter(val)}
              options={[
                { value: 'all', label: 'All Requests' },
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' }
              ]}
            />
          </div>
        </div>
      </div>

      {/* Main Layout (Split View) */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left: Master List */}
        <div className={`w-full lg:w-1/3 flex flex-col border-r border-outline-variant/20 bg-surface-container-lowest ${selectedRequest ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 size={24} className="animate-spin text-primary" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-on-surface-variant p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-4">
                  <CheckCircle2 size={32} className="opacity-50" />
                </div>
                <h3 className="font-bold text-on-surface mb-1">All Caught Up</h3>
                <p className="text-sm">No requests found matching your filters.</p>
              </div>
            ) : (
              filteredRequests.map(req => (
                <button
                  key={req._id}
                  onClick={() => {
                    setSelectedRequest(req);
                    setAdminNotes(req.adminNotes || '');
                  }}
                  className={`w-full text-left p-4 rounded-2xl transition-all border cursor-pointer ${
                    selectedRequest?._id === req._id 
                      ? 'bg-primary/5 border-primary/30 shadow-sm' 
                      : 'bg-surface hover:bg-surface-container border-outline-variant/20 hover:border-outline-variant/40'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container border border-outline-variant/20 flex-shrink-0">
                        {req.userId?.profilePic ? (
                          <img src={req.userId.profilePic} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                            <UserRound size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-on-surface truncate max-w-[150px]">{req.userId?.displayName}</h4>
                        <p className="text-xs font-medium text-on-surface-variant truncate">@{req.userId?.username}</p>
                      </div>
                    </div>
                    {getStatusBadge(req.status)}
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2 p-2 bg-surface-container-lowest rounded-lg border border-outline-variant/10">
                    <span className="text-xs font-bold text-on-surface-variant">Wants:</span>
                    <span className="text-sm font-black text-primary">@{req.requestedUsername}</span>
                  </div>
                  
                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    "{req.reason}"
                  </p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Workspace */}
        <div className={`w-full lg:w-2/3 flex flex-col bg-surface-container-lowest ${!selectedRequest ? 'hidden lg:flex' : 'flex'}`}>
          {!selectedRequest ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-on-surface-variant">
              <div className="w-20 h-20 rounded-3xl bg-surface border border-outline-variant/20 flex items-center justify-center mb-6 shadow-sm">
                <ShieldAlert size={32} className="text-primary/50" />
              </div>
              <h2 className="text-xl font-black text-on-surface mb-2">Identity Management</h2>
              <p className="max-w-md">Select a username change request from the list to review the user's history and approve or reject their appeal.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full overflow-hidden relative animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* Workspace Header */}
              <div className="flex-shrink-0 p-6 border-b border-outline-variant/20 bg-surface flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setSelectedRequest(null)}
                    className="lg:hidden w-10 h-10 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant cursor-pointer transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-surface-container border-2 border-surface shadow-sm">
                      {selectedRequest.userId?.profilePic ? (
                        <img src={selectedRequest.userId.profilePic} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                          <UserRound size={28} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-on-surface leading-tight">{selectedRequest.userId?.displayName}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm font-bold text-on-surface-variant">@{selectedRequest.userId?.username}</span>
                        <span className="w-1 h-1 rounded-full bg-outline-variant/50"></span>
                        <span className="text-xs font-medium text-on-surface-variant">{selectedRequest.userId?.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* Workspace Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-surface-container-lowest">
                
                {/* Information Bento */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-surface border border-outline-variant/20">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Requested Username</p>
                    <p className="text-2xl font-black text-primary">@{selectedRequest.requestedUsername}</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-surface border border-outline-variant/20">
                    <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Submitted</p>
                    <p className="text-lg font-bold text-on-surface">{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-surface border border-outline-variant/20 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary/30"></div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">User's Reason</p>
                  <p className="text-base font-medium text-on-surface leading-relaxed whitespace-pre-wrap">
                    "{selectedRequest.reason}"
                  </p>
                </div>
              </div>

              {/* Action Area */}
              {selectedRequest.status === 'pending' ? (
                <div className="flex-shrink-0 p-6 bg-surface border-t border-outline-variant/20">
                  <h3 className="text-sm font-bold text-on-surface mb-3">Admin Decision</h3>
                  <div className="space-y-4">
                    <textarea 
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Optional notes regarding this decision..."
                      className="w-full p-4 bg-surface-container-lowest border-2 border-outline-variant/30 rounded-2xl text-sm font-medium focus:outline-none focus:border-primary transition-colors resize-none"
                      rows="2"
                    />
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-full sm:w-1/3">
                        <label className="block text-xs font-bold text-on-surface-variant mb-1 ml-1">Grant Changes</label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={grantedChanges}
                          onChange={(e) => setGrantedChanges(e.target.value)}
                          className="w-full px-4 py-3 bg-surface-container-lowest border-2 border-outline-variant/30 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:border-primary transition-colors"
                          placeholder="e.g. 5"
                        />
                      </div>
                      
                      <div className="w-full sm:w-2/3 flex gap-3 sm:mt-5">
                        <button 
                          onClick={() => handleStatusUpdate('rejected')}
                          disabled={isSubmitting}
                          className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleStatusUpdate('approved')}
                          disabled={isSubmitting}
                          className="flex-1 py-3.5 rounded-xl font-bold text-sm bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                          Approve & Grant
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-shrink-0 p-6 bg-surface border-t border-outline-variant/20">
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/10">
                    <p className="text-sm font-bold text-on-surface mb-1">
                      This request was <span className={selectedRequest.status === 'approved' ? 'text-green-500' : 'text-red-500'}>{selectedRequest.status}</span>
                      {selectedRequest.status === 'approved' && selectedRequest.grantedChanges > 0 && (
                        <span> granting <span className="text-primary">+{selectedRequest.grantedChanges} Changes</span></span>
                      )}
                      {selectedRequest.approvedBy && (
                        <span className="text-on-surface-variant font-medium text-xs ml-2 border border-outline-variant/20 px-2 py-0.5 rounded-full bg-surface-container-lowest">
                          by {selectedRequest.approvedBy}
                        </span>
                      )}
                    </p>
                    {selectedRequest.adminNotes && (
                      <p className="text-sm text-on-surface-variant mt-2 p-3 bg-surface-container-lowest rounded-xl italic">
                        " {selectedRequest.adminNotes} "
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
