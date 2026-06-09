import { useEffect, useState, useRef } from 'react';
import {
  X, Users, UserPlus, ShieldBan, MessageSquare,
  Search, Loader2, Check, UserMinus, Hash, Clock, Inbox, ArrowLeft
} from 'lucide-react';
import { useFriendStore } from '../store/useFriendStore';
import { useAuthStore } from '../store/useAuthStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useChatStore } from '../store/useChatStore';
import { useConfirmStore } from '../store/useConfirmStore';
import Avatar from '../components/ui/Avatar';
import { useNavigate } from 'react-router-dom';

export default function Friends() {
  const navigate = useNavigate();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    searchResults,
    isSearching,
    searchUsers,
    getFriends,
    getRequests,
    acceptRequest,
    rejectRequest,
    removeFriend,
    sendRequest,
    blockUser,
    isLoading,
  } = useFriendStore();

  const { accessChat } = useChatStore();

  const [activeNav, setActiveNav] = useState('friends'); // 'friends' | 'incoming' | 'outgoing' | 'search'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    getFriends();
    getRequests();
  }, [getFriends, getRequests]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim()) {
        searchUsers(searchQuery);
        setActiveNav('search');
      } else {
        if (activeNav === 'search') setActiveNav('friends');
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleMessage = async (userId) => {
    await accessChat(userId);
    navigate('/');
  };

  const handleRemove = async (userId) => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Remove Friend",
      message: "Are you sure you want to remove this friend?",
      confirmText: "Remove",
      danger: true
    });
    if (!confirmed) return;
    setActionLoading(`remove-${userId}`);
    await removeFriend(userId);
    if (selectedUser?._id === userId) setSelectedUser(null);
    setActionLoading(null);
  };

  const handleBlock = async (userId) => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Block User",
      message: "Are you sure you want to block this user?",
      confirmText: "Block",
      danger: true
    });
    if (!confirmed) return;
    setActionLoading(`block-${userId}`);
    await blockUser(userId);
    if (selectedUser?._id === userId) setSelectedUser(null);
    setActionLoading(null);
  };

  const handleAccept = async (userId) => {
    setActionLoading(`accept-${userId}`);
    await acceptRequest(userId);
    if (selectedUser?._id === userId) setSelectedUser(null);
    setActionLoading(null);
  };

  const handleReject = async (userId) => {
    setActionLoading(`reject-${userId}`);
    await rejectRequest(userId);
    if (selectedUser?._id === userId) setSelectedUser(null);
    setActionLoading(null);
  };

  const handleSendRequest = async (userId) => {
    setActionLoading(`send-${userId}`);
    await sendRequest(userId);
    setActionLoading(null);
  };

  const handleCancelOutgoing = async (userId) => {
    setActionLoading(`cancel-${userId}`);
    await removeFriend(userId);
    await getRequests();
    if (selectedUser?._id === userId) setSelectedUser(null);
    setActionLoading(null);
  };

  const renderLeftPanel = () => (
    <div className="w-full md:w-[280px] bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col h-full shrink-0">
      <div className="px-5 py-6 shrink-0 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1 text-on-surface-variant hover:text-on-surface transition-colors md:hidden flex items-center"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-lg font-black text-on-surface tracking-tight flex items-center gap-2">
          <Users size={20} className="text-primary" />
          Orbit Network
        </h2>
      </div>

      <div className="px-4 mb-6 shrink-0">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            type="text"
            ref={searchInputRef}
            placeholder="Search network..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-low text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none border border-outline-variant/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all text-on-surface placeholder:text-on-surface-variant/70 shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 space-y-1">
        <div className="px-2 mb-2 text-[10px] font-bold tracking-wider text-on-surface-variant/70 uppercase">Management</div>

        <button
          onClick={() => { setActiveNav('friends'); setSelectedUser(null); }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeNav === 'friends' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}
        >
          <div className="flex items-center gap-3"><Users size={18} /> My Friends</div>
          {friends.length > 0 && <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full">{friends.length}</span>}
        </button>

        <button
          onClick={() => { setActiveNav('incoming'); setSelectedUser(null); }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeNav === 'incoming' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}
        >
          <div className="flex items-center gap-3"><Inbox size={18} /> Incoming Requests</div>
          {incomingRequests.length > 0 && <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full">{incomingRequests.length}</span>}
        </button>

        <button
          onClick={() => { setActiveNav('outgoing'); setSelectedUser(null); }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${activeNav === 'outgoing' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface-variant hover:text-on-surface'}`}
        >
          <div className="flex items-center gap-3"><UserPlus size={18} /> Outgoing Requests</div>
          {outgoingRequests.length > 0 && <span className="text-[10px] bg-surface-container px-2 py-0.5 rounded-full">{outgoingRequests.length}</span>}
        </button>

        {activeNav === 'search' && (
          <div className="mt-6">
            <div className="px-2 mb-2 text-[10px] font-bold tracking-wider text-primary uppercase">Search Results</div>
          </div>
        )}
      </div>
    </div>
  );

  const getActiveList = () => {
    switch (activeNav) {
      case 'friends': return friends;
      case 'incoming': return incomingRequests;
      case 'outgoing': return outgoingRequests;
      case 'search': return searchResults;
      default: return [];
    }
  };

  const getListTitle = () => {
    switch (activeNav) {
      case 'friends': return 'All Friends';
      case 'incoming': return 'Pending Invitations';
      case 'outgoing': return 'Sent Invitations';
      case 'search': return `Search Results for "${searchQuery}"`;
      default: return '';
    }
  };

  const renderMainPanel = () => {
    const list = getActiveList();

    return (
      <div className="hidden md:flex flex-1 flex-col bg-surface h-full min-w-0">
        <div className="px-8 py-6 border-b border-outline-variant/30 flex items-center justify-between shrink-0">
          <h3 className="text-xl font-bold text-on-surface tracking-tight">{getListTitle()}</h3>
          <div className="text-sm font-semibold text-on-surface-variant/70 bg-surface-container-low px-3 py-1 rounded-full border border-outline-variant/30">
            {list.length} {list.length === 1 ? 'User' : 'Users'}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-4">
          {isLoading || isSearching ? (
            <div className="space-y-2 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-3 rounded-xl border border-outline-variant/10 bg-surface-container-lowest animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0"></div>
                  <div className="flex-1 space-y-2.5 py-1">
                    <div className="h-3.5 bg-surface-container-high rounded-md w-32"></div>
                    <div className="h-2.5 bg-surface-container-high rounded-md w-24 opacity-60"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface-container-high shrink-0"></div>
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center select-none h-full">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full"></div>
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-surface-container to-surface-container-high flex items-center justify-center text-primary border border-outline-variant/30 shadow-xl">
                  <Users size={32} />
                </div>
              </div>
              <p className="text-on-surface font-black text-xl mb-2 tracking-tight">
                {activeNav === 'search' ? "No results found" : "It's quiet here..."}
              </p>
              <p className="text-on-surface-variant text-sm max-w-[280px] leading-relaxed">
                {activeNav === 'search' 
                  ? "We couldn't find anyone matching your search. Try different keywords." 
                  : "You don't have anyone in this list yet. Start connecting with others to grow your network!"}
              </p>
              {activeNav === 'friends' && (
                <button 
                  onClick={() => { setActiveNav('search'); setSelectedUser(null); }}
                  className="mt-6 px-6 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full text-sm font-bold transition-colors cursor-pointer"
                >
                  Find Friends
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              {list.map((user) => (
                <div
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-xl cursor-pointer transition-all border ${selectedUser?._id === user._id
                      ? 'bg-primary/5 border-primary/20'
                      : 'bg-surface hover:bg-surface-container-lowest border-transparent hover:border-outline-variant/30'
                    }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center overflow-hidden shrink-0">
                      <Avatar src={user.profilePic} name={user.displayName || user.username} sizeClass="w-full h-full" textClass="text-sm" />
                    </div>
                    {activeNav === 'friends' && (
                      <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${user.isOnline ? 'bg-emerald-500' : 'bg-on-surface-variant/40'}`} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-on-surface truncate">
                        {user.displayName || user.username}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-on-surface-variant truncate">
                      @{user.username}
                    </span>
                  </div>

                  {/* Primary Action Button directly on row (hover or always visible depending on state) */}
                  <div className="shrink-0 flex items-center gap-2">
                    {activeNav === 'incoming' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAccept(user._id); }}
                        disabled={actionLoading === `accept-${user._id}`}
                        className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {actionLoading === `accept-${user._id}` ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                        Accept
                      </button>
                    )}
                    {activeNav === 'friends' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMessage(user._id); }}
                        className="w-8 h-8 rounded-full bg-surface-container hover:bg-primary/10 hover:text-primary flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
                      >
                        <MessageSquare size={14} />
                      </button>
                    )}
                    {activeNav === 'outgoing' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCancelOutgoing(user._id); }}
                        disabled={actionLoading === `cancel-${user._id}`}
                        className="px-4 py-1.5 bg-surface-container hover:bg-red-500/10 text-on-surface hover:text-red-500 rounded-lg text-xs font-bold transition-colors border border-outline-variant/30 cursor-pointer"
                      >
                        {actionLoading === `cancel-${user._id}` ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderDetailsPanel = () => {
    if (!selectedUser) {
      return (
        <div className="w-[320px] bg-surface-container-lowest border-l border-outline-variant/30 h-full hidden lg:flex flex-col shrink-0 relative overflow-y-auto">
          {/* Header Area */}
          <div className="p-8 pb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10"></div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary mb-6 shadow-sm border border-primary/20 relative z-10">
              <Users size={28} />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-on-surface relative z-10">Orbit Network</h3>
            <p className="text-on-surface-variant text-sm mt-2 leading-relaxed relative z-10">
              Manage your connections, find new friends, and build your secured community.
            </p>
          </div>
          
          <div className="px-8 py-2">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70 mb-4">
              Network Overview
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-outline-variant/20 shadow-sm transition-all hover:border-primary/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Users size={16} />
                  </div>
                  <span className="text-sm font-bold text-on-surface">Total Friends</span>
                </div>
                <span className="text-lg font-black text-on-surface">{friends.length}</span>
              </div>
              
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-outline-variant/20 shadow-sm transition-all hover:border-amber-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Inbox size={16} />
                  </div>
                  <span className="text-sm font-bold text-on-surface">Pending Invites</span>
                </div>
                <span className="text-lg font-black text-on-surface">{incomingRequests.length}</span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-surface border border-outline-variant/20 shadow-sm transition-all hover:border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <UserPlus size={16} />
                  </div>
                  <span className="text-sm font-bold text-on-surface">Sent Invites</span>
                </div>
                <span className="text-lg font-black text-on-surface">{outgoingRequests.length}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 px-8 py-8 flex flex-col justify-end">
             <div className="w-full h-32 rounded-3xl bg-gradient-to-t from-surface-container to-transparent border border-outline-variant/10 flex items-end justify-center pb-6">
               <div className="flex items-center gap-2 opacity-50">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                 <span className="text-[10px] font-bold text-on-surface-variant tracking-widest uppercase">End-to-End Encrypted</span>
               </div>
             </div>
          </div>
        </div>
      );
    }

    let relationship = 'none';
    if (friends.some(f => f._id === selectedUser._id)) relationship = 'friend';
    else if (incomingRequests.some(r => r._id === selectedUser._id)) relationship = 'incoming';
    else if (outgoingRequests.some(r => r._id === selectedUser._id)) relationship = 'outgoing';

    return (
      <div className="w-full md:w-[320px] bg-surface-container-lowest border-l border-outline-variant/30 h-full flex flex-col shrink-0 relative">
        <button
          onClick={() => setSelectedUser(null)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors z-10 hidden xl:block cursor-pointer"
        >
          <X size={20} />
        </button>
        <button
          onClick={() => setSelectedUser(null)}
          className="absolute top-6 left-6 p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors z-10 md:hidden bg-surface/50 backdrop-blur-sm cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex-1 overflow-y-auto">
          <div className="h-32 bg-gradient-to-br from-primary/20 to-surface-container-high relative">
            <div className="absolute -bottom-10 left-6">
              <div className="w-20 h-20 rounded-2xl bg-surface p-1 shadow-lg">
                <div className="w-full h-full rounded-xl bg-surface-container-highest flex items-center justify-center overflow-hidden border border-outline-variant/20">
                  <Avatar src={selectedUser.profilePic} name={selectedUser.displayName || selectedUser.username} sizeClass="w-full h-full" textClass="text-3xl" roundedClass="rounded-none" />
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 pt-14 pb-6 border-b border-outline-variant/20">
            <h2 className="text-xl font-black text-on-surface leading-tight">
              {selectedUser.displayName || selectedUser.username}
            </h2>
            <p className="text-sm font-semibold text-on-surface-variant mt-0.5">
              @{selectedUser.username}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-container text-[11px] font-bold text-on-surface-variant border border-outline-variant/30">
                <Clock size={12} /> Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70 mb-3">
                Quick Actions
              </h4>
              <div className="flex flex-col gap-2">
                {(activeNav === 'friends' || relationship === 'friend') && (
                  <>
                    <button
                      onClick={() => handleMessage(selectedUser._id)}
                      className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare size={16} /> Direct Message
                    </button>
                    <button
                      onClick={() => handleRemove(selectedUser._id)}
                      disabled={actionLoading === `remove-${selectedUser._id}`}
                      className="w-full py-2.5 bg-surface-container hover:bg-red-500/10 text-on-surface hover:text-red-500 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-outline-variant/30 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === `remove-${selectedUser._id}` ? <Loader2 size={16} className="animate-spin" /> : <UserMinus size={16} />}
                      Remove Connection
                    </button>
                  </>
                )}

                {(activeNav === 'incoming' || relationship === 'incoming') && (
                  <>
                    <button
                      onClick={() => handleAccept(selectedUser._id)}
                      disabled={actionLoading === `accept-${selectedUser._id}`}
                      className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === `accept-${selectedUser._id}` ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      Accept Request
                    </button>
                    <button
                      onClick={() => handleReject(selectedUser._id)}
                      disabled={actionLoading === `reject-${selectedUser._id}`}
                      className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-outline-variant/30 cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === `reject-${selectedUser._id}` ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                      Decline
                    </button>
                  </>
                )}

                {(activeNav === 'outgoing' || relationship === 'outgoing') && (
                  <button
                    onClick={() => handleCancelOutgoing(selectedUser._id)}
                    disabled={actionLoading === `cancel-${selectedUser._id}`}
                    className="w-full py-2.5 bg-surface-container hover:bg-red-500/10 text-on-surface hover:text-red-500 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-outline-variant/30 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === `cancel-${selectedUser._id}` ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                    Cancel Invitation
                  </button>
                )}

                {(activeNav === 'search' && relationship === 'none') && (
                  <button
                    onClick={() => handleSendRequest(selectedUser._id)}
                    disabled={actionLoading === `send-${selectedUser._id}`}
                    className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading === `send-${selectedUser._id}` ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    Send Invite
                  </button>
                )}

              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/70 mb-3">
                Security & Moderation
              </h4>
              <button
                onClick={() => handleBlock(selectedUser._id)}
                disabled={actionLoading === `block-${selectedUser._id}`}
                className="w-full py-2.5 bg-surface-container hover:bg-red-500/10 text-on-surface hover:text-red-500 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 border border-outline-variant/30 cursor-pointer disabled:opacity-50"
              >
                {actionLoading === `block-${selectedUser._id}` ? <Loader2 size={16} className="animate-spin" /> : <ShieldBan size={16} />}
                Block User
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex w-full h-full bg-surface overflow-hidden relative">
      {/* Mobile slide architecture */}
      <div className={`w-full h-full flex flex-col md:hidden absolute inset-0 transition-transform duration-300 bg-surface ${selectedUser ? '-translate-x-full' : 'translate-x-0'}`}>
        <div className="px-5 py-4 border-b border-outline-variant/30 flex items-center gap-3 bg-surface-container-low shrink-0">
          <button onClick={() => navigate(-1)} className="p-1 text-on-surface-variant hover:text-on-surface transition-colors flex items-center">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
            <Users size={20} className="text-primary" /> Orbit Network
          </h2>
        </div>

        <div className="px-4 py-3 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low text-sm rounded-xl pl-9 pr-4 py-2.5 outline-none border border-outline-variant/30 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex overflow-x-auto px-4 gap-2 pb-3 shrink-0 no-scrollbar border-b border-outline-variant/30">
          <button onClick={() => { setActiveNav('friends'); setSelectedUser(null); }} className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeNav === 'friends' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'}`}>
            Friends ({friends.length})
          </button>
          <button onClick={() => { setActiveNav('incoming'); setSelectedUser(null); }} className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeNav === 'incoming' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'}`}>
            Incoming ({incomingRequests.length})
          </button>
          <button onClick={() => { setActiveNav('outgoing'); setSelectedUser(null); }} className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${activeNav === 'outgoing' ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'}`}>
            Outgoing ({outgoingRequests.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 space-y-2">
            {getActiveList().map(user => (
              <div key={user._id} onClick={() => setSelectedUser(user)} className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 active:bg-surface-container-low cursor-pointer">
                <div className="w-12 h-12 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center overflow-hidden shrink-0 relative">
                  <Avatar src={user.profilePic} name={user.displayName || user.username} sizeClass="w-full h-full" textClass="text-base" />
                  {activeNav === 'friends' && <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface ${user.isOnline ? 'bg-emerald-500' : 'bg-on-surface-variant/40'}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-on-surface truncate">{user.displayName || user.username}</div>
                  <div className="text-xs text-on-surface-variant truncate">@{user.username}</div>
                </div>
              </div>
            ))}
            {getActiveList().length === 0 && (
              <div className="text-center py-20 text-on-surface-variant text-sm">Nothing to show here.</div>
            )}
          </div>
        </div>
      </div>

      <div className={`w-full h-full flex md:hidden absolute inset-0 transition-transform duration-300 bg-surface ${selectedUser ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedUser && renderDetailsPanel()}
      </div>

      {/* Desktop Layout (fills the container entirely) */}
      <div className="hidden md:flex w-full h-full">
        {renderLeftPanel()}
        {renderMainPanel()}
        {renderDetailsPanel()}
      </div>
    </div>
  );
}
