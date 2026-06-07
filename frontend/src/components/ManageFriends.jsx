import { useEffect, useState } from 'react';
import { X, Users, Check, Trash2, Ban, MessageSquare, Loader2, UserX, Clock, UserPlus } from 'lucide-react';
import { useFriendStore } from '../store/useFriendStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useChatStore } from '../store/useChatStore';
import { useConfirmStore } from '../store/useConfirmStore';
import { useNavigate } from 'react-router-dom';

export default function ManageFriends() {
  const { setManageFriendsOpen } = useLayoutStore();
  const navigate = useNavigate();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    getFriends,
    getRequests,
    acceptRequest,
    rejectRequest,
    removeFriend,
    blockUser,
    isLoading,
  } = useFriendStore();

  const { accessChat } = useChatStore();

  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'requests'
  const [actionLoading, setActionLoading] = useState(null);


  useEffect(() => {
    getFriends();
    getRequests();
  }, [getFriends, getRequests]);

  const totalRequests = incomingRequests.length;

  const handleMessage = async (userId) => {
    await accessChat(userId);
    setManageFriendsOpen(false);
    navigate('/');
  };

  const handleRemove = async (userId) => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Remove Friend",
      message: "Remove this friend?",
      confirmText: "Remove",
      danger: true
    });
    if (!confirmed) return;
    setActionLoading(`remove-${userId}`);
    await removeFriend(userId);
    setActionLoading(null);
  };

  const handleBlock = async (userId) => {
    const confirmed = await useConfirmStore.getState().confirm({
      title: "Block User",
      message: "Block this user?",
      confirmText: "Block",
      danger: true
    });
    if (!confirmed) return;
    setActionLoading(`block-${userId}`);
    await blockUser(userId);
    setActionLoading(null);
  };

  const handleAccept = async (userId) => {
    setActionLoading(`accept-${userId}`);
    await acceptRequest(userId);
    setActionLoading(null);
  };

  const handleReject = async (userId) => {
    setActionLoading(`reject-${userId}`);
    await rejectRequest(userId);
    setActionLoading(null);
  };

  const handleCancelOutgoing = async (userId) => {
    setActionLoading(`cancel-${userId}`);
    await removeFriend(userId);
    await getRequests();
    setActionLoading(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface h-full shadow-2xl flex flex-col border-l border-outline-variant/60">
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/60 bg-surface-container-low flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Users size={18} className="text-primary" />
            <h3 className="text-base font-black text-on-surface tracking-tight">Manage Friends</h3>
          </div>
          <button
            onClick={() => setManageFriendsOpen(false)}
            className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/60 shrink-0">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
              activeTab === 'friends'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Friends ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 relative cursor-pointer ${
              activeTab === 'requests'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Requests
            {totalRequests > 0 && (
              <span className="absolute top-2 right-6 w-4 h-4 bg-primary rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                {totalRequests}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}

          {/* --- FRIENDS TAB --- */}
          {!isLoading && activeTab === 'friends' && (
            <div className="p-3 flex flex-col gap-2">
              {friends.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center select-none">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <Users size={24} />
                  </div>
                  <p className="text-sm font-bold text-on-surface">No friends yet</p>
                  <p className="text-xs text-on-surface-variant/70 mt-1 max-w-[200px] leading-relaxed">
                    Use "Search Friends" to find and add people to your network.
                  </p>
                </div>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend._id}
                    className="bg-surface-container-low border border-outline-variant/40 rounded-2xl p-3.5 hover:border-outline-variant/80 transition-colors"
                  >
                    <div 
                      onClick={() => {
                        setManageFriendsOpen(false);
                        navigate(`/user-profile/${friend._id}`);
                      }}
                      className="flex items-center gap-3 mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={
                          friend.profilePic ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName)}&background=random`
                        }
                        alt={friend.username}
                        className="w-10 h-10 rounded-full object-cover shadow-sm shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-on-surface truncate">{friend.displayName}</p>
                        <p className="text-[11px] text-on-surface-variant">@{friend.username}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleMessage(friend._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary/10 text-primary rounded-xl text-[11px] font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                      >
                        <MessageSquare size={12} /> Message
                      </button>
                      <button
                        onClick={() => handleBlock(friend._id)}
                        disabled={actionLoading === `block-${friend._id}`}
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-amber-500/10 text-amber-600 rounded-xl text-[11px] font-bold hover:bg-amber-500/20 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `block-${friend._id}` ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Ban size={12} />
                        )}
                      </button>
                      <button
                        onClick={() => handleRemove(friend._id)}
                        disabled={actionLoading === `remove-${friend._id}`}
                        className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-red-500/10 text-red-500 rounded-xl text-[11px] font-bold hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {actionLoading === `remove-${friend._id}` ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* --- REQUESTS TAB --- */}
          {!isLoading && activeTab === 'requests' && (
            <div className="p-3 flex flex-col gap-4">
              {/* Incoming */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1 mb-2 flex items-center gap-1.5">
                  <UserPlus size={12} className="text-green-500" /> Incoming ({incomingRequests.length})
                </p>
                {incomingRequests.length === 0 ? (
                  <p className="text-[11px] text-on-surface-variant/60 pl-1 font-medium">No pending requests</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {incomingRequests.map((req) => (
                      <div
                        key={req._id}
                        className="flex items-center gap-3 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/40"
                      >
                        <img
                          src={
                            req.profilePic ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(req.displayName)}&background=random`
                          }
                          alt={req.username}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-on-surface truncate">{req.displayName}</p>
                          <p className="text-[11px] text-on-surface-variant">@{req.username}</p>
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => handleAccept(req._id)}
                            disabled={actionLoading === `accept-${req._id}`}
                            className="p-2 bg-green-500/10 text-green-600 rounded-xl hover:bg-green-500/20 transition-colors cursor-pointer disabled:opacity-50"
                            title="Accept"
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
                            className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                            title="Ignore"
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

              {/* Outgoing */}
              <div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-1 mb-2 flex items-center gap-1.5">
                  <Clock size={12} className="text-amber-500" /> Sent ({outgoingRequests.length})
                </p>
                {outgoingRequests.length === 0 ? (
                  <p className="text-[11px] text-on-surface-variant/60 pl-1 font-medium">No sent requests</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {outgoingRequests.map((req) => (
                      <div
                        key={req._id}
                        className="flex items-center gap-3 p-3 bg-surface-container-low rounded-2xl border border-outline-variant/40"
                      >
                        <img
                          src={
                            req.profilePic ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(req.displayName)}&background=random`
                          }
                          alt={req.username}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-on-surface truncate">{req.displayName}</p>
                          <p className="text-[11px] text-on-surface-variant">@{req.username}</p>
                        </div>
                        <button
                          onClick={() => handleCancelOutgoing(req._id)}
                          disabled={actionLoading === `cancel-${req._id}`}
                          className="px-2.5 py-1.5 bg-outline-variant/30 text-on-surface hover:bg-red-500/10 hover:text-red-500 text-[10px] font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                          {actionLoading === `cancel-${req._id}` ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            'Cancel'
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
