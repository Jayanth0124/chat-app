import { useState, useEffect } from 'react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  AlertTriangle, 
  Check, 
  X, 
  Trash2, 
  User, 
  MessageCircle, 
  Loader2, 
  Clock, 
  ShieldAlert 
} from 'lucide-react';
import { useConfirmStore } from '../../store/useConfirmStore';

export default function ReportsCenter() {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending'); // 'pending', 'resolved', 'dismissed' or 'all'

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admin/reports');
      setReports(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch reported content');
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
      toast.success(`Report marked as ${newStatus}`);
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to mark report as ${newStatus}`);
    }
  };

  const handleDeleteMessage = async (messageId, reportId) => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Delete Message",
      message: "Are you sure you want to administratively delete this message? This action is irreversible.",
      confirmText: "Delete",
      danger: true
    });
    if (!confirmed) {
      return;
    }
    try {
      // 1. Delete message
      await axiosInstance.delete(`/admin/messages/${messageId}`);
      // 2. Auto-resolve the report
      await axiosInstance.put(`/admin/reports/${reportId}/status`, { status: 'resolved' });
      toast.success('Message deleted and report resolved successfully');
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const filteredReports = reports.filter(r => {
    if (filterStatus === 'all') return true;
    return r.status === filterStatus;
  });

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full font-sans text-on-surface">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
            <AlertTriangle className="text-red-500" /> Reports Center
          </h1>
          <p className="text-on-surface-variant text-[13px] sm:text-[15px] mt-1">Review flagged messages and resolve user behavior violations.</p>
        </div>
        
        {/* Filter Pill Controls */}
        <div className="flex items-center gap-2 bg-surface-container-low p-1.5 rounded-xl border border-outline-variant/60">
          {['pending', 'resolved', 'dismissed', 'all'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                filterStatus === status 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Stack */}
      <div className="space-y-4">
        {filteredReports.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm">
            <ShieldAlert size={48} className="mx-auto text-on-surface-variant/40 mb-3" />
            <p className="text-on-surface font-semibold text-lg">No reports found</p>
            <p className="text-on-surface-variant text-xs mt-1">No items exist for the status: <span className="font-bold">{filterStatus}</span></p>
          </div>
        ) : (
          filteredReports.map((report) => {
            const reporterName = report.reporter?.displayName || report.reporter?.username || 'Unknown User';
            const offenderName = report.reportedUser?.displayName || report.reportedUser?.username || 'Unknown User';
            
            return (
              <div 
                key={report._id} 
                className="bg-surface rounded-2xl border border-outline-variant/60 p-5 shadow-sm hover:border-outline-variant transition-colors flex flex-col gap-4"
              >
                {/* Header Information */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/30 pb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider border ${
                      report.reason === 'Harassment' 
                        ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }`}>
                      {report.reason}
                    </span>
                    <span className="text-xs text-on-surface-variant flex items-center gap-1">
                      <Clock size={12} /> {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Status Indicator badge */}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                    report.status === 'pending'
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      : report.status === 'resolved'
                      ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : 'bg-on-surface-variant/10 text-on-surface-variant border-on-surface-variant/20'
                  }`}>
                    {report.status}
                  </span>
                </div>

                {/* Reporter / Offender Relationship */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider block mb-1">Reporter</span>
                    <div className="flex items-center gap-2">
                      <img src={report.reporter?.profilePic || '/logo.png'} alt="profile" className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-xs font-bold">{reporterName}</span>
                      <span className="text-xs text-on-surface-variant">(@{report.reporter?.username})</span>
                    </div>
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30">
                    <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider block mb-1">Offender</span>
                    <div className="flex items-center gap-2">
                      <img src={report.reportedUser?.profilePic || '/logo.png'} alt="profile" className="w-6 h-6 rounded-full object-cover" />
                      <span className="text-xs font-bold text-red-500">{offenderName}</span>
                      <span className="text-xs text-on-surface-variant">(@{report.reportedUser?.username})</span>
                    </div>
                  </div>
                </div>

                {/* Flagged content block */}
                <div className="p-4 bg-surface-container/60 rounded-xl border border-outline-variant/30 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider flex items-center gap-1">
                    <MessageCircle size={12} /> Flagged Content
                  </span>
                  
                  {report.reportedMessage ? (
                    <div className="space-y-2">
                      {report.reportedMessage.content && (
                        <p className="text-sm font-semibold italic text-on-surface">
                          "{report.reportedMessage.content}"
                        </p>
                      )}
                      {report.reportedMessage.mediaUrl && (
                        <div className="max-w-[200px] rounded-lg overflow-hidden border border-outline-variant/40 mt-1">
                          <img src={report.reportedMessage.mediaUrl} alt="Flagged attachment" className="w-full h-auto object-cover max-h-48" />
                        </div>
                      )}
                      <p className="text-[10px] text-on-surface-variant/60">
                        Message ID: {report.reportedMessage._id} • Sent: {new Date(report.reportedMessage.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs italic text-red-500 font-semibold">[Message was previously deleted]</p>
                  )}

                  {report.details && (
                    <div className="mt-2 pt-2 border-t border-outline-variant/20 text-xs">
                      <span className="font-bold text-on-surface-variant/80">Report Description:</span>{' '}
                      <span className="text-on-surface-variant">{report.details}</span>
                    </div>
                  )}
                </div>

                {/* Action Controls */}
                {report.status === 'pending' && (
                  <div className="flex items-center gap-3 justify-end pt-2 border-t border-outline-variant/30">
                    <button 
                      onClick={() => handleUpdateStatus(report._id, 'dismissed')}
                      className="px-3 py-1.5 bg-surface-container-high hover:bg-outline-variant/20 text-on-surface-variant hover:text-on-surface rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-outline-variant/40"
                    >
                      <X size={14} /> Dismiss Report
                    </button>
                    
                    {report.reportedMessage && (
                      <button 
                        onClick={() => handleDeleteMessage(report.reportedMessage._id, report._id)}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-red-500/20"
                      >
                        <Trash2 size={14} /> Delete violating Message
                      </button>
                    )}

                    <button 
                      onClick={() => handleUpdateStatus(report._id, 'resolved')}
                      className="px-3.5 py-1.5 bg-primary text-white hover:opacity-90 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                    >
                      <Check size={14} /> Resolve Report
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
