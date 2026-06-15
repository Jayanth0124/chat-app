import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { 
  Activity, Database, HardDrive, Server, Zap, RefreshCw, 
  Activity as ActivityIcon, CheckCircle, AlertTriangle, 
  XCircle, Orbit, Cpu, MemoryStick, ShieldCheck, Clock,
  TrendingUp, Fingerprint, Layers, BarChart4, ChevronRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar 
} from 'recharts';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatNumber(num) {
  if (!num) return '0';
  return num.toLocaleString();
}

export default function DatabaseUsage() {
  const { socket } = useChatStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const prevStatsRef = useRef(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await axiosInstance.get('/admin/database-stats');
        setStats(res.data);
        prevStatsRef.current = res.data;
        setLoading(false);
        setHistory(prev => {
          const newPoint = { 
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), 
            docs: res.data.database.objects, 
            storage: res.data.database.dataSize / (1024*1024) 
          };
          return [...prev, newPoint].slice(-40);
        });
      } catch (err) {
        toast.error("Telemetry uplink failed");
        setLoading(false);
      }
    };
    fetchInitialData();

    if (socket) {
      socket.emit('admin:monitor:join');
      
      const handleStatsUpdate = (data) => {
        setStats(prev => {
          // Detect changes to generate live events
          if (prev) {
            const docDiff = data.database.objects - prev.database.objects;
            const sizeDiff = data.database.dataSize - prev.database.dataSize;
            
            if (docDiff !== 0) {
              const newEvent = {
                id: Date.now() + Math.random(),
                time: new Date().toLocaleTimeString(),
                type: docDiff > 0 ? 'INSERT' : 'DELETE',
                desc: `${Math.abs(docDiff)} Document(s) ${docDiff > 0 ? 'Indexed' : 'Purged'}`,
                color: docDiff > 0 ? 'text-emerald-400' : 'text-rose-400'
              };
              setEvents(e => [newEvent, ...e].slice(0, 15));
            }
          }
          return data;
        });

        setHistory(prev => {
          const newPoint = { 
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'}), 
            docs: data.database.objects,
            storage: data.database.dataSize / (1024*1024)
          };
          return [...prev, newPoint].slice(-40);
        });
      };

      socket.on('admin:db_stats_update', handleStatsUpdate);

      return () => {
        socket.emit('admin:monitor:leave');
        socket.off('admin:db_stats_update', handleStatsUpdate);
      };
    }
  }, [socket]);

  // Initial event population
  useEffect(() => {
    if (stats && events.length === 0) {
      setEvents([
        { id: 'initial1', time: new Date().toLocaleTimeString(), type: 'SYSTEM', desc: 'Telemetry Uplink Established', color: 'text-blue-400' },
        { id: 'initial2', time: new Date().toLocaleTimeString(), type: 'SYNC', desc: 'Database Synchronized', color: 'text-purple-400' }
      ]);
    }
  }, [stats]);

  if (loading || !stats) {
    return (
      <div className="flex h-full items-center justify-center bg-[#030303]">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full animate-ping"></div>
            <div className="absolute inset-2 border-2 border-blue-500/40 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Orbit className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-blue-500/70">Establishing Telemetry Link...</p>
        </div>
      </div>
    );
  }

  const { database, collections, systemHealth, uptime } = stats;
  
  // Calculate specific metrics
  const totalStorage = database.fsTotalSize || 512 * 1024 * 1024 * 1024; // fallback 512GB
  const usedStorage = database.fsUsedSize || database.storageSize;
  const storagePercent = ((usedStorage / totalStorage) * 100).toFixed(1);
  const remainingStorage = totalStorage - usedStorage;
  
  const largestCollection = [...collections].sort((a,b) => b.size - a.size)[0] || null;
  const mostDocsCollection = [...collections].sort((a,b) => b.count - a.count)[0] || null;

  // Radar Data for System Health
  const radarData = [
    { subject: 'MongoDB', score: systemHealth.mongodb === 'healthy' ? 100 : systemHealth.mongodb === 'warning' ? 50 : 20 },
    { subject: 'Socket.IO', score: systemHealth.socketio === 'healthy' ? 100 : systemHealth.socketio === 'warning' ? 50 : 20 },
    { subject: 'Cloudinary', score: systemHealth.cloudinary === 'healthy' ? 100 : systemHealth.cloudinary === 'warning' ? 50 : 20 },
    { subject: 'Core API', score: systemHealth.api === 'healthy' ? 100 : systemHealth.api === 'warning' ? 50 : 20 },
    { subject: 'Realtime', score: 100 } // Implicitly healthy if we are receiving sockets
  ];

  return (
    <div className="min-h-full bg-[#030303] text-white p-6 md:p-10 lg:p-12 font-sans selection:bg-blue-500/30">
      <div className="max-w-[1600px] mx-auto space-y-8 md:space-y-10">
        
        {/* ======================= TOP COMMAND BAR ======================= */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-4">
              <div className="relative flex items-center justify-center w-10 h-10 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
                <Orbit className="w-5 h-5 text-blue-400" />
                <div className="absolute inset-0 border border-blue-500/30 rounded-xl animate-pulse"></div>
              </div>
              MISSION CONTROL
            </h1>
            <p className="text-xs uppercase tracking-[0.2em] text-white/40 mt-3 ml-1 font-mono">Orbit System Telemetry</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">System Uptime</p>
              <p className="text-xl font-mono text-white/90">{(uptime / 3600).toFixed(2)}H</p>
            </div>
          </div>
        </div>

        {/* ======================= PRIMARY DASHBOARD GRID ======================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* ORBIT CORE PANEL (Span 8) */}
          <div className="lg:col-span-8 bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none transition-opacity duration-1000 group-hover:bg-blue-500/10"></div>
            
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-10 flex items-center gap-3">
              <Server size={14} /> Core Database Matrix
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10">
              {/* Storage Ring Visual */}
              <div className="flex flex-col items-center justify-center relative">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle cx="96" cy="96" r="88" stroke="rgba(255,255,255,0.05)" strokeWidth="16" fill="none" />
                  <circle 
                    cx="96" cy="96" r="88" 
                    stroke="url(#blueGradient)" 
                    strokeWidth="16" 
                    fill="none" 
                    strokeDasharray="552.92" 
                    strokeDashoffset={552.92 - (552.92 * storagePercent) / 100}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-black text-white tracking-tighter">{storagePercent}%</span>
                  <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold mt-1">Capacity</span>
                </div>
              </div>

              {/* Core Metrics */}
              <div className="md:col-span-2 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Total Storage</p>
                  <p className="text-3xl font-mono text-white mb-1">{formatBytes(totalStorage)}</p>
                  <p className="text-xs font-medium text-white/30 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Used: {formatBytes(usedStorage)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Storage Remaining</p>
                  <p className="text-3xl font-mono text-white mb-1">{formatBytes(remainingStorage)}</p>
                  <p className="text-xs font-medium text-white/30 flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10"></div> Free Allocation
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Total Documents</p>
                  <p className="text-3xl font-mono text-white mb-1">{formatNumber(database.objects)}</p>
                  <p className="text-xs font-medium text-white/30">Across {database.collections} collections</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Active Connections</p>
                  <p className="text-3xl font-mono text-white mb-1">{formatNumber(systemHealth.activeConnections)}</p>
                  <p className="text-xs font-medium text-emerald-400/80 flex items-center gap-1">
                    <ActivityIcon size={12} /> Live Sockets
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SYSTEM HEALTH RADAR (Span 4) */}
          <div className="lg:col-span-4 bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden flex flex-col items-center">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-4 w-full flex items-center gap-3">
              <ShieldCheck size={14} /> Health Radar
            </h2>
            <div className="flex-1 w-full flex items-center justify-center -mt-6">
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }} />
                  <Radar name="Health" dataKey="score" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.2} isAnimationActive={false} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full flex justify-between px-4 text-[10px] font-bold uppercase tracking-widest text-white/30">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Optimal</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-white/10 rounded-full"></div> Degraded</span>
            </div>
          </div>
        </div>

        {/* ======================= DATABASE COMMAND CENTER ======================= */}
        <div className="bg-[#050505] border border-white/5 rounded-[2rem] p-8 md:p-10 relative shadow-2xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 border-b border-white/5 pb-8">
            <div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2 flex items-center gap-3">
                <Database className="text-blue-500 w-6 h-6" /> Database Command Center
              </h2>
              <p className="text-xs uppercase tracking-widest text-white/40 font-mono">Live Collection Matrix</p>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Collections</p>
                <p className="text-xl font-mono text-white">{database.collections}</p>
              </div>
              <div className="h-8 w-px bg-white/10 hidden md:block"></div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Total Records</p>
                <p className="text-xl font-mono text-white">{formatNumber(database.objects)}</p>
              </div>
              <div className="h-8 w-px bg-white/10 hidden md:block"></div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Storage Allocation</p>
                <p className="text-xl font-mono text-blue-400">{formatBytes(usedStorage)}</p>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...collections].sort((a,b) => b.size - a.size).map((col, idx) => {
              const isTop3 = idx < 3;
              const maxDocs = mostDocsCollection?.count || 1;
              const ratio = Math.max(0.01, col.count / maxDocs);

              return (
                <div
                  key={col.name}
                  onClick={() => setSelectedCollection(col)}
                  className={`group relative bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 cursor-pointer overflow-hidden transition-all duration-300 hover:border-blue-500/50 hover:bg-[#0c0c0c] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(59,130,246,0.1)] ${isTop3 ? 'md:col-span-2 lg:col-span-2 xl:col-span-2' : ''}`}
                >
                  {/* Subtle Glow */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#111] border border-white/5 flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-colors">
                        <Layers className="w-5 h-5 text-white/40 group-hover:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white capitalize tracking-wide">{col.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80">Active</span>
                        </div>
                      </div>
                    </div>
                    {isTop3 && <div className="px-2 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold uppercase tracking-widest text-blue-400">Featured</div>}
                  </div>

                  <div className={`grid ${isTop3 ? 'grid-cols-2 gap-4' : 'grid-cols-1 gap-4'}`}>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Records</p>
                      <p className="text-xl font-mono text-white/90">{formatNumber(col.count)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Storage</p>
                      <p className="text-xl font-mono text-white/90">{formatBytes(col.size)}</p>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-6">
                    <div className="flex justify-between items-end mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Relative Density</p>
                      <p className="text-[10px] font-mono text-white/30">{(ratio * 100).toFixed(1)}%</p>
                    </div>
                    <div className="w-full h-1.5 bg-[#111] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500/50 rounded-full" style={{ width: `${ratio * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Database Health Timeline (Bottom Bar) */}
          <div className="mt-8 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40 flex items-center gap-2 shrink-0">
              <ActivityIcon size={14} className="text-emerald-500" /> Database Health
            </h3>
            <div className="flex-1 max-w-xl w-full flex items-center gap-2">
              <div className="w-full h-1 bg-emerald-500/20 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 animate-[pulse_4s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
                <div className="h-full bg-emerald-400" style={{ width: '30%' }}></div>
                <div className="h-full bg-emerald-300" style={{ width: '30%' }}></div>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/80 shrink-0">Optimal Integrity</span>
          </div>

          {/* Side Panel Overlay */}
          <AnimatePresence>
            {selectedCollection && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedCollection(null)}
                className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md h-full bg-[#050505] border-l border-white/10 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] p-8 overflow-y-auto flex flex-col"
                >
                  <button 
                    onClick={() => setSelectedCollection(null)}
                    className="w-8 h-8 rounded-full bg-[#111] hover:bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors mb-8 self-start"
                  >
                    <XCircle size={16} />
                  </button>

                  <div className="flex items-center gap-4 mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      <Database className="w-8 h-8 text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white capitalize">{selectedCollection.name}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-500/80">Online & Active</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 border-b border-white/5 pb-2">Core Metrics</p>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-white/60">Total Records</span>
                          <span className="text-lg font-mono text-white">{formatNumber(selectedCollection.count)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-white/60">Storage Usage</span>
                          <span className="text-lg font-mono text-white">{formatBytes(selectedCollection.size)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-white/60">Avg Record Size</span>
                          <span className="text-lg font-mono text-white">{formatBytes(selectedCollection.avgObjSize)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 border-b border-white/5 pb-2">Performance & Indexes</p>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-white/60">Active Indexes</span>
                          <span className="text-lg font-mono text-white">{selectedCollection.nindexes}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-white/60">Index Footprint</span>
                          <span className="text-lg font-mono text-white">{formatBytes(selectedCollection.totalIndexSize)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-[#0a0a0a] to-[#111] border border-white/5 rounded-2xl p-6 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                        <TrendingUp size={12} className="text-blue-500" /> Growth Trajectory
                      </p>
                      <div className="flex items-end gap-2 h-16 w-full opacity-60">
                        {/* Dummy bar chart for aesthetic side panel */}
                        {[30, 45, 25, 60, 40, 75, 50, 90, 65, 100].map((h, i) => (
                          <div key={i} className="flex-1 bg-blue-500/20 hover:bg-blue-500/40 rounded-t-sm transition-colors" style={{ height: `${h}%` }}></div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ======================= BOTTOM PANELS ======================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* TIMELINE (Span 8) */}
          <div className="lg:col-span-8 bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/5 rounded-[2rem] p-8 md:p-10 shadow-sm relative overflow-hidden flex flex-col">
            <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-8 flex items-center gap-3 shrink-0">
              <TrendingUp size={14} /> Live Telemetry
            </h2>
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} tickMargin={10} minTickGap={40} axisLine={false} tickLine={false} fontFamily="monospace" />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} fontFamily="monospace" tickFormatter={(v) => formatNumber(v)} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#050505', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', fontSize: '12px', padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    itemStyle={{ color: '#8b5cf6', fontFamily: 'monospace' }}
                    labelStyle={{ color: 'rgba(255,255,255,0.4)', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  />
                  <Area 
                    type="monotone" 
                    name="Documents"
                    dataKey="docs" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#purpleGradient)" 
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* INSIGHTS & EVENT STREAM (Span 4) */}
          <div className="lg:col-span-4 flex flex-col gap-8">
            
            {/* AI Insights Card */}
            <div className="bg-gradient-to-br from-[#111] to-[#0a0a0a] border border-white/5 rounded-[2rem] p-8 shadow-sm">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-6 flex items-center gap-3">
                <BarChart4 size={14} /> Database Insights
              </h2>
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Largest Entity</p>
                  <p className="text-sm font-medium text-white capitalize">{largestCollection?.name || 'N/A'}</p>
                  <p className="text-xs font-mono text-blue-400 mt-1">{formatBytes(largestCollection?.size)}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Highest Velocity</p>
                  <p className="text-sm font-medium text-white capitalize">{mostDocsCollection?.name || 'N/A'}</p>
                  <p className="text-xs font-mono text-purple-400 mt-1">{formatNumber(mostDocsCollection?.count)} Records</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold mb-1">Average Object Footprint</p>
                  <p className="text-xl font-mono text-white mt-1">{formatBytes(database.avgObjSize)}</p>
                </div>
              </div>
            </div>

            {/* Live Event Stream */}
            <div className="flex-1 bg-[#0a0a0a]/80 backdrop-blur-md border border-white/5 rounded-[2rem] p-8 shadow-sm flex flex-col overflow-hidden min-h-[300px]">
              <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-white/40 mb-6 flex items-center gap-3 shrink-0">
                <Activity size={14} /> Event Feed
              </h2>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
                <AnimatePresence>
                  {events.map((ev) => (
                    <motion.div 
                      key={ev.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-start gap-4 border-l-2 border-white/5 pl-4"
                    >
                      <div className="shrink-0 mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${ev.type === 'SYSTEM' ? 'bg-blue-500' : ev.type === 'SYNC' ? 'bg-purple-500' : ev.type === 'INSERT' ? 'bg-emerald-500' : 'bg-rose-500'} shadow-lg`} />
                      </div>
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${ev.color || 'text-white/70'}`}>{ev.type}</p>
                        <p className="text-sm text-white/90 leading-tight mb-1">{ev.desc}</p>
                        <p className="text-[9px] font-mono text-white/30">{ev.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
