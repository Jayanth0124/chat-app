import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, MoreVertical, CheckCheck, Check, Phone, Play, Pause, FileText, MapPin, Compass, Shield, Users, Search, Image as ImageIcon, Send, Clock, Eye, EyeOff } from 'lucide-react';
import ChatInput from './ChatInput';
import TypingIndicator from './shared/TypingIndicator';
import { useChatStore } from '../store/useChatStore';
import { useAuthStore } from '../store/useAuthStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { axiosInstance } from '../lib/axios';
import { useNavigate } from 'react-router-dom';

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
    reportMessage
  } = useChatStore();
  const { user } = useAuthStore();
  const { setActiveCall } = useLayoutStore();
  const navigate = useNavigate();

  const [isTyping, setIsTyping] = useState(false);
  const [viewingMessage, setViewingMessage] = useState(null);
  const [showVanishDropdown, setShowVanishDropdown] = useState(false);
  const [showChatActionsDropdown, setShowChatActionsDropdown] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [reportingMessage, setReportingMessage] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!selectedChat) return;
    getMessages(selectedChat._id);
    if (socket) socket.emit('join chat', selectedChat._id);
    // Mark seen ONLY when this chat window actually mounts/opens
    markChatAsSeen(selectedChat._id);

    return () => {
      // Leave the chat room when navigating away
      if (socket) socket.emit('leave chat', selectedChat._id);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    
    socket.on('typing', () => setIsTyping(true));
    socket.on('stop typing', () => setIsTyping(false));

    return () => {
      socket.off('typing');
      socket.off('stop typing');
    };
  }, [socket]);

  // Initiate a real socket-based call (no WebRTC, Option B)
  const triggerCall = async (type) => {
    if (!otherParticipant) return;
    try {
      const { user } = useAuthStore.getState();
      // Create call record in DB
      const res = await axiosInstance.post('/calls', {
        receiverId: otherParticipant._id,
        type
      });
      const callRecord = res.data;

      // Set active call in layout
      setActiveCall({
        callId: callRecord._id,
        name: chatName,
        pic: chatPic,
        type,
        status: 'dialing',
        receiverId: otherParticipant._id,
        direction: 'outgoing'
      });

      // Emit socket offer to receiver
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

  if (!selectedChat) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background h-full p-8 relative overflow-hidden select-none">
        {/* Subtle Decorative Glows */}
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="w-full max-w-xl text-center z-10 space-y-12">
          {/* Logo Badge */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 shadow-md">
              <span className="text-3xl font-black">O</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-on-surface tracking-tight">Orbit Desktop</h2>
              <p className="text-sm text-on-surface-variant/80 mt-1.5 max-w-sm mx-auto leading-relaxed">
                Connect securely and privately. Messages synchronize across clients in real-time.
              </p>
            </div>
          </div>

          {/* Features highlight grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <div className="p-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low flex gap-3.5 items-start">
              <div className="p-2 rounded-xl bg-primary/10 text-primary mt-0.5">
                <Shield size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">Strict Privacy</h4>
                <p className="text-[11.5px] text-on-surface-variant/80">Support for automatic Vanish Mode message lifecycle options.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-outline-variant/60 bg-surface-container-low flex gap-3.5 items-start">
              <div className="p-2 rounded-xl bg-secondary/10 text-secondary mt-0.5">
                <Users size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider mb-0.5">Quick Verification</h4>
                <p className="text-[11.5px] text-on-surface-variant/80">Strict verification rules: chat only with approved contacts.</p>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="pt-4 border-t border-outline-variant/40">
            <p className="text-[11px] font-bold text-on-surface-variant/75 uppercase tracking-wider mb-4">Quick Shortcuts</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button 
                onClick={() => navigate('/discover')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/60 bg-surface text-xs font-bold hover:bg-surface-container-low transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Compass size={14} /> Discover Friends
              </button>
              <button 
                onClick={() => navigate('/contacts')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/60 bg-surface text-xs font-bold hover:bg-surface-container-low transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Users size={14} /> Friend Requests
              </button>
              <button 
                onClick={() => navigate('/calls')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-outline-variant/60 bg-surface text-xs font-bold hover:bg-surface-container-low transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Phone size={14} /> Open Call History
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getSender = (loggedUser, users) => {
    return users[0]?._id === loggedUser?._id ? users[1]?.displayName : users[0]?.displayName;
  };

  const getSenderPic = (loggedUser, users) => {
    return users[0]?._id === loggedUser?._id ? users[1]?.profilePic : users[0]?.profilePic;
  };

  const handleSendMessage = (content, mediaUrl = null, messageType = 'text', replyToId = null) => {
    sendMessage({
      content,
      chatId: selectedChat._id,
      mediaUrl,
      messageType,
      isViewOnce: selectedChat.vanishMode === 'VIEW ONCE',
      replyTo: replyToId
    });
  };

  const handleViewMessage = (msg) => {
    setViewingMessage(msg);
  };

  const handleCloseViewMessage = async () => {
    if (viewingMessage && !viewingMessage.isViewed) {
      await markViewOnceOpened(viewingMessage._id);
    }
    setViewingMessage(null);
  };

  const chatName = !selectedChat.isGroupChat ? getSender(user, selectedChat.participants) : selectedChat.groupName;
  const chatPic = !selectedChat.isGroupChat ? getSenderPic(user, selectedChat.participants) || `https://ui-avatars.com/api/?name=${chatName}` : selectedChat.groupName;

  const otherParticipant = selectedChat.participants?.find(p => p._id !== user._id);
  const isOnline = otherParticipant?.isOnline || false;
  const lastSeen = otherParticipant?.lastSeen;

  const activeVanishMode = selectedChat.vanishMode && selectedChat.vanishMode !== 'OFF';

  return (
    <div className={`flex flex-col h-full w-full relative z-0 ${activeVanishMode ? 'bg-black text-white' : 'bg-background'}`}>
      {/* Header */}
      <div className="h-[70px] bg-surface flex items-center justify-between px-6 shrink-0 z-10 border-b border-outline-variant/60">
        <div 
          onClick={() => !selectedChat.isGroupChat && otherParticipant && navigate(`/user-profile/${otherParticipant._id}`)}
          className="flex items-center gap-4 cursor-pointer w-full"
        >
          <button 
            onClick={(e) => { e.stopPropagation(); onBack(); }}
            className="md:hidden p-1 mr-1 text-on-surface-variant hover:text-on-surface"
          >
            <ArrowLeft size={24} strokeWidth={2} />
          </button>
          <div className="relative">
            <img src={chatPic} alt="avatar" className="w-11 h-11 rounded-full object-cover shadow-sm" />
            {isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-surface rounded-full"></div>
            )}
          </div>
          <div className="flex flex-col justify-center flex-1 min-w-0">
            <h3 className="font-bold text-[16px] text-on-surface leading-tight truncate">{chatName}</h3>
            <p className="text-[13px] text-on-surface-variant/80 font-medium truncate">
              {isTyping ? (
                <span className="text-green-500 font-semibold">typing...</span>
              ) : isOnline ? (
                <span className="text-green-500 font-semibold">Online</span>
              ) : lastSeen ? (
                `Last seen ${new Date(lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-5 text-on-surface-variant">
          {/* Custom Vanish Mode Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowVanishDropdown(!showVanishDropdown)}
              className={`flex items-center gap-2 px-2 md:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
                selectedChat.vanishMode && selectedChat.vanishMode !== 'OFF'
                  ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                  : 'bg-surface-container-low border-outline-variant/60 hover:bg-surface-container-high text-on-surface-variant'
              }`}
              title="Vanish Mode Settings"
            >
              <Clock size={14} />
              <span className="hidden sm:inline">
                Vanish: {selectedChat.vanishMode === 'OFF' || !selectedChat.vanishMode ? 'Off' : selectedChat.vanishMode}
              </span>
            </button>

            {showVanishDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowVanishDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-surface border border-outline-variant/60 rounded-2xl shadow-xl z-50 p-2 animate-in slide-in-from-top-2 duration-150">
                  <p className="px-3 py-1.5 text-[10px] font-bold text-on-surface-variant/75 uppercase tracking-wider">Vanish Mode Options</p>
                  <div className="flex flex-col gap-1">
                    {[
                      { value: 'OFF', label: 'Off', desc: 'Keep messages permanently' },
                      { value: 'VIEW ONCE', label: 'Delete After Seen', desc: 'Message vanishes after opening' },
                      { value: '10 SECONDS', label: '10 Seconds', desc: 'Starts countdown once seen' },
                      { value: '1 MINUTE', label: '1 Minute', desc: 'Starts countdown once seen' }
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          updateVanishMode(selectedChat._id, opt.value);
                          setShowVanishDropdown(false);
                        }}
                        className={`flex flex-col text-left px-3 py-2 rounded-xl transition-all cursor-pointer ${
                          (selectedChat.vanishMode || 'OFF') === opt.value
                            ? 'bg-primary/10 text-primary font-bold'
                            : 'hover:bg-surface-container text-on-surface'
                        }`}
                      >
                        <span className="text-xs font-bold">{opt.label}</span>
                        <span className="text-[10px] opacity-75 font-medium">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          
          <button onClick={() => triggerCall('voice')} className="p-1 hover:text-on-surface transition-colors cursor-pointer" title="Voice Call">
            <Phone size={20} strokeWidth={2.5} />
          </button>
          <div className="relative shrink-0">
            <button 
              onClick={() => setShowChatActionsDropdown(!showChatActionsDropdown)}
              className="p-1 hover:text-on-surface transition-colors border-l border-outline-variant/60 pl-4 ml-1 cursor-pointer"
              title="Chat Actions"
            >
              <MoreVertical size={20} strokeWidth={2.5} />
            </button>

            {showChatActionsDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowChatActionsDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-outline-variant/60 rounded-2xl shadow-xl z-50 p-2 animate-in slide-in-from-top-2 duration-150">
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        markChatAsUnread(selectedChat._id);
                        setShowChatActionsDropdown(false);
                        onBack();
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-surface-container text-on-surface text-xs font-bold transition-all text-left w-full cursor-pointer"
                    >
                      <span>Mark as Unread</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowChatActionsDropdown(false);
                        if (window.confirm("Are you sure you want to delete this entire conversation?")) {
                          deleteChat(selectedChat._id);
                          onBack();
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-600 text-xs font-bold transition-all text-left w-full cursor-pointer"
                    >
                      <span>Delete Conversation</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className={`flex-1 overflow-y-auto px-[5%] py-4 flex flex-col gap-1 transition-colors ${activeVanishMode ? 'bg-black text-white/90' : 'bg-background'}`}>
        
        {activeVanishMode && (
          <div className="text-center my-4 opacity-50 text-sm font-semibold">
            Vanish Mode Active: {selectedChat.vanishMode}. Messages will disappear after they are viewed.
          </div>
        )}

        {/* Date Pill */}
        <div className="flex justify-center mb-4 mt-2">
          <div className="bg-surface-container-low text-on-surface-variant/80 text-[12px] font-bold px-3 py-1 rounded-lg shadow-sm border border-outline-variant/30 uppercase tracking-widest">
            CONVERSATION START
          </div>
        </div>

        {messages.map((m, i) => {
          const isOwn = m.sender?._id === user?._id;
          const nextIsSame = messages[i + 1]?.sender?._id === m.sender?._id;
          const prevIsSame = messages[i - 1]?.sender?._id === m.sender?._id;
          
          return (
            <MessageBubble 
              key={m._id} 
              isOwn={isOwn} 
              message={m}
              text={m.content} 
              time={new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
              status={m.status || 'sent'} 
              isFirstInGroup={!prevIsSame}
              isLastInGroup={!nextIsSame}
              onViewMessage={() => handleViewMessage(m)}
              setReplyToMessage={setReplyToMessage}
              onReportMessage={setReportingMessage}
            />
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Typing Indicator (Fixed above composer) */}
      {isTyping && (
        <div className={`px-[5%] py-2 flex items-center shrink-0 border-t border-outline-variant/10 backdrop-blur-sm ${activeVanishMode ? 'bg-black/80' : 'bg-surface/80'}`}>
          <div className="bg-surface-container px-4 py-2 rounded-2xl border border-outline-variant/30 shadow-sm">
            <TypingIndicator />
          </div>
          <span className="text-xs ml-3 font-medium text-on-surface-variant animate-pulse">
            {otherParticipant?.displayName || 'Someone'} is typing...
          </span>
        </div>
      )}

      {/* Chat Input Area */}
      <ChatInput 
        onSendMessage={handleSendMessage} 
        socket={socket} 
        selectedChat={selectedChat} 
        replyToMessage={replyToMessage}
        setReplyToMessage={setReplyToMessage}
      />

      {/* View Once Modal */}
      {viewingMessage && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
          <div className="absolute top-6 right-6">
            <button 
              onClick={handleCloseViewMessage}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors font-medium text-sm border border-white/20"
            >
              Close
            </button>
          </div>
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold">⏱️</span>
            </div>
            <p className="text-white/60 text-sm">View Once Message</p>
          </div>
          <div className="max-w-md w-full bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
            <p className="text-white text-lg text-center leading-relaxed font-semibold">
              {viewingMessage.content}
            </p>
          </div>
          <p className="absolute bottom-10 text-white/40 text-xs">This message will be deleted once you close this window.</p>
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

function MessageBubble({ isOwn, text, time, status, isFirstInGroup, isLastInGroup, message, onViewMessage, setReplyToMessage, onReportMessage }) {
  const { deleteMessage } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const longPressTimer = useRef(null);

  const calculateMenuPosition = (x, y) => {
    const MENU_WIDTH = 144; // w-36
    const MENU_HEIGHT = isOwn ? 90 : 90; // Approx height for 2 buttons + padding
    const PADDING = 16;
    
    let posX = x;
    let posY = y;
    
    if (x + MENU_WIDTH + PADDING > window.innerWidth) {
      posX = window.innerWidth - MENU_WIDTH - PADDING;
    }
    if (posX < PADDING) posX = PADDING;
    
    if (y + MENU_HEIGHT + PADDING > window.innerHeight) {
      posY = y - MENU_HEIGHT;
    }
    
    setShowMenu({ x: posX, y: posY });
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    calculateMenuPosition(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    
    longPressTimer.current = setTimeout(() => {
      calculateMenuPosition(x, y);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const roundedClasses = isOwn 
    ? `rounded-2xl ${!isFirstInGroup && !isLastInGroup ? 'rounded-tr-md rounded-br-md' : isFirstInGroup && !isLastInGroup ? 'rounded-br-md' : !isFirstInGroup && isLastInGroup ? 'rounded-tr-md' : ''}`
    : `rounded-2xl ${!isFirstInGroup && !isLastInGroup ? 'rounded-tl-md rounded-bl-md' : isFirstInGroup && !isLastInGroup ? 'rounded-bl-md' : !isFirstInGroup && isLastInGroup ? 'rounded-tl-md' : ''}`;
    
  // Check for specialized message styles
  const isVoice = text?.startsWith('[Voice Message');
  const isDoc = message?.messageType === 'document' || text?.startsWith('[Shared Document');
  const isImg = message?.messageType === 'image' || text?.startsWith('[Shared Image') || text?.startsWith('[Shared Snap Image');
  const isVideo = message?.messageType === 'video';

  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (message?.status === 'seen' && message?.expiresAt) {
      const calculateRemaining = () => {
        const diff = new Date(message.expiresAt).getTime() - Date.now();
        return Math.max(0, Math.ceil(diff / 1000));
      };

      const initial = calculateRemaining();
      // Only start timer if it's a short-lived vanish message (less than 90 seconds remaining)
      if (initial > 0 && initial <= 90) {
        setTimeRemaining(initial);
        const interval = setInterval(() => {
          const rem = calculateRemaining();
          if (rem <= 0) {
            clearInterval(interval);
            setTimeRemaining(0);
          } else {
            setTimeRemaining(rem);
          }
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, [message?.status, message?.expiresAt]);

  const isExpired = message?.expiresAt && new Date(message.expiresAt).getTime() <= Date.now();
  if (isExpired || timeRemaining === 0) return null;

  return (
    <div id={`msg-${message._id}`} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} w-full ${isFirstInGroup ? 'mt-3' : 'mt-0.5'}`}>
      {/* Wrapper to hold context menu without overflow hidden */}
      <div className={`relative max-w-[85%] md:max-w-[70%] flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Dropdown context menu overlay - outside overflow-hidden */}
        {showMenu && (
          <>
            <div className="fixed inset-0 z-[100] bg-black/5" onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} />
            <div 
              className="fixed z-[101] bg-surface border border-outline-variant/60 rounded-2xl shadow-2xl p-1.5 flex flex-col gap-1 w-36 animate-in fade-in zoom-in-95 duration-150"
              style={{ top: showMenu.y, left: showMenu.x }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setReplyToMessage(message);
                  setShowMenu(false);
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-container text-on-surface text-sm font-bold transition-all text-left w-full cursor-pointer"
              >
                Reply
              </button>
              {!isOwn && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onReportMessage(message);
                    setShowMenu(false);
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-600 text-sm font-bold transition-all text-left w-full cursor-pointer"
                >
                  Report
                </button>
              )}
              {isOwn && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    if (window.confirm("Are you sure you want to delete this message?")) {
                      deleteMessage(message._id);
                    }
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-600 text-sm font-bold transition-all text-left w-full cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          </>
        )}

        <div 
          className={`relative w-full shadow-sm flex flex-col overflow-hidden ${roundedClasses} ${isOwn ? 'bg-primary text-white font-medium' : 'bg-surface-container-low text-on-surface border border-outline-variant/30'}`}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >

        {/* Reply Indicator if message is replying to another message */}
        {message.replyTo && (
          <div 
            className={`mx-3 mt-2.5 px-3 py-1.5 rounded-xl text-xs flex flex-col border-l-4 ${
              isOwn ? 'border-white/60 bg-white/10' : 'border-primary bg-primary/5'
            } cursor-pointer max-w-full truncate`}
            onClick={() => {
              const targetEl = document.getElementById(`msg-${message.replyTo._id}`);
              if (targetEl) {
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                if (bubbleEl) {
                  const originalClass = bubbleEl.className;
                  bubbleEl.className = originalClass + ' ring-4 ring-primary/45 scale-[1.02] transition-all duration-300';
                  setTimeout(() => {
                    bubbleEl.className = originalClass;
                  }, 1200);
                }
              }
            }}
          >
            <span className={`font-bold text-[10px] uppercase tracking-wider ${isOwn ? 'text-white' : 'text-primary'}`}>
              {message.replyTo.sender?.displayName || 'User'}
            </span>
            <span className={`opacity-80 truncate text-[11px] mt-0.5 ${isOwn ? 'text-white/90 font-medium' : 'text-on-surface-variant font-medium'}`}>
              {message.replyTo.messageType === 'image' ? '📷 Image' : message.replyTo.content}
            </span>
          </div>
        )}
        
        {/* Content */}
        <div className="relative px-3.5 pt-2 pb-1.5 flex flex-col justify-between">
          {isVoice ? (
            /* Styled voice note note message */
            <div className="flex items-center gap-3 pr-2 min-w-[220px] py-1">
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isOwn ? 'bg-white text-primary' : 'bg-primary text-white'
                }`}
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>
              <div className="flex-1 flex flex-col gap-1">
                {/* Visual waveform simulation */}
                <div className="flex items-center gap-0.5 h-6">
                  {[3, 5, 2, 7, 6, 8, 4, 3, 5, 6, 8, 4, 7, 5, 3, 4, 2].map((h, index) => (
                    <span 
                      key={index} 
                      style={{ height: `${h * 2.2}px` }} 
                      className={`w-[2px] rounded-full transition-all duration-300 ${
                        isPlaying ? 'animate-pulse' : ''
                      } ${
                        isOwn 
                          ? index < 9 ? 'bg-white' : 'bg-white/40' 
                          : index < 9 ? 'bg-primary' : 'bg-on-surface-variant/40'
                      }`}
                    ></span>
                  ))}
                </div>
                <div className="flex justify-between items-center text-[10px] opacity-75 font-semibold">
                  <span>Voice Note</span>
                  <span>{text.split('(')[1]?.replace(')]', '') || '0:05'}</span>
                </div>
              </div>
            </div>
          ) : isDoc ? (
            /* Styled Document Attach Message */
            <div className="flex flex-col min-w-[200px] max-w-sm rounded-xl overflow-hidden py-1 relative group">
              <div className="flex items-center gap-3 pr-2 py-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isOwn ? 'bg-white/15' : 'bg-primary/10 text-primary'}`}>
                  <FileText size={18} />
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <span className="text-[13px] font-bold truncate">{text || 'Document'}</span>
                  <span className="text-[10px] opacity-75">Click icon to download</span>
                </div>
                {message?.mediaUrl && (
                  <a 
                    href={message.mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download
                    className={`ml-1 w-8 h-8 rounded-full flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity ${isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-primary/10 hover:bg-primary/20 text-primary'}`}
                    title="Download Document"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </a>
                )}
              </div>
            </div>
          ) : isVideo ? (
            /* Real Video Rendering */
            <div className="flex flex-col min-w-[200px] max-w-sm rounded-xl overflow-hidden relative group">
              {message?.mediaUrl ? (
                <>
                  <video 
                    controls
                    src={message.mediaUrl} 
                    className="w-full max-w-[260px] h-auto rounded-xl border border-outline-variant/30 bg-black/10" 
                  />
                  <a 
                    href={message.mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                    title="Save to Gallery"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </a>
                </>
              ) : (
                <span className="italic opacity-60">Video unavailable</span>
              )}
              {text && <span className="text-xs mt-1.5 font-semibold px-1">{text}</span>}
            </div>
          ) : isImg ? (
            /* Real image rendering / fallback */
            <div className="flex flex-col min-w-[200px] max-w-sm rounded-xl overflow-hidden relative group">
              {message?.mediaUrl ? (
                <>
                  <img 
                    src={message.mediaUrl} 
                    alt="Shared Media" 
                    className="w-full h-auto max-h-[300px] object-cover rounded-xl border border-outline-variant/30" 
                  />
                  <a 
                    href={message.mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    download
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-md"
                    title="Save to Gallery"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  </a>
                </>
              ) : (
                <div className="w-full h-32 rounded-xl bg-gradient-to-tr from-violet-500/10 to-indigo-500/10 border border-outline-variant/35 flex items-center justify-center mb-1">
                  <span className="text-xs opacity-60 flex items-center gap-1.5 font-bold"><ImageIcon size={14} /> Shared Media</span>
                </div>
              )}
              {text && !text.startsWith('[Shared') && <span className="text-xs mt-1.5 font-semibold px-1">{text}</span>}
            </div>
          ) : (
            <span className="text-[15px] font-medium leading-[22px] whitespace-pre-wrap break-words inline-block">
              {text}
            </span>
          )}
          
          {/* Metadata (Time & Ticks) inside bubble */}
          {!isVoice && !isDoc && !isVideo && !isImg && (
            <div className={`flex items-center gap-1.5 self-end mt-1.5 text-[10px] font-bold \${isOwn ? 'text-white/80' : 'text-on-surface-variant/70'}`}>
              {timeRemaining !== null && timeRemaining > 0 && (
                <span className="bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse select-none mr-1">
                  ⏱️ {timeRemaining}s
                </span>
              )}
              {message?.isViewOnce && <span title="Vanish Mode Message">⏱️</span>}
              <span>{time}</span>
              {isOwn && (
                <span className="inline-block -mb-[1px]">
                  {status === 'sending' ? (
                    <Clock size={11} className="text-white/70 animate-pulse" />
                  ) : status === 'sent' ? (
                    <Check size={13} strokeWidth={3} className="text-white/80" />
                  ) : (
                    <CheckCheck 
                      size={13} 
                      strokeWidth={3} 
                      className={status === 'seen' ? "text-sky-300 font-bold" : "text-white/85"} 
                    />
                  )}
                </span>
              )}
            </div>
          )}
          
          {/* Floating Time/Ticks for Audio/Doc bubbles to layout perfectly */}
          {(isVoice || isDoc || isVideo || isImg) && (
            <div className={`flex items-center gap-1.5 self-end mt-2 text-[10px] font-bold \${isOwn ? 'text-white/80' : 'text-on-surface-variant/70'}`}>
              {timeRemaining !== null && timeRemaining > 0 && (
                <span className="bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse select-none mr-1">
                  ⏱️ {timeRemaining}s
                </span>
              )}
              {message?.isViewOnce && <span title="Vanish Mode Message">⏱️</span>}
              <span>{time}</span>
              {isOwn && (
                <span className="inline-block -mb-[1px]">
                  {status === 'sending' ? (
                    <Clock size={11} className="text-white/70 animate-pulse" />
                  ) : status === 'sent' ? (
                    <Check size={13} strokeWidth={3} className="text-white/85" />
                  ) : (
                    <CheckCheck 
                      size={13} 
                      strokeWidth={3} 
                      className={status === 'seen' ? "text-sky-300 font-bold" : "text-white/85"} 
                    />
                  )}
                </span>
              )}
            </div>
          )}
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
    try {
      await onSubmit(reason, details);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-outline-variant/60 rounded-3xl max-w-md w-full shadow-2xl p-6 relative flex flex-col gap-4 animate-in scale-in-95 duration-150 text-on-surface">
        <h3 className="text-lg font-black tracking-tight text-on-surface">Report Message</h3>
        <p className="text-xs text-on-surface-variant/85 leading-relaxed">
          Help us keep Orbit safe. Please select a reason for reporting this message:
        </p>

        {/* Message Preview */}
        <div className="bg-surface-container-low border border-outline-variant/30 rounded-2xl p-3 text-xs italic text-on-surface-variant max-h-24 overflow-y-auto">
          "{message.content || '[Image/Media Message]'}"
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/75">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-surface-container border border-outline-variant/60 rounded-xl px-3 py-2.5 text-xs font-semibold focus:outline-none focus:border-primary text-on-surface cursor-pointer"
            >
              <option value="Spam">Spam</option>
              <option value="Harassment">Harassment</option>
              <option value="Hate Speech">Hate Speech</option>
              <option value="Inappropriate Content">Inappropriate Content</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/75">Details (Optional)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide additional details..."
              rows={3}
              className="bg-surface-container border border-outline-variant/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary text-on-surface resize-none"
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-outline-variant/60 rounded-xl text-xs font-bold hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Reporting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
