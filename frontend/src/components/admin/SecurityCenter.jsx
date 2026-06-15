import React, { useState, useEffect } from 'react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, RefreshCw, EyeOff, ShieldCheck, 
  Activity, Users, Server, Zap, Lock, Shield, 
  Wifi, BarChart4, Network, Cpu, LockKeyhole,
  Globe, MonitorSmartphone, Layers, Box
} from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

export default function SecurityCenter() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [dbStats, setDbStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [trafficHistory, setTrafficHistory] = useState([]);
  
  const { settings, fetchSettings, updateSettingAdmin } = useSettingsStore();
  const { socket } = useAuthStore();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [logsRes, statsRes, dbRes] = await Promise.all([
        axiosInstance.get('/admin/security-logs'),
        axiosInstance.get('/admin/stats'),
        axiosInstance.get('/admin/database-stats')
      ]);
      setLogs(logsRes.data);
      setStats(statsRes.data);
      setDbStats(dbRes.data);
    } catch (error) {
      toast.error('Failed to fetch security operations data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSettings();
    
    // Poll for changes
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update Traffic History Array for Charts
  useEffect(() => {
    if (!stats || !dbStats) return;
    
    setTrafficHistory(prev => {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const newPoint = {
        time: now,
        logins: stats.securityMonitor?.failedLogins || 0,
        messages: stats.messagesToday || 0,
        blocked: stats.securityMonitor?.blockedAttempts || 0,
        connections: dbStats.systemHealth?.activeConnections || 0
      };
      // Keep last 15 data points
      return [...prev, newPoint].slice(-15);
    });
  }, [stats, dbStats]);

  const handleTogglePrivacy = async () => {
    try {
      const newValue = !settings.screenCapturePrivacy;
      await updateSettingAdmin('screenCapturePrivacy', newValue);
      toast.success(`Screen Capture Privacy ${newValue ? 'Enabled' : 'Disabled'}`);
    } catch (error) {
      toast.error('Failed to update Screen Capture Privacy');
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex h-full items-center justify-center bg-[#030303]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-2 border-emerald-500/40 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-500/70">Initializing SOC...</p>
        </div>
      </div>
    );
  }

  // Calculate session data from logs as a proxy since there is no raw backend device metric
  const desktopSessions = logs.filter(l => l.deviceInfo?.toLowerCase().includes('windows') || l.deviceInfo?.toLowerCase().includes('mac')).length;
  const mobileSessions = logs.filter(l => l.deviceInfo?.toLowerCase().includes('ios') || l.deviceInfo?.toLowerCase().includes('android') || l.deviceInfo?.toLowerCase().includes('mobile')).length;
  const pwaInstalls = logs.filter(l => l.deviceInfo?.toLowerCase().includes('pwa')).length;

  return (
    <div className="min-h-full bg-[#030303] text-white p-6 md:p-10 lg:p-12 font-sans selection:bg-emerald-500/30">
      <div className="max-w-[1600px] mx-auto space-y-8 md:space-y-10">
        
        {/* ======================= TOP COMMAND BAR ======================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-4">
              <div className="relative flex items-center justify-center w-10 h-10 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <div className="absolute inset-0 border border-emerald-500/30 rounded-xl animate-pulse"></div>
              </div>
              SECURITY OPERATIONS
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-3 ml-1 font-mono">Live Traffic & Threat Intelligence</p>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={fetchData}
              className="px-5 py-2.5 bg-[#111] hover:bg-[#1a1a1a] border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest text-white/60 hover:text-white transition-all shadow-sm flex items-center gap-2"
            >
              <RefreshCw size={14} /> Refresh Grid
            </button>
          </div>
        </div>

        {/* ======================= PRIVACY UPGRADE CARD ======================= */}
        <div className="relative group overflow-hidden bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5 rounded-[2rem] p-8 md:p-10 shadow-2xl transition-all hover:border-emerald-500/30 hover:shadow-[0_20px_50px_rgba(16,185,129,0.05)]">
          {/* Subtle Glow Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex items-start gap-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-colors duration-500 ${settings.screenCapturePrivacy ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-red-500/10 border-red-500/30'}`}>
                {settings.screenCapturePrivacy ? <ShieldCheck className="w-8 h-8 text-emerald-400" /> : <EyeOff className="w-8 h-8 text-red-400" />}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">Screenshot Capture Privacy</h2>
                <p className="text-sm text-white/50 max-w-2xl leading-relaxed">
                  Enterprise-grade DRM protection. When enabled, this prevents unauthorized screenshots, screen recordings, and external display mirroring globally across all client applications.
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border ${settings.screenCapturePrivacy ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                    {settings.screenCapturePrivacy ? 'Strict Enforcement' : 'Warning: Disabled'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleTogglePrivacy}
              className={`relative inline-flex h-10 w-20 items-center rounded-full transition-colors cursor-pointer shrink-0 border ${
                settings.screenCapturePrivacy ? 'bg-emerald-500 border-emerald-400' : 'bg-[#1a1a1a] border-white/10'
              }`}
            >
              <span
                className={`inline-block h-8 w-8 transform rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] shadow-md ${
                  settings.screenCapturePrivacy ? 'translate-x-11' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* ======================= SOC MAIN GRID ======================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* ACTIVE SESSION COMMAND CENTER */}
          <div className="lg:col-span-7 bg-[#050505] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-8 flex items-center gap-3 shrink-0">
              <Globe size={14} className="text-blue-500" /> Active Session Command
            </h2>

            {/* Network Visualization */}
            <div className="relative w-full h-64 border border-white/5 rounded-2xl bg-gradient-to-b from-[#0a0a0a] to-[#050505] overflow-hidden mb-8 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full opacity-20">
                <path d="M 10% 50% Q 30% 20% 50% 50% T 90% 50%" fill="transparent" stroke="#3b82f6" strokeWidth="1" strokeDasharray="4,4" className="animate-[dash_10s_linear_infinite]" />
                <path d="M 20% 80% Q 50% 100% 80% 20%" fill="transparent" stroke="#8b5cf6" strokeWidth="1" />
                <path d="M 30% 20% L 50% 50% L 70% 80%" fill="transparent" stroke="#10b981" strokeWidth="1" strokeDasharray="2,6" />
              </svg>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                <div className="w-28 h-28 rounded-full bg-blue-500/5 border border-blue-500/20 flex flex-col items-center justify-center shadow-[0_0_60px_rgba(59,130,246,0.15)] relative">
                  <div className="absolute inset-0 rounded-full border border-blue-500/30 animate-ping opacity-20"></div>
                  <Network className="text-blue-400 mb-2" size={28} />
                  <span className="text-2xl font-light text-white leading-none">{dbStats?.systemHealth?.activeConnections || 0}</span>
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-1">Live Sockets</span>
                </div>
              </div>
              
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-[20%] left-[20%] w-12 h-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center z-20 shadow-lg">
                <MonitorSmartphone size={16} className="text-white/60" />
              </motion.div>
              
              <motion.div animate={{ y: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute bottom-[20%] right-[20%] w-14 h-14 rounded-full bg-[#111] border border-white/10 flex items-center justify-center z-20 shadow-lg">
                <Cpu size={18} className="text-white/60" />
              </motion.div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-auto">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Active Users</p>
                <p className="text-2xl font-mono text-white/90">{stats?.activeUsers || 0}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Desktop Sessions</p>
                <p className="text-2xl font-mono text-white/90">{dbStats?.systemHealth?.desktopSessions || 0}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Mobile Sessions</p>
                <p className="text-2xl font-mono text-white/90">{dbStats?.systemHealth?.mobileSessions || 0}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">PWA Installs</p>
                <p className="text-2xl font-mono text-blue-400">{dbStats?.systemHealth?.pwaInstalls || 0}</p>
              </div>
            </div>
          </div>

          {/* RATE LIMIT MONITOR */}
          <div className="lg:col-span-5 bg-[#050505] border border-white/5 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-8 flex items-center gap-3 shrink-0">
              <Activity size={14} className="text-purple-500" /> Rate Limit Monitor
            </h2>

            {/* Live Chart */}
            <div className="flex-1 min-h-[180px] w-full mb-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficHistory} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConnections" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickMargin={10} axisLine={false} tickLine={false} fontFamily="monospace" />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} fontFamily="monospace" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '12px', padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ fontFamily: 'monospace' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  <Area type="monotone" name="Messages/sec" dataKey="messages" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorMessages)" isAnimationActive={false} />
                  <Area type="monotone" name="Live Conns" dataKey="connections" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorConnections)" isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Real-time Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mt-auto">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Failed Logins</p>
                <p className="text-xl font-mono text-white flex items-center justify-between">
                  {stats?.securityMonitor?.failedLogins || 0}
                  <LockKeyhole size={14} className="text-white/20" />
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Daily Messages</p>
                <p className="text-xl font-mono text-white flex items-center justify-between">
                  {stats?.messagesToday?.toLocaleString() || 0}
                  <Layers size={14} className="text-white/20" />
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-4">
                <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Live Sockets</p>
                <p className="text-xl font-mono text-white flex items-center justify-between">
                  {dbStats?.systemHealth?.activeConnections || 0}
                  <Box size={14} className="text-white/20" />
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-red-500/10 rounded-xl p-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform"></div>
                <p className="text-[9px] uppercase tracking-widest text-red-500/60 font-bold mb-1 relative z-10">Blocked Requests</p>
                <p className="text-xl font-mono text-red-400 flex items-center justify-between relative z-10">
                  {stats?.securityMonitor?.blockedAttempts || 0}
                  <ShieldAlert size={14} className="text-red-500/40" />
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
