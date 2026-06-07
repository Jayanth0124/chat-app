import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2 } from 'lucide-react';
import ThemeSwitcher from '../components/shared/ThemeSwitcher';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile, changeUsername, updatePrivacySettings, isUpdatingProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [username, setUsername] = useState(user?.username || '');

  const [readReceipts, setReadReceipts] = useState(user?.privacySettings?.readReceipts ?? true);
  const [onlineStatus, setOnlineStatus] = useState(user?.privacySettings?.onlineStatus ?? true);

  const handlePrivacyChange = async (type, value) => {
    if (type === 'readReceipts') setReadReceipts(value);
    if (type === 'onlineStatus') setOnlineStatus(value);
    try {
      await updatePrivacySettings({ [type]: value });
    } catch (err) {
      // Revert on error
      if (type === 'readReceipts') setReadReceipts(!value);
      if (type === 'onlineStatus') setOnlineStatus(!value);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();
    const payload = { displayName, bio };
    if (profilePic && profilePic !== user?.profilePic) {
      payload.profilePic = profilePic;
    }
    await updateProfile(payload);
  };

  const handleChangeUsername = async (e) => {
    e.preventDefault();
    if (username.trim() === user?.username) return;
    try {
      await changeUsername(username);
    } catch (err) {
      // Error handled by store toast
    }
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto w-full text-on-surface font-sans border-l border-outline-variant/60">
      {/* Header matching Orbit style */}
      <div className="h-[60px] bg-background flex items-center justify-between px-6 shrink-0 border-b border-outline-variant/60 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors md:hidden flex items-center"
          >
            <span className="material-symbols-outlined !text-[24px]">arrow_back</span>
          </button>
          <h2 className="text-xl font-bold tracking-tight">Settings</h2>
        </div>
      </div>

      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Profile Section */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
          <h2 className="text-lg font-bold mb-6">Profile Settings</h2>
          
          <form onSubmit={handleSaveChanges} className="space-y-6">
            {/* Avatar Row */}
            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 rounded-full bg-surface-container border border-outline-variant/60 overflow-hidden flex items-center justify-center">
                {profilePic ? (
                  <img src={profilePic} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-outline uppercase">{user?.username?.[0] || 'U'}</span>
                )}
              </div>
              <div>
                <label className="px-4 py-2 bg-surface hover:bg-surface-container-low border border-outline-variant text-on-surface text-xs font-semibold rounded-lg cursor-pointer transition-colors shadow-sm inline-block">
                  Change photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1.5 tracking-wider">Display Name</label>
                <input 
                  type="text" 
                  required
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm text-on-surface" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1.5 tracking-wider">Bio</label>
                <input 
                  type="text"
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write something about yourself..."
                  className="w-full px-4 py-2.5 rounded-lg bg-surface border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-sm text-on-surface" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isUpdatingProfile}
              className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Username Section */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
          <h2 className="text-lg font-bold mb-3">Account Username</h2>
          <p className="text-xs text-on-surface-variant mb-6">
            You can change your username a maximum of 3 times. (Used: {user?.usernameChanges || 0}/3)
          </p>

          <form onSubmit={handleChangeUsername} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1.5 tracking-wider">Username</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">@</span>
                <input 
                  type="text" 
                  disabled={(user?.usernameChanges || 0) >= 3} 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="new_username"
                  className={`w-full pl-7 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none transition-all ${
                    (user?.usernameChanges || 0) >= 3 
                      ? 'bg-surface-container-low border-outline-variant text-on-surface-variant/80 cursor-not-allowed' 
                      : 'bg-surface border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/10 text-on-surface'
                  }`} 
                />
              </div>
              {(user?.usernameChanges || 0) >= 3 ? (
                <p className="text-xs text-red-500 mt-1.5 font-medium">
                  You have reached the maximum of 3 username changes. Editing is disabled.
                </p>
              ) : (
                <p className="text-xs text-on-surface-variant/80 mt-1.5">
                  You have {3 - (user?.usernameChanges || 0)} username change{(3 - (user?.usernameChanges || 0)) !== 1 ? 's' : ''} remaining.
                </p>
              )}
            </div>

            {user?.previousUsernames && user.previousUsernames.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-semibold text-on-surface-variant uppercase mb-1">Username History</p>
                <div className="flex flex-wrap gap-2">
                  {user.previousUsernames.map((prev, index) => (
                    <span key={index} className="px-2 py-1 bg-surface-container-low border border-outline-variant/50 text-[11px] font-bold text-on-surface-variant rounded-md">
                      @{prev}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isUpdatingProfile || (user?.usernameChanges || 0) >= 3 || username === user?.username}
              className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : 'Update Username'}
            </button>
          </form>
        </div>

        {/* Privacy Settings Section */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
          <h2 className="text-lg font-bold mb-6">Privacy Settings</h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Read Receipts</p>
                <p className="text-xs text-on-surface-variant/80 mt-1 max-w-sm">
                  Let others know when you have read their messages. If turned off, you won't be able to see read receipts from others.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={readReceipts}
                  onChange={(e) => handlePrivacyChange('readReceipts', e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            <hr className="border-t border-outline-variant/30" />

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-on-surface">Online Status</p>
                <p className="text-xs text-on-surface-variant/80 mt-1 max-w-sm">
                  Show others when you are online. If turned off, you won't be able to see the online status of others.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={onlineStatus}
                  onChange={(e) => handlePrivacyChange('onlineStatus', e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Theme Settings switcher component */}
        <ThemeSwitcher />
      </div>
    </div>
  );
}
