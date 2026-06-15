import { useState } from 'react';
import { Shield, Key, User as UserIcon, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { axiosInstance } from '../../lib/axios';
import { useConfirmStore } from '../../store/useConfirmStore';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { user, checkAuth } = useAuthStore();
  const { confirm } = useConfirmStore();
  
  // Username Form State
  const [username, setUsername] = useState(user?.username || '');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameUpdating, setIsUsernameUpdating] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // 'available', 'taken', 'invalid'

  // Password Form State
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

  const calculateStrength = (pass) => {
    let score = 0;
    if (pass.length > 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score; // 0-4
  };
  
  const passwordStrength = calculateStrength(passwords.newPassword);
  
  const handleUsernameChange = async (e) => {
    const val = e.target.value;
    setUsername(val);
    
    if (val === user?.username) {
      setUsernameStatus(null);
      return;
    }
    
    if (val.length < 8) {
      setUsernameStatus('invalid');
      return;
    }

    setIsCheckingUsername(true);
    try {
      const res = await axiosInstance.post(`/auth/check-username`, { username: val });
      setUsernameStatus(res.data.available ? 'available' : 'taken');
    } catch (error) {
      setUsernameStatus('taken');
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const submitUsernameChange = async (e) => {
    e.preventDefault();
    if (usernameStatus !== 'available') return;
    
    const isConfirmed = await confirm({
      title: "Update Username",
      message: `Are you sure you want to change your admin username to @${username}? This action will be logged.`,
      confirmText: "Update",
    });
    
    if (!isConfirmed) return;
    
    setIsUsernameUpdating(true);
    try {
      await axiosInstance.put('/admin/credentials/username', { username });
      toast.success('Admin username updated successfully');
      checkAuth(); // Refresh user data
      setUsernameStatus(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update username');
    } finally {
      setIsUsernameUpdating(false);
    }
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    
    const isConfirmed = await confirm({
      title: "Update Password",
      message: "Are you sure you want to change your password? This will log you out of all active sessions immediately.",
      confirmText: "Update Password",
      danger: true
    });
    
    if (!isConfirmed) return;
    
    setIsPasswordUpdating(true);
    try {
      await axiosInstance.put('/admin/credentials/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      toast.success('Admin password updated successfully.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      // The backend will emit forceLogout which will log the user out
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  return (
    <div className="min-h-full bg-background font-sans text-on-surface">
      {/* Top Header Section */}
      <div className="bg-surface border-b border-outline-variant/30 sticky top-0 z-20 shadow-sm backdrop-blur-xl bg-surface/90">
        <div className="max-w-[1600px] xl:max-w-7xl mx-auto px-6 py-6 lg:py-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8C6DF0]/10 border border-[#8C6DF0]/20 flex items-center justify-center">
                <Shield className="text-[#8C6DF0]" size={22} />
              </div>
              Executive Security Console
            </h1>
            <p className="text-sm font-medium text-on-surface-variant/70">
              Manage core administrative credentials and platform security access parameters.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] xl:max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Username Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[2rem] p-6 lg:p-8 shadow-xl relative overflow-hidden group hover:border-[#8C6DF0]/30 transition-colors duration-500 h-full flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#8C6DF0]/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50" />
            
            <div className="flex items-center gap-4 mb-8 pb-5 border-b border-outline-variant/30 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#8C6DF0]/10 flex items-center justify-center shrink-0 border border-[#8C6DF0]/20 shadow-inner">
                <UserIcon size={22} className="text-[#8C6DF0]" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">System Identifier</h2>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">Modify primary administrator handle</p>
              </div>
            </div>

            <form onSubmit={submitUsernameChange} className="space-y-6 relative z-10 flex-1 flex flex-col">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">
                  New Handle
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#8C6DF0]/30 focus:border-[#8C6DF0] transition-all shadow-inner placeholder:text-on-surface-variant/50"
                    placeholder="Enter new username"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {isCheckingUsername && <Loader2 size={18} className="animate-spin text-[#8C6DF0]" />}
                    {!isCheckingUsername && usernameStatus === 'available' && <Check size={18} className="text-emerald-500 drop-shadow-md" />}
                    {!isCheckingUsername && usernameStatus === 'taken' && <AlertCircle size={18} className="text-red-500 drop-shadow-md" />}
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-bold min-h-[16px] px-1">
                  {usernameStatus === 'invalid' && <span className="text-red-500">Requires minimum 8 secure characters</span>}
                  {usernameStatus === 'taken' && <span className="text-red-500">Identifier already registered in system</span>}
                  {usernameStatus === 'available' && <span className="text-emerald-500">Identifier cleared for assignment</span>}
                </div>
              </div>

              <div className="pt-6 mt-auto">
                <button
                  type="submit"
                  disabled={isUsernameUpdating || usernameStatus !== 'available' || username === user?.username}
                  className="w-full py-4 bg-[#8C6DF0] text-white text-sm font-black rounded-xl hover:bg-[#7b5ce0] disabled:opacity-50 disabled:hover:bg-[#8C6DF0] transition-all shadow-lg hover:shadow-[#8C6DF0]/25 flex items-center justify-center gap-2"
                >
                  {isUsernameUpdating ? <Loader2 size={18} className="animate-spin" /> : null}
                  Authorize Identifier Update
                </button>
              </div>
            </form>
          </div>

          {/* Password Card */}
          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-[2rem] p-6 lg:p-8 shadow-xl relative overflow-hidden group hover:border-red-500/30 transition-colors duration-500 h-full flex flex-col">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50" />
            
            <div className="flex items-center gap-4 mb-8 pb-5 border-b border-outline-variant/30 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0 border border-red-500/20 shadow-inner">
                <Key size={22} className="text-red-500" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white tracking-tight">Security Token</h2>
                <p className="text-xs text-on-surface-variant font-medium mt-0.5">Rotate administrator access key</p>
              </div>
            </div>

            <form onSubmit={submitPasswordChange} className="space-y-5 relative z-10 flex-1 flex flex-col">
              <div className="flex-1 space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">
                    Active Security Key
                  </label>
                  <input
                    type="password"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all shadow-inner placeholder:text-on-surface-variant/50"
                    placeholder="Provide current clearance key"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">
                    New Security Key
                  </label>
                  <input
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all shadow-inner placeholder:text-on-surface-variant/50"
                    placeholder="Generate new clearance key"
                    required
                  />
                  {passwords.newPassword && (
                    <div className="mt-3.5 flex gap-1.5 h-1.5 w-full">
                      {[...Array(4)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`flex-1 rounded-full shadow-inner ${
                            i < passwordStrength 
                              ? (passwordStrength < 2 ? 'bg-red-500 shadow-red-500/50' : passwordStrength < 4 ? 'bg-amber-500 shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50')
                              : 'bg-surface border border-outline-variant/20'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">
                    Verify Security Key
                  </label>
                  <input
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                    className="w-full bg-surface border border-outline-variant/40 rounded-xl px-5 py-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-all shadow-inner placeholder:text-on-surface-variant/50"
                    placeholder="Re-enter new clearance key"
                    required
                  />
                </div>
              </div>

              <div className="pt-6 mt-auto">
                <button
                  type="submit"
                  disabled={isPasswordUpdating || !passwords.currentPassword || !passwords.newPassword || passwords.newPassword !== passwords.confirmPassword}
                  className="w-full py-4 bg-red-600/10 text-red-500 border border-red-500/30 hover:bg-red-600 hover:text-white hover:border-red-600 text-sm font-black rounded-xl disabled:opacity-40 disabled:hover:bg-red-600/10 disabled:hover:text-red-500 disabled:hover:border-red-500/30 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isPasswordUpdating ? <Loader2 size={18} className="animate-spin" /> : null}
                  Force Security Token Rotation
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
