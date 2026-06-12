import { useEffect, useState, useRef } from 'react';
import chatlistBg from '../assets/images/chatlist.jpg';
import { Search, Loader2, MessageSquarePlus, MoreHorizontal, Users, Trash2, Clock, Inbox, Bell, Pin, BellOff, Ban, ChevronDown, CheckCircle2, X, Mic, Image as ImageIcon, Video, FileText, PhoneMissed, Phone, Zap, Check, CheckCheck, Camera } from 'lucide-react';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useFriendStore } from '../store/useFriendStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useNavigate } from 'react-router-dom';
import { useLongPress } from '../hooks/useLongPress';
import { useConfirmStore } from '../store/useConfirmStore';
import StoryRing from './stories/StoryRing';
import Avatar from './ui/Avatar';

function ChatListItem({ chat, user, selectedChat, setSelectedChat, activeContextMenu, setActiveContextMenu, getSender, getSenderPic, unreadCounts }) {
  const navigate = useNavigate();
  const { deleteChat, pinChat, muteChat, markChatAsUnread } = useChatStore();
  const isTyping = useChatStore((state) => state.typingChats[chat._id]);
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

  const handleAction = async (action, e) => {
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
          const confirmed = await useConfirmStore.getState().confirm({
            title: "Block User",
            message: `Block ${otherParticipant.displayName}?`,
            confirmText: "Block",
            danger: true
          });
          if (confirmed) blockUser(otherParticipant._id); 
        }
        break;
      case 'delete':
        const confirmedDelete = await useConfirmStore.getState().confirm({
          title: "Delete Chat",
          message: "Are you sure you want to delete this conversation?",
          confirmText: "Delete",
          danger: true
        });
        if (confirmedDelete) deleteChat(chat._id);
        break;
      default: break;
    }
  };

  const isMenuOpenDesktop = activeContextMenu?.chatId === chat._id && !activeContextMenu?.isMobile;
  const isMenuOpenMobile = activeContextMenu?.chatId === chat._id && activeContextMenu?.isMobile;

  const isSelected = selectedChat?._id === chat._id;
  const hasUnread = unreadCounts[chat._id] > 0;

  return (
    <div className="relative mb-1">
      <div 
        {...longPressProps}
        className={`flex items-stretch gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200 group/item ${
          isSelected 
            ? 'bg-black/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_4px_10px_rgba(0,0,0,0.3)] ring-1 ring-white/10' 
            : 'hover:bg-black/20 border border-transparent hover:border-white/5'
        }`}
      >
        <div 
          onClick={(e) => {
            if (!chat.isGroupChat && otherParticipant) {
              e.stopPropagation();
              navigate(`/user-profile/${otherParticipant._id}`);
            }
          }}
          className="relative shrink-0 flex items-center justify-center cursor-pointer transition-transform"
        >
          <div className="w-[48px] h-[48px] rounded-full flex shrink-0 items-center justify-center">
            {!chat.isGroupChat && otherParticipant ? (
              <StoryRing 
                user={{
                  ...otherParticipant,
                  profilePic: getSenderPic(user, chat.participants),
                  displayName: getSender(user, chat.participants)
                }}
                size={48} 
              />
            ) : (
              <Avatar 
                src={chat.isGroupChat ? chat.groupPic : getSenderPic(user, chat.participants)}
                name={chat.isGroupChat ? chat.groupName : getSender(user, chat.participants)}
                sizeClass="w-full h-full text-lg shadow-lg border border-white/5 bg-black/50"
              />
            )}
          </div>
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-[#34C759] rounded-full border-[2px] border-[#1C1C1E] shadow-sm z-10" />
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center pt-0.5">
          <div className="flex justify-between items-baseline mb-1">
            <h3 className={`font-semibold text-[15px] truncate pr-2 ${hasUnread ? 'text-white' : 'text-[#EBEBF5]'}`}>
              {!chat.isGroupChat ? getSender(user, chat.participants) : chat.groupName}
            </h3>
            <span className={`text-[11px] font-medium whitespace-nowrap transition-colors ${
              isSelected ? 'text-white/70' : hasUnread ? 'text-[#0A84FF]' : 'text-[#EBEBF5]/50'
            }`}>
              {chat.latestMessage ? new Date(chat.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <div className={`text-[13px] truncate pr-2 transition-colors flex items-center gap-1.5 flex-1 min-w-0 ${
              hasUnread 
                ? 'text-[#EBEBF5] font-medium' 
                : isSelected ? 'text-white/60' : 'text-[#EBEBF5]/50'
            }`}>
              {(() => {
                if (chat.vanishMode && chat.vanishMode !== 'OFF') {
                  return (
                    <>
                      <Clock size={12} className="text-[#0A84FF]" />
                      <span className="italic text-[#0A84FF]">Vanish Mode</span>
                    </>
                  );
                }
                

                if (isTyping) {
                  return <span className="text-[#0A84FF] font-medium animate-pulse">Typing...</span>;
                }

                if (!chat.latestMessage) {
                  return 'No messages yet...';
                }

                const msg = chat.latestMessage;
                const isSender = typeof msg.sender === 'object' ? msg.sender._id === user._id : msg.sender === user._id;

                const renderTicks = () => {
                  if (!isSender) return null;
                  const isRead = msg.status === 'seen' || (msg.readBy && msg.readBy.some(r => {
                     const readerId = typeof r.user === 'object' ? r.user._id : r.user;
                     return readerId !== user._id;
                  }));
                  if (isRead) {
                    return <CheckCheck size={14} className="text-[#0A84FF] shrink-0" />;
                  } else if (msg.status === 'delivered') {
                    return <CheckCheck size={14} className="text-white/40 shrink-0" />;
                  }
                  return <Check size={14} className="text-white/40 shrink-0" />;
                };

                if (msg.isUnsent) {
                  const senderName = isSender ? "You" : (typeof msg.sender === 'object' ? msg.sender.displayName : getSender(user, chat.participants));
                  return (
                    <span className="italic text-[#EBEBF5]/40 flex items-center gap-1.5 w-full truncate">
                      {senderName} unsent a message
                    </span>
                  );
                }

                const previewContent = () => {
                  switch(msg.messageType) {
                    case 'snap':
                      const isExpiredSnap = msg.expiresAt && new Date(msg.expiresAt).getTime() <= Date.now();
                      let snapText = "Snap";
                      if (isExpiredSnap) snapText = "Snap Expired";
                      else if (msg.opened) snapText = "Snap Opened";
                      else if (isSender) snapText = msg.status === 'delivered' ? "Snap Delivered" : "Snap Sent";
                      else snapText = "New Snap";
                      return <><Camera size={13} className="shrink-0" /> <span className="truncate">{snapText}</span></>;
                    case 'image':
                      return <><ImageIcon size={13} className="shrink-0" /> <span className="truncate">Photo</span></>;
                    case 'video':
                      return <><Video size={13} className="shrink-0" /> <span className="truncate">Video</span></>;
                    case 'audio':
                      return <><Mic size={13} className="shrink-0" /> <span className="truncate">Voice Message</span></>;
                    case 'document':
                      return <><FileText size={13} className="shrink-0" /> <span className="truncate">File</span></>;
                    case 'call':
                      const isMissed = msg.callData?.status === 'missed';
                      const isVideoCall = msg.callData?.type === 'video';
                      if (isMissed) return <><PhoneMissed size={13} className="shrink-0 text-red-500" /> <span className="truncate">Missed Call</span></>;
                      if (isVideoCall) return <><Video size={13} className="shrink-0" /> <span className="truncate">Video Call</span></>;
                      return <><Phone size={13} className="shrink-0" /> <span className="truncate">Voice Call</span></>;
                    default:
                      return <span className="truncate">{msg.content}</span>;
                  }
                };

                return (
                  <span className="flex items-center gap-1.5 w-full truncate">
                    {renderTicks()}
                    <span className="flex items-center gap-1.5 truncate">{previewContent()}</span>
                  </span>
                );
              })()}
            </div>
            
            <div className="flex items-center gap-1.5 shrink-0">
              {isPinned && <Pin size={12} className="text-[#EBEBF5]/40 rotate-45" />}
              {isMuted && <BellOff size={12} className="text-[#EBEBF5]/40" />}
              {hasUnread && (
                <div className="min-w-[20px] h-[20px] px-1.5 rounded-full bg-[#0A84FF] text-white text-[11px] font-bold flex items-center justify-center shadow-[0_2px_5px_rgba(10,132,255,0.3)]">
                  {unreadCounts[chat._id]}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop 3-dot Trigger */}
        <button
          onClick={(e) => { e.stopPropagation(); setActiveContextMenu({ chatId: chat._id, isMobile: false }); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-all opacity-0 group-hover/item:opacity-100 z-10 hidden md:flex cursor-pointer"
        >
          <MoreHorizontal size={18} />
        </button>

        {/* Desktop Dropdown */}
        {isMenuOpenDesktop && (
          <>
            <div className="fixed inset-0 z-40" onClick={closeMenu} />
            <div className="absolute right-4 top-10 w-56 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] z-50 p-1.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex flex-col text-[13px] font-medium text-[#EBEBF5]">
                <button onClick={(e) => handleAction('pin', e)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2C2C2E] transition-colors cursor-pointer">
                  {isPinned ? 'Unpin chat' : 'Pin chat'}
                  <Pin size={14} className="opacity-50" />
                </button>
                {unreadCounts[chat._id] === 0 && (
                  <button onClick={(e) => handleAction('unread', e)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2C2C2E] transition-colors cursor-pointer">
                    Mark as unread
                    <Inbox size={14} className="opacity-50" />
                  </button>
                )}
                {isMuted ? (
                  <button onClick={(e) => handleAction('unmute', e)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2C2C2E] transition-colors cursor-pointer">
                    Unmute notifications
                    <Bell size={14} className="opacity-50" />
                  </button>
                ) : (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-bold text-white/40 uppercase tracking-wider mt-1 border-t border-white/5 pt-2">Mute</div>
                    <button onClick={(e) => handleAction('mute_8h', e)} className="text-left px-3 py-2 rounded-lg hover:bg-[#2C2C2E] transition-colors cursor-pointer">8 hours</button>
                    <button onClick={(e) => handleAction('mute_1w', e)} className="text-left px-3 py-2 rounded-lg hover:bg-[#2C2C2E] transition-colors cursor-pointer">1 week</button>
                    <button onClick={(e) => handleAction('mute_always', e)} className="text-left px-3 py-2 rounded-lg hover:bg-[#2C2C2E] transition-colors cursor-pointer">Always</button>
                  </>
                )}
                <div className="h-px bg-white/5 my-1 mx-2" />
                <button onClick={(e) => handleAction('block', e)} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#2C2C2E] transition-colors cursor-pointer">
                  Block contact
                  <Ban size={14} className="opacity-50" />
                </button>
                <button onClick={(e) => handleAction('delete', e)} className="flex items-center justify-between px-3 py-2 rounded-lg text-[#FF453A] hover:bg-[#FF453A]/10 transition-colors cursor-pointer">
                  Delete chat
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Mobile Bottom Sheet */}
      {isMenuOpenMobile && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/70 animate-in fade-in duration-200" onClick={closeMenu} />
          <div className="fixed bottom-0 left-0 right-0 z-[101] bg-[#1C1C1E] border-t border-white/10 rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto my-3" />
            <div className="flex flex-col pb-4 text-[#EBEBF5]">
              <button onClick={(e) => handleAction('pin', e)} className="flex items-center gap-4 px-6 py-4 hover:bg-[#2C2C2E] active:bg-[#3A3A3C] transition-colors text-left font-medium text-[16px] cursor-pointer">
                <Pin size={20} className="text-white/50" />
                {isPinned ? 'Unpin chat' : 'Pin chat'}
              </button>
              {unreadCounts[chat._id] === 0 && (
                <button onClick={(e) => handleAction('unread', e)} className="flex items-center gap-4 px-6 py-4 hover:bg-[#2C2C2E] active:bg-[#3A3A3C] transition-colors text-left font-medium text-[16px] cursor-pointer">
                  <Inbox size={20} className="text-white/50" />
                  Mark as unread
                </button>
              )}
              {isMuted ? (
                <button onClick={(e) => handleAction('unmute', e)} className="flex items-center gap-4 px-6 py-4 hover:bg-[#2C2C2E] active:bg-[#3A3A3C] transition-colors text-left font-medium text-[16px] cursor-pointer">
                  <Bell size={20} className="text-white/50" />
                  Unmute notifications
                </button>
              ) : (
                <button onClick={(e) => handleAction('mute_always', e)} className="flex items-center gap-4 px-6 py-4 hover:bg-[#2C2C2E] active:bg-[#3A3A3C] transition-colors text-left font-medium text-[16px] cursor-pointer">
                  <BellOff size={20} className="text-white/50" />
                  Mute notifications
                </button>
              )}
              <div className="h-px bg-white/5 my-2 mx-6" />
              <button onClick={(e) => handleAction('block', e)} className="flex items-center gap-4 px-6 py-4 hover:bg-[#2C2C2E] active:bg-[#3A3A3C] transition-colors text-left font-medium text-[16px] cursor-pointer">
                <Ban size={20} className="text-white/50" />
                Block contact
              </button>
              <button onClick={(e) => handleAction('delete', e)} className="flex items-center gap-4 px-6 py-4 hover:bg-[#FF453A]/10 active:bg-[#FF453A]/20 transition-colors text-left text-[#FF453A] font-medium text-[16px] cursor-pointer">
                <Trash2 size={20} />
                Delete chat
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ChatList({ activeChat, setActiveChat }) {
  const { chats, fetchChats, isChatsLoading, selectedChat, setSelectedChat, accessChat, deleteChat, pinChat, muteChat, markChatAsUnread, unreadCounts } = useChatStore();
  const { searchUsers, searchResults, isSearching, getFriends, friends, blockUser, isLoading: isFriendsLoading } = useFriendStore();
  const { user } = useAuthStore();
  const { setNotificationsOpen } = useLayoutStore();
  const { unreadCount } = useNotificationStore();
  const [filter, setFilter] = useState('all'); 
  
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
  const [activeContextMenu, setActiveContextMenu] = useState(null); 
  const navigate = useNavigate();
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (showUsersModal) getFriends();
  }, [showUsersModal, getFriends]);

  useEffect(() => {
    setActiveChat(selectedChat ? selectedChat._id : null);
  }, [selectedChat, setActiveChat]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => searchUsers(value), 400);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      const query = searchQuery.trim();
      const updated = [query, ...recentSearches.filter(s => {
        if (typeof s === 'string') return s !== query;
        return s.username !== query;
      })].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('orbit_recent_searches', JSON.stringify(updated));
    }
  };

  const selectSearchResult = (targetUser) => {
    const userObj = {
      _id: targetUser._id,
      username: targetUser.username,
      displayName: targetUser.displayName,
      profilePic: targetUser.profilePic
    };
    
    const filtered = recentSearches.filter(s => {
      if (typeof s === 'string') return s !== targetUser.username;
      return s._id !== targetUser._id;
    });

    const updated = [userObj, ...filtered].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('orbit_recent_searches', JSON.stringify(updated));

    setSearchQuery('');
    setIsFocused(false);
    navigate(`/user-profile/${targetUser._id}`);
  };

  const removeRecentSearch = (e, q) => {
    e.stopPropagation();
    const updated = recentSearches.filter(s => {
      if (typeof s === 'string') return s !== q;
      return s._id !== q._id;
    });
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

  const filteredChats = chats.filter(chat => {
    if (filter === 'snaps') {
      if (chat.vanishMode === 'OFF' || !chat.vanishMode) return false;
    }
    if (filter === 'groups' && !chat.isGroupChat) return false;
    
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
    
    const timeA = a.latestMessage ? new Date(a.latestMessage.createdAt).getTime() : new Date(a.updatedAt).getTime();
    const timeB = b.latestMessage ? new Date(b.latestMessage.createdAt).getTime() : new Date(b.updatedAt).getTime();
    return timeB - timeA;
  });

  return (
    <>
      <div 
        className={`orbit-bg-chatlist w-full md:w-[320px] lg:w-[380px] h-full overflow-hidden flex flex-col shrink-0 bg-cover bg-center bg-no-repeat relative border-r border-white/5 ${activeChat ? 'hidden md:flex' : 'flex'}`}
        style={{ backgroundImage: `url(${chatlistBg})` }}
      >
        {/* Dark Matte Layer overlaying the image precisely to retain visibility but dim it */}
        <div className="orbit-dark-overlay absolute inset-0 bg-black/40 z-0 pointer-events-none" />
        
        {/* Main Content */}
        <div className="relative z-10 flex flex-col h-full w-full">
        
          {/* Dashboard Header */}
          <div className="px-5 pt-8 pb-4 flex justify-between items-center select-none">
            <div className="flex items-center gap-4 md:gap-0">
              <img src="/logo.png" alt="Orbit Logo" className="w-8 h-8 rounded-lg md:hidden object-cover" />
              <h2 className="text-[24px] md:text-[28px] text-white font-spacetron tracking-[0.15em] leading-none">ORBIT</h2>
            </div>
            <div className="flex gap-2 text-[#EBEBF5]/80">
              {/* Mobile Notifications */}
              <button 
                onClick={() => navigate('/activity')} 
                className="relative p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer md:hidden" 
            >
              <Bell size={20} strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#0A84FF] rounded-full shadow-[0_0_8px_rgba(10,132,255,0.8)]" />
              )}
            </button>

            <button onClick={() => setShowUsersModal(true)} className="p-2 bg-white/5 border border-white/5 hover:bg-white/10 rounded-full shadow-sm transition-all cursor-pointer" title="New Chat">
              <MessageSquarePlus size={18} strokeWidth={2} className="text-white/80" />
            </button>
            <div className="relative shrink-0">
              <button onClick={() => setShowListMenu(!showListMenu)} className="p-2 hover:bg-white/10 rounded-full transition-all cursor-pointer" title="Menu">
                <MoreHorizontal size={20} strokeWidth={2} className="text-white/80" />
              </button>
              
              {showListMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowListMenu(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] z-50 p-1.5 animate-in slide-in-from-top-2 duration-100">
                    <div className="flex flex-col gap-1 text-[#EBEBF5]">
                      <button onClick={() => { setShowListMenu(false); navigate('/profile'); }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2C2C2E] transition-all text-left w-full cursor-pointer font-medium text-[13px]">
                        Profile Settings
                      </button>
                      <button onClick={() => { setShowListMenu(false); navigate('/settings'); }} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2C2C2E] transition-all text-left w-full cursor-pointer font-medium text-[13px]">
                        System Preferences
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Search Command Center */}
        <div className="px-4 pb-3">
          <div className="relative flex items-center bg-black/40 rounded-lg overflow-hidden transition-all h-[40px] border border-white/5 hover:bg-black/50 focus-within:bg-black/60 focus-within:border-white/20 shadow-inner">
            <div className="pl-3 pr-2 flex items-center justify-center text-white/40">
              <Search size={16} strokeWidth={2.5} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder="Search..." 
              className="w-full h-full bg-transparent text-[14px] text-white/90 placeholder-white/40 outline-none pr-3"
            />
            {isFocused && (
              <button 
                onClick={() => { setSearchQuery(''); setIsFocused(false); }}
                className="pr-3 text-[12px] font-medium text-[#0A84FF] hover:text-[#0A84FF]/80 transition-colors shrink-0 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Dynamic List Container */}
        {isFocused ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-black/20">
            {/* Case 1: Empty Query - Show Recent Searches */}
            {!searchQuery.trim() ? (
              <div className="p-4 flex-1 flex flex-col gap-3 select-none">
                <h4 className="text-[11px] font-bold text-white/30 uppercase tracking-widest px-1">Recent Searches</h4>
                {recentSearches.length === 0 ? (
                  <p className="text-[13px] text-white/40 italic px-1">No recent searches.</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {recentSearches.map((q, idx) => {
                      const isObj = typeof q === 'object' && q !== null;
                      const displayUsername = isObj ? q.username : q;
                      return (
                        <div 
                          key={idx}
                          onClick={() => { 
                            if (isObj) navigate(`/user-profile/${q._id}`);
                            else { setSearchQuery(displayUsername); searchUsers(displayUsername); }
                          }}
                          className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-3 text-[14px] text-white/80 font-medium">
                            {isObj ? (
                              <Avatar src={q.profilePic} name={q.displayName || q.username} sizeClass="w-7 h-7 opacity-80" />
                            ) : (
                              <Clock size={16} className="text-white/40" />
                            )}
                            <span>{displayUsername}</span>
                          </div>
                          <button onClick={(e) => removeRecentSearch(e, q)} className="p-1 text-white/30 hover:text-white/80 transition-colors cursor-pointer">
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : isSearching ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-white/40" />
                <span className="text-[13px] text-white/50">Querying directory...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none">
                <div className="w-12 h-12 bg-white/5 text-white/30 rounded-full flex items-center justify-center mb-3">
                  <Inbox size={20} />
                </div>
                <h4 className="text-[14px] font-medium text-white/80">No matches found</h4>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1 custom-scrollbar">
                <h4 className="text-[11px] font-bold text-white/30 uppercase tracking-widest px-2 mb-2">Directory Results</h4>
                {searchResults.map((u) => (
                  <div 
                    key={u._id} 
                    onClick={() => selectSearchResult(u)}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent"
                  >
                    <Avatar src={u.profilePic} name={u.displayName || u.username} sizeClass="w-9 h-9" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-white/90 truncate">{u.displayName}</p>
                      <p className="text-[12px] text-white/50">@{u.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Normal Conversations List Mode */
          <div className="flex-1 overflow-y-auto px-2 pb-3 pt-1 custom-scrollbar">
            {isChatsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-white/30" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-16 select-none">
                <p className="text-[13px] text-white/40">No active conversations</p>
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
        )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1C1C1E] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 animate-in zoom-in-95 duration-200">
            <div className="bg-[#2C2C2E]/50 px-5 py-4 border-b border-white/5 flex justify-between items-center select-none">
              <h3 className="text-[16px] font-medium text-white/90">New Communication</h3>
              <button onClick={() => setShowUsersModal(false)} className="text-white/50 hover:text-white/90 transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
              <button 
                onClick={() => { setShowUsersModal(false); navigate('/contacts'); }}
                className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors mb-2 group"
              >
                <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:bg-[#0A84FF] group-hover:text-white transition-colors">
                  <Users size={18} />
                </div>
                <div className="border-b border-white/5 flex-1 pb-2 pt-1 text-left">
                  <p className="text-[15px] font-medium text-white/90">Directory</p>
                  <p className="text-[12px] text-white/40">Find new contacts</p>
                </div>
              </button>

              <h4 className="text-[11px] font-bold text-white/30 uppercase tracking-widest px-3 py-3 select-none">Established Links</h4>

              {isFriendsLoading ? (
                <div className="text-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-white/40" />
                </div>
              ) : (friends || []).length === 0 ? (
                <div className="text-center text-white/40 py-8 text-[13px]">
                  No established links found.<br />Access Directory to expand network.
                </div>
              ) : (
                (friends || []).map((u) => (
                  <div 
                    key={u._id} 
                    onClick={() => handleStartChat(u._id)}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <Avatar src={u.profilePic} name={u.displayName || u.username} className="border border-white/10" sizeClass="w-10 h-10" />
                    <div className="flex-1 text-left">
                      <p className="text-[14px] font-medium text-white/90">{u.displayName}</p>
                      <p className="text-[12px] text-white/40">@{u.username}</p>
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
