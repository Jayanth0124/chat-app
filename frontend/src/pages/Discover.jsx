import { useState, useEffect } from 'react';
import { Compass, Search, UserPlus, UserCheck, Flame, Sparkles, Users, ArrowLeft, Loader2 } from 'lucide-react';
import { useFriendStore } from '../store/useFriendStore';
import { useNavigate } from 'react-router-dom';

export default function Discover() {
  const navigate = useNavigate();
  const { searchUsers, searchResults, isSearching, sendRequest, outgoingRequests, friends, getRequests, getFriends } = useFriendStore();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getRequests();
    getFriends();
  }, [getRequests, getFriends]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    searchUsers(query);
  };

  const isFriend = (userId) => friends.some((f) => f._id === userId);
  const hasSentRequest = (userId) => outgoingRequests.some((r) => r._id === userId);

  return (
    <div className="flex-1 h-full flex flex-col w-full bg-surface overflow-hidden border-l border-outline-variant/60 select-none">
      {/* Header */}
      <div className="h-[60px] bg-surface flex items-center justify-between px-6 shrink-0 z-10 border-b border-outline-variant/60">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1 mr-1 text-on-surface-variant md:hidden cursor-pointer">
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
          <h2 className="text-xl font-black tracking-tight text-on-surface flex items-center gap-2">
            <Compass className="text-primary" size={22} /> Discover
          </h2>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 overflow-y-auto p-6 bg-background space-y-8">

        {/* Search Bar */}
        <div className="max-w-md mx-auto">
          <div className="relative flex items-center bg-surface rounded-full overflow-hidden border border-outline-variant/60 focus-within:border-primary transition-colors shadow-sm h-[48px]">
            <div className="pl-4 pr-3 flex items-center justify-center text-on-surface-variant">
              <Search size={18} strokeWidth={2.5} />
            </div>
            <input
              type="text"
              placeholder="Search user profiles globally..."
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
        </div>

        {/* Search Results or Empty State */}
        {searchQuery ? (
          <div className="max-w-md mx-auto space-y-4">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider pl-1">Search Results</h3>
            {isSearching ? (
              <div className="text-center py-6 text-on-surface-variant font-bold text-xs">Searching directory...</div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-6 text-on-surface-variant font-bold text-xs">No matching users found</div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((user) => {
                  const alreadyFriend = isFriend(user._id);
                  const requestSent = hasSentRequest(user._id);
                  return (
                    <div key={user._id} className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`}
                          alt="avatar"
                          className="w-11 h-11 rounded-full object-cover shadow-sm"
                        />
                        <div>
                          <p className="text-[14px] font-bold text-on-surface">{user.displayName}</p>
                          <p className="text-xs text-on-surface-variant">@{user.username}</p>
                        </div>
                      </div>
                      {alreadyFriend ? (
                        <span className="text-[11px] font-bold text-green-600 bg-green-500/10 px-3 py-1 rounded-full">Friends</span>
                      ) : (
                        <button
                          onClick={() => sendRequest(user._id)}
                          disabled={requestSent}
                          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                            requestSent
                              ? 'bg-surface-container-low text-on-surface-variant/60'
                              : 'bg-primary text-white hover:opacity-90 active:scale-95'
                          }`}
                        >
                          {requestSent ? <UserCheck size={16} /> : <UserPlus size={16} />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Default empty discover state — no mock data */
          <div className="max-w-md mx-auto flex flex-col items-center justify-center py-20 text-center select-none">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Compass size={28} />
            </div>
            <h3 className="text-base font-black text-on-surface">Discover People</h3>
            <p className="text-sm text-on-surface-variant/70 mt-1.5 max-w-[260px] leading-relaxed">
              Search by name or username to find and connect with people on Blink.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
