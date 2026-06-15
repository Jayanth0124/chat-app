import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Users, MessageCircle, Activity, Image as ImageIcon, AlertCircle, Database, 
  Shield, Server, Mail, HardDrive, ShieldBan, ShieldAlert,
  Loader2, ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { socket } = useAuthStore();

  const fetchDashboardData = async () => {
    try {
      const [statsRes, dbRes, logsRes] = await Promise.all([
        axiosInstance.get('/admin/stats'),
        axiosInstance.get('/admin/database-stats'),
        axiosInstance.get('/admin/audit-logs')
      ]);
      setStats(statsRes.data);
      setDbStats(dbRes.data);
      setAuditLogs(logsRes.data);
    } catch (error) {
      toast.error('Failed to load command center data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll every 10 seconds for hard database sync
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Listen to live socket events for instantaneous KPI updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      setStats(prev => prev ? { 
        ...prev, 
        messagesSent: (prev.messagesSent || 0) + 1,
        messagesToday: (prev.messagesToday || 0) + 1
      } : prev);
    };

    const handleUserOnline = () => {
      setStats(prev => prev ? {
        ...prev,
        onlineUsers: (prev.onlineUsers || 0) + 1
      } : prev);
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userOnline', handleUserOnline);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userOnline', handleUserOnline);
    };
  }, [socket]);

  if (isLoading || !stats) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#050505]">
        <div className="relative">
          <div className="w-16 h-16 border-[1px] border-white/10 border-t-white/80 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-24 w-full min-h-full bg-[#050505] text-white font-sans selection:bg-white/20 block">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            Orbit Command Center
          </h1>
          <p className="text-[11px] text-white/40 uppercase tracking-widest mt-1">Live telemetry & operations</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/30 uppercase tracking-widest">System Time</p>
          <p className="text-sm font-mono text-white/70">{new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      {/* Top KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
        <KPICard title="Total Users" value={stats.totalUsers} icon={<Users />} />
        <KPICard title="Active Status" value={stats.activeUsers} icon={<Activity />} />
        <KPICard title="Routed Msgs" value={stats.messagesSent?.toLocaleString()} icon={<MessageCircle />} />
        <KPICard title="Daily Msgs" value={stats.messagesToday?.toLocaleString()} icon={<ArrowUpRight />} />
        <KPICard title="Total Chats" value={stats.totalChats} icon={<MessageCircle />} />
        <KPICard title="Storage DB" value={formatBytes(dbStats?.database?.dataSize || 0)} icon={<HardDrive />} />
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column (8/12) */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-4">
          
          {/* Orbit Core Visualization */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden h-[420px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)]" />
            
            {/* Animated Rings */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border-[0.5px] border-white/10 rounded-full border-dashed"
              />
              <motion.div 
                animate={{ rotate: -360 }} 
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute inset-6 border-[1px] border-white/5 rounded-full"
              >
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] -translate-x-1/2 -translate-y-1/2" />
              </motion.div>
              <motion.div 
                animate={{ rotate: 360 }} 
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="absolute inset-12 border-[0.5px] border-white/10 rounded-full"
              >
                <div className="absolute bottom-0 left-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.8)] -translate-x-1/2 translate-y-1/2" />
              </motion.div>

              {/* Core metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm rounded-full m-16 border border-white/10 shadow-[0_0_40px_rgba(0,0,0,1)]">
                <span className="text-xs text-white/50 uppercase tracking-widest mb-1">Live Agents</span>
                <span className="text-5xl font-light text-white tracking-tighter">{stats.onlineUsers}</span>
              </div>
            </div>

            <div className="absolute bottom-4 left-6 right-6 flex justify-between text-[10px] text-white/30 uppercase tracking-widest font-mono">
              <span>Core Temp: Nominal</span>
              <span>Sync Time: {dbStats?.uptime ? Math.floor(dbStats.uptime / 60) : 0}m</span>
            </div>
          </div>

          {/* User Growth Chart */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-5 h-[320px]">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xs uppercase tracking-widest text-white/40 font-bold">Acquisition Trajectory</h2>
                <span className="text-[10px] text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded border border-emerald-500/20">Last 7 Days</span>
             </div>
             <div className="h-56 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={stats.userGrowth || []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15}/>
                       <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.4)' }} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                     itemStyle={{ color: '#fff' }}
                   />
                   <Area type="monotone" dataKey="count" stroke="rgba(255,255,255,0.5)" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

        </div>

        {/* Right Column (4/12) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
          
          {/* System Health */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-5">
            <h2 className="text-[11px] uppercase tracking-widest text-white/40 font-bold mb-5 flex items-center gap-2">
              <Server size={14} /> System Health
            </h2>
            <div className="space-y-4">
              <HealthRow label="Database (MongoDB)" status={dbStats?.systemHealth?.mongodb} />
              <HealthRow label="Socket.io Realtime" status={dbStats?.systemHealth?.socketio} />
              <HealthRow label="REST API Core" status="healthy" />
              <HealthRow label="CDN Storage" status={dbStats?.systemHealth?.cloudinary} />
            </div>
          </div>

          {/* Story Analytics */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-5 flex flex-col">
            <h2 className="text-[11px] uppercase tracking-widest text-white/40 font-bold mb-5 flex items-center gap-2">
              <ImageIcon size={14} /> Story Analytics
            </h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[9px] text-white/40 uppercase tracking-wider mb-2">Stories Today</p>
                <p className="text-3xl font-light">{stats.storiesToday}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4 flex flex-col items-center justify-center text-center">
                <p className="text-[9px] text-white/40 uppercase tracking-wider mb-2">This Week</p>
                <p className="text-3xl font-light">{stats.storiesThisWeek}</p>
              </div>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-lg p-5 flex flex-col items-center justify-center text-center mt-2">
              <p className="text-[9px] text-white/40 uppercase tracking-wider mb-2">Total Impressions</p>
              <p className="text-5xl font-light text-emerald-400">{stats.totalStoryViews?.toLocaleString()}</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// Subcomponents
const HealthRow = ({ label, status }) => {
  const isHealthy = status === 'healthy';
  return (
    <div className="flex justify-between items-center group">
      <span className="text-[11px] text-white/60 group-hover:text-white transition-colors">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-[9px] uppercase font-bold tracking-wider ${isHealthy ? 'text-emerald-500' : 'text-amber-500'}`}>
          {status || 'unknown'}
        </span>
        <div className={`w-1.5 h-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, icon }) => (
  <div className="bg-[#0A0A0A] border border-white/5 rounded-xl p-4 relative overflow-hidden group hover:border-white/10 transition-colors">
    <div className="absolute right-[-10px] top-[-10px] opacity-5 text-white transform group-hover:scale-110 transition-transform duration-500">
      {React.cloneElement(icon, { size: 64 })}
    </div>
    <div className="relative z-10">
      <h3 className="text-[9px] font-bold text-white/40 uppercase tracking-widest mb-2">{title}</h3>
      <p className="text-2xl font-light text-white tracking-tight">{value}</p>
    </div>
  </div>
);
