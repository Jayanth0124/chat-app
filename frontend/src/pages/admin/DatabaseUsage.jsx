import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useChatStore } from '../../store/useChatStore';
import { Activity, Database, HardDrive, Server, Zap, RefreshCw, LayoutList, CheckCircle, AlertTriangle, XCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';

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
  const [activeTab, setActiveTab] = useState('storage');

  useEffect(() => {
    // Initial fetch via REST to guarantee immediate load
    const fetchInitialData = async () => {
      try {
        const res = await axiosInstance.get('/admin/database-stats');
        setStats(res.data);
        setLoading(false);
        setHistory(prev => {
          const newPoint = { time: new Date().toLocaleTimeString(), docs: res.data.database.objects, storage: res.data.database.dataSize / (1024*1024) };
          return [...prev, newPoint].slice(-20);
        });
      } catch (err) {
        console.error("Failed to fetch database stats", err);
        toast.error("Failed to fetch database usage");
        setLoading(false);
      }
    };
    fetchInitialData();

    // Subscribe to WebSocket updates
    if (socket) {
      socket.emit('admin:monitor:join');
      
      const handleStatsUpdate = (data) => {
        setStats(data);
        setHistory(prev => {
          const newPoint = { 
            time: new Date().toLocaleTimeString(), 
            docs: data.database.objects,
            storage: data.database.dataSize / (1024*1024)
          };
          return [...prev, newPoint].slice(-20); // Keep last 20 points for live chart
        });
      };

      socket.on('admin:db_stats_update', handleStatsUpdate);

      return () => {
        socket.emit('admin:monitor:leave');
        socket.off('admin:db_stats_update', handleStatsUpdate);
      };
    }
  }, [socket]);

  if (loading || !stats) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-on-surface-variant">
          <RefreshCw className="animate-spin w-8 h-8" />
          <p>Connecting to Telemetry...</p>
        </div>
      </div>
    );
  }

  const { database, collections, systemHealth, uptime } = stats;

  const getStatusIcon = (status) => {
    switch(status) {
      case 'healthy': return <CheckCircle className="text-green-500 w-5 h-5" />;
      case 'warning': return <AlertTriangle className="text-yellow-500 w-5 h-5" />;
      case 'error': return <XCircle className="text-red-500 w-5 h-5" />;
      default: return <AlertTriangle className="text-neutral-500 w-5 h-5" />;
    }
  };

  const largestCollection = [...collections].sort((a,b) => b.size - a.size)[0] || null;
  const mostDocsCollection = [...collections].sort((a,b) => b.count - a.count)[0] || null;

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary" />
            System Telemetry
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">Real-time database and service health monitoring.</p>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/50 text-sm font-medium text-on-surface">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
          Live Connected
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <HealthCard title="MongoDB" status={systemHealth.mongodb} />
        <HealthCard title="Socket.IO" status={systemHealth.socketio} />
        <HealthCard title="Cloudinary" status={systemHealth.cloudinary} />
        <HealthCard title="Core API" status={systemHealth.api} />
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-4 flex flex-col justify-center shadow-sm col-span-2 md:col-span-1 text-center md:text-left items-center md:items-start">
          <span className="text-on-surface-variant text-xs uppercase tracking-wider font-bold mb-1">Active Sockets</span>
          <span className="text-xl font-bold text-on-surface">{formatNumber(systemHealth.activeConnections)}</span>
        </div>
      </div>

      {/* Database Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard 
          icon={<HardDrive className="text-blue-500 w-5 h-5" />} 
          label="Total Data Size" 
          value={formatBytes(database.dataSize)} 
          subtext={`Storage Used: ${formatBytes(database.storageSize)}`} 
        />
        <MetricCard 
          icon={<Server className="text-emerald-500 w-5 h-5" />} 
          label="Storage Left" 
          value={formatBytes((database.fsTotalSize || 512 * 1024 * 1024) - (database.fsUsedSize || database.storageSize))} 
          subtext={`Used: ${(((database.fsUsedSize || database.storageSize) / (database.fsTotalSize || 512 * 1024 * 1024)) * 100).toFixed(1)}%`} 
        />
        <MetricCard 
          icon={<Database className="text-purple-500 w-5 h-5" />} 
          label="Total Documents" 
          value={formatNumber(database.objects)} 
          subtext={`Across ${database.collections} collections`} 
        />
        <MetricCard 
          icon={<LayoutList className="text-orange-500 w-5 h-5" />} 
          label="Total Indexes" 
          value={formatNumber(database.indexes)} 
          subtext={`${formatBytes(database.indexSize)} on disk`} 
        />
        <MetricCard 
          icon={<Zap className="text-yellow-500 w-5 h-5" />} 
          label="Avg Document Size" 
          value={formatBytes(database.avgObjSize)} 
          subtext={`Uptime: ${(uptime / 3600).toFixed(1)} hrs`} 
        />
      </div>

      {/* Live Analytics Chart */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-lg font-bold text-on-surface">Live Database Growth</h2>
          <div className="flex bg-surface-container-low rounded-lg p-1 border border-outline-variant/50 self-start sm:self-auto">
            <button 
              onClick={() => setActiveTab('storage')} 
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeTab === 'storage' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}
            >
              Storage (MB)
            </button>
            <button 
              onClick={() => setActiveTab('docs')} 
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${activeTab === 'docs' ? 'bg-primary text-white' : 'text-on-surface-variant'}`}
            >
              Documents
            </button>
          </div>
        </div>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={activeTab === 'storage' ? '#3b82f6' : '#8b5cf6'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={activeTab === 'storage' ? '#3b82f6' : '#8b5cf6'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--outline-variant)" />
              <XAxis dataKey="time" stroke="var(--on-surface-variant)" fontSize={11} tickMargin={10} minTickGap={30} />
              <YAxis stroke="var(--on-surface-variant)" fontSize={11} tickFormatter={(v) => activeTab === 'storage' ? v.toFixed(2) : v} width={50} />
              <RechartsTooltip 
                contentStyle={{ backgroundColor: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)', borderRadius: '12px', color: 'var(--on-surface)' }}
                itemStyle={{ color: 'var(--primary)' }}
              />
              <Area 
                type="monotone" 
                dataKey={activeTab} 
                stroke={activeTab === 'storage' ? '#3b82f6' : '#8b5cf6'} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Collection Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {largestCollection && (
          <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Largest by Storage</p>
              <h3 className="text-lg font-bold text-on-surface capitalize">{largestCollection.name}</h3>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-blue-500">{formatBytes(largestCollection.size)}</span>
            </div>
          </div>
        )}
        {mostDocsCollection && (
          <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Most Documents</p>
              <h3 className="text-lg font-bold text-on-surface capitalize">{mostDocsCollection.name}</h3>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-purple-500">{formatNumber(mostDocsCollection.count)} Docs</span>
            </div>
          </div>
        )}
      </div>

      {/* Collections Table */}
      <div className="bg-surface border border-outline-variant/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-outline-variant/60">
          <h2 className="text-lg font-bold text-on-surface">Collection Statistics</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest/50 text-on-surface-variant text-xs uppercase tracking-wider font-bold">
                <th className="p-4 border-b border-outline-variant/40">Collection</th>
                <th className="p-4 border-b border-outline-variant/40 text-right">Documents</th>
                <th className="p-4 border-b border-outline-variant/40 text-right">Size</th>
                <th className="p-4 border-b border-outline-variant/40 text-right">Avg Doc Size</th>
                <th className="p-4 border-b border-outline-variant/40 text-right">Indexes</th>
                <th className="p-4 border-b border-outline-variant/40 text-right">Index Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 text-sm">
              {collections.map((c) => (
                <tr key={c.name} className="hover:bg-surface-container-low/30 transition-colors">
                  <td className="p-4 font-medium text-on-surface capitalize flex items-center gap-2">
                    <Database className="w-4 h-4 text-on-surface-variant" />
                    {c.name}
                  </td>
                  <td className="p-4 text-right font-medium text-on-surface">{formatNumber(c.count)}</td>
                  <td className="p-4 text-right text-on-surface-variant">{formatBytes(c.size)}</td>
                  <td className="p-4 text-right text-on-surface-variant">{formatBytes(c.avgObjSize)}</td>
                  <td className="p-4 text-right text-on-surface-variant">{c.nindexes}</td>
                  <td className="p-4 text-right text-on-surface-variant">{formatBytes(c.totalIndexSize)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

function HealthCard({ title, status }) {
  const getStatusIcon = (s) => {
    switch(s) {
      case 'healthy': return <CheckCircle className="text-green-500 w-5 h-5" />;
      case 'warning': return <AlertTriangle className="text-yellow-500 w-5 h-5" />;
      case 'error': return <XCircle className="text-red-500 w-5 h-5" />;
      default: return <AlertTriangle className="text-neutral-500 w-5 h-5" />;
    }
  };

  return (
    <div className="bg-surface border border-outline-variant/60 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 shadow-sm text-center">
      {getStatusIcon(status)}
      <span className="text-on-surface-variant text-[10px] sm:text-xs uppercase tracking-wider font-bold truncate w-full text-center">{title}</span>
    </div>
  );
}

function MetricCard({ icon, label, value, subtext }) {
  return (
    <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 bg-surface-container-low rounded-xl border border-outline-variant/50">
          {icon}
        </div>
        <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-black text-on-surface mb-1">{value}</div>
      <div className="text-xs font-medium text-on-surface-variant">{subtext}</div>
    </div>
  );
}
