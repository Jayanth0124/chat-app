import { useEffect, useState, useRef } from 'react';
import chatlistBg from '../assets/images/chatlist.jpg';
import { Search, Loader2, MessageSquarePlus, MoreVertical, Users, Trash2, Clock, Inbox, Bell, Pin, BellOff, Ban, Mail, ChevronDown } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useFriendStore } from '../store/useFriendStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useNavigate } from 'react-router-dom';
import { useLongPress } from '../hooks/useLongPress';

function ChatListItem({ chat, user, selectedChat, setSelectedChat, activeContextMenu, setActiveContextMenu, getSender, getSenderPic, unreadCounts }) {
  const navigate = useNavigate();
  const { deleteChat, pinChat, muteChat, markChatAsUnread } = useChatStore();
  const { blockUser } = useFriendStore();

  const otherParticipant = !chat.isGroupChat ? chat.participants?.find(p => p._id !== user?._id) : null;
  const isOnline = otherParticipant?.isOnline || false;
  
  const isPinned = user?.pinnedChats?.includes(chat._id);
  const isMuted = user?.mutedChats?.some(m => m.chatId === chat._id && (m.mutedUntil === null || new Date(m.mutedUntil) > new Date()));

  // Long press for mobile
  const longPressProps = useLongPress((e) => {
    setActiveContextMenu({ chatId: chat._id, isMobile: true });
  }, (e) => {
    // Normal Click
    if (!activeContextMenu) {
      setSelectedChat(chat);
    }
  });

  const closeMenu = (e) => {
    e?.stopPropagation();
    setActiveContextMenu(null);
  };

  const handleAction = (action, e) => {
    e?.stopPropagation();
    closeMenu();
    switch (action) {
      case 'pin': pinChat(chat._id, !isPinned); break;
      case 'unread': markChatAsUnread(chat._id); break;
      case 'mute_8h': muteChat(chat._id, 8); break;
      case 'mute_1w': muteChat(chat._id, 168); break;
      case 'mute_always': muteChat(chat._id, null); break;
      case 'unmute': muteChat(chat._id, false); break;
      case 'block': 
        if (otherParticipant) {
          if (window.confirm(`Block ${otherParticipant.displayName}?`)) blockUser(otherParticipant._id); 
        }
        break;
      case 'delete':
        if (window.confirm("Are you sure you want to delete this conversation?")) deleteChat(chat._id);
        break;
      default: break;
    }
  };

  const isMenuOpenDesktop = activeContextMenu?.chatId === chat._id && !activeContextMenu?.isMobile;
  const isMenuOpenMobile = activeContextMenu?.chatId === chat._id && activeContextMenu?.isMobile;

  return (
    <>
      <div 
        {...longPressProps}
        className={`flex items-center gap-4 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-300 relative group/item ${
          selectedChat?._id === chat._id ? 'bg-secondary-container shadow-[0_0_15px_rgba(139,92,246,0.15)] ring-1 ring-primary-container' : 'hover:bg-white/5 border border-transparent'
        }`}
      >
        <div 
          onClick={(e) => {
            if (!chat.isGroupChat && otherParticipant) {
              e.stopPropagation();
              navigate(`/user-profile/${otherParticipant._id}`);
            }
          }}
          className="relative shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        >
          <img 
            src={!chat.isGroupChat ? getSenderPic(user, chat.participants) || `https://ui-avatars.com/api/?name=${getSender(user, chat.participants)}` : chat.groupName} 
            alt="avatar" 
            className="w-[46px] h-[46px] rounded-full object-cover shadow-sm" 
          />
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary rounded-full orbit-online-indicator"></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 h-full flex flex-col justify-center">
          <div className="flex justify-between items-center mb-[2px]">
            <h3 className="font-semibold text-[15px] text-on-surface truncate pr-6">
              {!chat.isGroupChat ? getSender(user, chat.participants) : chat.groupName}
            </h3>
            <span className={`text-[12px] font-medium whitespace-nowrap pl-2 group-hover/item:opacity-0 transition-opacity ${selectedChat?._id === chat._id ? 'text-primary' : 'text-on-surface-variant/80'}`}>
              {chat.latestMessage ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center text-[13px] text-on-surface-variant/80 font-medium truncate pr-2">
              <span className="truncate">
                {chat.latestMessage ? chat.latestMessage.content : 'No messages yet...'}
              </span>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              {isPinned && <Pin size={12} className="text-on-surface-variant/70 rotate-45" />}
              {isMuted && <BellOff size={12} className="text-on-surface-variant/70" />}
              {unreadCounts[chat._id] > 0 && (
                <div className="w-5 h-5 rounded-full bg-primary-container text-white text-[11px] font-bold flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.4)] ml-1 group-hover/item:opacity-0 transition-opacity">
                  {unreadCounts[chat._id]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop 3-dot Trigger */}
        <button
          onClick={(e) => { e.stopPropagation(); setActiveContextMenu({ chatId: chat._id, isMobile: false }); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 bg-surface-container text-on-surface-variant rounded-full hover:bg-surface-container-high transition-all opacity-0 group-hover/item:opacity-100 shadow-sm cursor-pointer z-10 hidden md:block"
        >
          <ChevronDown size={18} />
        </button>

        {/* Desktop Dropdown */}
        {isMenuOpenDesktop && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} />
            <div className="absolute right-4 top-12 w-48 bg-surface border border-outline-variant/60 rounded-xl shadow-xl z-50 p-1.5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex flex-col text-[13px] font-medium">
                <button onClick={(e) => handleAction('pin', e)} className="text-left px-3 py-2 rounded-lg hover:bg-surface-container cursor-pointer transition-colors">
                  {isPinned ? 'Unpin chat' : 'Pin chat'}
                </button>
                {unreadCounts[chat._id] === 0 && (
                  <button onClick={(e) => handleAction('unread', e)} className="text-left px-3 py-2 rounded-lg hover:bg-surface-container cursor-pointer transition-colors">
                    Mark as unread
                  </button>
                )}
                {isMuted ? (
                  <button onClick={(e) => handleAction('unmute', e)} className="text-left px-3 py-2 rounded-lg hover:bg-surface-container cursor-pointer transition-colors">
                    Unmute notifications
                  </button>
                ) : (
                  <>
                    <div className="px-3 py-1.5 text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mt-1 border-t border-outline-variant/30 pt-2">Mute Notifications</div>
                    <button onClick={(e) => handleAction('mute_8h', e)} className="text-left px-3 py-2 rounded-lg hover:bg-surface-container cursor-pointer transition-colors">8 hours</button>
                    <button onClick={(e) => handleAction('mute_1w', e)} className="text-left px-3 py-2 rounded-lg hover:bg-surface-container cursor-pointer transition-colors">1 week</button>
                    <button onClick={(e) => handleAction('mute_always', e)} className="text-left px-3 py-2 rounded-lg hover:bg-surface-container cursor-pointer transition-colors">Always</button>
                  </>
                )}
                <div className="h-px bg-outline-variant/30 my-1" />
                <button onClick={(e) => handleAction('block', e)} className="text-left px-3 py-2 rounded-lg hover:bg-surface-container cursor-pointer transition-colors">
                  Block contact
                </button>
                <button onClick={(e) => handleAction('delete', e)} className="text-left px-3 py-2 rounded-lg text-red-500 hover:bg-red-500/10 cursor-pointer transition-colors">
                  Delete chat
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      {isMenuOpenMobile && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeMenu} />
          <div className="fixed bottom-0 left-0 right-0 z-[101] bg-surface rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe">
            <div className="w-12 h-1.5 bg-outline-variant/50 rounded-full mx-auto my-3" />
            <div className="flex flex-col pb-4">
              <button onClick={(e) => handleAction('pin', e)} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container active:bg-surface-container-high transition-colors text-left text-on-surface font-semibold text-[15px]">
                <Pin size={20} className="text-on-surface-variant" />
                {isPinned ? 'Unpin chat' : 'Pin chat'}
              </button>
              {unreadCounts[chat._id] === 0 && (
                <button onClick={(e) => handleAction('unread', e)} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container active:bg-surface-container-high transition-colors text-left text-on-surface font-semibold text-[15px]">
                  <Inbox size={20} className="text-on-surface-variant" />
                  Mark as unread
                </button>
              )}
              {isMuted ? (
                <button onClick={(e) => handleAction('unmute', e)} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container active:bg-surface-container-high transition-colors text-left text-on-surface font-semibold text-[15px]">
                  <Bell size={20} className="text-on-surface-variant" />
                  Unmute notifications
                </button>
              ) : (
                <button onClick={(e) => handleAction('mute_always', e)} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container active:bg-surface-container-high transition-colors text-left text-on-surface font-semibold text-[15px]">
                  <BellOff size={20} className="text-on-surface-variant" />
                  Mute notifications
                </button>
              )}
              <div className="h-px bg-outline-variant/30 my-2 mx-6" />
              <button onClick={(e) => handleAction('block', e)} className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container active:bg-surface-container-high transition-colors text-left text-on-surface font-semibold text-[15px]">
                <Ban size={20} className="text-on-surface-variant" />
                Block contact
              </button>
              <button onClick={(e) => handleAction('delete', e)} className="flex items-center gap-4 px-6 py-4 hover:bg-red-500/10 active:bg-red-500/20 transition-colors text-left text-red-500 font-semibold text-[15px]">
                <Trash2 size={20} />
                Delete chat
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default function ChatList({ activeChat, setActiveChat }) {
  const { chats, fetchChats, isChatsLoading, selectedChat, setSelectedChat, accessChat, deleteChat, pinChat, muteChat, markChatAsUnread, unreadCounts } = useChatStore();
  const { searchUsers, searchResults, isSearching, getFriends, friends, blockUser, isLoading: isFriendsLoading } = useFriendStore();
  const { user } = useAuthStore();
  const { setNotificationsOpen } = useLayoutStore();
  const { unreadCount } = useNotificationStore();
  const [filter, setFilter] = useState('all'); // all, snaps, groups, starred
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem('orbit_recent_searches') || localStorage.getItem('blink_recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });



  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showListMenu, setShowListMenu] = useState(false);
  
  // Context Menu State
  const [activeContextMenu, setActiveContextMenu] = useState(null); // { chatId, isMobile }
  const navigate = useNavigate();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (showUsersModal) {
      getFriends();
    }
  }, [showUsersModal, getFriends]);

  useEffect(() => {
    setActiveChat(selectedChat ? selectedChat._id : null);
  }, [selectedChat, setActiveChat]);

  // Handle live query searching
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      searchUsers(value);
    }, 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const query = searchQuery.trim();
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('orbit_recent_searches', JSON.stringify(updated));
    }
  };

  const selectSearchResult = (targetUser) => {
    // Save to recent searches
    const query = targetUser.username;
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('orbit_recent_searches', JSON.stringify(updated));

    // Clear search and open conversation
    setSearchQuery('');
    setIsFocused(false);
    accessChat(targetUser._id);
  };

  const removeRecentSearch = (e, q) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => s !== q);
    setRecentSearches(updated);
    localStorage.setItem('orbit_recent_searches', JSON.stringify(updated));
  };

  const handleStartChat = (userId) => {
    accessChat(userId);
    setShowUsersModal(false);
  };

  const getSender = (loggedUser, chatUsers) => {
    return chatUsers[0]?._id === loggedUser?._id ? chatUsers[1]?.displayName : chatUsers[0]?.displayName;
  };

  const getSenderPic = (loggedUser, chatUsers) => {
    return chatUsers[0]?._id === loggedUser?._id ? chatUsers[1]?.profilePic : chatUsers[0]?.profilePic;
  };

  // Filter conversations based on selected tab & search string
  const filteredChats = chats.filter(chat => {
    // 1. Filter by Tab
    if (filter === 'snaps') {
      if (chat.vanishMode === 'OFF' || !chat.vanishMode) return false;
    }
    if (filter === 'groups' && !chat.isGroupChat) return false;
    
    // 2. Filter by search query if typing inside chat list and not focused on global users search
    if (searchQuery && !isFocused) {
      const name = !chat.isGroupChat 
        ? getSender(user, chat.participants)?.toLowerCase() 
        : chat.groupName?.toLowerCase();
      return name?.includes(searchQuery.toLowerCase());
    }

    return true;
  }).sort((a, b) => {
    const isAPinned = user?.pinnedChats?.includes(a._id);
    const isBPinned = user?.pinnedChats?.includes(b._id);
    if (isAPinned && !isBPinned) return -1;
    if (!isAPinned && isBPinned) return 1;
    return 0; // fallback to original sorting (by latestMessage date which is done by useChatStore)
  });

  return (
    <>
      <div 
        className={`orbit-bg-chatlist w-full md:w-[320px] lg:w-[350px] h-full overflow-hidden flex flex-col shrink-0 bg-cover bg-center bg-no-repeat relative border-r border-outline-variant ${activeChat ? 'hidden md:flex' : 'flex'}`}
        style={{ backgroundImage: `url(${chatlistBg})` }}
      >
        {/* Dark Glass Overlay */}
        <div className="orbit-dark-overlay absolute inset-0 bg-black/30 backdrop-blur-none z-0" />
        
        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full w-full">
        
          {/* Header */}
          <div className="px-6 pt-6 pb-4 flex justify-between items-center select-none">
            <h2 className="text-[24px] font-black tracking-tight text-white">Chats</h2>
            <div className="flex gap-2 text-white/80">
              {/* Mobile-only notifications drawer trigger */}
              <button 
                onClick={() => setNotificationsOpen(true)} 
                className="relative p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer md:hidden" 
                title="Notifications"
            >
              <Bell size={20} strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-surface animate-pulse" />
              )}
            </button>

            <button onClick={() => setShowUsersModal(true)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer" title="New Chat">
              <MessageSquarePlus size={20} strokeWidth={2} />
            </button>
            <div className="relative shrink-0">
              <button onClick={() => setShowListMenu(!showListMenu)} className="p-2 hover:bg-surface-container-low rounded-full transition-colors cursor-pointer" title="Menu">
                <MoreVertical size={20} strokeWidth={2} />
              </button>
              
              {showListMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowListMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-surface border border-outline-variant/60 rounded-2xl shadow-xl z-50 p-2 animate-in slide-in-from-top-2 duration-150">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => { setShowListMenu(false); navigate('/profile'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container text-on-surface text-xs font-bold transition-all text-left w-full cursor-pointer">
                        Profile
                      </button>
                      <button onClick={() => { setShowListMenu(false); navigate('/settings'); }} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container text-on-surface text-xs font-bold transition-all text-left w-full cursor-pointer">
                        Settings
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-2 pt-2">
          <div className="relative flex items-center bg-surface-container-low/80 backdrop-blur-sm rounded-[20px] overflow-hidden transition-colors h-[48px] border border-transparent focus-within:border-primary/50 shadow-inner">
            <div className="pl-4 pr-3 flex items-center justify-center text-on-surface-variant">
              <Search size={16} strokeWidth={2.5} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search users or chats..." 
              className="w-full h-full bg-transparent text-[14px] font-semibold text-on-surface placeholder-on-surface-variant/50 outline-none pr-4"
            />
            {isFocused && (
              <button 
                onClick={() => { setSearchQuery(''); setIsFocused(false); }}
                className="pr-4 text-xs font-bold text-primary hover:text-primary-hover shrink-0 cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Search States Overlay/Container */}
        {isFocused ? (
          <div className="flex-1 flex flex-col bg-surface overflow-hidden">
            {/* Case 1: Empty Query - Show Recent Searches */}
            {!searchQuery.trim() ? (
              <div className="p-5 flex-1 flex flex-col gap-4 select-none">
                <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Recent Searches</h4>
                {recentSearches.length === 0 ? (
                  <p className="text-xs text-on-surface-variant/70 italic">No recent searches</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {recentSearches.map((q) => (
                      <div 
                        key={q}
                        onClick={() => { setSearchQuery(q); searchUsers(q); }}
                        className="flex items-center justify-between p-3 bg-surface-container-low hover:bg-surface-container-high rounded-xl cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 text-xs font-semibold">
                          <Clock size={14} className="text-on-surface-variant" />
                          <span>@{q}</span>
                        </div>
                        <button 
                          onClick={(e) => removeRecentSearch(e, q)}
                          className="p-1 hover:text-red-500 transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : isSearching ? (
              /* Case 2: Loading State */
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs font-bold text-on-surface-variant/80">Searching users database...</span>
              </div>
            ) : searchResults.length === 0 ? (
              /* Case 3: No Results State */
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="w-12 h-12 bg-outline-variant/10 text-on-surface-variant/70 rounded-full flex items-center justify-center mb-3">
                  <Inbox size={22} />
                </div>
                <h4 className="text-sm font-bold">No results found</h4>
                <p className="text-xs text-on-surface-variant/85 max-w-[200px] mt-1 leading-relaxed">
                  We couldn't find any user matching "{searchQuery}". Try another username.
                </p>
              </div>
            ) : (
              /* Case 4: Search Results List */
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
                <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-3 mb-1">Global Users</h4>
                {searchResults.map((u) => (
                  <div 
                    key={u._id} 
                    onClick={() => selectSearchResult(u)}
                    className="flex items-center gap-3.5 p-3 rounded-2xl hover:bg-surface-container-low cursor-pointer transition-colors border border-transparent hover:border-outline-variant/30"
                  >
                    <img 
                      src={u.profilePic || `https://ui-avatars.com/api/?name=${u.displayName}`} 
                      alt={u.username} 
                      className="w-10 h-10 rounded-full object-cover shadow-sm" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-on-surface truncate">{u.displayName}</p>
                      <p className="text-[12px] text-on-surface-variant font-medium">@{u.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Normal Conversations List Mode */
          <>
            {/* Chat List Items */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 pt-2 space-y-1.5">
              {isChatsLoading ? (
                <div className="flex items-center justify-center h-20">
                  <Loader2 className="w-6 h-6 animate-spin text-on-surface-variant" />
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="text-center py-10 select-none">
                  <p className="text-xs text-on-surface-variant/80 font-bold">No active conversations found</p>
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <ChatListItem 
                    key={chat._id}
                    chat={chat}
                    user={user}
                    selectedChat={selectedChat}
                    setSelectedChat={setSelectedChat}
                    activeContextMenu={activeContextMenu}
                    setActiveContextMenu={setActiveContextMenu}
                    getSender={getSender}
                    getSenderPic={getSenderPic}
                    unreadCounts={unreadCounts}
                  />
                ))
              )}
            </div>
          </>
        )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md overflow-hidden border border-outline-variant shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-surface-container-low px-6 py-5 border-b border-outline-variant/60 flex justify-between items-center select-none">
              <h3 className="text-lg font-bold text-on-surface">New Chat</h3>
              <button onClick={() => setShowUsersModal(false)} className="text-on-surface-variant hover:text-on-surface font-semibold text-sm cursor-pointer">
                Close
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2">
              <button 
                onClick={() => { setShowUsersModal(false); navigate('/contacts'); }}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-low cursor-pointer transition-colors mb-2"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Users size={24} />
                </div>
                <div className="border-b border-outline-variant/60 flex-1 pb-3 pt-1 text-left">
                  <p className="text-[16px] font-semibold text-on-surface">Add Friends</p>
                  <p className="text-[13px] text-on-surface-variant">Search and send friend requests</p>
                </div>
              </button>

              <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider px-3 py-2 select-none">Your Friends</h4>

              {isFriendsLoading ? (
                <div className="text-center text-on-surface-variant py-6">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                </div>
              ) : (friends || []).length === 0 ? (
                <div className="text-center text-on-surface-variant py-6 text-sm">
                  You don't have any friends yet.<br />Go to Contacts to add some!
                </div>
              ) : (
                (friends || []).map((u) => (
                  <div 
                    key={u._id} 
                    onClick={() => handleStartChat(u._id)}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-low cursor-pointer transition-colors"
                  >
                    <img src={u.profilePic || `https://ui-avatars.com/api/?name=${u.displayName}`} alt={u.username} className="w-12 h-12 rounded-full object-cover" />
                    <div className="border-b border-outline-variant/60 flex-1 pb-3 pt-1 text-left">
                      <p className="text-[15px] font-bold text-on-surface">{u.displayName}</p>
                      <p className="text-[13px] text-on-surface-variant">@{u.username}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
