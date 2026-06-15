import { useState, useEffect } from 'react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  AlertTriangle, Check, X, Trash2, ShieldAlert, 
  Clock, MessageCircle, AlertCircle, Shield, 
  Ban, Bell, Lock, UserX, Image as ImageIcon,
  ChevronDown, Search, Filter, RefreshCw
} from 'lucide-react';
import { useConfirmStore } from '../../store/useConfirmStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReportsCenter() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending', 'resolved', 'dismissed', 'all'
  const [expandedCase, setExpandedCase] = useState(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admin/reports');
      setReports(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch security incidents');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      await axiosInstance.put(`/admin/reports/${reportId}/status`, { status: newStatus });
      toast.success(`Case status updated to ${newStatus}`);
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to update case`);
    }
  };

  const handleDeleteMessage = async (messageId, reportId) => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Delete Content & Resolve",
      message: "This will permanently delete the offending message and resolve the case. Proceed?",
      confirmText: "Execute",
      danger: true
    });
    if (!confirmed) return;
    try {
      await axiosInstance.delete(`/admin/messages/${messageId}`);
      await axiosInstance.put(`/admin/reports/${reportId}/status`, { status: 'resolved' });
      toast.success('Content purged and case resolved.');
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to purge content');
    }
  };

  const handleWarnUser = async (userId) => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Issue Official Warning",
      message: "Send a formal warning to this user without restricting account functionality?",
      confirmText: "Issue Warning",
      danger: true
    });
    if (!confirmed) return;
    try {
      await axiosInstance.post(`/admin/users/${userId}/warn`);
      toast.success('Warning issued to user successfully.');
    } catch (error) {
      toast.error('Failed to issue warning');
    }
  };

  const handleMuteUser = async (userId, hours) => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: `Restrict Comms (${hours}h)`,
      message: `User will be muted for ${hours} hours. They can login but cannot send messages.`,
      confirmText: "Mute",
      danger: true
    });
    if (!confirmed) return;
    try {
      await axiosInstance.put(`/admin/users/${userId}/restrict`, { durationHours: hours });
      toast.success(`User communications restricted for ${hours}h.`);
    } catch (error) {
      toast.error('Failed to restrict communications');
    }
  };

  const handleSuspendUser = async (userId, currentStatus) => {
    const isSuspended = currentStatus === 'suspended';
    const confirmed = await useConfirmStore.getState().confirm({
      title: isSuspended ? "Unsuspend Account" : "Suspend Account",
      message: isSuspended ? "Remove suspension for this account?" : "Temporarily suspend this account? User will lose all platform access.",
      confirmText: isSuspended ? "Unsuspend" : "Suspend",
      danger: !isSuspended
    });
    if (!confirmed) return;
    try {
      await axiosInstance.put(`/admin/users/${userId}/suspend`);
      toast.success(isSuspended ? 'Account unsuspended.' : 'Account suspended successfully.');
      fetchReports();
    } catch (error) {
      toast.error('Failed to suspend account');
    }
  };

  const filteredReports = reports.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-12 bg-[#050505] min-h-[calc(100vh-4rem)]">
        <div className="relative">
          <div className="w-16 h-16 border-[1px] border-white/10 border-t-red-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-h-full bg-[#050505] text-white font-sans selection:bg-white/20 pb-24 block">
      
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={28} />
            Security Operations Center
          </h1>
          <p className="text-[12px] text-white/40 uppercase tracking-widest mt-2">Active Incident Moderation & Case Files</p>
        </div>
        
        <div className="flex items-center gap-3 bg-[#0A0A0A] border border-white/10 p-1.5 rounded-xl">
          {['pending', 'resolved', 'dismissed', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                filterStatus === status 
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
                  : 'text-white/40 hover:text-white/80 border border-transparent'
              }`}
            >
              {status}
            </button>
          ))}
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          <button onClick={fetchReports} className="p-1.5 text-white/40 hover:text-white transition-colors" title="Refresh Feed">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Case Files Feed */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-20 bg-[#0A0A0A] border border-white/5 rounded-2xl">
            <Shield className="mx-auto text-white/10 mb-4" size={48} />
            <p className="text-[13px] text-white/60 font-bold tracking-tight">No Active Incidents</p>
            <p className="text-[11px] text-white/30 uppercase tracking-widest mt-1">Status queue: {filterStatus}</p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const isExpanded = expandedCase === report._id;
            const offender = report.reportedUser || {};
            const reporter = report.reporter || {};
            const isHighRisk = offender.riskScore > 70;
            const severityLevel = report.reason === 'Harassment' ? 'CRITICAL' : 'ELEVATED';

            return (
              <div 
                key={report._id} 
                className={`bg-[#0A0A0A] border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isExpanded ? 'border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.05)]' : 'border-white/5 hover:border-white/10'
                }`}
              >
                {/* Case Header (Always Visible) */}
                <div 
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedCase(isExpanded ? null : report._id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                      severityLevel === 'CRITICAL' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                    }`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-[14px] font-bold text-white tracking-tight">CASE-{report._id.substring(report._id.length - 8).toUpperCase()}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${
                          report.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          report.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          'bg-white/5 text-white/40 border-white/10'
                        }`}>
                          {report.status}
                        </span>
                        {isHighRisk && (
                          <span className="px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border bg-red-500/10 text-red-500 border-red-500/20 flex items-center gap-1">
                            <AlertCircle size={10} /> Repeat Offender
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/50 flex items-center gap-2">
                        <span className="text-white/80">{report.reason}</span>
                        <span>•</span>
                        <span>Filed: {new Date(report.createdAt).toLocaleString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                      <p className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">Offender Risk Score</p>
                      <p className={`text-lg font-mono ${isHighRisk ? 'text-red-400' : 'text-amber-400'}`}>{offender.riskScore || 0}%</p>
                    </div>
                    <ChevronDown size={20} className={`text-white/40 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Expanded Case File */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 bg-black/20"
                    >
                      <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                        
                        {/* Evidence & Context (Left Column 8/12) */}
                        <div className="lg:col-span-8 space-y-6">
                          
                          {/* Evidence Block */}
                          <div>
                            <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3 border-b border-white/5 pb-2 flex items-center gap-2">
                              <MessageCircle size={12} className="text-blue-500" /> Primary Evidence
                            </h3>
                            <div className="bg-[#050505] border border-white/5 rounded-xl p-4">
                              {report.reportedMessage ? (
                                <div className="space-y-3">
                                  {report.reportedMessage.content && (
                                    <div className="bg-white/[0.02] border border-white/5 rounded-lg p-3">
                                      <p className="text-[13px] text-white font-medium">"{report.reportedMessage.content}"</p>
                                    </div>
                                  )}
                                  {report.reportedMessage.mediaUrl && (
                                    <div className="rounded-lg overflow-hidden border border-white/10 max-w-sm">
                                      <img src={report.reportedMessage.mediaUrl} alt="Evidence" className="w-full h-auto" />
                                    </div>
                                  )}
                                  <p className="text-[10px] text-white/40 font-mono">
                                    MSG_ID: {report.reportedMessage._id} | TSTAMP: {new Date(report.reportedMessage.createdAt).toISOString()}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-[12px] italic text-red-500/70 font-semibold flex items-center gap-2">
                                  <Trash2 size={14} /> Content physically purged from database.
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Reporter Context */}
                          <div>
                            <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3 border-b border-white/5 pb-2">
                              Reporter Context
                            </h3>
                            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
                                  {(reporter.displayName || reporter.username || '?')[0]}
                                </div>
                                <div>
                                  <p className="text-[13px] font-bold text-white">{reporter.displayName || reporter.username || 'Unknown'}</p>
                                  <p className="text-[11px] text-blue-400">@{reporter.username}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5">Reporter Trust</p>
                                <p className="text-[13px] font-mono text-emerald-400">{reporter.trustScore ?? 100}%</p>
                              </div>
                            </div>
                            {report.details && (
                              <div className="mt-3 bg-white/[0.02] border border-white/5 rounded-xl p-3">
                                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Additional Notes</p>
                                <p className="text-[12px] text-white/80">{report.details}</p>
                              </div>
                            )}
                          </div>

                        </div>

                        {/* Offender Matrix & Actions (Right Column 4/12) */}
                        <div className="lg:col-span-4 space-y-6">
                          
                          {/* Offender Dossier */}
                          <div className="bg-[#050505] border border-red-500/10 rounded-xl p-5">
                            <h3 className="text-[10px] uppercase tracking-widest text-red-400 font-bold mb-4 flex items-center gap-2">
                              <ShieldAlert size={12} /> Offender Profile
                            </h3>
                            
                            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
                                <div className="w-10 h-10 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center font-bold text-lg">
                                  {(offender.displayName || offender.username || '?')[0]}
                                </div>
                                <div>
                                  <p className="text-[14px] font-bold text-white">{offender.displayName || offender.username || 'Unknown'}</p>
                                  <p className="text-[11px] text-red-400">@{offender.username}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] text-white/50">Prior Violations</span>
                                <span className="text-[12px] font-mono text-amber-400">{offender.violations || 0}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] text-white/50">Trust Level</span>
                                <span className="text-[12px] font-mono text-red-400">{offender.trustScore ?? 100}%</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] text-white/50">Account Status</span>
                                <span className={`text-[10px] uppercase tracking-wider font-bold ${offender.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {offender.status === 'active' ? 'Active' : 'Suspended'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Workflow */}
                          {report.status === 'pending' && (
                            <div className="space-y-3">
                              <h3 className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-3 border-b border-white/5 pb-2">
                                Moderation Workflow
                              </h3>
                              
                              <button onClick={() => handleUpdateStatus(report._id, 'dismissed')} className="w-full p-2.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/10 rounded-xl text-[11px] font-bold text-white flex items-center justify-center gap-2 transition-colors">
                                <X size={14} /> Dismiss (False Report)
                              </button>
                              
                              <button onClick={() => handleWarnUser(offender._id)} className="w-full p-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl text-[11px] font-bold text-amber-500 flex items-center justify-center gap-2 transition-colors">
                                <Bell size={14} /> Issue Formal Warning
                              </button>
                              
                              <button onClick={() => handleMuteUser(offender._id, 24)} className="w-full p-2.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-xl text-[11px] font-bold text-orange-500 flex items-center justify-center gap-2 transition-colors">
                                <Lock size={14} /> Restrict Comms (24h)
                              </button>

                              <button onClick={() => handleSuspendUser(offender._id, offender.status)} className="w-full p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-[11px] font-bold text-red-500 flex items-center justify-center gap-2 transition-colors">
                                <UserX size={14} /> {offender.status === 'suspended' ? 'Unsuspend Account' : 'Suspend Account'}
                              </button>

                              {report.reportedMessage && (
                                <div className="pt-2 border-t border-red-500/10 mt-2">
                                  <button onClick={() => handleDeleteMessage(report.reportedMessage._id, report._id)} className="w-full p-2.5 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 rounded-xl text-[11px] font-bold text-red-400 flex items-center justify-center gap-2 transition-colors">
                                    <Trash2 size={14} /> Delete Content & Resolve
                                  </button>
                                </div>
                              )}

                              <div className="pt-2 border-t border-white/5 mt-2">
                                <button onClick={() => handleUpdateStatus(report._id, 'resolved')} className="w-full p-2.5 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 rounded-xl text-[11px] font-bold flex items-center justify-center gap-2 transition-all">
                                  <Check size={14} /> Mark as Resolved
                                </button>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
