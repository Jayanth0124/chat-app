import { useEffect, useState, useRef } from 'react';
import chatWindowBg from '../assets/images/chat-window.jpg';
import { createPortal } from 'react-dom';
import { ArrowLeft, MoreHorizontal, CheckCheck, Check, Phone, Video, Play, Pause, FileText, Search, Image as ImageIcon, Clock, MonitorPlay, Download, StopCircle, X, ChevronUp, ChevronDown, Eye, Camera, Trash2 } from 'lucide-react';
import ChatInput from './ChatInput';
import Select from './ui/Select';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useConfirmStore } from '../store/useConfirmStore';
import { axiosInstance } from '../lib/axios';
import { useNavigate } from 'react-router-dom';
import Avatar from './ui/Avatar';

export default function ChatWindow({ onBack }) {
  const { 
    selectedChat, 
    messages, 
    getMessages, 
    sendMessage, 
    socket, 
    markViewOnceOpened, 
    updateVanishMode,
    markChatAsSeen,
    deleteChat,
    markChatAsUnread,
    reportMessage,
    isSelectionMode,
    selectedMessages,
    toggleSelectionMode,
    clearSelection,
    unsendMessages,
    deleteMessagesForMe
  } = useChatStore();
  const { user } = useAuthStore();
  const { setActiveCall } = useLayoutStore();
  const navigate = useNavigate();

  const [isTyping, setIsTyping] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [viewingMessage, setViewingMessage] = useState(null);
  const [viewingSnap, setViewingSnap] = useState(null);
  
  // Dropdowns and menus
  const [showVanishDropdown, setShowVanishDropdown] = useState(false);
  const [showChatActionsDropdown, setShowChatActionsDropdown] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [reportingMessage, setReportingMessage] = useState(null);
  
  // Search state
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);

  const messagesEndRef = useRef(null);
  const isInitialMount = useRef(true);

  // Load messages
  useEffect(() => {
    if (!selectedChat) return;
    getMessages(selectedChat._id);
    if (socket) socket.emit('join chat', selectedChat._id);
    markChatAsSeen(selectedChat._id);

    return () => {
      if (socket) socket.emit('leave chat', selectedChat._id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?._id]);

  useEffect(() => {
    isInitialMount.current = true;
    setIsSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
    setCurrentSearchIndex(-1);
  }, [selectedChat?._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && !isSearchMode) {
      const behavior = isInitialMount.current ? 'auto' : 'smooth';
      messagesEndRef.current?.scrollIntoView({ behavior, block: 'end' });
      
      if (isInitialMount.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        }, 150);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
        }, 500);
        isInitialMount.current = false;
      }
    }
  }, [messages, isSearchMode]);

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }
    const results = messages.filter(m => 
      m.messageType === 'text' && 
      m.content && 
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? results.length - 1 : -1);
  }, [searchQuery, messages]);

  // Scroll to search result
  useEffect(() => {
    if (currentSearchIndex >= 0 && searchResults[currentSearchIndex]) {
      const msgId = searchResults[currentSearchIndex]._id;
      const el = document.getElementById(`msg-${msgId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const inner = el.querySelector('.orbit-bubble-target');
        if (inner) {
          inner.classList.add('ring-2', 'ring-[#0A84FF]', 'scale-[1.01]');
          setTimeout(() => inner.classList.remove('ring-2', 'ring-[#0A84FF]', 'scale-[1.01]'), 1500);
        }
      }
    }
  }, [currentSearchIndex, searchResults]);

  // Socket events
  useEffect(() => {
    if (!socket) return;
    
    socket.on('typing', () => setIsTyping(true));
    socket.on('stop typing', () => setIsTyping(false));
    socket.on('voice_recording_start', () => setIsRecordingVoice(true));
    socket.on('voice_recording_stop', () => setIsRecordingVoice(false));

    return () => {
      socket.off('typing');
      socket.off('stop typing');
      socket.off('voice_recording_start');
      socket.off('voice_recording_stop');
    };
  }, [socket]);

  const triggerCall = async (type) => {
    if (!otherParticipant) return;
    try {
      const { user } = useAuthStore.getState();
      const res = await axiosInstance.post('/calls', {
        receiverId: otherParticipant._id,
        type
      });
      const callRecord = res.data;

      setActiveCall({
        callId: callRecord._id,
        name: !selectedChat.isGroupChat ? getSender(user, selectedChat.participants) : selectedChat.groupName,
        pic: !selectedChat.isGroupChat ? getSenderPic(user, selectedChat.participants) : null,
        type,
        status: 'dialing',
        receiverId: otherParticipant._id,
        direction: 'outgoing'
      });

      if (socket) {
        socket.emit('call:offer', {
          to: otherParticipant._id,
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
    }
  };

  const getSender = (loggedUser, users) => {
    return users[0]?._id === loggedUser?._id ? users[1]?.displayName : users[0]?.displayName;
  };

  const getSenderPic = (loggedUser, users) => {
    return users[0]?._id === loggedUser?._id ? users[1]?.profilePic : users[0]?.profilePic;
  };

  if (!selectedChat) {
    return (
      <div 
        className="orbit-bg-chatwindow flex-1 flex flex-col items-center justify-center h-full relative overflow-hidden select-none bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${chatWindowBg})` }}
      >
        <div className="orbit-dark-overlay absolute inset-0 bg-black/60 z-0 pointer-events-none" />
        <div className="w-full max-w-xl text-center z-10 flex flex-col items-center justify-center h-full gap-8">
          <div className="w-16 h-16 rounded-full border border-white/10 bg-black/40 shadow-2xl flex items-center justify-center">
            <MonitorPlay size={24} className="text-white/40" />
          </div>
          <div className="space-y-2">
            <h2 className="text-[20px] font-medium text-white/90 tracking-wide">No Chat Selected</h2>
            <p className="text-[13px] text-white/40 max-w-sm mx-auto">
              Select a chat to start messaging.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSendMessage = (content, mediaUrl = null, messageType = 'text', replyToId = null, mediaSource = null) => {
    sendMessage({
      content,
      chatId: selectedChat._id,
      mediaUrl,
      messageType,
      isViewOnce: selectedChat.vanishMode === 'VIEW ONCE',
      replyTo: replyToId,
      mediaSource
    });
  };

  const handleViewMessage = (msg) => {
    if (msg.messageType === 'snap' && !msg.opened) {
      setViewingSnap(msg);
      markViewOnceOpened(msg._id);
    } else {
      setViewingMessage(msg);
    }
  };

  const handleCloseViewMessage = async () => {
    if (viewingMessage && !viewingMessage.isViewed) {
      await markViewOnceOpened(viewingMessage._id);
    }
    setViewingMessage(null);
  };

  const chatName = !selectedChat.isGroupChat ? getSender(user, selectedChat.participants) : selectedChat.groupName;

  const otherParticipant = selectedChat.participants?.find(p => p._id !== user._id);
  const isOnline = otherParticipant?.isOnline || false;
  const lastSeen = otherParticipant?.lastSeen;

  const activeVanishMode = selectedChat.vanishMode && selectedChat.vanishMode !== 'OFF';

  return (
    <div 
      className={`orbit-bg-chatwindow flex flex-col h-full w-full relative z-0 bg-cover bg-center bg-no-repeat bg-fixed`}
      style={{ backgroundImage: `url(${chatWindowBg})` }}
    >
      <div className={`orbit-dark-overlay absolute inset-0 z-0 pointer-events-none transition-colors duration-500 ${activeVanishMode ? 'bg-black/90' : 'bg-black/50'}`} />
      
      <div className={`orbit-dark-overlay absolute inset-0 z-0 pointer-events-none transition-colors duration-500 ${activeVanishMode ? 'bg-black/90' : 'bg-black/50'}`} />
      
      {/* Precision Engineered Header - z-30 to stay above everything but modals/dropdowns */}
      {isSelectionMode ? (
        <div className="h-[64px] bg-[#0A84FF]/10 flex items-center justify-between px-4 sm:px-5 md:px-6 shrink-0 z-30 relative border-b border-[#0A84FF]/20 w-full shadow-xl">
          <div className="flex items-center gap-3 text-[#0A84FF]">
            <button onClick={clearSelection} className="p-2 hover:bg-[#0A84FF]/10 rounded-full transition-colors cursor-pointer">
              <X size={20} />
            </button>
            <span className="font-medium text-[15px]">{selectedMessages.length} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={selectedMessages.length === 0}
              onClick={async () => {
                const confirmed = await useConfirmStore.getState().confirm({
                  title: "Unsend Messages",
                  message: "Unsend these messages for everyone? This only affects messages you sent.",
                  confirmText: "Unsend",
                  danger: true
                });
                if (confirmed) {
                  unsendMessages(selectedMessages);
                }
              }}
              className="px-3 py-1.5 bg-[#0A84FF]/10 text-[#0A84FF] hover:bg-[#0A84FF]/20 rounded-md text-[13px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              Unsend
            </button>
            <button
              disabled={selectedMessages.length === 0}
              onClick={async () => {
                const confirmed = await useConfirmStore.getState().confirm({
                  title: "Delete For Me",
                  message: "Delete these messages for you? They will remain for the other person.",
                  confirmText: "Delete",
                  danger: true
                });
                if (confirmed) {
                  deleteMessagesForMe(selectedMessages);
                }
              }}
              className="px-3 py-1.5 bg-[#FF453A]/10 text-[#FF453A] hover:bg-[#FF453A]/20 rounded-md text-[13px] font-medium transition-colors disabled:opacity-50 cursor-pointer"
            >
              Delete For Me
            </button>
          </div>
        </div>
      ) : (
      <div className="h-[64px] bg-[#111111]/90 flex items-center justify-between px-4 sm:px-5 md:px-6 shrink-0 z-30 relative border-b border-white/5 w-full shadow-xl">
        <div 
          onClick={() => !selectedChat.isGroupChat && otherParticipant && navigate(`/user-profile/${otherParticipant._id}`)}
          className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 pr-4"
        >
          <button 
            onClick={(e) => { e.stopPropagation(); onBack(); }}
            className="md:hidden p-1.5 -ml-1 text-white/50 hover:text-white hover:bg-white/5 rounded-md transition-colors"
          >
            <ArrowLeft size={22} />
          </button>
          <div className="relative shrink-0 ml-0.5">
            <div className="w-[38px] h-[38px] rounded-full overflow-hidden bg-black/50 border border-white/5 flex shrink-0">
              <Avatar 
                src={!selectedChat.isGroupChat ? getSenderPic(user, selectedChat.participants) : null}
                name={chatName}
                sizeClass="w-full h-full"
              />
            </div>
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#34C759] rounded-full border-[2px] border-[#111111] z-10" />
            )}
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h3 className="font-medium text-[15px] text-white/90 truncate">{chatName}</h3>
            <p className="text-[11px] font-medium tracking-wide truncate">
              {isTyping ? (
                <span className="text-[#0A84FF]">Typing...</span>
              ) : isOnline ? (
                <span className="text-[#34C759]">Active Session</span>
              ) : lastSeen ? (
                <span className="text-white/40">Offline • {new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              ) : (
                <span className="text-white/40">Offline</span>
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 text-white/50 shrink-0">
          {/* Custom Vanish Mode Menu */}
          <div className="relative">
            <button
              onClick={() => setShowVanishDropdown(!showVanishDropdown)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-[11px] font-bold tracking-widest uppercase transition-all shadow-sm cursor-pointer ${
                selectedChat.vanishMode && selectedChat.vanishMode !== 'OFF'
                  ? 'bg-[#0A84FF]/10 border-[#0A84FF]/30 text-[#0A84FF] hover:bg-[#0A84FF]/20'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/60'
              }`}
              title="Vanish Mode"
            >
              <Clock size={12} />
              <span className="hidden sm:inline">
                {selectedChat.vanishMode === 'OFF' || !selectedChat.vanishMode ? 'Standard' : 'Volatile'}
              </span>
            </button>

            {showVanishDropdown && (
              <>
                {/* z-[100] for click outside handler to ensure it covers everything */}
                <div className="fixed inset-0 z-[100]" onClick={() => setShowVanishDropdown(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-[101] p-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <p className="px-3 py-2 text-[9px] font-bold text-white/30 uppercase tracking-widest border-b border-white/5 mb-1">Vanish Mode Options</p>
                  <div className="flex flex-col gap-0.5">
                    {[
                      { value: 'OFF', label: 'Standard', desc: 'Messages stay in chat' },
                      { value: 'VIEW ONCE', label: 'View Once', desc: 'Message disappears after viewing' },
                      { value: '10 SECONDS', label: '10 Seconds', desc: 'Disappears after 10 seconds' },
                      { value: '1 MINUTE', label: '1 Minute', desc: 'Disappears after 1 minute' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          updateVanishMode(selectedChat._id, opt.value);
                          setShowVanishDropdown(false);
                        }}
                        className={`flex flex-col text-left px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                          (selectedChat.vanishMode || 'OFF') === opt.value
                            ? 'bg-[#0A84FF]/10 text-[#0A84FF]'
                            : 'hover:bg-[#2C2C2E] text-white/80'
                        }`}
                      >
                        <span className="text-[12px] font-medium">{opt.label}</span>
                        <span className="text-[10px] opacity-50 mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <button 
            onClick={() => {
              setIsSearchMode(!isSearchMode);
              if (isSearchMode) {
                setSearchQuery('');
                setSearchResults([]);
                setCurrentSearchIndex(-1);
              }
            }}
            className={`p-2 rounded-md transition-colors cursor-pointer hidden sm:block ${isSearchMode ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-white/50 hover:text-white'}`} 
            title="Search Chat"
          >
            <Search size={18} />
          </button>
          
          <button onClick={() => triggerCall('voice')} className="p-2 hover:bg-white/10 rounded-md transition-colors cursor-pointer text-white/50 hover:text-white" title="Voice Channel">
            <Phone size={18} />
          </button>
          
          <button onClick={() => triggerCall('video')} className="p-2 hover:bg-white/10 rounded-md transition-colors cursor-pointer text-white/50 hover:text-white" title="Video Channel">
            <Video size={18} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setShowChatActionsDropdown(!showChatActionsDropdown)}
              className="p-2 hover:bg-white/10 rounded-md transition-colors cursor-pointer text-white/50 hover:text-white"
              title="Chat Options"
            >
              <MoreHorizontal size={18} />
            </button>

            {showChatActionsDropdown && (
              <>
                <div className="fixed inset-0 z-[100]" onClick={() => setShowChatActionsDropdown(false)} />
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-[101] p-1.5 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSearchMode(true);
                        setShowChatActionsDropdown(false);
                      }}
                      className="flex sm:hidden items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#2C2C2E] text-white/90 text-[13px] font-medium transition-colors w-full cursor-pointer"
                    >
                      Search Log
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        markChatAsUnread(selectedChat._id);
                        setShowChatActionsDropdown(false);
                        onBack();
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#2C2C2E] text-white/90 text-[13px] font-medium transition-colors w-full cursor-pointer"
                    >
                      Mark as Unread
                    </button>
                    <div className="h-px bg-white/5 mx-2 my-1" />
                    <button
                      type="button"
                      onClick={async () => {
                        setShowChatActionsDropdown(false);
                        const confirmed = await useConfirmStore.getState().confirm({
                          title: "Delete Chat",
                          message: "Delete this conversation?",
                          confirmText: "Delete",
                          danger: true
                        });
                        if (confirmed) {
                          deleteChat(selectedChat._id);
                          onBack();
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#FF453A]/10 text-[#FF453A] text-[13px] font-medium transition-colors w-full cursor-pointer"
                    >
                      Delete Chat
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Search Header Bar */}
      {isSearchMode && (
        <div className="bg-[#111111]/95 border-b border-white/5 p-2 px-4 flex items-center gap-3 z-20 shrink-0 shadow-lg relative">
          <div className="flex-1 bg-black/50 border border-white/10 rounded-md flex items-center px-3 py-1.5">
            <Search size={14} className="text-white/40 mr-2 shrink-0" />
            <input 
              autoFocus
              type="text"
              placeholder="Search conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white/90 text-[13px] outline-none w-full placeholder:text-white/30"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="p-1 text-white/40 hover:text-white shrink-0 cursor-pointer">
                <X size={14} />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div className="flex items-center gap-2 shrink-0 text-white/50">
              <span className="text-[11px] font-medium mr-1 tracking-widest uppercase">
                {currentSearchIndex + 1} OF {searchResults.length}
              </span>
              <button 
                onClick={() => setCurrentSearchIndex(prev => Math.max(0, prev - 1))}
                disabled={currentSearchIndex <= 0}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-colors"
              >
                <ChevronUp size={14} />
              </button>
              <button 
                onClick={() => setCurrentSearchIndex(prev => Math.min(searchResults.length - 1, prev + 1))}
                disabled={currentSearchIndex >= searchResults.length - 1}
                className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer transition-colors"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Communications Display */}
      {/* Optimized padding and width utilization */}
      <div className={`flex-1 overflow-y-auto px-6 sm:px-8 md:px-10 lg:px-12 py-6 flex flex-col gap-[3px] transition-colors relative z-10 custom-scrollbar ${activeVanishMode ? 'text-white/90' : ''}`}>
        
        {activeVanishMode && (
          <div className="flex justify-center mb-6">
            <div className="bg-[#FF453A]/10 text-[#FF453A] text-[11px] font-bold px-4 py-2 rounded-md border border-[#FF453A]/20 uppercase tracking-widest shadow-sm">
              Vanish Mode Active
            </div>
          </div>
        )}

        <div className="flex justify-center mb-8 mt-4">
          <div className="bg-black/40 text-white/40 text-[10px] font-bold px-3 py-1.5 rounded-md border border-white/5 uppercase tracking-widest shadow-inner">
            Conversation Started
          </div>
        </div>

        {messages.map((m, i) => {
          const isOwn = m.sender?._id === user?._id;
          const nextIsSame = messages[i + 1]?.sender?._id === m.sender?._id;
          const prevIsSame = messages[i - 1]?.sender?._id === m.sender?._id;
          const isHighlighted = searchResults[currentSearchIndex]?._id === m._id;
          
          return (
            <MessagePanel 
              key={m._id} 
              isOwn={isOwn} 
              message={m}
              text={m.content} 
              time={new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
              status={m.status || 'sent'} 
              isFirstInGroup={!prevIsSame}
              isLastInGroup={!nextIsSame}
              isHighlighted={isHighlighted}
              onViewMessage={() => handleViewMessage(m)}
              onViewSnap={() => handleViewMessage(m)}
              setReplyToMessage={setReplyToMessage}
              onReportMessage={setReportingMessage}
              isSelectionMode={isSelectionMode}
              isSelected={selectedMessages.includes(m._id)}
              toggleSelection={() => useChatStore.getState().toggleMessageSelection(m._id)}
              triggerCall={triggerCall}
            />
          );
        })}
        <div ref={messagesEndRef} className="h-6" />
      </div>

      {/* Atmospheric Transmission State */}
      {(isTyping || isRecordingVoice) && (
        <div className={`absolute bottom-[72px] md:bottom-[80px] left-[5%] right-[5%] max-w-[900px] mx-auto z-20 pointer-events-none`}>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-[#111111]/90 border border-white/10 shadow-lg backdrop-blur-md">
            {isRecordingVoice ? (
              <StopCircle size={14} className="text-[#FF453A] animate-pulse" />
            ) : (
              <div className="flex gap-1 items-center">
                <span className="w-1 h-1 bg-[#0A84FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-[#0A84FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-[#0A84FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            )}
            <span className="text-[11px] font-bold tracking-widest uppercase text-white/50">
              {otherParticipant?.displayName} {isRecordingVoice ? 'Recording' : 'Transmitting'}
            </span>
          </div>
        </div>
      )}

      {/* Command Input Area - Ensure z-20 */}
      <div className="z-20 relative bg-transparent">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          socket={socket} 
          selectedChat={selectedChat} 
          replyToMessage={replyToMessage}
          setReplyToMessage={setReplyToMessage}
        />
      </div>

      {/* Snap Full Screen Viewer */}
      {viewingSnap && createPortal(
        <div 
          className="fixed inset-0 w-screen h-screen z-[9999] bg-[#000000] flex flex-col animate-in fade-in zoom-in-95 duration-300"
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 pt-safe z-50 bg-gradient-to-b from-black/80 to-transparent flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={viewingSnap.sender?.profilePic} alt={viewingSnap.sender?.displayName} size="md" />
              <div className="flex flex-col">
                <span className="text-white font-bold text-[15px] drop-shadow-md leading-tight">{viewingSnap.sender?.displayName}</span>
                <span className="text-white/70 font-medium text-[12px] drop-shadow-md">
                  @{viewingSnap.sender?.email?.split('@')[0] || viewingSnap.sender?.displayName?.toLowerCase().replace(/\s+/g, '')}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-3">
                <span className="text-white/90 text-[12px] font-bold tracking-wide drop-shadow-md">
                  {new Date(viewingSnap.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button 
                  onClick={() => setViewingSnap(null)}
                  className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 flex items-center justify-center text-white backdrop-blur-md transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <span className="text-white/60 text-[10px] font-medium italic drop-shadow-md mt-1">
                {viewingSnap.mediaSource === 'camera' ? 'Taken with Camera' : viewingSnap.mediaSource === 'gallery' ? 'From Gallery' : ''}
              </span>
            </div>
          </div>

          {/* Media Content */}
          <div className="flex-1 w-full h-full flex items-center justify-center relative">
            {viewingSnap.mediaUrl && viewingSnap.mediaUrl.match(/\.(mp4|webm|ogg)$/i) ? (
              <video 
                src={viewingSnap.mediaUrl} 
                autoPlay 
                loop
                className="w-full h-full object-contain"
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
              />
            ) : (
              <img 
                src={viewingSnap.mediaUrl} 
                alt="Snap" 
                className="w-full h-full object-contain select-none" 
                draggable={false}
              />
            )}
          </div>

          {/* Caption (Instagram style) */}
          {viewingSnap.content && viewingSnap.content !== 'Snap' && viewingSnap.content !== 'Opened' && (
            <div className="absolute bottom-12 left-0 right-0 px-6 z-50 flex justify-center pointer-events-none">
              <div className="bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl max-w-sm text-center shadow-xl border border-white/10">
                <p className="text-white text-[14px] font-medium leading-snug drop-shadow-md">
                  {viewingSnap.content}
                </p>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Restricted View Modal */}
      {viewingMessage && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="absolute top-6 right-6">
            <button 
              onClick={handleCloseViewMessage}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 rounded-md transition-colors text-[11px] font-bold uppercase tracking-widest border border-white/10 cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="text-center mb-10">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-[#0A84FF]/50 flex items-center justify-center mx-auto mb-4 bg-[#0A84FF]/10">
              <Eye size={20} className="text-[#0A84FF]" />
            </div>
            <p className="text-white/40 text-[11px] uppercase tracking-widest font-bold">View Once Message</p>
          </div>
          <div className="max-w-2xl w-full bg-[#111111] p-8 rounded-xl border border-white/10 shadow-2xl">
            <p className="text-white/90 text-xl text-center leading-relaxed font-medium">
              {viewingMessage.content}
            </p>
          </div>
          <p className="absolute bottom-10 text-[#FF453A]/80 text-[10px] font-bold uppercase tracking-widest">
            Message will be deleted after closing
          </p>
        </div>
      )}

      {/* Report Modal */}
      {reportingMessage && (
        <ReportModal 
          message={reportingMessage}
          onClose={() => setReportingMessage(null)}
          onSubmit={async (reason, details) => {
            await reportMessage(reportingMessage._id, reason, details);
            setReportingMessage(null);
          }}
        />
      )}
    </div>
  );
}

const handleDownload = async (e, url, defaultFilename) => {
  e.preventDefault();
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    if (blob.size === 0 || blob.type.includes('text/html')) throw new Error('Invalid blob data (likely an error page)');
    
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = defaultFilename || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed, opening in new tab', error);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

function MessagePanel({ isOwn, text, time, status, isFirstInGroup, isLastInGroup, isHighlighted, message, onViewMessage, onViewSnap, setReplyToMessage, onReportMessage, isSelectionMode, isSelected, toggleSelection, triggerCall }) {
  const { deleteMessage, toggleSelectionMode, unsendMessages, deleteMessagesForMe } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const longPressTimer = useRef(null);

  const calculateMenuPosition = (x, y) => {
    const MENU_WIDTH = 160; 
    const MENU_HEIGHT = 100;
    const PADDING = 16;
    
    let posX = x;
    let posY = y;
    
    if (x + MENU_WIDTH + PADDING > window.innerWidth) posX = window.innerWidth - MENU_WIDTH - PADDING;
    if (posX < PADDING) posX = PADDING;
    if (y + MENU_HEIGHT + PADDING > window.innerHeight) posY = y - MENU_HEIGHT;
    
    setShowMenu({ x: posX, y: posY });
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (isSelectionMode) return;
    calculateMenuPosition(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    if (isSelectionMode) return;
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    longPressTimer.current = setTimeout(() => {
      toggleSelectionMode();
      toggleSelection();
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  // Structural design over decorative bubbles
  const panelClasses = isOwn 
    ? `rounded-lg ${!isFirstInGroup && !isLastInGroup ? 'rounded-r-sm' : isFirstInGroup && !isLastInGroup ? 'rounded-br-sm' : !isFirstInGroup && isLastInGroup ? 'rounded-tr-sm' : ''}`
    : `rounded-lg ${!isFirstInGroup && !isLastInGroup ? 'rounded-l-sm' : isFirstInGroup && !isLastInGroup ? 'rounded-bl-sm' : !isFirstInGroup && isLastInGroup ? 'rounded-tl-sm' : ''}`;
    
  const isVoice = message?.messageType === 'audio' || text?.startsWith('[Voice Message');
  const isDoc = message?.messageType === 'document' || text?.startsWith('[Shared Document');
  const isImg = message?.messageType === 'image' || text?.startsWith('[Shared Image');
  const isVideo = message?.messageType === 'video';
  const isSnap = message?.messageType === 'snap';

  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); } 
      else { audioRef.current.play(); setIsPlaying(true); }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const [audioDuration, setAudioDuration] = useState(null);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (message?.status === 'seen' && message?.expiresAt) {
      const calculateRemaining = () => {
        const diff = new Date(message.expiresAt).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / 1000));
      };

      const initial = calculateRemaining();
      if (initial > 0 && initial <= 90) {
        setTimeRemaining(initial);
        const interval = setInterval(() => {
          const rem = calculateRemaining();
          if (rem <= 0) { clearInterval(interval); setTimeRemaining(0); } 
          else { setTimeRemaining(rem); }
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [message?.status, message?.expiresAt]);

  const isExpired = message?.expiresAt && new Date(message.expiresAt).getTime() <= Date.now();
  if ((isExpired || timeRemaining === 0) && message?.messageType !== 'snap') return null;

  return (
    <div id={`msg-${message._id}`} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} w-full ${isFirstInGroup ? 'mt-2.5' : ''}`}>
      {/* Optimized message width utilization */}
      <div className={`relative w-fit max-w-[92%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Spatial System Menu */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-[100] bg-black/10" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
            <div 
              className="fixed z-[101] bg-[#1C1C1E] border border-white/10 rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] p-1.5 flex flex-col w-40 animate-in fade-in zoom-in-95 duration-100"
              style={{ top: showMenu.y, left: showMenu.x }}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setReplyToMessage(message); setShowMenu(false); }}
                className="px-3 py-2 rounded-lg hover:bg-[#2C2C2E] text-white/90 text-[13px] font-medium transition-colors text-left w-full cursor-pointer"
              >
                Reply
              </button>
              {!isOwn && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onReportMessage(message); setShowMenu(false); }}
                  className="px-3 py-2 rounded-lg hover:bg-[#FF453A]/10 text-[#FF453A] text-[13px] font-medium transition-colors text-left w-full cursor-pointer"
                >
                  Report Message
                </button>
              )}
              {isOwn && !message.isUnsent && (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation(); setShowMenu(false);
                    const confirmed = await useConfirmStore.getState().confirm({
                      title: "Unsend Message",
                      message: "Unsend this message for everyone?",
                      confirmText: "Unsend",
                      danger: true
                    });
                    if (confirmed) unsendMessages([message._id]);
                  }}
                  className="px-3 py-2 rounded-lg hover:bg-[#FF453A]/10 text-[#FF453A] text-[13px] font-medium transition-colors text-left w-full cursor-pointer mt-1 border-t border-white/5 pt-2"
                >
                  Unsend Message
                </button>
              )}
              <button
                type="button"
                onClick={async (e) => {
                  e.stopPropagation(); setShowMenu(false);
                  const confirmed = await useConfirmStore.getState().confirm({
                    title: "Delete For Me",
                    message: "Delete this message for you?",
                    confirmText: "Delete",
                    danger: true
                  });
                  if (confirmed) deleteMessagesForMe([message._id]);
                }}
                className={`px-3 py-2 rounded-lg hover:bg-[#FF453A]/10 text-[#FF453A] text-[13px] font-medium transition-colors text-left w-full cursor-pointer ${isOwn && message.isUnsent ? 'mt-1 border-t border-white/5 pt-2' : ''}`}
              >
                Delete For Me
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  toggleSelectionMode();
                  toggleSelection();
                }}
                className="px-3 py-2 rounded-lg hover:bg-[#2C2C2E] text-white/90 text-[13px] font-medium transition-colors text-left w-full cursor-pointer mt-1 border-t border-white/5 pt-2"
              >
                Select Message
              </button>
            </div>
          </>
        )}

        {/* The Panel */}
        <div 
          onClick={isSelectionMode ? toggleSelection : undefined}
          className={`orbit-bubble-target relative w-full flex flex-col transition-transform active:scale-[0.99] ${panelClasses} ${
            isSelected ? 'ring-2 ring-[#0A84FF] bg-[#0A84FF]/20' : 
            isOwn 
              ? 'bg-black/50 border shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_2px_5px_rgba(0,0,0,0.2)]' 
              : 'bg-white/5 border shadow-sm'
          } ${
            isHighlighted 
              ? 'border-[#0A84FF] ring-2 ring-[#0A84FF]/50 bg-[#0A84FF]/10' 
              : isOwn ? 'border-white/10' : 'border-white/5'
          } ${isSelectionMode ? 'cursor-pointer' : ''}`}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >

        {message.replyTo && (
          <div 
            className={`mx-2 mt-2 px-3 py-2 rounded-md text-xs flex flex-col border-l-2 ${
              isOwn ? 'border-white/30 bg-black/40' : 'border-[#0A84FF]/50 bg-black/20'
            } cursor-pointer max-w-full truncate group`}
            onClick={() => {
              const targetEl = document.getElementById(`msg-${message.replyTo._id}`);
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                targetEl.querySelector('.orbit-bubble-target')?.classList.add('ring-2', 'ring-[#0A84FF]', 'scale-[1.01]');
                setTimeout(() => targetEl.querySelector('.orbit-bubble-target')?.classList.remove('ring-2', 'ring-[#0A84FF]', 'scale-[1.01]'), 1000);
              }
            }}
          >
            <span className={`font-bold text-[9px] uppercase tracking-widest ${isOwn ? 'text-white/50' : 'text-[#0A84FF]'}`}>
              {message.replyTo.sender?.displayName || 'USER'}
            </span>
            <span className={`opacity-80 truncate text-[12px] mt-0.5 ${isOwn ? 'text-white/80' : 'text-white/80'}`}>
              {message.replyTo.messageType === 'image' ? 'IMG_PAYLOAD' : message.replyTo.content}
            </span>
          </div>
        )}
        
        <div className="relative px-3.5 pt-2.5 pb-2 flex flex-col justify-between">
          {message.isUnsent ? (
            <div className="flex items-center gap-2 py-1 italic text-white/40">
              <span className="text-[12px]">{isOwn ? "You unsent a message" : "This message was unsent"}</span>
            </div>
          ) : message.messageType === 'call' && message.callData ? (
            <div 
              className="flex items-center gap-3 pr-2 min-w-[200px] py-1 cursor-pointer"
              onClick={() => triggerCall && triggerCall(message.callData.callType)}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                message.callData.status === 'missed' || message.callData.status === 'rejected'
                  ? 'bg-[#FF453A]/10 border-[#FF453A]/20 text-[#FF453A]'
                  : isOwn ? 'bg-black/50 border-white/10 text-white/70' : 'bg-[#34C759]/10 border-[#34C759]/20 text-[#34C759]'
              }`}>
                {message.callData.callType === 'video' ? <Video size={18} /> : <Phone size={18} />}
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[13px] font-medium text-white/90">
                  {message.callData.status === 'missed' 
                    ? 'Missed Call' 
                    : message.callData.status === 'rejected'
                      ? 'Declined Call'
                      : isOwn ? 'Outgoing Call' : 'Incoming Call'
                  }
                </span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                  {message.callData.duration ? formatDuration(message.callData.duration) : 'No Answer'}
                </span>
              </div>
            </div>
          ) : isVoice ? (
            <div className="flex items-center gap-3 pr-2 min-w-[200px] py-1">
              {message?.mediaUrl && (
                <audio 
                  ref={audioRef} 
                  src={message.mediaUrl} 
                  onEnded={() => setIsPlaying(false)} 
                  onLoadedMetadata={(e) => setAudioDuration(e.target.duration)}
                  className="hidden" 
                />
              )}
              <button 
                onClick={togglePlay}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer border ${
                  isOwn ? 'bg-white/10 hover:bg-white/20 border-white/20 text-white' : 'bg-[#0A84FF]/20 hover:bg-[#0A84FF]/30 border-[#0A84FF]/30 text-[#0A84FF]'
                }`}
              >
                {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
              </button>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-[2px] h-5">
                  {[3, 5, 2, 7, 6, 8, 4, 3, 5, 6, 8, 4, 7, 5, 3].map((h, index) => (
                    <span 
                      key={index} 
                      style={{ height: `${h * 1.8}px` }} 
                      className={`w-[2px] rounded-full transition-all duration-300 ${isPlaying ? 'animate-pulse' : ''} ${
                        isOwn ? (index < 8 ? 'bg-white/90' : 'bg-white/20') : (index < 8 ? 'bg-[#0A84FF]' : 'bg-[#0A84FF]/30')
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between items-center text-[9px] text-white/50 font-bold uppercase tracking-widest">
                  <span>Voice Message</span>
                  <span>{audioDuration ? formatDuration(audioDuration) : (text.split('(')[1]?.replace(')]', '') || '0:00')}</span>
                </div>
              </div>
            </div>
          ) : isDoc ? (
            <div className="flex flex-col min-w-[200px] max-w-sm rounded-lg overflow-hidden py-1 relative group">
              <div className="flex items-center gap-3 pr-2 py-1">
                <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 border ${
                  isOwn ? 'bg-black/50 border-white/10 text-white/70' : 'bg-black/50 border-white/5 text-[#0A84FF]'
                }`}>
                  <FileText size={18} strokeWidth={1.5} />
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <span className="text-[13px] font-medium text-white/90 truncate">{text || 'Document'}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">Document</span>
                </div>
                {message?.mediaUrl && (
                  <button 
                    onClick={(e) => handleDownload(e, message.mediaUrl, 'document.pdf')}
                    className={`ml-1 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      isOwn ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white/5 hover:bg-white/10 text-[#0A84FF]'
                    }`}
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>
            </div>
          ) : isVideo ? (
            <div className="flex flex-col min-w-[200px] max-w-sm rounded-lg overflow-hidden relative group">
              {message?.mediaUrl ? (
                <div className="relative rounded-md overflow-hidden border border-white/10 bg-black">
                  <video controls src={message.mediaUrl} className="w-full max-w-[260px] h-auto" />
                </div>
              ) : (
                <span className="text-[10px] uppercase tracking-widest text-white/40">Media Offline</span>
              )}
              {text && <span className="text-[13px] mt-2 font-medium text-white/90 px-1">{text}</span>}
            </div>
          ) : isImg ? (
            <div className="flex flex-col min-w-[200px] max-w-sm rounded-lg overflow-hidden relative group">
              {message?.mediaUrl ? (
                <div className="relative rounded-md overflow-hidden border border-white/10 bg-black">
                  <img src={message.mediaUrl} alt="Visual Payload" className="w-full h-auto max-h-[300px] object-cover" />
                  <button 
                    onClick={(e) => handleDownload(e, message.mediaUrl, 'image.jpg')}
                    className="absolute top-2 right-2 w-8 h-8 rounded-md bg-black/60 hover:bg-black/80 border border-white/20 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md cursor-pointer"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-full h-32 rounded-md bg-black/40 border border-white/5 flex items-center justify-center">
                  <span className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1.5"><ImageIcon size={14} /> Visual Offline</span>
                </div>
              )}
              {text && !text.startsWith('[Shared') && <span className="text-[13px] mt-2 font-medium text-white/90 px-1">{text}</span>}
            </div>
          ) : isSnap ? (
            <div 
              className={`flex flex-col min-w-[140px] rounded-lg overflow-hidden relative group p-3 ${!message.opened && !isOwn ? 'cursor-pointer hover:bg-white/5' : ''} transition-colors`} 
              onClick={() => { if (!message.opened && !isOwn && onViewSnap) onViewSnap(message); }}
            >
              {message.opened || message.content === 'Opened' ? (
                <div className="flex flex-col items-center justify-center gap-2 text-white/50">
                  <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center bg-black/40">
                    <Eye size={20} />
                  </div>
                  <span className="text-[11px] font-bold tracking-widest uppercase">Opened</span>
                </div>
              ) : isExpired ? (
                <div className="flex flex-col items-center justify-center gap-2 text-red-500/50">
                  <div className="w-12 h-12 rounded-full border border-red-500/10 flex items-center justify-center bg-red-500/5">
                    <Trash2 size={20} />
                  </div>
                  <span className="text-[11px] font-bold tracking-widest uppercase">Deleted</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 text-yellow-500 transition-transform">
                  <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(234,179,8,0.4)] ${!isOwn ? 'animate-pulse' : ''}`}>
                    <Camera size={24} className="text-white drop-shadow-md" />
                  </div>
                  <span className="text-[11px] font-black tracking-widest uppercase mt-1 text-center">
                    {isOwn ? "Sent" : "Tap to View\nSnap"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <span className={`text-[14px] leading-relaxed whitespace-pre-wrap break-words inline-block ${isOwn ? 'text-white/95' : 'text-white/85'}`}>
              {text}
            </span>
          )}
          
          <div className={`flex items-center gap-2 self-end mt-2 text-[9px] font-bold uppercase tracking-widest ${isOwn ? 'text-white/40' : 'text-white/30'}`}>
            {timeRemaining !== null && timeRemaining > 0 && (
              <span className="text-[#FF453A] px-1 rounded flex items-center gap-1 animate-pulse border border-[#FF453A]/20 bg-[#FF453A]/10">
                T-{timeRemaining}s
              </span>
            )}
            {message?.isViewOnce && <span className="text-[#FF453A]">View Once</span>}
            <span>{time}</span>
            {isOwn && (
              <span className="inline-block -mb-[1px]">
                {status === 'sending' ? (
                  <span className="text-[#0A84FF] animate-pulse">sending...</span>
                ) : status === 'sent' ? (
                  <Check size={12} strokeWidth={3} className="text-white/40" />
                ) : status === 'delivered' ? (
                  <CheckCheck size={12} strokeWidth={3} className="text-white/40" />
                ) : (
                  <CheckCheck size={12} strokeWidth={3} className="text-[#0A84FF]" />
                )}
              </span>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function ReportModal({ message, onClose, onSubmit }) {
  const [reason, setReason] = useState('Spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try { await onSubmit(reason, details); } 
    finally { setIsSubmitting(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1C1C1E] border border-white/10 rounded-xl max-w-md w-full shadow-2xl p-6 relative flex flex-col gap-5 animate-in scale-in-95 duration-100">
        <h3 className="text-[18px] font-medium text-white/90">Report Message</h3>
        <p className="text-[13px] text-white/50">Select a reason for reporting this message.</p>

        <div className="bg-black/50 border border-white/5 rounded-lg p-3 text-[13px] italic text-white/70 max-h-24 overflow-y-auto custom-scrollbar">
          "{message.content || '[Media Message]'}"
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Reason</label>
            <Select
              value={reason}
              onChange={(val) => setReason(val)}
              options={[
                { value: 'Spam', label: 'Spam / Noise' },
                { value: 'Harassment', label: 'Hostile / Harassment' },
                { value: 'Hate Speech', label: 'Restricted Language' },
                { value: 'Inappropriate Content', label: 'Inappropriate Payload' },
                { value: 'Other', label: 'Other Protocol Violation' }
              ]}
              className="bg-black/50 border-white/10"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">Additional Details</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Optional logs..."
              rows={3}
              className="bg-black/50 border border-white/10 rounded-md px-3 py-2 text-[13px] focus:outline-none focus:border-[#0A84FF] text-white/90 resize-none custom-scrollbar"
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-md text-[12px] font-medium hover:bg-white/5 text-white/70 transition-colors cursor-pointer">
              Abort
            </button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[#FF453A]/10 text-[#FF453A] border border-[#FF453A]/20 hover:bg-[#FF453A]/20 rounded-md text-[12px] font-medium transition-colors cursor-pointer">
              {isSubmitting ? 'Reporting...' : 'Report Message'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
