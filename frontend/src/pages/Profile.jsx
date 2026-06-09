import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useChatStore } from '../store/useChatStore';
import { 
  Camera, ArrowLeft, ZoomIn, X, 
  Shield, Edit3, CheckCircle2, AlertCircle,
  Activity, User, Lock, History, ChevronDown, LogOut
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import ImageAdjustModal from '../components/modals/ImageAdjustModal';
import UsernameRequestModal from '../components/ui/UsernameRequestModal';
import SpecificFriendsModal from '../components/modals/SpecificFriendsModal';
import { axiosInstance } from '../lib/axios';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile, changeUsername, isUpdatingProfile, updatePrivacySettings, checkAuth, logout } = useAuthStore();
  const { socket } = useChatStore();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || '');
  const [username, setUsername] = useState(user?.username || '');
  
  const [adjustingImage, setAdjustingImage] = useState(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isFullscreenDp, setIsFullscreenDp] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isSpecificFriendsModalOpen, setIsSpecificFriendsModalOpen] = useState(false);
  const [usernameRequests, setUsernameRequests] = useState([]);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setBio(user.bio || '');
      setProfilePic(user.profilePic || '');
      setUsername(user.username || '');
      fetchUsernameRequests();
    }
  }, [user]);

  const fetchUsernameRequests = async () => {
    try {
      const res = await axiosInstance.get('/users/username-request');
      setUsernameRequests(res.data);
    } catch (error) {
      console.error('Error fetching username requests:', error);
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handleLimitsUpdated = () => {
      fetchUsernameRequests();
      checkAuth(); // refresh user object to get new maxUsernameChanges
    };
    socket.on('usernameLimitsUpdated', handleLimitsUpdated);
    return () => socket.off('usernameLimitsUpdated', handleLimitsUpdated);
  }, [socket, checkAuth]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdjustingImage(reader.result);
        setIsAdjustOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const handleSaveChanges = async (e, newProfilePic = null) => {
    if (e) e.preventDefault();
    const payload = { displayName, bio };
    const picToSave = newProfilePic || profilePic;
    if (picToSave && picToSave !== user?.profilePic) {
      payload.profilePic = picToSave;
    }
    await updateProfile(payload);
    setIsEditing(false);
  };

  const handleChangeUsername = async () => {
    if (username.trim() === user?.username) return;
    try {
      await changeUsername(username);
    } catch (err) {}
  };

  const currentDp = profilePic;
  const usernameChangesLeft = (user?.maxUsernameChanges || 3) - (user?.usernameChanges || 0);
  const changesLeft = Math.max(0, usernameChangesLeft);
  
  const hasPendingRequest = usernameRequests.some(r => r.status === 'pending');
  const latestRequest = usernameRequests[0];

  return (
    <div className="h-full flex flex-col bg-[#0A0A0E] overflow-y-auto overflow-x-hidden w-full text-white font-sans relative isolate">
      
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-20 flex items-center px-8 z-50 bg-gradient-to-b from-[#0A0A0E]/90 to-transparent pointer-events-none">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors pointer-events-auto border border-white/10"
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* Massive Profile Hero */}
      <div className="relative w-full pt-40 pb-24 px-8 flex flex-col items-center justify-center min-h-[60vh] md:min-h-[70vh] bg-gradient-to-b from-white/[0.02] to-transparent border-b border-white/5">
        
        {/* Large Avatar */}
        <div className="relative mb-10">
          <div 
            className="w-48 h-48 md:w-64 md:h-64 rounded-[3rem] overflow-hidden border border-white/10 bg-[#050505] shadow-2xl relative transition-transform duration-500 hover:scale-105 cursor-pointer"
            onClick={() => setIsFullscreenDp(true)}
          >
              <Avatar
                src={currentDp}
                name={displayName || user?.username}
                sizeClass="w-full h-full"
                textClass="text-5xl md:text-7xl"
                roundedClass="rounded-none"
              />
          </div>
          
          {/* Edit DP Button */}
          <label className="absolute -bottom-2 -right-2 md:bottom-2 md:-right-6 w-12 h-12 md:w-14 md:h-14 bg-[#8C6DF0] hover:bg-[#7b5bea] text-white rounded-[1rem] flex items-center justify-center shadow-[0_8px_30px_rgba(140,109,240,0.4)] transition-transform hover:scale-110 cursor-pointer z-30 border-[4px] border-[#0A0A0E]">
            <Edit3 size={20} strokeWidth={2.5} />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>

          {/* Online Indicator */}
          <div className="absolute -bottom-2 left-6 md:left-8 w-8 h-8 bg-[#34C759] border-[4px] border-[#0A0A0E] rounded-full z-20 shadow-[0_0_20px_rgba(52,199,89,0.4)]" title="Online" />
        </div>

        {/* Massive Typography */}
        <div className="text-center w-full max-w-3xl space-y-4">
          <h1 className="text-5xl md:text-7xl font-spacetron tracking-tight text-white/95 leading-none">
            {displayName || 'Orbit User'}
          </h1>
          <p className="text-xl md:text-2xl text-[#8C6DF0] font-mono tracking-wide font-medium">
            @{username}
          </p>
          <div className="w-full max-w-2xl mx-auto pt-6 text-lg md:text-xl leading-relaxed text-white/50 font-medium">
            {bio || 'Set your bio to complete your profile.'}
          </div>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="w-full max-w-7xl mx-auto px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Identity Information */}
          <div className="bg-[#12121A] border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-6 hover:border-white/10 transition-colors shadow-xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 text-white/90">
                <div className="p-2.5 bg-white/5 rounded-xl"><User size={20} /></div>
                <h2 className="text-xl font-semibold">Identity</h2>
              </div>
              <button 
                onClick={() => {
                  if(isEditing) handleSaveChanges();
                  else setIsEditing(true);
                }}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-full text-sm transition-colors flex items-center gap-2"
              >
                {isEditing ? <CheckCircle2 size={16} className="text-[#34C759]" /> : <Edit3 size={16} />}
                {isEditing ? 'Save' : 'Edit'}
              </button>
            </div>
            
            <div className="space-y-5 flex-1">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Display Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#0A0A0E] border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-[#8C6DF0] focus:ring-1 focus:ring-[#8C6DF0] outline-none text-base transition-all font-medium"
                  />
                ) : (
                  <div className="w-full bg-[#0A0A0E]/50 border border-white/5 rounded-2xl px-5 py-4 text-lg font-medium text-white/90">
                    {displayName}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest pl-1">Biography</label>
                {isEditing ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows="3"
                    className="w-full bg-[#0A0A0E] border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-[#8C6DF0] focus:ring-1 focus:ring-[#8C6DF0] outline-none text-base resize-none transition-all font-medium"
                  />
                ) : (
                  <div className="w-full bg-[#0A0A0E]/50 border border-white/5 rounded-2xl px-5 py-4 text-base font-medium min-h-[100px] text-white/70 whitespace-pre-wrap">
                    {bio || 'No bio provided.'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Username Management */}
          <div className="bg-[#12121A] border border-white/5 rounded-[2.5rem] p-8 flex flex-col gap-6 hover:border-white/10 transition-colors shadow-xl">
             <div className="flex justify-between items-start">
              <div className="flex items-center gap-3 text-white/90">
                <div className="p-2.5 bg-white/5 rounded-xl"><Edit3 size={20} /></div>
                <h2 className="text-xl font-semibold">Username Management</h2>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${changesLeft > 0 ? 'bg-white/10 text-white/80' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>
                {changesLeft} Changes Left
              </span>
            </div>

            <div className="flex-1 space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-white/40 font-bold">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    disabled={changesLeft <= 0}
                    className="w-full bg-[#0A0A0E] border border-white/10 rounded-2xl pl-10 pr-5 py-4 text-white focus:border-[#8C6DF0] outline-none font-mono text-base transition-all disabled:opacity-50"
                  />
                </div>
                <button
                  onClick={handleChangeUsername}
                  disabled={isUpdatingProfile || username.trim() === user?.username || changesLeft <= 0}
                  className="px-8 py-4 bg-white text-black hover:bg-white/90 disabled:opacity-50 disabled:hover:bg-white text-sm font-bold rounded-2xl transition-all whitespace-nowrap shadow-lg"
                >
                  Update
                </button>
              </div>

              {changesLeft <= 0 && (
                <div className="p-5 bg-gradient-to-r from-[#8C6DF0]/10 to-[#8C6DF0]/5 border border-[#8C6DF0]/20 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white/90">Limit Exceeded</h4>
                    <p className="text-xs text-white/60 mt-1">You must submit a request to admin to change your username again.</p>
                  </div>
                  <button 
                    onClick={() => setIsRequestModalOpen(true)}
                    disabled={hasPendingRequest}
                    className="px-5 py-2.5 bg-[#8C6DF0] text-white hover:bg-[#8C6DF0]/90 disabled:opacity-50 rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                  >
                    {hasPendingRequest ? 'Request Pending' : 'Appeal Limit'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Account Status */}
          <div className="bg-[#12121A] border border-white/5 rounded-[2.5rem] p-8 flex flex-col hover:border-white/10 transition-colors shadow-xl">
             <div className="flex items-center gap-3 text-white/90 mb-6">
                <div className="p-2.5 bg-white/5 rounded-xl"><Activity size={20} /></div>
                <h2 className="text-xl font-semibold">Account Status</h2>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center py-6">
              <div className="w-20 h-20 bg-[#34C759]/10 rounded-full flex items-center justify-center text-[#34C759] mb-4 shadow-[0_0_30px_rgba(52,199,89,0.15)]">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-lg font-bold text-white/90">Active & Verified</h3>
              <p className="text-sm text-white/50 mt-1 text-center">Your account is in good standing.</p>
            </div>
          </div>

          {/* Privacy Controls */}
          <div className="bg-[#12121A] border border-white/5 rounded-[2.5rem] p-8 flex flex-col hover:border-white/10 transition-colors shadow-xl">
             <div className="flex items-center gap-3 text-white/90 mb-6">
                <div className="p-2.5 bg-white/5 rounded-xl"><Shield size={20} /></div>
                <h2 className="text-xl font-semibold">Privacy Controls</h2>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0A0A0E] border border-white/5 rounded-2xl">
                <div>
                  <h3 className="text-sm font-semibold text-white/90">Online Status</h3>
                  <p className="text-xs text-white/50 mt-1">Who can see when you are online</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white rounded-xl px-4 py-2 transition-all"
                  >
                    {user?.privacySettings?.onlineStatus === 'nobody' ? 'Nobody' : 'Specific Friends'}
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {isStatusDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-[#1A1A24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
                      >
                        <button
                          onClick={() => {
                            if (user?.privacySettings?.onlineStatus === 'specific_friends') {
                              setIsSpecificFriendsModalOpen(true);
                            } else {
                              updatePrivacySettings({ onlineStatus: 'specific_friends' });
                              setIsSpecificFriendsModalOpen(true);
                            }
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 ${user?.privacySettings?.onlineStatus === 'specific_friends' ? 'text-[#8C6DF0] bg-white/5' : 'text-white/80'}`}
                        >
                          Specific Friends
                          {user?.privacySettings?.onlineStatus === 'specific_friends' && (
                            <Edit3 size={14} className="text-[#8C6DF0]" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            updatePrivacySettings({ onlineStatus: 'nobody' });
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors hover:bg-white/5 border-t border-white/5 ${user?.privacySettings?.onlineStatus === 'nobody' ? 'text-[#8C6DF0] bg-white/5' : 'text-white/80'}`}
                        >
                          Nobody
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Usernames & Requests */}
          <div className="bg-[#12121A] border border-white/5 rounded-[2.5rem] p-8 flex flex-col hover:border-white/10 transition-colors shadow-xl lg:col-span-2">
             <div className="flex items-center gap-3 text-white/90 mb-6">
                <div className="p-2.5 bg-white/5 rounded-xl"><History size={20} /></div>
                <h2 className="text-xl font-semibold">Username History & Appeals</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
              {/* History */}
              <div>
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 pl-1">Past Handles</h4>
                {user?.previousUsernames?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.previousUsernames.map((old, idx) => (
                      <span key={idx} className="px-4 py-2 bg-[#0A0A0E] border border-white/5 rounded-xl text-sm font-mono text-white/60 font-medium">
                        @{old}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/40 italic p-4 bg-[#0A0A0E] rounded-2xl border border-white/5">No previous usernames.</p>
                )}
              </div>

              {/* Latest Appeal Status */}
              <div>
                <h4 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-4 pl-1">Latest Appeal</h4>
                {latestRequest ? (
                  <div className="p-4 bg-[#0A0A0E] border border-white/5 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="font-mono text-sm font-bold text-white/90">@{latestRequest.requestedUsername}</span>
                      <div className="flex items-center gap-2">
                        {latestRequest.status === 'approved' && latestRequest.grantedChanges > 0 && (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#8C6DF0]/10 text-[#8C6DF0] border border-[#8C6DF0]/20">
                            +{latestRequest.grantedChanges} Granted
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize
                          ${latestRequest.status === 'approved' ? 'bg-[#34C759]/10 text-[#34C759]' : 
                            latestRequest.status === 'rejected' ? 'bg-[#FF3B30]/10 text-[#FF3B30]' : 
                            'bg-yellow-500/10 text-yellow-500'}`}
                        >
                          {latestRequest.status}
                        </span>
                      </div>
                    </div>
                    {latestRequest.status !== 'pending' && (
                      <div className="flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest font-bold pt-1">
                        <span>{new Date(latestRequest.updatedAt).toLocaleDateString()}</span>
                        {latestRequest.approvedBy && (
                          <span>By {latestRequest.approvedBy}</span>
                        )}
                      </div>
                    )}
                    {latestRequest.adminNotes && (
                      <p className="text-xs text-white/50 bg-white/5 p-3 rounded-xl border border-white/5">
                        <strong className="text-white/70">Admin Note:</strong> {latestRequest.adminNotes}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-white/40 italic p-4 bg-[#0A0A0E] rounded-2xl border border-white/5">No appeals submitted.</p>
                )}
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-[#12121A] border border-white/5 rounded-[2.5rem] p-8 flex flex-col hover:border-white/10 transition-colors shadow-xl lg:col-span-2">
             <div className="flex items-center gap-3 text-white/90 mb-6">
                <div className="p-2.5 bg-white/5 rounded-xl"><Lock size={20} /></div>
                <h2 className="text-xl font-semibold">Account Information</h2>
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#0A0A0E] border border-white/5 rounded-2xl">
                <div>
                  <h3 className="text-sm font-semibold text-white/90">Email Address</h3>
                  <p className="text-xs text-white/50 mt-1">{user?.email}</p>
                </div>
                <div className="p-2 bg-[#34C759]/10 text-[#34C759] rounded-xl">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-[#0A0A0E] border border-white/5 rounded-2xl">
                <div>
                  <h3 className="text-sm font-semibold text-white/90">Member Since</h3>
                  <p className="text-xs text-white/50 mt-1">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Mobile Logout Button */}
        <div className="md:hidden mt-8">
          <button 
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center justify-center gap-3 py-4 bg-[#FF3B30]/10 text-[#FF3B30] rounded-2xl font-bold border border-[#FF3B30]/20 active:bg-[#FF3B30]/20 transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Fullscreen DP Viewer Modal */}
      <AnimatePresence>
        {isFullscreenDp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#0A0A0E]/95 flex items-center justify-center p-4 backdrop-blur-2xl"
            onClick={() => setIsFullscreenDp(false)}
          >
            <button
              className="absolute top-8 right-8 text-white/50 hover:text-white p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all cursor-pointer"
              onClick={() => setIsFullscreenDp(false)}
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-w-[90vw] max-h-[90vh] aspect-square select-none rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Avatar
                src={currentDp}
                name={displayName || user?.username}
                sizeClass="w-full h-full"
                textClass="text-[150px] md:text-[200px]"
                roundedClass="rounded-none"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ImageAdjustModal
        isOpen={isAdjustOpen}
        imageSrc={adjustingImage}
        onClose={() => setIsAdjustOpen(false)}
        onConfirm={(adjustedDataUrl) => {
          setProfilePic(adjustedDataUrl);
          setIsAdjustOpen(false);
          handleSaveChanges(null, adjustedDataUrl); // auto save on avatar change
        }}
        aspectMode="circle"
      />

      <UsernameRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={() => fetchUsernameRequests()}
      />

      <SpecificFriendsModal
        isOpen={isSpecificFriendsModalOpen}
        onClose={() => setIsSpecificFriendsModalOpen(false)}
      />
    </div>
  );
}
