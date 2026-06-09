import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, ShieldAlert, UserMinus, MessageSquare, Clock, Globe, UserPlus, UserCheck, X } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useFriendStore } from '../store/useFriendStore';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import { useConfirmStore } from '../store/useConfirmStore';
import Avatar from '../components/ui/Avatar';

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreenDp, setIsFullscreenDp] = useState(false);

  const { friends, outgoingRequests, sendRequest, acceptRequest, rejectRequest, removeFriend, blockUser, unblockUser, getFriends, getRequests } = useFriendStore();
  const { accessChat, socket } = useChatStore();
  const { user } = useAuthStore();

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await axiosInstance.get(`/users/${id}`);
      setProfileUser(res.data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err.response?.data?.message || 'Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
    getFriends();
    getRequests();
  }, [id, getFriends, getRequests]);

  useEffect(() => {
    const handleRelationshipUpdate = ({ otherUserId }) => {
      if (otherUserId === id) {
        axiosInstance.get(`/users/${id}`)
          .then(res => setProfileUser(res.data))
          .catch(err => console.error('Error refreshing profile:', err));
        getFriends();
        getRequests();
      }
    };
    
    if (socket) {
      socket.on('relationshipUpdated', handleRelationshipUpdate);
    }
    
    return () => {
      if (socket) {
        socket.off('relationshipUpdated', handleRelationshipUpdate);
      }
    };
  }, [id, socket, getFriends, getRequests]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-background w-full text-on-surface font-sans border-l border-outline-variant/60">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-xs text-on-surface-variant/80 font-semibold mt-3">Loading profile details...</p>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="h-full flex flex-col bg-background w-full text-on-surface font-sans border-l border-outline-variant/60">
        <div className="h-[60px] bg-surface flex items-center px-6 border-b border-outline-variant/60 shrink-0">
          <button onClick={() => navigate(-1)} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors flex items-center mr-3 cursor-pointer">
            <ArrowLeft size={22} />
          </button>
          <h2 className="text-lg font-bold">Error</h2>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
            <ShieldAlert size={26} />
          </div>
          <h3 className="text-base font-bold text-on-surface">Failed to load profile</h3>
          <p className="text-xs text-on-surface-variant/80 mt-1 max-w-sm leading-relaxed">
            {error || 'This user does not exist or you do not have permission to view their profile.'}
          </p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-6 px-5 py-2.5 bg-surface hover:bg-surface-container-low border border-outline-variant text-on-surface font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isFriend = profileUser.relationship === 'FRIEND';
  const requestSent = profileUser.relationship === 'PENDING_OUTGOING';
  const requestReceived = profileUser.relationship === 'PENDING_INCOMING';
  const isSelf = user?._id === profileUser._id;
  const isYouBlocked = profileUser.relationship === 'YOU_BLOCKED';
  const isBlockedYou = profileUser.relationship === 'BLOCKED_YOU';
  const isAnyBlocked = isYouBlocked || isBlockedYou;
  
  // Privacy logic: if not friend and not self, profile details are restricted
  const showFullProfile = (isFriend || isSelf) && !isAnyBlocked;

  const activeSocials = Object.entries(profileUser.socialLinks || {}).filter(([_, val]) => val && val.trim() !== '');

  const handleMessage = async () => {
    try {
      await accessChat(profileUser._id);
      navigate('/');
    } catch (err) {
      console.error('Failed to open chat:', err);
    }
  };

  const handleUnfriend = async () => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Remove Friend",
      message: `Are you sure you want to remove ${profileUser.displayName} from your friends list?`,
      confirmText: "Remove",
      danger: true
    });
    if (confirmed) {
      await removeFriend(profileUser._id);
      toast.success(`${profileUser.displayName} removed from friends`);
      // Refresh state
      const res = await axiosInstance.get(`/users/${id}`);
      setProfileUser(res.data);
    }
  };

  const handleBlock = async () => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Block User",
      message: `Are you sure you want to block ${profileUser.displayName}? You will no longer receive their messages.`,
      confirmText: "Block",
      danger: true
    });
    if (confirmed) {
      await blockUser(profileUser._id);
      toast.success(`${profileUser.displayName} blocked successfully`);
      // Refresh state
      const res = await axiosInstance.get(`/users/${id}`);
      setProfileUser(res.data);
    }
  };

  const handleUnblock = async () => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Unblock User",
      message: `Are you sure you want to unblock ${profileUser.displayName}?`,
      confirmText: "Unblock",
      danger: false
    });
    if (confirmed) {
      await unblockUser(profileUser._id);
      toast.success(`${profileUser.displayName} unblocked successfully`);
      // Refresh state
      const res = await axiosInstance.get(`/users/${id}`);
      setProfileUser(res.data);
    }
  };

  const handleAddFriend = async () => {
    try {
      await sendRequest(profileUser._id);
      toast.success(`Friend request sent to ${profileUser.displayName}`);
      // Refresh state
      const res = await axiosInstance.get(`/users/${id}`);
      setProfileUser(res.data);
    } catch (err) {
      console.error('Failed to send request:', err);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      await acceptRequest(profileUser._id);
      toast.success(`You are now friends with ${profileUser.displayName}`);
      const res = await axiosInstance.get(`/users/${id}`);
      setProfileUser(res.data);
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  };

  const handleRejectRequest = async () => {
    try {
      await rejectRequest(profileUser._id);
      toast.success(`Friend request declined`);
      const res = await axiosInstance.get(`/users/${id}`);
      setProfileUser(res.data);
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  const formattedJoinDate = profileUser.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : 'Recently';

  const formattedLastSeen = profileUser.lastSeen
    ? new Date(profileUser.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto w-full text-on-surface font-sans border-l border-outline-variant/60">
      {/* Header */}
      <div className="h-[60px] bg-background flex items-center px-6 shrink-0 border-b border-outline-variant/60 sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)} 
          className="p-1.5 rounded-full hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors flex items-center mr-3 cursor-pointer"
        >
          <ArrowLeft size={22} />
        </button>
        <h2 className="text-xl font-bold tracking-tight">User Profile</h2>
      </div>

      <div className="p-6 max-w-2xl mx-auto w-full space-y-6">
        {/* Profile Card */}
        <div className="bg-surface-container-lowest rounded-[2.5rem] overflow-hidden border border-outline-variant/60 shadow-sm relative flex flex-col">
          
          {/* Details & Avatar Container (No Cover) */}
          <div className="px-8 pb-8 relative flex flex-col pt-8 items-start">
            
            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between w-full gap-4 mb-6">
              <div className="relative shrink-0 group">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-primary-variant rounded-full blur opacity-20 group-hover:opacity-40 transition duration-300" />
                <div 
                  className="w-28 h-28 relative p-1.5 bg-surface-container-lowest rounded-full shadow-md border border-outline-variant/25 cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setIsFullscreenDp(true)}
                >
                  <Avatar
                    src={profileUser.profilePic} 
                    name={profileUser.displayName || profileUser.username}
                    sizeClass="w-full h-full"
                    textClass="text-4xl md:text-5xl"
                  />
                </div>
                {/* Active status indicator badge */}
                {!isAnyBlocked && (
                  <div 
                    className={`absolute bottom-2 right-2 w-5.5 h-5.5 rounded-full border-[3px] border-surface flex items-center justify-center shadow-md ${
                      profileUser.isOnline ? 'bg-green-500' : 'bg-neutral-500'
                    }`}
                    title={profileUser.isOnline ? 'Online' : 'Offline'}
                  >
                    {profileUser.isOnline && <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                  </div>
                )}
              </div>

              {/* Action Buttons for Friends / Contacts */}
              <div className="flex flex-wrap gap-2.5 sm:mb-2">
                {!isSelf && (
                  <>
                    {/* Unblock button if we blocked them */}
                    {isYouBlocked && (
                      <button
                        onClick={handleUnblock}
                        className="py-2.5 px-4 rounded-xl bg-primary text-white hover:opacity-90 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                      >
                        <ShieldAlert size={13.5} />
                        Unblock User
                      </button>
                    )}

                    {/* Interactive buttons only if neither party is blocked */}
                    {!isAnyBlocked && (
                      <>
                        {isFriend && (
                          <button
                            onClick={handleMessage}
                            className="py-2.5 px-4 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-black/10 cursor-pointer active:scale-98 transition-all"
                          >
                            <MessageSquare size={13.5} />
                            Send Message
                          </button>
                        )}

                        {isFriend ? (
                          <button
                            onClick={handleUnfriend}
                            className="py-2.5 px-4 rounded-xl border border-outline-variant hover:bg-red-500/5 hover:border-red-500/15 text-red-500 hover:text-red-600 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                          >
                            <UserMinus size={13.5} />
                            Unfriend
                          </button>
                        ) : requestReceived ? (
                          <div className="flex gap-2 w-full sm:w-auto">
                            <button
                              onClick={handleAcceptRequest}
                              className="flex-1 sm:flex-none py-2.5 px-4 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-black/10 cursor-pointer active:scale-98 transition-all"
                            >
                              <UserCheck size={13.5} />
                              Accept Request
                            </button>
                            <button
                              onClick={handleRejectRequest}
                              className="py-2.5 px-4 rounded-xl border border-outline-variant hover:bg-surface-container-highest text-on-surface hover:text-red-500 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                            >
                              <X size={13.5} />
                              Decline
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleAddFriend}
                            disabled={requestSent}
                            className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all active:scale-95 ${
                              requestSent 
                                ? 'bg-surface-container-low border border-outline-variant text-on-surface-variant/50 cursor-default'
                                : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/10'
                            }`}
                          >
                            {requestSent ? (
                              <>
                                <UserCheck size={13.5} />
                                Request Sent
                              </>
                            ) : (
                              <>
                                <UserPlus size={13.5} />
                                Add Friend
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={handleBlock}
                          className="py-2.5 px-4 rounded-xl bg-surface-container-low border border-outline-variant hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 hover:border-red-500/20 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                        >
                          <ShieldAlert size={13.5} />
                          Block User
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* User Details */}
            <div className="w-full text-left space-y-1">
              <h1 className="text-2xl font-black text-on-surface tracking-tight leading-none">
                {profileUser.displayName}
              </h1>
              <p className="text-[13px] text-on-surface-variant/80 font-bold tracking-wide">@{profileUser.username}</p>
              
              <div className="pt-2 flex items-center gap-2 text-xs">
                {!isAnyBlocked && (
                  profileUser.isOnline ? (
                    <span className="text-green-600 dark:text-green-400 font-bold bg-green-500/10 px-3 py-0.5 rounded-full border border-green-500/10">
                      Online Now
                    </span>
                  ) : (
                    <span 
                      style={{ 
                        backgroundColor: 'color-mix(in srgb, var(--outline-variant) 15%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--outline-variant) 10%, transparent)'
                      }}
                      className="text-on-surface-variant/70 font-semibold px-3 py-0.5 rounded-full border flex items-center gap-1"
                    >
                      <Clock size={11} className="text-primary" />
                      {formattedLastSeen ? `Active at ${formattedLastSeen}` : 'Offline'}
                    </span>
                  )
                )}
              </div>
            </div>

            {/* Divider */}
            <hr className="w-full border-t border-outline-variant/30 my-6" />

            {isAnyBlocked ? (
              <div className="w-full py-8 flex flex-col items-center justify-center text-center select-none bg-red-500/5 rounded-2xl border border-red-500/15">
                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mb-3 text-red-500">
                  <ShieldAlert size={20} />
                </div>
                <h3 className="text-sm font-bold text-red-500">
                  {isYouBlocked ? 'You Have Blocked This User' : 'Blocked User'}
                </h3>
                <p className="text-xs text-on-surface-variant/70 mt-1 max-w-[280px]">
                  {isYouBlocked 
                    ? 'Unblock this user if you wish to allow requests or messaging.' 
                    : 'You cannot interact with this user.'}
                </p>
              </div>
            ) : showFullProfile ? (
              <>
                {/* Bio Section */}
                <div 
                  style={{ 
                    backgroundColor: 'color-mix(in srgb, var(--surface-container-low) 40%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--outline-variant) 20%, transparent)'
                  }}
                  className="w-full text-left rounded-2xl p-5 border"
                >
                  <span className="text-[10px] font-bold text-on-surface-variant/75 uppercase tracking-wider block mb-1.5">About</span>
                  <p className="text-[13px] text-on-surface-variant/90 leading-relaxed font-semibold">
                    {profileUser.bio || "No status or bio available yet."}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] text-on-surface-variant/80 pl-1 font-bold">
                  <div className="flex items-center gap-3.5">
                     <Calendar size={15} className="text-primary" />
                    <span>Joined {formattedJoinDate}</span>
                  </div>
                  <div className="flex items-center gap-3.5">
                    <Globe size={15} className="text-primary" />
                    <span>Role: {profileUser.role === 'admin' ? 'Admin' : 'Orbit Member'}</span>
                  </div>
                </div>

                {/* Social Links Section */}
                {activeSocials.length > 0 && (
                  <div className="w-full mt-6">
                    <span className="text-[10px] font-bold text-on-surface-variant/75 uppercase tracking-wider block mb-2.5">Social Profiles</span>
                    <div className="flex flex-wrap gap-2.5">
                      {activeSocials.map(([platform, url]) => (
                        <a 
                          key={platform}
                          href={url.startsWith('http') ? url : `https://${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 rounded-xl text-xs font-bold text-on-surface-variant flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 uppercase tracking-wider cursor-pointer shadow-sm"
                        >
                          {platform}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full py-8 flex flex-col items-center justify-center text-center select-none bg-surface-container-low/50 rounded-2xl border border-outline-variant/30">
                <div className="w-12 h-12 bg-outline-variant/10 rounded-full flex items-center justify-center mb-3">
                  <ShieldAlert size={20} className="text-on-surface-variant/60" />
                </div>
                <h3 className="text-sm font-bold text-on-surface">This Profile is Private</h3>
                <p className="text-xs text-on-surface-variant/70 mt-1 max-w-[200px]">
                  Add this user as a friend to see their bio, join date, and send messages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen DP Viewer */}
      {isFullscreenDp && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsFullscreenDp(false)}
        >
          <button 
            className="absolute top-6 right-6 text-white/70 hover:text-white p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
            onClick={() => setIsFullscreenDp(false)}
          >
            <X size={24} />
          </button>
          <div 
            className="max-w-[90vw] max-h-[90vh] aspect-square select-none rounded-[3rem] shadow-2xl border border-white/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar
              src={profileUser.profilePic} 
              name={profileUser.displayName || profileUser.username}
              sizeClass="w-full h-full"
              textClass="text-[150px] md:text-[200px]"
              roundedClass="rounded-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
