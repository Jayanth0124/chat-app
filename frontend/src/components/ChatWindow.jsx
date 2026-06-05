import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, MoreVertical, CheckCheck, Check, Video, Phone, Play, Pause, FileText, MapPin, Compass, Shield, Users, Search, Image as ImageIcon, Send, Clock, Eye, EyeOff } from 'lucide-react';
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
    markChatAsSeen
  } = useChatStore();
  const { user } = useAuthStore();
  const { setActiveCall } = useLayoutStore();
  const navigate = useNavigate();

  const [isTyping, setIsTyping] = useState(false);
  const [viewingMessage, setViewingMessage] = useState(null);
  const [showVanishDropdown, setShowVanishDropdown] = useState(false);
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
              <span className="text-3xl font-black">B</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-on-surface tracking-tight">Blink Desktop</h2>
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

  const handleSendMessage = (content, mediaUrl = null, messageType = 'text') => {
    sendMessage({
      content,
      chatId: selectedChat._id,
      mediaUrl,
      messageType,
      isViewOnce: selectedChat.vanishMode === 'VIEW ONCE'
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
        <div className="flex items-center gap-4 cursor-pointer w-full">
          <button onClick={onBack} className="md:hidden p-1 mr-1 text-on-surface-variant hover:text-on-surface">
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
        
        <div className="flex items-center gap-5 text-on-surface-variant">
          {/* Custom Vanish Mode Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setShowVanishDropdown(!showVanishDropdown)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer ${
                selectedChat.vanishMode && selectedChat.vanishMode !== 'OFF'
                  ? 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'
                  : 'bg-surface-container-low border-outline-variant/60 hover:bg-surface-container-high text-on-surface-variant'
              }`}
              title="Vanish Mode Settings"
            >
              <Clock size={14} />
              <span>
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
          <button className="p-1 hover:text-on-surface transition-colors border-l border-outline-variant/60 pl-4 ml-1">
            <MoreVertical size={20} strokeWidth={2.5} />
          </button>
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
            />
          );
        })}
        {isTyping && (
          <div className="mt-2 self-start bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/30">
            <TypingIndicator />
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Chat Input Area */}
      <ChatInput onSendMessage={handleSendMessage} socket={socket} selectedChat={selectedChat} />

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

    </div>
  );
}

function MessageBubble({ isOwn, text, time, status, isFirstInGroup, isLastInGroup, message, onViewMessage }) {
  const roundedClasses = isOwn 
    ? `rounded-2xl \${!isFirstInGroup && !isLastInGroup ? 'rounded-tr-md rounded-br-md' : isFirstInGroup && !isLastInGroup ? 'rounded-br-md' : !isFirstInGroup && isLastInGroup ? 'rounded-tr-md' : ''}`
    : `rounded-2xl \${!isFirstInGroup && !isLastInGroup ? 'rounded-tl-md rounded-bl-md' : isFirstInGroup && !isLastInGroup ? 'rounded-bl-md' : !isFirstInGroup && isLastInGroup ? 'rounded-tl-md' : ''}`;
    
  // Check for specialized message styles
  const isVoice = text?.startsWith('[Voice Message');
  const isDoc = text?.startsWith('[Shared Document');
  const isLoc = text?.startsWith('[Shared Location');
  const isImg = text?.startsWith('[Shared Image') || text?.startsWith('[Shared Snap Image') || message?.messageType === 'image';

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
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} w-full ${isFirstInGroup ? 'mt-3' : 'mt-1'}`}>
      <div className={`relative max-w-[70%] shadow-sm flex flex-col overflow-hidden ${roundedClasses} ${isOwn ? 'bg-primary text-white font-medium' : 'bg-surface-container-low text-on-surface border border-outline-variant/30'}`}>
        
        {/* Content */}
        <div className="relative px-4 py-3 flex flex-col justify-between">
          
          {message?.isViewOnce && !message?.isViewed ? (
            <div className="flex flex-col min-w-[200px]">
              {!isOwn ? (
                <div className="flex flex-col">
                  {/* View Once Placeholder */}
                  <div className="w-full h-[120px] bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl mb-3 flex flex-col justify-between p-3 relative overflow-hidden">
                    <div className="absolute inset-0 backdrop-blur-3xl bg-black/5"></div>
                    <div className="relative z-10 flex justify-between">
                      <div className="bg-primary text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        ⏱️ View Once
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={onViewMessage}
                    className="flex items-center justify-center gap-2 text-[14px] font-bold text-primary bg-primary/10 py-2.5 rounded-xl hover:bg-primary/20 transition-colors w-full cursor-pointer"
                  >
                    👁️ Tap to view Message
                  </button>
                </div>
              ) : (
                <span className="text-[14px] font-bold italic opacity-85 flex items-center gap-2 py-1">
                  ⏱️ View Once sent
                </span>
              )}
            </div>
          ) : message?.isViewOnce && message?.isViewed ? (
            <div className="flex items-center gap-2 pr-4 pl-1 py-1">
              <span className="text-[14px] italic opacity-60 flex items-center gap-2 font-semibold">
                👁️ View Once opened
              </span>
            </div>
          ) : isVoice ? (
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
            <div className="flex items-center gap-3 pr-2 min-w-[200px] py-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOwn ? 'bg-white/15' : 'bg-primary/10 text-primary'}`}>
                <FileText size={18} />
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[13px] font-bold truncate">Document.pdf</span>
                <span className="text-[10px] opacity-75">1.2 MB • Click to View</span>
              </div>
            </div>
          ) : isLoc ? (
            /* Styled Location Pin Message */
            <div className="flex items-center gap-3 pr-2 min-w-[200px] py-1">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isOwn ? 'bg-white/15' : 'bg-primary/10 text-primary'}`}>
                <MapPin size={18} />
              </div>
              <div className="flex-1 flex flex-col">
                <span className="text-[13px] font-bold truncate">Google Maps Pin</span>
                <span className="text-[10px] opacity-75">12.9806° N, 80.2520° E</span>
              </div>
            </div>
          ) : isImg ? (
            /* Real image rendering / fallback */
            <div className="flex flex-col min-w-[200px] max-w-sm rounded-xl overflow-hidden">
              {message?.mediaUrl ? (
                <img 
                  src={message.mediaUrl} 
                  alt="Shared Media" 
                  className="w-full h-auto max-h-[300px] object-cover rounded-xl border border-outline-variant/30" 
                />
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
          {!isVoice && !isDoc && !isLoc && !isImg && (
            <div className={`flex items-center gap-1.5 self-end mt-1.5 text-[10px] font-bold \${isOwn ? 'text-white/80' : 'text-on-surface-variant/70'}`}>
              {timeRemaining !== null && timeRemaining > 0 && (
                <span className="bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse select-none mr-1">
                  ⏱️ {timeRemaining}s
                </span>
              )}
              <span>{time}</span>
              {isOwn && (
                <span className="inline-block -mb-[1px]">
                  {status === 'sent' ? (
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
          {(isVoice || isDoc || isLoc || isImg) && (
            <div className={`flex items-center gap-1.5 self-end mt-2 text-[10px] font-bold \${isOwn ? 'text-white/80' : 'text-on-surface-variant/70'}`}>
              {timeRemaining !== null && timeRemaining > 0 && (
                <span className="bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse select-none mr-1">
                  ⏱️ {timeRemaining}s
                </span>
              )}
              <span>{time}</span>
              {isOwn && (
                <span className="inline-block -mb-[1px]">
                  {status === 'sent' ? (
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
  );
}
