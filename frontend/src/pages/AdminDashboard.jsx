import { useState, useEffect } from 'react';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { Loader2, ShieldBan, Trash2, FileText } from 'lucide-react';

export default function AdminDashboard() {
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalChats: 0,
    totalMessages: 0
  });
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        axiosInstance.get('/admin/stats'),
        axiosInstance.get('/admin/users'),
        axiosInstance.get('/admin/audit-logs')
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setAuditLogs(logsRes.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch admin dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleBan = async (userId) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${userId}/ban`);
      toast.success(res.data.message);
      fetchDashboardData(); // Refresh page metrics and list
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle user status');
    }
  };

  const filteredUsers = statusFilter === 'All Status' 
    ? users 
    : users.filter(u => {
        if (statusFilter === 'Active') return u.status === 'active';
        if (statusFilter === 'Suspended') return u.status === 'banned';
        return true;
      });

  const getLogIcon = (action) => {
    switch (action) {
      case 'BAN_USER': return <ShieldBan size={16} className="text-red-500" />;
      case 'UNBAN_USER': return <ShieldBan size={16} className="text-emerald-500" />;
      default: return <FileText size={16} className="text-primary" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background h-full">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto w-full text-on-surface font-sans border-l border-outline-variant/60">
      
      {/* Top Header */}
      <div className="h-[60px] bg-surface flex items-center justify-between px-6 shrink-0 border-b border-outline-variant/60 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold tracking-tight">Admin Portal</h2>
        </div>
        
        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-xs mx-4">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input 
              className="w-full pl-9 pr-4 py-1.5 bg-surface-container border border-outline-variant rounded-lg text-xs focus:outline-none focus:border-primary transition-all" 
              placeholder="Search users..." 
              type="text"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={fetchDashboardData}
            className="text-on-surface-variant hover:text-on-surface transition-colors p-1.5 rounded-full hover:bg-surface-container"
          >
            <span className="material-symbols-outlined !text-[20px]">refresh</span>
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Row 1: Greeting & Action */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">System Overview</h2>
            <p className="text-sm text-on-surface-variant mt-1">System health, auditing and key platform metrics.</p>
          </div>
          <div>
            <button 
              onClick={fetchDashboardData}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer"
            >
              Refresh Dashboard
            </button>
          </div>
        </div>

        {/* Stats Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Users</h3>
              <span className="material-symbols-outlined text-outline">group</span>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-2xl font-black">{stats.totalUsers}</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Messages Sent</h3>
              <span className="material-symbols-outlined text-outline">chat</span>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-2xl font-black">{stats.totalMessages}</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-tertiary"></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Chats/Channels</h3>
              <span className="material-symbols-outlined text-outline">forum</span>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-2xl font-black">{stats.totalChats}</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-error"></div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Banned Users</h3>
              <span className="material-symbols-outlined text-outline">warning</span>
            </div>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-2xl font-black text-red-500">{stats.bannedUsers}</span>
            </div>
          </div>
        </div>

        {/* Mid Row: Charts and Audit Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Growth Chart Panel */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-outline-variant/60 flex justify-between items-center bg-surface">
              <h3 className="text-sm font-bold">Growth &amp; Activity</h3>
            </div>
            <div className="p-6 flex-grow min-h-[260px] flex flex-col justify-center items-center relative bg-surface-container-lowest">
              <p className="text-on-surface-variant/80 font-bold text-sm mb-4">Total Platform Registrations: {stats.totalUsers}</p>
              <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${stats.totalUsers > 0 ? ((stats.totalUsers - stats.bannedUsers) / stats.totalUsers) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between w-full mt-2 text-xs text-on-surface-variant/70 font-semibold">
                <span>Active Users ({stats.totalUsers - stats.bannedUsers})</span>
                <span>Banned Users ({stats.bannedUsers})</span>
              </div>
            </div>
          </div>

          {/* Audit Logs */}
          <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-outline-variant/60 flex justify-between items-center bg-surface">
              <h3 className="text-sm font-bold">System Audit Log</h3>
            </div>
            <div className="p-0 overflow-y-auto max-h-[300px] flex-grow">
              <ul className="divide-y divide-outline-variant/60">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-12 text-xs text-on-surface-variant">No actions logged yet.</div>
                ) : (
                  auditLogs.slice(0, 5).map((log) => (
                    <li key={log._id} className="p-4 hover:bg-surface-container transition-colors flex gap-3 items-start">
                      <div className="p-1.5 rounded-full mt-0.5 flex items-center justify-center bg-primary/10 text-primary">
                        {getLogIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-on-surface truncate">@{log.adminId?.username || 'admin'}</p>
                        <p className="text-[10px] text-on-surface-variant mt-0.5 break-all">{log.details}</p>
                        <p className="text-[9px] text-outline mt-1 font-semibold">
                          {new Date(log.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* User Management Section */}
        <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-outline-variant/60 flex justify-between items-center bg-surface">
            <h3 className="text-sm font-bold">Recent Users</h3>
            <div>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 bg-surface border border-outline-variant rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Suspended</option>
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant/60 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                  <th className="p-4">User</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Last Active</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-on-surface-variant font-medium">No users found</td>
                  </tr>
                ) : (
                  filteredUsers.map((item) => (
                    <tr key={item._id} className="hover:bg-surface-container/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {(item.displayName || item.username)[0]}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface">{item.displayName || item.username}</p>
                            <p className="text-[10px] text-on-surface-variant">@{item.username} - {item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle font-semibold text-on-surface-variant uppercase tracking-wider text-[10px]">{item.role}</td>
                      <td className="p-4 align-middle">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 align-middle text-on-surface-variant font-medium">
                        {item.isOnline ? (
                          <span className="text-green-500 font-semibold">Online</span>
                        ) : item.lastSeen ? (
                          `Last seen ${new Date(item.lastSeen).toLocaleDateString()}`
                        ) : (
                          'Offline'
                        )}
                      </td>
                      <td className="p-4 align-middle text-right">
                        {item.role !== 'admin' && (
                          <button 
                            onClick={() => handleToggleBan(item._id)}
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors ${
                              item.status === 'active' 
                                ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                            }`}
                          >
                            {item.status === 'active' ? 'Ban User' : 'Unban User'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
