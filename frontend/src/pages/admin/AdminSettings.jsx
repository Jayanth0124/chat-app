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
    <div className="p-4 sm:p-8 max-w-4xl mx-auto w-full font-sans text-on-surface">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
          <Shield className="text-primary" /> Security & Credentials
        </h1>
        <p className="text-on-surface-variant text-[13px] sm:text-[15px] mt-1">
          Manage your administrator account credentials securely.
        </p>
      </div>

      <div className="space-y-6">
        {/* Username Card */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/60">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserIcon size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Change Username</h2>
              <p className="text-xs text-on-surface-variant">Update your administrator handle</p>
            </div>
          </div>

          <form onSubmit={submitUsernameChange} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                New Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  className="w-full bg-surface-container border border-outline-variant/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="Enter new username"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingUsername && <Loader2 size={16} className="animate-spin text-on-surface-variant" />}
                  {!isCheckingUsername && usernameStatus === 'available' && <Check size={16} className="text-emerald-500" />}
                  {!isCheckingUsername && usernameStatus === 'taken' && <AlertCircle size={16} className="text-red-500" />}
                </div>
              </div>
              <div className="mt-2 text-[11px] font-medium min-h-[16px]">
                {usernameStatus === 'invalid' && <span className="text-red-500">Must be at least 8 characters long</span>}
                {usernameStatus === 'taken' && <span className="text-red-500">This username is already taken</span>}
                {usernameStatus === 'available' && <span className="text-emerald-500">Username is available!</span>}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isUsernameUpdating || usernameStatus !== 'available' || username === user?.username}
                className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
              >
                {isUsernameUpdating ? <Loader2 size={16} className="animate-spin" /> : null}
                Update Username
              </button>
            </div>
          </form>
        </div>

        {/* Password Card */}
        <div className="bg-surface border border-outline-variant/60 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-outline-variant/60">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
              <Key size={20} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface">Change Password</h2>
              <p className="text-xs text-on-surface-variant">Ensure your account is using a strong password</p>
            </div>
          </div>

          <form onSubmit={submitPasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                className="w-full bg-surface-container border border-outline-variant/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter current password"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                className="w-full bg-surface-container border border-outline-variant/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Enter new password"
                required
              />
              {passwords.newPassword && (
                <div className="mt-3 flex gap-1 h-1.5 w-full">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-full ${
                        i < passwordStrength 
                          ? (passwordStrength < 2 ? 'bg-red-500' : passwordStrength < 4 ? 'bg-amber-500' : 'bg-emerald-500')
                          : 'bg-outline-variant/30'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                className="w-full bg-surface-container border border-outline-variant/60 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="Confirm new password"
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isPasswordUpdating || !passwords.currentPassword || !passwords.newPassword || passwords.newPassword !== passwords.confirmPassword}
                className="px-6 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {isPasswordUpdating ? <Loader2 size={16} className="animate-spin" /> : null}
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
