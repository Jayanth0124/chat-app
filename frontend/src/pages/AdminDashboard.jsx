import { useState, useEffect } from 'react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  ShieldBan, 
  Trash2, 
  FileText, 
  AlertCircle, 
  Shield, 
  RefreshCw, 
  Clock, 
  MessageCircle, 
  Users, 
  Check, 
  X,
  ChevronRight
} from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    onlineUsers: 0,
    messagesSent: 0,
    friendRequests: 0,
    reportsSubmitted: 0,
    bannedUsers: 0,
    totalChats: 0
  });
  
  const [auditLogs, setAuditLogs] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, logsRes, reportsRes] = await Promise.all([
        axiosInstance.get('/admin/stats'),
        axiosInstance.get('/admin/audit-logs'),
        axiosInstance.get('/admin/reports')
      ]);
      setStats(statsRes.data);
      setAuditLogs(logsRes.data);
      setReports(reportsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch admin dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUpdateReportStatus = async (reportId, status) => {
    try {
      const res = await axiosInstance.put(`/admin/reports/${reportId}/status`, { status });
      toast.success(res.data.message || `Report marked as ${status}`);
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update report status');
    }
  };

  const handleDeleteMessage = async (messageId, reportId) => {
    if (!window.confirm("Are you sure you want to delete this message administratively?")) return;
    try {
      await axiosInstance.delete(`/admin/messages/${messageId}`);
      if (reportId) {
        await axiosInstance.put(`/admin/reports/${reportId}/status`, { status: 'resolved' });
      }
      toast.success('Message deleted successfully');
      fetchDashboardData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    }
  };

  const getLogIcon = (action) => {
    switch (action) {
      case 'BAN_USER': return <ShieldBan size={16} className="text-red-500" />;
      case 'UNBAN_USER': return <ShieldBan size={16} className="text-emerald-500" />;
      case 'RESOLVE_REPORT': return <Check size={16} className="text-blue-500" />;
      case 'DISMISS_REPORT': return <X size={16} className="text-on-surface-variant" />;
      case 'MODERATION_DELETE_MESSAGE': return <Trash2 size={16} className="text-red-600" />;
      default: return <FileText size={16} className="text-primary" />;
    }
  };

  const pendingReports = reports.filter(r => r.status === 'pending').slice(0, 3);
  const recentLogs = auditLogs.slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-background h-full">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full font-sans text-on-surface">
      
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
            <Shield className="text-primary" /> System Overview
          </h1>
          <p className="text-on-surface-variant text-[13px] sm:text-[15px] mt-1">Operational state, active connections, and latest pending actions.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="self-end sm:self-auto p-2.5 bg-surface hover:bg-surface-container border border-outline-variant/60 rounded-xl text-on-surface-variant hover:text-on-surface transition-all shadow-sm cursor-pointer"
          title="Refresh Overview"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        {/* Total Users */}
        <div 
          onClick={() => navigate('/admin/users')}
          className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm hover:bg-surface-container-low transition-colors cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[110px] group"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Users</h3>
            <Users size={16} className="text-blue-500" />
          </div>
          <div className="mt-4 flex justify-between items-end">
            <div>
              <span className="text-3xl font-black">{stats.totalUsers}</span>
              <span className="text-[9px] text-on-surface-variant/70 font-semibold block mt-1">Registered accounts</span>
            </div>
            <ChevronRight size={16} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Online Sockets */}
        <div 
          onClick={() => navigate('/admin/analytics')}
          className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm hover:bg-surface-container-low transition-colors cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[110px] group"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Online Users</h3>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-extrabold text-green-500">LIVE</span>
            </div>
          </div>
          <div className="mt-4 flex justify-between items-end">
            <div>
              <span className="text-3xl font-black">{stats.onlineUsers}</span>
              <span className="text-[9px] text-on-surface-variant/70 font-semibold block mt-1">Active sockets</span>
            </div>
            <ChevronRight size={16} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Message volume */}
        <div 
          onClick={() => navigate('/admin/analytics')}
          className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm hover:bg-surface-container-low transition-colors cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[110px] group"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Messages Sent</h3>
            <MessageCircle size={16} className="text-violet-500" />
          </div>
          <div className="mt-4 flex justify-between items-end">
            <div>
              <span className="text-3xl font-black">{stats.messagesSent}</span>
              <span className="text-[9px] text-on-surface-variant/70 font-semibold block mt-1">Routed messages</span>
            </div>
            <ChevronRight size={16} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Reports submitted */}
        <div 
          onClick={() => navigate('/admin/reports')}
          className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm hover:bg-surface-container-low transition-colors cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[110px] group"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Pending Reports</h3>
            <AlertCircle size={16} className="text-red-500" />
          </div>
          <div className="mt-4 flex justify-between items-end">
            <div>
              <span className={`text-3xl font-black ${reports.filter(r => r.status === 'pending').length > 0 ? 'text-red-500' : ''}`}>
                {reports.filter(r => r.status === 'pending').length}
              </span>
              <span className="text-[9px] text-on-surface-variant/70 font-semibold block mt-1">Flagged reports</span>
            </div>
            <ChevronRight size={16} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Bento: Actionable Pending Reports */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <AlertCircle size={16} className="text-red-500" /> Urgent Action Items
              </h3>
              <button 
                onClick={() => navigate('/admin/reports')}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                View All Reports <ChevronRight size={12} />
              </button>
            </div>

            <div className="space-y-3">
              {pendingReports.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant/70">
                  <Check size={28} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold">Inbox is clear</p>
                  <p className="text-[10px]">No pending user reports need review.</p>
                </div>
              ) : (
                pendingReports.map(report => (
                  <div key={report._id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded">
                        {report.reason}
                      </span>
                      <span className="text-[9px] text-on-surface-variant">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {report.reportedMessage ? (
                      <p className="text-xs font-semibold italic text-on-surface truncate">
                        "{report.reportedMessage.content || 'Image Message'}"
                      </p>
                    ) : (
                      <p className="text-[10px] italic text-red-500 font-semibold">[Message Deleted]</p>
                    )}

                    <div className="flex items-center gap-2 justify-end pt-1">
                      <button 
                        onClick={() => handleUpdateReportStatus(report._id, 'dismissed')}
                        className="px-2 py-1 bg-surface-container-high hover:bg-outline-variant/20 text-on-surface-variant hover:text-on-surface rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Dismiss
                      </button>
                      
                      {report.reportedMessage && (
                        <button 
                          onClick={() => handleDeleteMessage(report.reportedMessage._id, report._id)}
                          className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          Delete Message
                        </button>
                      )}

                      <button 
                        onClick={() => handleUpdateReportStatus(report._id, 'resolved')}
                        className="px-2 py-1 bg-primary text-white hover:opacity-90 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Bento: Latest System Audit Feed */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between min-h-[400px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                <Shield size={16} className="text-primary" /> Recent System Logs
              </h3>
              <button 
                onClick={() => navigate('/admin/moderation')}
                className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                View Audit Panel <ChevronRight size={12} />
              </button>
            </div>

            <div className="space-y-3">
              {recentLogs.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant/70">
                  <FileText className="mx-auto text-on-surface-variant/30 mb-2" size={28} />
                  <p className="text-xs font-semibold">No logs available</p>
                </div>
              ) : (
                recentLogs.map(log => (
                  <div key={log._id} className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-3.5">
                    <div className="p-1.5 bg-surface rounded-lg border border-outline-variant/40 shrink-0">
                      {getLogIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-on-surface leading-tight truncate">
                        {log.details}
                      </p>
                      <span className="text-[9px] text-on-surface-variant/80 flex items-center gap-0.5 mt-1">
                        <Clock size={8} /> {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
