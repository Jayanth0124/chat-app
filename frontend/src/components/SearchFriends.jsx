import { useState, useEffect, useRef } from 'react';
import { X, Search, UserPlus, UserCheck, Loader2, Users } from 'lucide-react';
import { useFriendStore } from '../store/useFriendStore';
import { useNavigate } from 'react-router-dom';
import { useLayoutStore } from '../store/useLayoutStore';
import Avatar from './ui/Avatar';
import StoryRing from './stories/StoryRing';

export default function SearchFriends() {
  const { setSearchFriendsOpen } = useLayoutStore();
  const navigate = useNavigate();
  const {
    searchResults,
    searchUsers,
    isSearching,
    sendRequest,
    outgoingRequests,
    friends,
    getRequests,
    getFriends,
  } = useFriendStore();

  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    getRequests();
    getFriends();
    // Auto-focus input on open
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [getRequests, getFriends]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setQuery(q);
    searchUsers(q);
  };

  const isFriend = (userId) => friends.some((f) => f._id === userId);
  const hasSentRequest = (userId) => outgoingRequests.some((r) => r._id === userId);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface h-full shadow-2xl flex flex-col border-l border-outline-variant/60">
        {/* Header */}
        <div className="px-5 py-4 border-b border-outline-variant/60 bg-surface-container-low flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Search size={18} className="text-primary" />
            <h3 className="text-base font-black text-on-surface tracking-tight">Search Friends</h3>
          </div>
          <button
            onClick={() => setSearchFriendsOpen(false)}
            className="p-1.5 rounded-full hover:bg-surface-container-high text-on-surface-variant transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search Input */}
        <div className="px-4 py-3 shrink-0 border-b border-outline-variant/40">
          <div className="relative flex items-center bg-surface-container-low rounded-full h-[42px] border border-transparent focus-within:border-primary transition-colors overflow-hidden">
            <div className="pl-4 pr-2 text-on-surface-variant shrink-0">
              <Search size={15} strokeWidth={2.5} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleSearch}
              placeholder="Search by username or name..."
              className="flex-1 h-full bg-transparent text-[13px] font-semibold text-on-surface placeholder-on-surface-variant/50 outline-none pr-4"
            />
            {isSearching && (
              <div className="pr-3 shrink-0">
                <Loader2 size={14} className="animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {!query.trim() ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 select-none">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                <Users size={24} />
              </div>
              <p className="text-sm font-bold text-on-surface">Find People</p>
              <p className="text-xs text-on-surface-variant/70 mt-1 max-w-[200px] leading-relaxed">
                Type a username or display name to search the Orbit network.
              </p>
            </div>
          ) : isSearching ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
              <span className="text-xs font-bold text-on-surface-variant/70">Searching...</span>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 select-none">
              <div className="w-12 h-12 rounded-full bg-outline-variant/10 flex items-center justify-center text-on-surface-variant/50 mb-3">
                <Search size={22} />
              </div>
              <p className="text-sm font-bold text-on-surface">No results</p>
              <p className="text-xs text-on-surface-variant/70 mt-1">
                No user matched "{query}".
              </p>
            </div>
          ) : (
            <div className="p-3 flex flex-col gap-1.5">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-2 mb-1">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </p>
              {searchResults.map((user) => {
                const alreadyFriend = isFriend(user._id);
                const requestSent = hasSentRequest(user._id);

                return (
                  <div
                    key={user._id}
                    className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-container-low border border-transparent hover:border-outline-variant/30 transition-all"
                  >
                    <div 
                      onClick={() => {
                        setSearchFriendsOpen(false);
                        navigate(`/user-profile/${user._id}`);
                      }}
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    >
                      <StoryRing
                        user={user}
                        size={40} // w-10 h-10 is 40px
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-bold text-on-surface truncate">{user.displayName}</p>
                        <p className="text-[11px] text-on-surface-variant font-medium">@{user.username}</p>
                      </div>
                    </div>
                    {alreadyFriend ? (
                      <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full">
                        Friends
                      </span>
                    ) : (
                      <button
                        onClick={() => sendRequest(user._id)}
                        disabled={requestSent}
                        className={`p-2 rounded-xl transition-all cursor-pointer shrink-0 ${
                          requestSent
                            ? 'bg-surface-container-low text-on-surface-variant/50'
                            : 'bg-primary text-white hover:opacity-90 active:scale-95'
                        }`}
                        title={requestSent ? 'Request Sent' : 'Send Friend Request'}
                      >
                        {requestSent ? <UserCheck size={14} /> : <UserPlus size={14} />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
