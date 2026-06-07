import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, User, Shield, Palette, ChevronLeft, Camera, Key } from 'lucide-react';
import ThemeSwitcher from '../components/shared/ThemeSwitcher';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile, changeUsername, updatePrivacySettings, isUpdatingProfile } = useAuthStore();

  const [activeTab, setActiveTab] = useState('profile');
  const [mobileView, setMobileView] = useState('nav'); // 'nav' or 'detail'

  // Profile State
  const [displayName, setDisplayName] = useState(user?.displayName || 'Jayanth Chowdary');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '../images/jayanth.jpg');
  
  // Account State
  const [username, setUsername] = useState(user?.username || 'jayanth');

  // Privacy State
  const [readReceipts, setReadReceipts] = useState(user?.privacySettings?.readReceipts ?? true);
  const [onlineStatus, setOnlineStatus] = useState(user?.privacySettings?.onlineStatus ?? true);

  const handlePrivacyChange = async (type, value) => {
    if (type === 'readReceipts') setReadReceipts(value);
    if (type === 'onlineStatus') setOnlineStatus(value);
    try {
      await updatePrivacySettings({ [type]: value });
    } catch (err) {
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
    } catch (err) {}
  };

  const navItems = [
    { id: 'profile', label: 'User Profile', icon: <User size={18} /> },
    { id: 'account', label: 'Account Data', icon: <Key size={18} /> },
    { id: 'privacy', label: 'Privacy & Safety', icon: <Shield size={18} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={18} /> },
  ];

  const renderNav = () => (
    <div className={`w-full md:w-[280px] shrink-0 border-r border-outline-variant/30 bg-background flex flex-col h-full ${mobileView === 'detail' ? 'hidden md:flex' : 'flex'}`}>
      <div className="h-[72px] px-8 flex items-center shrink-0 border-b border-transparent">
        <button 
          onClick={() => navigate(-1)} 
          className="mr-4 p-2 -ml-2 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors md:hidden cursor-pointer"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-black tracking-tight text-on-surface">Settings</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setMobileView('detail');
            }}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer select-none ${
              activeTab === item.id 
                ? 'bg-surface-container-high text-on-surface' 
                : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
            }`}
          >
            <div className={`${activeTab === item.id ? 'text-primary' : 'text-on-surface-variant'}`}>
              {item.icon}
            </div>
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderProfile = () => (
    <form onSubmit={handleSaveChanges} className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Profile Hero Card */}
      <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 flex flex-col items-center text-center xl:row-span-2 gap-2 relative">
        <div className="relative group mb-4">
          <div className="w-36 h-36 rounded-full bg-surface-container-high border-[6px] border-background flex items-center justify-center overflow-hidden ring-1 ring-outline-variant/20 shadow-sm transition-transform group-hover:scale-[1.02]">
            {profilePic ? (
              <img src={profilePic} alt="profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-5xl font-black text-on-surface-variant uppercase">{displayName?.[0] || 'J'}</span>
            )}
          </div>
          
          {/* Pencil Edit Overlay */}
          <label className="absolute bottom-1 right-1 w-10 h-10 bg-surface rounded-full border border-outline-variant/30 flex items-center justify-center cursor-pointer shadow-md text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-surface-container transition-all active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>
        </div>

        <h3 className="text-2xl font-bold text-on-surface tracking-tight leading-none">{displayName || 'Jayanth Chowdary'}</h3>
        <p className="text-sm font-medium text-on-surface-variant mb-4">@{username || 'jayanth'}</p>

        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold mb-4">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          Active Account
        </div>

        <button 
          type="button" 
          onClick={() => setProfilePic('')}
          className="mt-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors pb-1 border-b border-transparent hover:border-outline-variant"
        >
          Remove profile picture
        </button>
      </div>

      {/* Display Name Card */}
      <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 xl:col-span-2 flex flex-col justify-center">
        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
          Display Name
        </label>
        <input 
          type="text" 
          required
          value={displayName} 
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-4 py-3.5 bg-background border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-lg font-semibold text-on-surface placeholder:text-on-surface-variant/40" 
          placeholder="Jayanth Chowdary"
        />
        <p className="text-xs font-medium text-on-surface-variant mt-3">This is your primary name visible to your network contacts.</p>
      </div>

      {/* Bio Card */}
      <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 xl:col-span-2 flex flex-col justify-center">
        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
          Biography
        </label>
        <textarea 
          value={bio} 
          onChange={(e) => setBio(e.target.value)}
          className="w-full px-4 py-3.5 bg-background border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-base font-medium text-on-surface placeholder:text-on-surface-variant/40 min-h-[110px] resize-none" 
          placeholder="Building premium digital experiences."
        />
      </div>

      {/* Account Information Card & Actions */}
      <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 xl:col-span-3 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h4 className="text-sm font-bold text-on-surface mb-1">Account Workspace</h4>
          <p className="text-xs font-medium text-on-surface-variant">Your personal settings are synchronized across all Orbit applications.</p>
        </div>
        <button 
          type="submit" 
          disabled={isUpdatingProfile}
          className="px-8 py-3 bg-on-surface hover:bg-on-surface/90 text-surface text-sm font-bold rounded-xl transition-transform flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 w-full sm:w-auto"
        >
          {isUpdatingProfile ? <Loader2 size={18} className="animate-spin" /> : 'Save Profile Changes'}
        </button>
      </div>
    </form>
  );

  const renderAccount = () => (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-6xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Username Editor Card */}
      <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 xl:col-span-2 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-on-surface tracking-tight mb-1">Orbit Identity</h2>
              <p className="text-sm font-medium text-on-surface-variant">Update your unique platform handle.</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Key size={24} />
            </div>
          </div>
          
          <form onSubmit={handleChangeUsername} className="space-y-6">
            <div className="relative flex items-center">
              <span className="absolute left-5 text-primary font-black text-xl">@</span>
              <input 
                type="text" 
                disabled={(user?.usernameChanges || 0) >= 3} 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="new_username"
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 text-lg font-bold focus:outline-none transition-all shadow-inner ${
                  (user?.usernameChanges || 0) >= 3 
                    ? 'bg-surface-container border-outline-variant/30 text-on-surface-variant cursor-not-allowed' 
                    : 'bg-surface-container-lowest border-outline-variant/30 focus:border-primary focus:bg-surface text-on-surface'
                }`} 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isUpdatingProfile || (user?.usernameChanges || 0) >= 3 || username === user?.username}
              className="px-6 py-3.5 bg-on-surface hover:bg-on-surface/90 text-surface text-sm font-bold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer w-full sm:w-auto hover:-translate-y-0.5 active:translate-y-0"
            >
              {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : 'Confirm New Identity'}
            </button>
          </form>
        </div>
      </div>

      {/* Account Limits Card */}
      <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-primary/30 transition-colors">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container-high/50 pointer-events-none"></div>
        <div className="relative z-10 w-24 h-24 rounded-full bg-surface-container-highest border-4 border-surface shadow-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-105">
          <span className={`text-4xl font-black ${(user?.usernameChanges || 0) >= 3 ? 'text-red-500' : 'text-primary'}`}>
            {3 - (user?.usernameChanges || 0)}
          </span>
        </div>
        <h3 className="text-base font-black text-on-surface uppercase tracking-widest mb-2">Changes Remaining</h3>
        <p className="text-sm font-medium text-on-surface-variant px-4">
          {(user?.usernameChanges || 0) >= 3 
            ? "You have exhausted your username changes to prevent network spam." 
            : "Use your changes wisely. This limit prevents identity spoofing."}
        </p>
      </div>

      {/* History Card */}
      {user?.previousUsernames && user.previousUsernames.length > 0 && (
        <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 xl:col-span-3">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
              <Shield size={16} />
            </div>
            <h3 className="text-sm font-black text-on-surface-variant uppercase tracking-widest">Public Alias History</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {user.previousUsernames.map((prev, index) => (
              <div key={index} className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 text-sm font-bold text-on-surface rounded-xl shadow-sm">
                <span className="text-on-surface-variant">@</span>{prev}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderPrivacy = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-w-6xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Read Receipts Card */}
      <div 
        onClick={() => handlePrivacyChange('readReceipts', !readReceipts)}
        className={`bg-surface p-8 rounded-3xl border-2 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden ${readReceipts ? 'border-emerald-500/30 shadow-[0_8px_30px_rgb(16,185,129,0.05)]' : 'border-outline-variant/20'}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent transition-colors ${readReceipts ? 'to-emerald-500/5' : ''}`}></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-12">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${readReceipts ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-container text-on-surface-variant'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>
            </div>
            <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
              <input type="checkbox" className="sr-only peer" checked={readReceipts} readOnly />
              <div className="w-12 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
            </label>
          </div>
          <h3 className="text-xl font-black text-on-surface mb-2">Read Receipts</h3>
          <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
            Broadcast when you've read messages. When disabled, you also lose the ability to see if others have read your messages, enforcing mutual privacy.
          </p>
        </div>
      </div>

      {/* Online Status Card */}
      <div 
        onClick={() => handlePrivacyChange('onlineStatus', !onlineStatus)}
        className={`bg-surface p-8 rounded-3xl border-2 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden ${onlineStatus ? 'border-primary/30 shadow-[0_8px_30px_rgb(99,102,241,0.05)]' : 'border-outline-variant/20'}`}
      >
        <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent transition-colors ${onlineStatus ? 'to-primary/5' : ''}`}></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-12">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${onlineStatus ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
              <div className={`w-6 h-6 rounded-full border-4 border-surface ${onlineStatus ? 'bg-emerald-500' : 'bg-on-surface-variant'}`}></div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
              <input type="checkbox" className="sr-only peer" checked={onlineStatus} readOnly />
              <div className="w-12 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
            </label>
          </div>
          <h3 className="text-xl font-black text-on-surface mb-2">Activity Status</h3>
          <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
            Allow your network to see when you're actively using Orbit. Hiding your status provides a true stealth communication experience.
          </p>
        </div>
      </div>

    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfile();
      case 'account': return renderAccount();
      case 'privacy': return renderPrivacy();
      case 'appearance': return <ThemeSwitcher />;
      default: return null;
    }
  };

  return (
    <div className="h-full flex bg-background w-full text-on-surface font-sans overflow-hidden">
      {renderNav()}
      
      <div className={`flex-1 flex-col h-full bg-surface-container-lowest ${mobileView === 'nav' ? 'hidden md:flex' : 'flex'}`}>
        <div className="h-[72px] px-8 flex items-center shrink-0 border-b border-transparent">
          <button 
            onClick={() => setMobileView('nav')} 
            className="mr-4 p-2 -ml-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors md:hidden flex items-center cursor-pointer"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="text-sm font-black text-on-surface-variant tracking-widest uppercase md:hidden">
            {navItems.find(i => i.id === activeTab)?.label}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 md:px-16 py-8 pb-32">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
