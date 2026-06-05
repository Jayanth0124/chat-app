import { useState, useEffect } from 'react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  ShieldBan, 
  Trash2, 
  Loader2, 
  FileText, 
  Clock, 
  User, 
  AlertCircle, 
  Check, 
  X, 
  Search 
} from 'lucide-react';

export default function ChatModeration() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admin/audit-logs');
      setLogs(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDeleteById = async (e) => {
    e.preventDefault();
    if (!deleteId.trim()) return;

    if (!window.confirm(`Are you sure you want to delete message ID: ${deleteId}?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      await axiosInstance.delete(`/admin/messages/${deleteId.trim()}`);
      toast.success("Message deleted successfully");
      setDeleteId('');
      fetchLogs(); // refresh logs to show deletion log
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete message. Verify the ID is correct.');
    } finally {
      setIsDeleting(false);
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

  const filteredLogs = logs.filter(log => 
    log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.adminId?.username && log.adminId.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto w-full font-sans text-on-surface">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
          <ShieldBan className="text-primary" /> Moderation & Audit Logs
        </h1>
        <p className="text-on-surface-variant text-[15px] mt-1">Audit administrative actions and utilize content review utilities.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Actions & Message Removal */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-2">
              <Trash2 size={16} className="text-red-500" /> Administrative Deletion
            </h3>
            <p className="text-xs text-on-surface-variant mb-4">Delete any message from any conversation instantly using its unique database identifier.</p>

            <form onSubmit={handleDeleteById} className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-on-surface-variant/80 uppercase tracking-wider block mb-1">Message Database ID</label>
                <input 
                  type="text" 
                  placeholder="e.g. 64ac82fb9023..." 
                  value={deleteId}
                  onChange={(e) => setDeleteId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:ring-2 focus:ring-primary/15 focus:border-primary outline-none text-[13px] shadow-sm transition-all"
                  required
                />
              </div>
              <button 
                type="submit"
                disabled={isDeleting || !deleteId.trim()}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Delete Message
              </button>
            </form>
          </div>

          <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm">
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-primary" /> Quick Guidelines
            </h3>
            <ul className="text-xs text-on-surface-variant space-y-2 list-disc pl-4">
              <li>Message deletion will immediately remove it from both participants' screens in real-time.</li>
              <li>Every deletion is logged in the system audit logs for administrative accountability.</li>
              <li>Banning a user forces their status to "banned", restricting their chat access.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Audit Logs Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm flex flex-col min-h-[500px]">
            
            {/* Logs search & filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
              <h3 className="text-sm font-bold text-on-surface">Administrative Activity Log</h3>
              
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-full rounded-xl bg-surface border border-outline-variant/60 text-xs focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            {/* Audit list */}
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[550px] pr-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant/70">
                  <FileText className="mx-auto text-on-surface-variant/30 mb-2" size={36} />
                  <p className="text-xs font-semibold">No audit logs found</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div 
                    key={log._id} 
                    className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 hover:border-outline-variant/60 transition-colors flex items-start gap-3"
                  >
                    <div className="p-2 bg-surface rounded-lg border border-outline-variant/30 shrink-0">
                      {getLogIcon(log.action)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 bg-surface rounded border border-outline-variant/40">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-on-surface-variant flex items-center gap-0.5">
                          <Clock size={10} /> {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      
                      <p className="text-xs text-on-surface font-medium leading-relaxed mb-1">
                        {log.details}
                      </p>

                      <div className="text-[10px] text-on-surface-variant flex items-center gap-1">
                        <User size={10} /> Executor: <span className="font-bold">@{log.adminId?.username || 'System'}</span>
                      </div>
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
