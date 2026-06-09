import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Trash2, Ban, Archive, MessageSquare } from 'lucide-react';
import { useFriendStore } from '../store/useFriendStore';
import { useChatStore } from '../store/useChatStore';
import { useNavigate } from 'react-router-dom';

export default function Contacts() {
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(null);
  
  const { 
    friends,
    getFriends,
    isLoading,
    removeFriend,
    blockUser
  } = useFriendStore();

  const { accessChat } = useChatStore();

  useEffect(() => {
    getFriends();
  }, [getFriends]);

  const handleRemove = async (userId) => {
    if (window.confirm("Are you sure you want to remove this friend?")) {
      setActionLoading(`remove-${userId}`);
      await removeFriend(userId);
      setActionLoading(null);
    }
  };

  const handleBlock = async (userId) => {
    if (window.confirm("Are you sure you want to block this user?")) {
      setActionLoading(`block-${userId}`);
      await blockUser(userId);
      setActionLoading(null);
    }
  };

  const handleMessage = (userId) => {
    accessChat(userId);
    navigate('/');
  };

  const handleArchive = (userId) => {
    alert("Archive chat feature coming soon!");
  };

  return (
    <div className="flex-1 h-full flex flex-col w-full bg-surface overflow-hidden border-l border-outline-variant/60">
      {/* Header */}
      <div className="h-[60px] bg-surface flex items-center px-6 shrink-0 z-10 border-b border-outline-variant/60">
        <button onClick={() => navigate(-1)} className="p-1 mr-3 text-on-surface-variant md:hidden">
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <h2 className="text-xl font-bold tracking-tight text-on-surface">Manage Contacts</h2>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-background">
        <div className="max-w-2xl mx-auto space-y-6">
          <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-3 pl-1">Your Friends</h3>
          
          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : friends.length === 0 ? (
            <p className="text-sm text-on-surface-variant/80 pl-1 text-center mt-10">You have no friends yet.</p>
          ) : (
            <div className="space-y-3">
              {friends.map(friend => (
                <div key={friend._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/60 gap-4 shadow-sm hover:shadow transition-shadow">
                  <div className="flex items-center gap-4">
                    <img src={friend.profilePic || '/logo.png'} alt="avatar" className="w-12 h-12 rounded-full object-cover shadow-sm" />
                    <div>
                      <p className="text-[16px] font-bold text-on-surface">{friend.displayName}</p>
                      <p className="text-xs text-on-surface-variant">@{friend.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleMessage(friend._id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-surface-container-low text-on-surface rounded-xl hover:bg-surface-container-high transition-colors text-xs font-semibold cursor-pointer"
                    >
                      <MessageSquare size={14} /> Message
                    </button>
                    <button 
                      onClick={() => handleArchive(friend._id)}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-surface-container-low text-on-surface rounded-xl hover:bg-surface-container-high transition-colors text-xs font-semibold cursor-pointer"
                    >
                      <Archive size={14} /> Archive
                    </button>
                    <button 
                      onClick={() => handleBlock(friend._id)}
                      disabled={actionLoading === `block-${friend._id}`}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-amber-500/10 text-amber-600 rounded-xl hover:bg-amber-500/20 transition-colors text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading === `block-${friend._id}` ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />} Block
                    </button>
                    <button 
                      onClick={() => handleRemove(friend._id)}
                      disabled={actionLoading === `remove-${friend._id}`}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 text-red-600 rounded-xl hover:bg-red-500/20 transition-colors text-xs font-semibold disabled:opacity-50 cursor-pointer"
                    >
                      {actionLoading === `remove-${friend._id}` ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

