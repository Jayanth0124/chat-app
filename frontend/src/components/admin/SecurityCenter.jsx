import { useState, useEffect } from 'react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  ShieldAlert, 
  LogIn, 
  MonitorSmartphone, 
  Loader2, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  RefreshCw 
} from 'lucide-react';

export default function SecurityCenter() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocking, setIsBlocking] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admin/security-logs');
      setLogs(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch security logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleBlockIP = async (ip) => {
    if (!ip) return;
    if (!window.confirm(`Are you sure you want to block all sessions from IP: ${ip}?`)) {
      return;
    }

    setIsBlocking(true);
    try {
      const res = await axiosInstance.post('/admin/security/block-ip', { ip });
      toast.success(res.data.message || `IP Address ${ip} blocked`);
      fetchLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block IP Address');
    } finally {
      setIsBlocking(false);
    }
  };

  const failedLoginAttempts = logs.filter(log => log.logType === 'failed_login');
  const suspiciousDevices = logs.filter(log => log.logType === 'suspicious_device');

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
            <ShieldAlert className="text-primary" /> Security Center
          </h1>
          <p className="text-on-surface-variant text-[13px] sm:text-[15px] mt-1">Audit failed login traces, monitor active device connections, and restrict offending IPs.</p>
        </div>
        <button 
          onClick={fetchLogs}
          className="p-2.5 bg-surface hover:bg-surface-container border border-outline-variant/60 rounded-xl text-on-surface-variant hover:text-on-surface transition-all shadow-sm cursor-pointer"
          title="Refresh Logs"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Failed Login Attempts Panel */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[450px]">
          <div>
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-4">
              <LogIn size={16} className="text-red-500" /> Failed Login Attempts
            </h3>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {failedLoginAttempts.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant/75 border border-dashed border-outline-variant/60 rounded-xl">
                  <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold">No failed attempts recorded</p>
                  <p className="text-[10px]">All login requests are valid.</p>
                </div>
              ) : (
                failedLoginAttempts.map((log) => (
                  <div 
                    key={log._id} 
                    className={`p-3.5 rounded-xl border flex justify-between items-center gap-4 transition-all ${
                      log.status === 'blocked'
                        ? 'bg-on-surface-variant/5 border-outline-variant/40 opacity-70'
                        : 'bg-red-500/5 border-red-500/10 hover:border-red-500/30'
                    }`}
                  >
                    <div>
                      <p className={`text-xs font-bold ${log.status === 'blocked' ? 'text-on-surface-variant line-through' : 'text-red-500'}`}>
                        {log.email}
                      </p>
                      <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
                        IP: {log.ip} • Attempts: <span className="font-bold">{log.attempts}</span>
                      </p>
                      <span className="text-[9px] text-on-surface-variant/60 block mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {log.status === 'blocked' ? (
                        <span className="text-[9px] font-bold px-2 py-1 bg-on-surface-variant/15 text-on-surface-variant rounded-lg uppercase tracking-wider flex items-center gap-1">
                          <Lock size={10} /> Blocked
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleBlockIP(log.ip)}
                          disabled={isBlocking}
                          className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-red-500/20"
                        >
                          <Lock size={10} /> Block IP
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Suspicious Device Logs Panel */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[450px]">
          <div>
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-4">
              <MonitorSmartphone size={16} className="text-amber-500" /> Device Sign-In Log
            </h3>
            
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
              {suspiciousDevices.length === 0 ? (
                <div className="text-center py-16 text-on-surface-variant/75 border border-dashed border-outline-variant/60 rounded-xl">
                  <MonitorSmartphone size={32} className="mx-auto text-on-surface-variant/40 mb-2" />
                  <p className="text-xs font-semibold">No devices tracked yet</p>
                  <p className="text-[10px]">Signin device details will appear once users log in.</p>
                </div>
              ) : (
                suspiciousDevices.map((log) => (
                  <div 
                    key={log._id} 
                    className={`p-3.5 rounded-xl border flex justify-between items-center gap-4 transition-all ${
                      log.status === 'blocked'
                        ? 'bg-on-surface-variant/5 border-outline-variant/40 opacity-70'
                        : 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-on-surface">
                        {log.deviceInfo}
                      </p>
                      <p className="text-[10px] text-on-surface-variant/80 mt-0.5">
                        Account: <span className="font-bold">@{log.email.split('@')[0]}</span> • IP: {log.ip}
                      </p>
                      <span className="text-[9px] text-on-surface-variant/60 block mt-1">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {log.status === 'blocked' ? (
                        <span className="text-[9px] font-bold px-2 py-1 bg-on-surface-variant/15 text-on-surface-variant rounded-lg uppercase tracking-wider flex items-center gap-1">
                          <Lock size={10} /> Blocked
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleBlockIP(log.ip)}
                          disabled={isBlocking}
                          className="px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-amber-500/20"
                        >
                          <Lock size={10} /> Block IP
                        </button>
                      )}
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
