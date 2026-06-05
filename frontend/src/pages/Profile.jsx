import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, Camera, ArrowLeft } from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, changeUsername, isUpdatingProfile } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [username, setUsername] = useState(user?.username || '');

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
      {/* Header */}
      <div className="h-[60px] bg-surface flex items-center justify-between px-6 shrink-0 border-b border-outline-variant/60 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors md:hidden flex items-center"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-tight">My Profile</h2>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
        {/* Profile Details Card */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-6">Profile Details</h3>
          
          <form onSubmit={handleSaveChanges} className="space-y-6">
            {/* Avatar upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-primary/20 shadow-lg">
                <img 
                  src={profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || 'User')}&background=random`} 
                  alt="Avatar" 
                  className="w-full h-full object-cover" 
                />
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer">
                  <Camera size={18} className="mb-1" />
                  <span>Change</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              <p className="text-xs text-on-surface-variant">Click photo to upload a new avatar</p>
            </div>

            {/* Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5 tracking-wider">Display Name</label>
                <input 
                  type="text" 
                  required
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all text-sm font-semibold text-on-surface" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5 tracking-wider">Bio</label>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)}
                  rows="3"
                  maxLength="150"
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/60 focus:border-primary focus:ring-1 focus:ring-primary/10 outline-none transition-all text-sm resize-none text-on-surface" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isUpdatingProfile}
              className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-md hover:opacity-95 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
            >
              {isUpdatingProfile ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Username Modification Card */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Change Username</h3>
          <p className="text-xs text-on-surface-variant/80 mb-6 leading-relaxed">
            You can change your unique username. You are allowed up to 3 changes. (Changes remaining: {3 - (user?.usernameChanges || 0)})
          </p>

          <form onSubmit={handleChangeUsername} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5 tracking-wider">Username</label>
              <div className="relative flex items-center bg-surface rounded-xl border border-outline-variant/60 focus-within:border-primary overflow-hidden h-[46px]">
                <span className="pl-4 pr-1 text-sm font-bold text-on-surface-variant">@</span>
                <input 
                  type="text" 
                  required
                  value={username} 
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="new_username"
                  className="w-full h-full bg-transparent outline-none text-sm font-semibold text-on-surface pr-4" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isUpdatingProfile || username.trim() === user?.username || (user?.usernameChanges || 0) >= 3}
              className="w-full py-3 bg-surface hover:bg-surface-container-low border border-outline-variant text-on-surface font-bold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            >
              Change Username
            </button>
          </form>
        </div>

        {/* Readonly Account Details & Username History */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-2">Account Info</h3>
          
          <div className="divide-y divide-outline-variant/30 text-xs">
            <div className="py-3 flex justify-between items-center">
              <span className="font-bold text-on-surface-variant">Email Address</span>
              <span className="text-on-surface font-semibold">{user?.email}</span>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="font-bold text-on-surface-variant">Role</span>
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold capitalize">{user?.role || 'user'}</span>
            </div>
          </div>

          {user?.previousUsernames && user.previousUsernames.length > 0 && (
            <div className="pt-4 border-t border-outline-variant/40">
              <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2.5">Previous Usernames</h4>
              <div className="flex flex-wrap gap-2">
                {user.previousUsernames.map((oldName, index) => (
                  <span key={index} className="px-3 py-1 bg-surface rounded-lg border border-outline-variant/50 text-xs font-mono text-on-surface-variant">
                    @{oldName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
