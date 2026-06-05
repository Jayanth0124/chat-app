import { useState, useEffect } from 'react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  BarChart2, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  UserPlus, 
  AlertCircle, 
  UserX, 
  ShieldCheck, 
  Loader2, 
  RefreshCw 
} from 'lucide-react';

export default function Analytics() {
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
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admin/stats');
      setStats(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch platform analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={36} />
      </div>
    );
  }

  const activeRatio = stats.totalUsers > 0 
    ? Math.round(((stats.totalUsers - stats.bannedUsers) / stats.totalUsers) * 100) 
    : 100;
    
  const bannedRatio = stats.totalUsers > 0 
    ? Math.round((stats.bannedUsers / stats.totalUsers) * 100) 
    : 0;

  const onlineRatio = stats.totalUsers > 0 
    ? Math.round((stats.onlineUsers / stats.totalUsers) * 100) 
    : 0;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full font-sans text-on-surface">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 sm:mb-8 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
            <BarChart2 className="text-primary" /> Advanced Analytics
          </h1>
          <p className="text-on-surface-variant text-[13px] sm:text-[15px] mt-1">Real-time statistics, active connections, and activity telemetry.</p>
        </div>
        <button 
          onClick={fetchStats}
          className="self-end sm:self-auto p-2.5 bg-surface hover:bg-surface-container border border-outline-variant/60 rounded-xl text-on-surface-variant hover:text-on-surface transition-all shadow-sm cursor-pointer"
          title="Refresh Statistics"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        
        {/* Total Users */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Accounts</h3>
            <Users size={16} className="text-blue-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-on-surface leading-none">{stats.totalUsers}</span>
            <span className="text-[10px] text-on-surface-variant/70 font-semibold block mt-1">Registered profiles</span>
          </div>
        </div>

        {/* Online Sockets */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Online Users</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-extrabold text-green-500 tracking-wider">LIVE</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-on-surface leading-none">{stats.onlineUsers}</span>
            <span className="text-[10px] text-on-surface-variant/70 font-semibold block mt-1">Active socket streams</span>
          </div>
        </div>

        {/* Message Volume */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500"></div>
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Messages Routed</h3>
            <MessageCircle size={16} className="text-violet-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-on-surface leading-none">{stats.messagesSent}</span>
            <span className="text-[10px] text-on-surface-variant/70 font-semibold block mt-1">Total chat messages sent</span>
          </div>
        </div>

        {/* Reports Submitted */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Submitted Reports</h3>
            <AlertCircle size={16} className="text-red-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-red-500 leading-none">{stats.reportsSubmitted}</span>
            <span className="text-[10px] text-on-surface-variant/70 font-semibold block mt-1">Flagged messages reported</span>
          </div>
        </div>

        {/* Friend Connections */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Friend Requests</h3>
            <UserPlus size={16} className="text-amber-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-on-surface leading-none">{stats.friendRequests}</span>
            <span className="text-[10px] text-on-surface-variant/70 font-semibold block mt-1">Total pending invitations</span>
          </div>
        </div>

        {/* Suspended Accounts */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600"></div>
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Banned Users</h3>
            <UserX size={16} className="text-red-600" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-red-600 leading-none">{stats.bannedUsers}</span>
            <span className="text-[10px] text-on-surface-variant/70 font-semibold block mt-1">Suspended user accounts</span>
          </div>
        </div>

        {/* Active Conversations */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-sky-500"></div>
          <div className="flex justify-between items-start">
            <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Conversations</h3>
            <ShieldCheck size={16} className="text-sky-500" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-black text-on-surface leading-none">{stats.totalChats}</span>
            <span className="text-[10px] text-on-surface-variant/70 font-semibold block mt-1">Active conversation rooms</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics / Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Security & Account Ratio */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-1">
              <ShieldCheck size={16} className="text-primary" /> Security Ratios
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">Percentage distribution of suspended versus active accounts.</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-emerald-500">Active Profiles ({stats.totalUsers - stats.bannedUsers})</span>
                <span>{activeRatio}%</span>
              </div>
              <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden border border-outline-variant/20">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${activeRatio}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-red-500">Banned Profiles ({stats.bannedUsers})</span>
                <span>{bannedRatio}%</span>
              </div>
              <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden border border-outline-variant/20">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${bannedRatio}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Socket Activity Density */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-on-surface flex items-center gap-2 mb-1">
              <TrendingUp size={16} className="text-primary" /> Session Densities
            </h3>
            <p className="text-xs text-on-surface-variant mb-6">Real-time socket session density relative to total platform accounts.</p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-emerald-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"></span>
                  Online Stream Sessions
                </span>
                <span>{onlineRatio}%</span>
              </div>
              <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden border border-outline-variant/20">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${onlineRatio}%` }}></div>
              </div>
            </div>

            <div className="flex justify-between text-[11px] font-bold text-on-surface-variant/70 pt-2 border-t border-outline-variant/20">
              <span>Concurrent Sockets: {stats.onlineUsers}</span>
              <span>Offline Profiles: {stats.totalUsers - stats.onlineUsers}</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
