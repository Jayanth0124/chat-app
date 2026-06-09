import { useState, useEffect } from 'react';
import { Search, UserPlus, UserCheck, ArrowLeft, Loader2, Check, X, ChevronRight } from 'lucide-react';
import { useFriendStore } from '../store/useFriendStore';
import { useNavigate } from 'react-router-dom';

export default function AddFriends() {
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'requests'
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const {
    searchResults,
    searchUsers,
    isSearching,
    sendRequest,
    incomingRequests,
    outgoingRequests,
    friends,
    getRequests,
    acceptRequest,
    rejectRequest,
    removeFriend,
    isLoading
  } = useFriendStore();

  useEffect(() => {
    getRequests();
  }, [getRequests]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const handleCancelOutgoing = async (userId) => {
    await removeFriend(userId);
    getRequests();
  };

  const isFriend = (userId) => friends.some((f) => f._id === userId);
  const hasSentRequest = (userId) => outgoingRequests.some((r) => r._id === userId);

  return (
    <div className="flex-1 h-full flex flex-col w-full bg-surface overflow-hidden border-l border-outline-variant/60 select-none">
      {/* Header */}
      <div className="h-[60px] bg-surface flex items-center px-6 shrink-0 z-10 border-b border-outline-variant/60">
        <button onClick={() => navigate(-1)} className="p-1 mr-3 text-on-surface-variant md:hidden cursor-pointer">
          <ArrowLeft size={24} strokeWidth={2} />
        </button>
        <h2 className="text-xl font-black tracking-tight text-on-surface">Manage Contacts</h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-outline-variant/60 px-6 bg-surface shrink-0">
        <button
          onClick={() => setActiveTab('search')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${activeTab === 'search' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/80 hover:text-on-surface'}`}
        >
          Find Friends
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 relative cursor-pointer ${activeTab === 'requests' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant/80 hover:text-on-surface'}`}
        >
          Pending Requests
          {incomingRequests.length > 0 && (
            <span className="absolute top-1.5 -right-1 w-4 h-4 bg-primary rounded-full text-white text-[9px] flex items-center justify-center font-bold">
              {incomingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-background">
        {activeTab === 'search' && (
          <div className="max-w-md mx-auto space-y-6">
            <div className="relative flex items-center bg-surface rounded-full overflow-hidden border border-outline-variant/60 focus-within:border-primary transition-colors shadow-sm h-[48px]">
              <div className="pl-4 pr-3 flex items-center justify-center text-on-surface-variant">
                <Search size={18} strokeWidth={2} />
              </div>
              <input
                type="text"
                placeholder="Search user profile directories..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full h-full bg-transparent text-[14px] font-semibold text-on-surface placeholder-on-surface-variant/50 outline-none"
              />
              {isSearching && (
                <div className="pr-4 shrink-0">
                  <Loader2 size={16} className="animate-spin text-primary" />
                </div>
              )}
            </div>

            {isSearching ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((user) => {
                  const alreadyFriend = isFriend(user._id);
                  const requestSent = hasSentRequest(user._id);
                  return (
                    <div 
                      key={user._id} 
                      onClick={() => navigate(`/user-profile/${user._id}`)}
                      className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`}
                          alt="avatar"
                          className="w-10 h-10 rounded-full shadow-sm object-cover"
                        />
                        <div>
                          <p className="text-[14px] font-bold text-on-surface">{user.displayName}</p>
                          <p className="text-xs text-on-surface-variant font-medium">@{user.username}</p>
                        </div>
                      </div>
                      <ChevronRight className="text-on-surface-variant/50" size={20} />
                    </div>
                  );
                })}
              </div>
            ) : searchQuery ? (
              <p className="text-center text-on-surface-variant/80 mt-8 text-sm">No users matched that query.</p>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <Search size={24} />
                </div>
                <p className="text-sm font-bold text-on-surface">Find people on Orbit</p>
                <p className="text-xs text-on-surface-variant/70 mt-1 max-w-[220px] leading-relaxed">
                  Type a name or username above to search the network.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div className="max-w-md mx-auto space-y-8">
            {/* Incoming */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                Incoming Requests ({incomingRequests.length})
              </h3>
              {isLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : incomingRequests.length === 0 ? (
                <p className="text-xs text-on-surface-variant/80 pl-1 font-bold">No incoming requests pending</p>
              ) : (
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <div key={req._id} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm">
                      <div className="flex items-center gap-3">
                        <img
                          src={req.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.displayName)}&background=random`}
                          alt="avatar"
                          className="w-10 h-10 rounded-full shadow-sm object-cover"
                        />
                        <div>
                          <p className="text-[14px] font-bold text-on-surface">{req.displayName}</p>
                          <p className="text-xs text-on-surface-variant">@{req.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptRequest(req._id)}
                          className="p-2 rounded-xl bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors cursor-pointer"
                          title="Accept"
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={() => rejectRequest(req._id)}
                          className="p-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors cursor-pointer"
                          title="Ignore"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing */}
            <div className="space-y-3 pt-4 border-t border-outline-variant/40">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">
                Sent Requests ({outgoingRequests.length})
              </h3>
              {outgoingRequests.length === 0 ? (
                <p className="text-xs text-on-surface-variant/80 pl-1 font-bold">No sent requests pending</p>
              ) : (
                <div className="space-y-3">
                  {outgoingRequests.map((req) => (
                    <div key={req._id} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm">
                      <div className="flex items-center gap-3">
                        <img
                          src={req.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.displayName)}&background=random`}
                          alt="avatar"
                          className="w-10 h-10 rounded-full shadow-sm object-cover"
                        />
                        <div>
                          <p className="text-[14px] font-bold text-on-surface">{req.displayName}</p>
                          <p className="text-xs text-on-surface-variant">@{req.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelOutgoing(req._id)}
                        className="px-3.5 py-1.5 bg-outline-variant/30 text-on-surface hover:bg-red-500/10 hover:text-red-500 text-xs font-bold rounded-xl transition-all cursor-pointer"
                        title="Cancel Request"
                      >
                        Cancel
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
  );
}
