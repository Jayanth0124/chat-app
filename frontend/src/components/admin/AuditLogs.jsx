import { useEffect, useState } from 'react';
import { History, FileText, Trash2, ShieldBan, Loader2 } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuditLogs = async () => {
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
    fetchAuditLogs();
  }, []);

  const getLogIcon = (action) => {
    switch (action) {
      case 'BAN_USER':
        return <ShieldBan size={16} className="text-red-500" />;
      case 'UNBAN_USER':
        return <ShieldBan size={16} className="text-green-500" />;
      default:
        return <FileText size={16} className="text-primary" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-surface p-6 rounded-2xl border border-outline-variant/60 shadow-sm text-on-surface flex justify-center items-center py-12">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-surface p-6 rounded-2xl border border-outline-variant/60 shadow-sm text-on-surface">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <History className="text-primary" /> Audit Logs
        </h2>
        <button 
          onClick={fetchAuditLogs}
          className="text-xs font-semibold text-primary hover:underline"
        >
          Refresh
        </button>
      </div>

      <div className="relative border-l-2 border-outline-variant/60 ml-3 space-y-6 pb-4">
        {logs.length === 0 ? (
          <div className="text-center py-6 text-on-surface-variant/80 text-sm pl-3">
            No actions logged yet.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log._id} className="relative pl-6">
              <div className="absolute -left-[9px] top-1 w-4 h-4 bg-background rounded-full border-2 border-outline-variant/60 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant"></div>
              </div>
              <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/30">
                <div className="flex justify-between items-start mb-1 gap-4">
                  <span className="text-sm font-bold text-on-surface">
                    @{log.adminId?.username || 'admin'}
                  </span>
                  <span className="text-[11px] text-on-surface-variant whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  {getLogIcon(log.action)}
                  <span className="break-all">{log.details}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
