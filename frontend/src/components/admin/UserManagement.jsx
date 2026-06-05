import { useEffect, useState } from 'react';
import { Search, Shield, Ban, CheckCircle, Loader2 } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleBan = async (userId) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${userId}/ban`);
      toast.success(res.data.message);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to toggle status');
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">User Management</h1>
          <p className="text-on-surface-variant text-[15px] mt-1">Manage accounts, roles, and access.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} strokeWidth={2} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full sm:w-64 rounded-xl bg-surface border border-outline-variant/60 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-[14px] shadow-sm transition-all"
            />
          </div>
          <button 
            onClick={fetchUsers}
            className="px-4 py-2 bg-primary text-white rounded-xl text-[14px] font-semibold shadow-sm hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-surface rounded-2xl border border-outline-variant/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant/60">
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-on-surface-variant text-[14px] font-medium">
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-surface-container-low transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase shadow-sm">
                          {(user.displayName || user.username)[0]}
                        </div>
                        <div>
                          <div className="font-bold text-on-surface text-[14px]">{user.displayName || user.username}</div>
                          <div className="text-on-surface-variant text-[13px]">@{user.username} • {user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[14px] text-on-surface font-semibold uppercase tracking-wider text-[11px]">
                        {user.role === 'admin' && <Shield size={14} className="text-primary" />}
                        {user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] font-semibold border ${
                        user.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}>
                        {user.status === 'active' ? <CheckCircle size={12} /> : <Ban size={12} />}
                        {user.status === 'active' ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[14px] text-on-surface-variant">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.role !== 'admin' && (
                        <button 
                          onClick={() => handleToggleBan(user._id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer ${
                            user.status === 'active' 
                              ? 'bg-red-100 hover:bg-red-200 text-red-700' 
                              : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                          }`}
                        >
                          {user.status === 'active' ? 'Ban' : 'Unban'}
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
  );
}
