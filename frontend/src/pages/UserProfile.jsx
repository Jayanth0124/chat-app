import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, ShieldAlert, UserMinus, MessageSquare, Clock, Globe, UserPlus, UserCheck, X, Phone, Video, Share2, Link, Zap, Satellite, Moon, Radar, Sparkles, Star } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { useFriendStore } from '../store/useFriendStore';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useLayoutStore } from '../store/useLayoutStore';
import toast from 'react-hot-toast';
import { useConfirmStore } from '../store/useConfirmStore';
import Avatar from '../components/ui/Avatar';
import StoryRing from '../components/stories/StoryRing';

const SocialIcon = ({ platform }) => {
  const p = platform.toLowerCase();
  if (p === 'github') return <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>;
  if (p === 'x' || p === 'twitter') return <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>;
  if (p === 'instagram') return <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
  if (p === 'linkedin') return <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
  if (p === 'youtube') return <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
  if (p === 'discord') return <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>;
  if (p === 'telegram') return <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>;
  return <Link className="w-5 h-5" />; // default to generic link
};

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullscreenDp, setIsFullscreenDp] = useState(false);
  const [connectionData, setConnectionData] = useState(null);
  const [focusedStage, setFocusedStage] = useState(null);

  const { friends, outgoingRequests, sendRequest, acceptRequest, rejectRequest, removeFriend, blockUser, unblockUser, getFriends, getRequests } = useFriendStore();
  const { accessChat, socket } = useChatStore();
  const { user } = useAuthStore();
  const { setActiveCall } = useLayoutStore();

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await axiosInstance.get(`/users/${id}`);
      setProfileUser(res.data);

      try {
        const connRes = await axiosInstance.get(`/users/${id}/connection`);
        setConnectionData(connRes.data);
      } catch (connErr) {
        console.error('Error fetching connection:', connErr);
      }
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

  const triggerCall = async (type) => {
    if (!profileUser) return;
    try {
      const res = await axiosInstance.post('/calls', {
        receiverId: profileUser._id,
        type
      });
      const callRecord = res.data;

      setActiveCall({
        callId: callRecord._id,
        name: profileUser.displayName,
        pic: profileUser.profilePic,
        type,
        status: 'dialing',
        receiverId: profileUser._id,
        direction: 'outgoing'
      });

      if (socket) {
        socket.emit('call:offer', {
          to: profileUser._id,
          callData: {
            callId: callRecord._id,
            callerId: user._id,
            callerName: user.displayName,
            callerPic: user.profilePic,
            type
          }
        });
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Failed to start call');
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

  const getOrbitStage = (score) => {
    if (score >= 50000) return { stage: 7, name: 'Infinity', desc: 'The highest Orbit Connection level representing exceptional communication history.', icon: <Star size={20} />, next: null, min: 50000, progress: 100 };
    if (score >= 10000) return { stage: 6, name: 'Resonance', desc: 'A strong and meaningful Orbit connection built through significant interaction.', icon: <Sparkles size={20} />, next: 50000, min: 10000, progress: ((score - 10000) / 40000) * 100 };
    if (score >= 5000) return { stage: 5, name: 'Sync', desc: 'Communication patterns are highly consistent between both users.', icon: <Radar size={20} />, next: 10000, min: 5000, progress: ((score - 5000) / 5000) * 100 };
    if (score >= 2000) return { stage: 4, name: 'Bond', desc: 'Conversations extend beyond occasional chats. Calls and messages strengthen the connection.', icon: <Globe size={20} />, next: 5000, min: 2000, progress: ((score - 2000) / 3000) * 100 };
    if (score >= 500) return { stage: 3, name: 'Link', desc: 'A recognizable connection has developed through frequent messaging.', icon: <Moon size={20} />, next: 2000, min: 500, progress: ((score - 500) / 1500) * 100 };
    if (score >= 100) return { stage: 2, name: 'Alignment', desc: 'Communication is becoming regular. Both users are actively interacting.', icon: <Satellite size={20} />, next: 500, min: 100, progress: ((score - 100) / 400) * 100 };
    return { stage: 1, name: 'Encounter', desc: 'A new connection has formed. Early conversations have begun.', icon: <Zap size={20} />, next: 100, min: 0, progress: (score / 100) * 100 };
  };

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

      <div className="p-4 sm:p-8 md:p-10 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[380px_1fr] gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: Identity & Actions */}
          <div className="flex flex-col items-center md:items-start space-y-6">
            
            {/* Avatar container */}
            <div className="relative group shrink-0">
              <div
                className="w-40 h-40 sm:w-48 sm:h-48 relative p-1.5 bg-surface-container-lowest rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border border-outline-variant/40 cursor-pointer hover:border-outline-variant/80 transition-all"
                onClick={() => setIsFullscreenDp(true)}
              >
                <StoryRing
                  user={profileUser}
                  size="100%"
                  className="w-full h-full"
                  textClass="text-5xl sm:text-6xl"
                />
              </div>
            </div>

            {/* User Details (Name, Username, Status) */}
            <div className="text-center md:text-left w-full space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-spacetron text-on-surface tracking-tight leading-none">
                {profileUser.displayName}
              </h1>
              <p className="text-[15px] text-on-surface-variant/80 font-bold tracking-wide">@{profileUser.username}</p>


              {/* Unique Bio Display */}
              <div className="pt-5 pb-1 w-full max-w-sm mx-auto md:mx-0">
                <div className="relative text-left bg-surface-container-low border border-outline-variant/30 rounded-2xl p-4 shadow-sm group hover:border-outline-variant/60 transition-colors">
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary/80 rounded-r-full" />
                  <p className="text-[14px] text-on-surface-variant leading-relaxed font-medium pl-2 whitespace-pre-wrap italic">
                    {profileUser.bio ? `"${profileUser.bio}"` : "No status or bio available yet."}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col gap-3 pt-2">
              {!isSelf && (
                <>
                  {isYouBlocked && (
                    <button
                      onClick={handleUnblock}
                      className="w-full py-3 px-4 rounded-xl bg-primary text-white hover:opacity-90 transition-all text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm"
                    >
                      <ShieldAlert size={16} />
                      Unblock User
                    </button>
                  )}

                  {!isAnyBlocked && (
                    <>
                      {isFriend && (
                        <div className="w-full flex flex-col md:flex-row gap-2.5 bg-surface-container-lowest p-2 rounded-2xl border border-outline-variant/30 shadow-sm">
                          <button
                            onClick={handleMessage}
                            className="flex-1 py-3 px-4 bg-primary text-white hover:bg-primary/90 font-bold rounded-xl text-[13px] flex flex-row md:flex-col lg:flex-row items-center justify-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5"
                            title="Send Message"
                          >
                            <MessageSquare size={18} />
                            <span className="md:text-[11px] lg:text-[13px]">Message</span>
                          </button>
                          <button
                            onClick={() => triggerCall('voice')}
                            className="flex-1 py-3 px-4 bg-surface-container-low text-on-surface hover:bg-surface-container-high hover:text-primary font-bold rounded-xl text-[13px] flex flex-row md:flex-col lg:flex-row items-center justify-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 border border-outline-variant/40"
                            title="Voice Call"
                          >
                            <Phone size={18} />
                            <span className="md:text-[11px] lg:text-[13px]">Voice</span>
                          </button>
                          <button
                            onClick={() => triggerCall('video')}
                            className="flex-1 py-3 px-4 bg-surface-container-low text-on-surface hover:bg-surface-container-high hover:text-primary font-bold rounded-xl text-[13px] flex flex-row md:flex-col lg:flex-row items-center justify-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 border border-outline-variant/40"
                            title="Video Call"
                          >
                            <Video size={18} />
                            <span className="md:text-[11px] lg:text-[13px]">Video</span>
                          </button>
                        </div>
                      )}

                      {isFriend ? (
                        <button
                          onClick={handleUnfriend}
                          className="w-full py-3 px-4 rounded-xl bg-surface-container hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition-all text-[13px] font-bold flex items-center justify-center gap-2 border border-outline-variant/40"
                        >
                          <UserMinus size={16} />
                          Unfriend
                        </button>
                      ) : requestReceived ? (
                        <div className="flex gap-2 w-full">
                          <button
                            onClick={handleAcceptRequest}
                            className="flex-1 py-3 px-4 bg-primary hover:opacity-90 text-white font-bold rounded-xl text-[13px] flex items-center justify-center gap-2 shadow-sm transition-all"
                          >
                            <UserCheck size={16} />
                            Accept
                          </button>
                          <button
                            onClick={handleRejectRequest}
                            className="flex-1 py-3 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-red-500 transition-all text-[13px] font-bold flex items-center justify-center gap-2 border border-outline-variant/40"
                          >
                            <X size={16} />
                            Decline
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleAddFriend}
                          disabled={requestSent}
                          className={`w-full py-3 px-4 rounded-xl font-bold text-[13px] flex items-center justify-center gap-2 shadow-sm transition-all ${
                            requestSent
                              ? 'bg-surface-container-low border border-outline-variant/30 text-on-surface-variant/50 cursor-default'
                              : 'bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20'
                          }`}
                        >
                          {requestSent ? (
                            <>
                              <UserCheck size={16} />
                              Request Sent
                            </>
                          ) : (
                            <>
                              <UserPlus size={16} />
                              Add Friend
                            </>
                          )}
                        </button>
                      )}

                      <button
                        onClick={handleBlock}
                        className="w-full py-3 px-4 rounded-xl bg-surface-container hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 transition-all text-[13px] font-bold flex items-center justify-center gap-2 border border-outline-variant/40"
                      >
                        <ShieldAlert size={16} />
                        Block User
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
            
          </div>

          {/* RIGHT COLUMN: Profile Information */}
          <div className="flex flex-col w-full space-y-6 pt-2 md:pt-0">
            {isAnyBlocked ? (
              <div className="w-full py-12 flex flex-col items-center justify-center text-center select-none bg-red-500/5 rounded-[2rem] border border-red-500/15">
                <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="text-base font-bold text-red-500">
                  {isYouBlocked ? 'You Have Blocked This User' : 'Blocked User'}
                </h3>
                <p className="text-[13px] text-on-surface-variant/70 mt-1 max-w-[280px]">
                  {isYouBlocked
                    ? 'Unblock this user if you wish to allow requests or messaging.'
                    : 'You cannot interact with this user.'}
                </p>
              </div>
            ) : showFullProfile ? (
              <div className="space-y-6">
                {/* Orbit Connection Card */}
                {connectionData && !isSelf && (
                  <div className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-[2rem] p-6 sm:p-8">
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Globe size={18} />
                      Orbit Connection
                    </h3>

                    {(() => {
                      const formatDuration = (secs) => {
                        if (!secs) return '0m';
                        const h = Math.floor(secs / 3600);
                        const m = Math.floor((secs % 3600) / 60);
                        if (h > 0) return `${h}h ${m}m`;
                        return `${m}m`;
                      };

                      const stageInfo = getOrbitStage(connectionData.totalScore || 0);
                      const allStages = [
                        getOrbitStage(0),
                        getOrbitStage(100),
                        getOrbitStage(500),
                        getOrbitStage(2000),
                        getOrbitStage(5000),
                        getOrbitStage(10000),
                        getOrbitStage(50000)
                      ];

                      const activeStage = focusedStage || stageInfo;

                      return (
                        <div className="space-y-8">
                          {/* Current Stage Highlight */}
                          <div className="flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center text-primary shadow-sm border border-outline-variant/30 transition-all duration-500">
                              {stageInfo.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-xl font-bold text-on-surface">{stageInfo.name}</h4>
                              {stageInfo.next ? (
                                <p className="text-[13px] text-on-surface-variant mt-1 font-medium">
                                  <span className="text-primary font-bold">{stageInfo.next - connectionData.totalScore} Points Remaining</span> to {allStages[stageInfo.stage]?.name || 'Next Stage'}
                                </p>
                              ) : (
                                <p className="text-[13px] text-primary mt-1 font-bold">
                                  Max Connection Achieved! ({connectionData.totalScore.toLocaleString()} Points)
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Timeline Progress */}
                          <div className="relative pt-4 pb-2">
                            <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-surface-container -translate-y-1/2 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary transition-all duration-1000 ease-out rounded-full" 
                                style={{ width: `${Math.min(100, Math.max(0, ((stageInfo.stage - 1) * (100/6)) + (stageInfo.progress / 6)))}%` }}
                              />
                            </div>
                            <div className="relative flex justify-between">
                              {allStages.map((s, idx) => {
                                const isReached = idx < stageInfo.stage;
                                const isCurrent = idx === stageInfo.stage - 1;
                                return (
                                  <div 
                                    key={idx} 
                                    className="flex flex-col items-center gap-2 -mt-4 group relative cursor-pointer"
                                    onClick={() => setFocusedStage(s)}
                                    onMouseEnter={() => setFocusedStage(s)}
                                    onMouseLeave={() => setFocusedStage(null)}
                                  >
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                                      isCurrent ? 'bg-primary border-4 border-surface-container-lowest text-white scale-[1.15] shadow-md' :
                                      isReached ? 'bg-surface border border-outline-variant/50 text-primary hover:bg-surface-container-low' : 'bg-surface-container border border-transparent text-on-surface-variant/30 hover:text-on-surface-variant/60'
                                    }`}>
                                      {s.icon}
                                    </div>
                                    <span className={`text-[10px] font-bold hidden sm:block transition-colors ${isCurrent ? 'text-primary' : isReached ? 'text-on-surface' : 'text-on-surface-variant/40'}`}>
                                      {s.name}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Interactive Description */}
                          <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 text-center min-h-[80px] flex flex-col justify-center transition-all duration-300 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                            <h5 className="text-[13px] font-bold text-on-surface mb-1 flex items-center justify-center gap-2">
                              {activeStage.icon}
                              {activeStage.name}
                            </h5>
                            <p className="text-[12px] text-on-surface-variant leading-relaxed font-medium">
                              {activeStage.desc}
                            </p>
                          </div>

                          {/* Stats Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                            <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-1.5 border border-outline-variant/30 hover:border-outline-variant/60 transition-colors">
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                                <MessageSquare size={12} className="text-primary" />
                                Messages
                              </span>
                              <span className="text-xl font-black text-on-surface tracking-tight">{(connectionData.chatCount || 0).toLocaleString()}</span>
                            </div>
                            <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-1.5 border border-outline-variant/30 hover:border-outline-variant/60 transition-colors">
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                                <Phone size={12} className="text-primary" />
                                Voice Duration
                              </span>
                              <span className="text-xl font-black text-on-surface tracking-tight">{formatDuration(connectionData.voiceCallDuration)}</span>
                            </div>
                            <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-1.5 border border-outline-variant/30 hover:border-outline-variant/60 transition-colors">
                              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5">
                                <Video size={12} className="text-primary" />
                                Video Duration
                              </span>
                              <span className="text-xl font-black text-on-surface tracking-tight">{formatDuration(connectionData.videoCallDuration)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Info & Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">Joined</span>
                      <span className="text-sm font-bold text-on-surface">{formattedJoinDate}</span>
                    </div>
                  </div>
                  
                  <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-3xl p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Globe size={18} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-0.5">Role</span>
                      <span className="text-sm font-bold text-on-surface">{profileUser.role === 'admin' ? 'Admin' : 'Orbit Member'}</span>
                    </div>
                  </div>
                </div>

                {/* Social Links */}
                {activeSocials.length > 0 && (
                  <div className="w-full bg-surface-container-lowest border border-outline-variant/40 rounded-[2rem] p-6 sm:p-8">
                    <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4">Social Profiles</h3>
                    <div className="flex flex-wrap gap-4">
                      {activeSocials.map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url.startsWith('http') ? url : `https://${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={platform}
                          className="group relative w-12 h-12 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-all hover:scale-110 hover:-translate-y-1 cursor-pointer shadow-sm hover:shadow-md"
                        >
                          <SocialIcon platform={platform} />
                          <div className="absolute top-full mt-2 bg-surface-container-highest text-on-surface text-[10px] font-bold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none capitalize tracking-wider shadow-lg">
                            {platform}
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full py-16 flex flex-col items-center justify-center text-center select-none bg-surface-container-lowest/50 rounded-[2rem] border border-outline-variant/40">
                <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                  <ShieldAlert size={28} className="text-on-surface-variant/50" />
                </div>
                <h3 className="text-lg font-bold text-on-surface">This Profile is Private</h3>
                <p className="text-[13px] text-on-surface-variant/80 mt-2 max-w-[260px] leading-relaxed">
                  Add this user as a friend to see their bio, joined date, and send messages.
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
