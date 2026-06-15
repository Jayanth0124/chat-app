import { useState, useEffect } from 'react';
import { axiosInstance } from '../../lib/axios';
import { useAuthStore } from '../../store/useAuthStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  BarChart2, Activity, Zap, Clock, ShieldCheck,
  TrendingUp, Radio, Maximize, MessageSquare, PhoneCall,
  Image as ImageIcon, Loader2
} from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [liveStream, setLiveStream] = useState([]);
  
  const { socket } = useAuthStore();

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
  }, [dateRange]); // Refetch if we had an endpoint supporting range

  // Live Socket Stream
  useEffect(() => {
    if (!socket) return;

    const addStreamItem = (type, text) => {
      setLiveStream(prev => {
        const newItem = { id: Date.now() + Math.random(), time: new Date(), type, text };
        return [newItem, ...prev].slice(0, 50); // Keep last 50 events
      });
    };

    const handleNewMessage = () => addStreamItem('message', 'Message routed successfully');
    const handleUserOnline = () => addStreamItem('user', 'User connection established');
    const handleCall = () => addStreamItem('call', 'Call session initiated');

    socket.on('newMessage', handleNewMessage);
    socket.on('userOnline', handleUserOnline);
    socket.on('incomingCall', handleCall);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userOnline', handleUserOnline);
      socket.off('incomingCall', handleCall);
    };
  }, [socket]);

  if (isLoading || !stats) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#050505] min-h-[calc(100vh-4rem)]">
        <div className="relative">
          <div className="w-16 h-16 border-[1px] border-white/10 border-t-emerald-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Data Preparations
  const platformActivityData = [
    { name: 'Messages', value: stats.messagesSent || 0 },
    { name: 'Calls', value: (stats.totalVoiceCalls || 0) + (stats.totalVideoCalls || 0) },
    { name: 'Stories', value: stats.totalStoryViews || 0 },
    { name: 'Users', value: stats.totalUsers || 0 },
  ];

  const commBreakdownData = [
    { name: 'Messages', value: stats.messagesSent || 0 },
    { name: 'Voice Calls', value: stats.totalVoiceCalls || 0 },
    { name: 'Video Calls', value: stats.totalVideoCalls || 0 },
    { name: 'Story Views', value: stats.totalStoryViews || 0 },
  ].filter(d => d.value > 0);

  // Intelligence panel calculations
  const totalCommEvents = platformActivityData.slice(0, 3).reduce((acc, curr) => acc + curr.value, 0);
  const mostUsedFeature = platformActivityData.slice(0, 3).sort((a, b) => b.value - a.value)[0]?.name || 'Messages';
  const growthTrend = (stats.messagesToday || 0) > 0 ? 'Positive Trajectory' : 'Stable';

  return (
    <div className="p-4 sm:p-6 lg:p-8 pb-24 w-full min-h-full bg-[#050505] text-white font-sans selection:bg-white/20 block">
      
      {/* 1. Analytics Command Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <BarChart2 className="text-emerald-500" size={28} />
            Orbit Analytics Workspace
          </h1>
          <p className="text-[12px] text-white/40 uppercase tracking-widest mt-2">Deep telemetry & performance metrics</p>
        </div>
        
        <div className="flex bg-[#0A0A0A] border border-white/10 rounded-lg p-1">
          {['24h', '7d', '30d'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                dateRange === range 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'text-white/40 hover:text-white/80 border border-transparent'
              }`}
            >
              Last {range}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8/12) */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          
          {/* 2. Platform Activity Graph (Full width of col) */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 h-[380px] flex flex-col">
            <h2 className="text-[11px] uppercase tracking-widest text-white/40 font-bold mb-6 flex items-center gap-2">
              <Activity size={14} className="text-blue-500" /> Platform Activity Volumes
            </h2>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={platformActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {platformActivityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.8} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 6. Growth Analytics (Area Chart) */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 h-[380px] flex flex-col">
            <h2 className="text-[11px] uppercase tracking-widest text-white/40 font-bold mb-6 flex items-center gap-2">
              <TrendingUp size={14} className="text-emerald-500" /> User Growth Trajectory
            </h2>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.userGrowth || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.4)' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#10b981' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#growthColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 3. Orbit Activity Visualization */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 h-[340px] flex flex-col items-center justify-center relative overflow-hidden">
              <h2 className="text-[11px] uppercase tracking-widest text-white/40 font-bold absolute top-6 left-6 z-10 flex items-center gap-2">
                <Radio size={14} className="text-violet-500" /> Engagement Radar
              </h2>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.05)_0%,transparent_70%)]" />
              
              <div className="relative w-48 h-48 flex items-center justify-center mt-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-0 border-[2px] border-violet-500/20 rounded-full border-dashed" />
                <motion.div animate={{ rotate: -360 }} transition={{ duration: 15, repeat: Infinity, ease: "linear" }} className="absolute inset-4 border-[1px] border-white/10 rounded-full">
                  <div className="absolute top-0 left-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-[0_0_15px_rgba(96,165,250,1)] -translate-x-1/2 -translate-y-1/2" />
                </motion.div>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }} className="absolute inset-10 border-[1px] border-white/5 rounded-full">
                  <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(52,211,153,1)] -translate-x-1/2 translate-y-1/2" />
                </motion.div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/80 backdrop-blur-sm rounded-full m-12 border border-white/10 z-10">
                  <span className="text-3xl font-light text-white">{stats.activeUsers}</span>
                  <span className="text-[9px] text-white/40 uppercase tracking-widest mt-1">Active</span>
                </div>
              </div>
            </div>

            {/* 5. Communication Breakdown (Donut) */}
            <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 h-[340px] flex flex-col">
              <h2 className="text-[11px] uppercase tracking-widest text-white/40 font-bold mb-2 flex items-center gap-2">
                <PieChart size={14} className="text-amber-500" /> Comm Breakdown
              </h2>
              <div className="flex-1 w-full min-h-0 relative">
                {commBreakdownData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={commBreakdownData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {commBreakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/30 text-xs">No data available</div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (4/12) */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          
          {/* 8. Orbit Intelligence Panel */}
          <div className="bg-gradient-to-b from-[#0A0A0A] to-[#0A0A0A]/50 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
            <h2 className="text-[11px] uppercase tracking-widest text-emerald-400 font-bold mb-6 flex items-center gap-2">
              <Zap size={14} /> Orbit Intelligence
            </h2>
            
            <div className="space-y-5">
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">System Status</p>
                <p className="text-sm font-medium text-white flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Optimal Performance
                </p>
              </div>
              
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Most Used Feature</p>
                <p className="text-sm font-medium text-white">{mostUsedFeature}</p>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Growth Trajectory</p>
                <p className="text-sm font-medium text-emerald-400">{growthTrend}</p>
              </div>
              
              <div className="bg-white/[0.02] border border-white/5 rounded-lg p-4">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">Total Interactions</p>
                <p className="text-xl font-light text-white">{totalCommEvents.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* 4. Story Performance Analytics */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6">
            <h2 className="text-[11px] uppercase tracking-widest text-white/40 font-bold mb-6 flex items-center gap-2">
              <ImageIcon size={14} className="text-pink-500" /> Story Performance
            </h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-xs text-white/60">Stories Today</span>
                <span className="text-lg font-light">{stats.storiesToday}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <span className="text-xs text-white/60">Stories This Week</span>
                <span className="text-lg font-light">{stats.storiesThisWeek}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60">Total Views</span>
                <span className="text-lg font-light text-pink-400">{stats.totalStoryViews?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* 7. Live Activity Stream */}
          <div className="bg-[#0A0A0A] border border-white/5 rounded-2xl p-6 flex-1 min-h-[300px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[11px] uppercase tracking-widest text-white/40 font-bold flex items-center gap-2">
                <Clock size={14} className="text-blue-500" /> Live Stream
              </h2>
              <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded border border-emerald-500/20 text-[9px] uppercase tracking-wider font-bold">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                Live
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              <AnimatePresence>
                {liveStream.length === 0 ? (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-white/30 text-center mt-10">
                    Awaiting telemetry events...
                  </motion.p>
                ) : (
                  liveStream.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3 items-start border-l-2 border-white/10 pl-3 py-1"
                    >
                      <div className="mt-0.5">
                        {item.type === 'message' && <MessageSquare size={12} className="text-violet-400" />}
                        {item.type === 'user' && <Users size={12} className="text-emerald-400" />}
                        {item.type === 'call' && <PhoneCall size={12} className="text-blue-400" />}
                      </div>
                      <div>
                        <p className="text-xs text-white/80">{item.text}</p>
                        <p className="text-[9px] text-white/40 font-mono mt-0.5">{item.time.toLocaleTimeString()}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}
