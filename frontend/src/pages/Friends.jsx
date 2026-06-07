import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriendStore } from '../store/useFriendStore';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Users, Search, UserPlus, UserCheck, UserX, Loader2, ArrowLeft, 
  Check, X, Trash2, Ban, MessageSquare, Clock, Inbox, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirmStore } from '../store/useConfirmStore';

export default function Friends() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { accessChat } = useChatStore();
  
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    searchResults,
    searchUsers,
    isSearching,
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    blockUser,
    getFriends,
    getRequests,
    isLoading,
  } = useFriendStore();

  const [activeTab, setActiveTab] = useState('my-friends'); // 'my-friends', 'search-friends', 'pending-requests'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    getFriends();
    getRequests();
  }, []);

  // Auto focus search input when entering search tab
  useEffect(() => {
    if (activeTab === 'search-friends') {
      setTimeout(() => searchInputRef.current?.focus(), 150);
    }
  }, [activeTab]);

  const handleSearchChange = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    searchUsers(q);
  };

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
    if (confirmed) {
      setActionLoading(`remove-${userId}`);
      await removeFriend(userId);
      setActionLoading(null);
      toast.success('Friend removed');
    }
  };

  const handleBlock = async (userId) => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Block User",
      message: "Are you sure you want to block this user?",
      confirmText: "Block",
      danger: true
    });
    if (confirmed) {
      setActionLoading(`block-${userId}`);
      await blockUser(userId);
      setActionLoading(null);
      toast.success('User blocked');
    }
  };

  const handleAccept = async (userId) => {
    setActionLoading(`accept-${userId}`);
    await acceptRequest(userId);
    setActionLoading(null);
    toast.success('Request accepted');
  };

  const handleReject = async (userId) => {
    setActionLoading(`reject-${userId}`);
    await rejectRequest(userId);
    setActionLoading(null);
    toast.success('Request ignored');
  };

  const handleCancelOutgoing = async (userId) => {
    setActionLoading(`cancel-${userId}`);
    await removeFriend(userId);
    await getRequests();
    setActionLoading(null);
    toast.success('Request cancelled');
  };

  const isFriend = (userId) => (friends || []).some((f) => f && f._id === userId);
  const hasSentRequest = (userId) => (outgoingRequests || []).some((r) => r && r._id === userId);

  const totalRequestsCount = (incomingRequests || []).length;

  return (
    <div className="flex-1 h-full flex flex-col w-full bg-background overflow-hidden border-l border-outline-variant/60 font-sans text-on-surface">
      {/* Header */}
      <div className="h-[60px] bg-background flex items-center justify-between px-6 shrink-0 border-b border-outline-variant/60 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors md:hidden flex items-center"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-tight">Friends</h2>
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-outline-variant/40 bg-surface shrink-0 px-6 py-2 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('my-friends')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'my-friends'
              ? 'bg-primary/10 text-primary'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          My Friends ({(friends || []).length})
        </button>
        <button
          onClick={() => setActiveTab('search-friends')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
            activeTab === 'search-friends'
              ? 'bg-primary/10 text-primary'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          Find Friends
        </button>
        <button
          onClick={() => setActiveTab('pending-requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 relative flex items-center gap-1.5 ${
            activeTab === 'pending-requests'
              ? 'bg-primary/10 text-primary'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          Pending Requests
          {totalRequestsCount > 0 && (
            <span className="w-4.5 h-4.5 rounded-full bg-primary text-white text-[9px] flex items-center justify-center font-bold">
              {totalRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Panel Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin text-primary w-6 h-6" />
            </div>
          )}

          {/* Tab 1: My Friends */}
          {!isLoading && activeTab === 'my-friends' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 pl-1">All Friends</h3>
              
              {(friends || []).length === 0 ? (
                <div className="text-center py-16 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm">
                  <Users className="mx-auto text-on-surface-variant/30 mb-3" size={36} />
                  <p className="text-sm font-bold">No friends yet</p>
                  <p className="text-xs text-on-surface-variant/80 mt-1">Go to "Find Friends" to start adding contacts!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(friends || []).map((friend) => (
                    <div
                      key={friend._id}
                      className="bg-surface border border-outline-variant/60 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={friend.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName)}&background=random`}
                          alt={friend.username}
                          className="w-11 h-11 rounded-full object-cover shadow-sm shrink-0"
                        />
                        <div>
                          <p className="font-bold text-sm text-on-surface leading-tight">{friend.displayName}</p>
                          <p className="text-xs text-on-surface-variant">@{friend.username}</p>
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleMessage(friend._id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                        >
                          <MessageSquare size={13} /> Message
                        </button>
                        <button
                          onClick={() => handleBlock(friend._id)}
                          disabled={actionLoading === `block-${friend._id}`}
                          className="p-2 bg-amber-500/10 text-amber-600 rounded-xl hover:bg-amber-500/20 transition-all cursor-pointer"
                          title="Block"
                        >
                          {actionLoading === `block-${friend._id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Ban size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleRemove(friend._id)}
                          disabled={actionLoading === `remove-${friend._id}`}
                          className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer"
                          title="Remove Friend"
                        >
                          {actionLoading === `remove-${friend._id}` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Find Friends */}
          {!isLoading && activeTab === 'search-friends' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 pl-1">Search Directory</h3>
              
              {/* Search bar input */}
              <div className="relative flex items-center bg-surface border border-outline-variant/60 rounded-2xl h-[46px] focus-within:border-primary transition-colors overflow-hidden mb-6">
                <div className="pl-4 pr-2 text-on-surface-variant shrink-0">
                  <Search size={16} strokeWidth={2.5} />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Enter username or display name..."
                  className="flex-1 h-full bg-transparent text-sm font-semibold text-on-surface placeholder-on-surface-variant/50 outline-none pr-4"
                />
                {isSearching && (
                  <div className="pr-4 shrink-0">
                    <Loader2 size={15} className="animate-spin text-primary" />
                  </div>
                )}
              </div>

              {!searchQuery.trim() ? (
                <div className="text-center py-16 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm select-none">
                  <Users className="mx-auto text-primary mb-3" size={32} />
                  <p className="text-sm font-bold">Search for people</p>
                  <p className="text-xs text-on-surface-variant/80 mt-1 max-w-sm mx-auto leading-relaxed px-4">
                    Type above to search through all users in the Orbit messaging network and add them.
                  </p>
                </div>
              ) : isSearching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (searchResults || []).length === 0 ? (
                <div className="text-center py-16 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm">
                  <Inbox className="mx-auto text-on-surface-variant/40 mb-3" size={32} />
                  <p className="text-sm font-bold">No results found</p>
                  <p className="text-xs text-on-surface-variant/80 mt-1">We couldn't find any users matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(searchResults || []).map((userItem) => {
                    const alreadyFriend = isFriend(userItem?._id);
                    const requestSent = hasSentRequest(userItem._id);

                    return (
                      <div
                        key={userItem._id}
                        onClick={() => navigate(`/user-profile/${userItem._id}`)}
                        className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={userItem.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(userItem.displayName)}&background=random`}
                            alt={userItem.username}
                            className="w-11 h-11 rounded-full object-cover shadow-sm shrink-0"
                          />
                          <div>
                            <p className="font-bold text-sm text-on-surface leading-tight">{userItem.displayName}</p>
                            <p className="text-xs text-on-surface-variant">@{userItem.username}</p>
                          </div>
                        </div>

                        <ChevronRight className="text-on-surface-variant/50" size={20} />

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Pending Requests */}
          {!isLoading && activeTab === 'pending-requests' && (
            <div className="space-y-6">
              {/* Incoming Requests */}
              <div>
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 pl-1 flex items-center gap-1.5">
                  <UserPlus size={13} className="text-green-500" /> Incoming Requests ({(incomingRequests || []).length})
                </h4>

                {(incomingRequests || []).length === 0 ? (
                  <p className="text-xs text-on-surface-variant/70 pl-1 italic">No pending incoming requests</p>
                ) : (
                  <div className="space-y-3">
                    {(incomingRequests || []).map((req) => (
                      <div
                        key={req._id}
                        className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={req.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.displayName)}&background=random`}
                            alt={req.username}
                            className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0"
                          />
                          <div>
                            <p className="font-bold text-sm text-on-surface leading-tight">{req.displayName}</p>
                            <p className="text-xs text-on-surface-variant">@{req.username}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleAccept(req._id)}
                            disabled={actionLoading === `accept-${req._id}`}
                            className="p-2 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500/20 transition-all cursor-pointer disabled:opacity-50"
                            title="Accept Request"
                          >
                            {actionLoading === `accept-${req._id}` ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                          </button>
                          <button
                            onClick={() => handleReject(req._id)}
                            disabled={actionLoading === `reject-${req._id}`}
                            className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                            title="Decline Request"
                          >
                            {actionLoading === `reject-${req._id}` ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <X size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Requests */}
              <div className="pt-6 border-t border-outline-variant/40">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3 pl-1 flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-500" /> Sent Requests ({(outgoingRequests || []).length})
                </h4>

                {(outgoingRequests || []).length === 0 ? (
                  <p className="text-xs text-on-surface-variant/70 pl-1 italic">No pending sent requests</p>
                ) : (
                  <div className="space-y-3">
                    {(outgoingRequests || []).map((req) => (
                      <div
                        key={req._id}
                        className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={req.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.displayName)}&background=random`}
                            alt={req.username}
                            className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0"
                          />
                          <div>
                            <p className="font-bold text-sm text-on-surface leading-tight">{req.displayName}</p>
                            <p className="text-xs text-on-surface-variant">@{req.username}</p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleCancelOutgoing(req._id)}
                          disabled={actionLoading === `cancel-${req._id}`}
                          className="px-3 py-2 bg-outline-variant/20 hover:bg-red-500/10 hover:text-red-500 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === `cancel-${req._id}` ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            'Cancel Request'
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
