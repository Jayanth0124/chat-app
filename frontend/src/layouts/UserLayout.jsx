import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import UserSidebar from '../components/UserSidebar';
import { MessageSquare, Users, Phone, Search, Settings, User, LogOut, X, Camera, Mic, MicOff, Video, VideoOff, PhoneOff, PhoneIncoming, Check, Loader2, Bell, Trash2, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useChatStore } from '../store/useChatStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';

export default function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    isLogoutOpen, setLogoutOpen,
    isNotificationsOpen, setNotificationsOpen,
    activeCall, setActiveCall 
  } = useLayoutStore();

  const [callHistory, setCallHistory] = useState([]);
  const [callHistoryLoading, setCallHistoryLoading] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null); // { callId, callerId, callerName, callerPic, type }

  // Audio/Video controls for active call
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useState(null);

  const { socket } = useChatStore();
  const { notifications, clearAll, removeNotification, markAllRead } = useNotificationStore();

  useEffect(() => {
    if (isNotificationsOpen) {
      markAllRead();
    }
  }, [isNotificationsOpen, markAllRead]);

  // WebRTC Audio Connection Setup
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);

  const activeCallRef = useRef(activeCall);
  const incomingCallRef = useRef(incomingCall);
  const isMutedRef = useRef(isMuted);

  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Handle hidden audio player lifecycle
  useEffect(() => {
    if (!remoteAudioRef.current) {
      const audio = document.createElement('audio');
      audio.autoplay = true;
      audio.style.display = 'none';
      document.body.appendChild(audio);
      remoteAudioRef.current = audio;
    }
    return () => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.remove();
        remoteAudioRef.current = null;
      }
    };
  }, []);

  const cleanupWebRTC = () => {
    if (pcRef.current) {
      try { pcRef.current.close(); } catch (e) {}
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {}
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    if (!activeCall) {
      cleanupWebRTC();
    }
  }, [activeCall]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (activeCall?.status === 'connected') {
      const startWebRTC = async () => {
        try {
          cleanupWebRTC();
          
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          localStreamRef.current = stream;
          stream.getAudioTracks().forEach(track => {
            track.enabled = !isMutedRef.current;
          });

          const pc = new RTCPeerConnection({
            iceServers: [
              { urls: 'stun:stun.l.google.com:19302' },
              { urls: 'stun:stun1.l.google.com:19302' },
              { urls: 'stun:stun2.l.google.com:19302' }
            ]
          });
          pcRef.current = pc;

          stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
          });

          pc.ontrack = (event) => {
            if (remoteAudioRef.current) {
              remoteAudioRef.current.srcObject = event.streams[0];
            }
          };

          pc.onicecandidate = (event) => {
            if (event.candidate && socket) {
              const otherId = activeCallRef.current?.receiverId;
              if (otherId) {
                socket.emit('webrtc:signal', {
                  to: otherId,
                  signal: { type: 'candidate', candidate: event.candidate }
                });
              }
            }
          };

          if (activeCallRef.current?.direction === 'outgoing') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            socket.emit('webrtc:signal', {
              to: activeCallRef.current.receiverId,
              signal: { type: 'offer', offer }
            });
          }
        } catch (err) {
          console.error('Failed to get media devices or start WebRTC:', err);
          toast.error('Could not access microphone');
        }
      };

      startWebRTC();
    }
  }, [activeCall?.status, socket]);

  useEffect(() => {
    if (!socket) return;

    const handleWebRTCSignal = async ({ from, signal }) => {
      try {
        if (signal.type === 'offer') {
          if (!pcRef.current) {
            let stream = localStreamRef.current;
            if (!stream) {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              localStreamRef.current = stream;
              stream.getAudioTracks().forEach(track => {
                track.enabled = !isMutedRef.current;
              });
            }

            const pc = new RTCPeerConnection({
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
              ]
            });
            pcRef.current = pc;

            stream.getTracks().forEach(track => {
              pc.addTrack(track, stream);
            });

            pc.ontrack = (event) => {
              if (remoteAudioRef.current) {
                remoteAudioRef.current.srcObject = event.streams[0];
              }
            };

            pc.onicecandidate = (event) => {
              if (event.candidate && socket) {
                socket.emit('webrtc:signal', {
                  to: from,
                  signal: { type: 'candidate', candidate: event.candidate }
                });
              }
            };
          }

          const pc = pcRef.current;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('webrtc:signal', {
            to: from,
            signal: { type: 'answer', answer }
          });
        } else if (signal.type === 'answer') {
          const pc = pcRef.current;
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
          }
        } else if (signal.type === 'candidate') {
          const pc = pcRef.current;
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC signal:', err);
      }
    };

    socket.on('webrtc:signal', handleWebRTCSignal);

    return () => {
      socket.off('webrtc:signal', handleWebRTCSignal);
    };
  }, [socket]);

  // Fetch real call history from API
  const fetchCallHistory = async () => {
    setCallHistoryLoading(true);
    try {
      const res = await axiosInstance.get('/calls');
      setCallHistory(res.data);
    } catch (e) {
      console.error('Error fetching call history:', e);
    } finally {
      setCallHistoryLoading(false);
    }
  };

  // Listen for incoming call events dispatched from useChatStore
  useEffect(() => {
    const handleIncoming = (e) => setIncomingCall(e.detail);
    const handleAnswered = () => {
      if (activeCall) {
        setActiveCall({ ...activeCall, status: 'connected' });
        setIncomingCall(null);
      }
    };
    const handleRejected = () => {
      toast('Call was declined', { icon: '📵' });
      setActiveCall(null);
      setIncomingCall(null);
    };
    const handleEnded = (e) => {
      setActiveCall(null);
      setIncomingCall(null);
    };

    window.addEventListener('blink:incomingCall', handleIncoming);
    window.addEventListener('blink:callAnswered', handleAnswered);
    window.addEventListener('blink:callRejected', handleRejected);
    window.addEventListener('blink:callEnded', handleEnded);

    return () => {
      window.removeEventListener('blink:incomingCall', handleIncoming);
      window.removeEventListener('blink:callAnswered', handleAnswered);
      window.removeEventListener('blink:callRejected', handleRejected);
      window.removeEventListener('blink:callEnded', handleEnded);
    };
  }, [activeCall, setActiveCall]);

  // Start/stop call timer when call status changes
  useEffect(() => {
    if (activeCall?.status === 'connected') {
      setCallDuration(0);
      const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
      callTimerRef[1](timer);
      return () => clearInterval(timer);
    } else {
      if (callTimerRef[0]) clearInterval(callTimerRef[0]);
    }
  }, [activeCall?.status]);

  const formatDuration = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Accept an incoming call
  const handleAcceptCall = () => {
    if (!incomingCall) return;
    setActiveCall({
      callId: incomingCall.callId,
      name: incomingCall.callerName,
      pic: incomingCall.callerPic,
      type: incomingCall.type,
      status: 'connected',
      receiverId: incomingCall.callerId,
      direction: 'incoming'
    });
    setIncomingCall(null);
    if (socket) socket.emit('call:answer', { to: incomingCall.callerId, callId: incomingCall.callId });
  };

  // Reject an incoming call
  const handleRejectCall = () => {
    if (!incomingCall) return;
    if (socket) socket.emit('call:reject', { to: incomingCall.callerId, callId: incomingCall.callId });
    setIncomingCall(null);
  };

  // End the active call
  const handleEndCall = async () => {
    if (!activeCall) return;
    const otherId = activeCall.receiverId;
    if (socket && otherId) {
      socket.emit('call:end', {
        to: otherId,
        callId: activeCall.callId,
        duration: callDuration
      });
    }
    // Update call record in DB
    if (activeCall.callId) {
      try {
        await axiosInstance.patch(`/calls/${activeCall.callId}`, {
          status: 'completed',
          duration: callDuration
        });
      } catch (e) {}
    }
    setActiveCall(null);
  };

  // Call back from history
  const handleCallBack = async (call) => {
    // Determine the other party
    const other = call.caller?._id === user?._id ? call.receiver : call.caller;
    if (!other) return;
    toast(`Calling ${other.displayName}...`, { icon: '📞' });
    try {
      const res = await axiosInstance.post('/calls', {
        receiverId: other._id,
        type: 'voice'
      });
      const callRecord = res.data;
      setActiveCall({
        callId: callRecord._id,
        name: other.displayName,
        pic: other.profilePic,
        type: 'voice',
        status: 'dialing',
        receiverId: other._id,
        direction: 'outgoing'
      });
      if (socket) {
        socket.emit('call:offer', {
          to: other._id,
          callData: {
            callId: callRecord._id,
            callerId: user._id,
            callerName: user.displayName,
            callerPic: user.profilePic,
            type: 'voice'
          }
        });
      }
    } catch (e) {
      console.error('Error initiating call back:', e);
      toast.error('Could not initiate call');
    }
  };

  return (
    <div className="relative h-screen w-full flex flex-col md:flex-row overflow-hidden font-sans bg-background text-on-surface">
      {/* Desktop Sidebar (Hidden on mobile) */}
      <div className="hidden md:block h-full">
        <UserSidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 h-full relative flex flex-col overflow-hidden bg-background">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden flex justify-around items-center bg-surface border-t border-outline-variant/60 px-2 py-1 shrink-0 pb-safe">
        <button 
          onClick={() => navigate('/')} 
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-on-surface-variant/80'}`}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-semibold">Chats</span>
        </button>

        <button 
          onClick={() => navigate('/calls')} 
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/calls' ? 'text-primary' : 'text-on-surface-variant/80'}`}
        >
          <Phone size={20} />
          <span className="text-[10px] font-semibold">Calls</span>
        </button>

        <button 
          onClick={() => navigate('/friends')}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/friends' ? 'text-primary' : 'text-on-surface-variant/80'}`}
        >
          <Users size={20} />
          <span className="text-[10px] font-semibold">Friends</span>
        </button>

        <button 
          onClick={() => navigate('/profile')}
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/profile' ? 'text-primary' : 'text-on-surface-variant/80'}`}
        >
          <User size={20} />
          <span className="text-[10px] font-semibold">Profile</span>
        </button>

        <button 
          onClick={() => setLogoutOpen(true)}
          className="flex flex-col items-center gap-0.5 p-2 rounded-xl text-on-surface-variant/80 hover:text-red-500 transition-colors"
        >
          <LogOut size={20} />
          <span className="text-[10px] font-semibold">Exit</span>
        </button>
      </div>



      {/* GLOBAL OVERLAY 3: LOGOUT CONFIRMATION MODAL */}
      {isLogoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-surface rounded-2xl border border-outline-variant/60 shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto mb-4">
              <LogOut size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Sign Out</h3>
            <p className="text-sm text-on-surface-variant mb-6">Are you sure you want to log out of your Blink session?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setLogoutOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors font-semibold text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setLogoutOpen(false);
                  logout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors shadow-md shadow-red-500/10 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL OVERLAY 3.5: NOTIFICATIONS CENTER DRAWER */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-md h-[90vh] md:h-full bg-surface border border-outline-variant/60 shadow-2xl rounded-2xl md:rounded-l-2xl md:rounded-r-none flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-outline-variant/60 flex justify-between items-center bg-surface-container-low">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-primary animate-bounce" />
                <h3 className="font-bold text-lg text-on-surface">System Notifications</h3>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button 
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-500/10 rounded-lg font-semibold transition-colors"
                  >
                    <Trash2 size={13} />
                    Clear All
                  </button>
                )}
                <button 
                  onClick={() => setNotificationsOpen(false)}
                  className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                    <Bell size={22} />
                  </div>
                  <h4 className="font-bold text-sm">No new notifications</h4>
                  <p className="text-xs text-on-surface-variant/80 mt-1 max-w-xs">System alerts and system-wide broadcast updates will show up here.</p>
                </div>
              ) : (
                notifications.map((notif) => {
                  const isSystem = notif.type === 'system';
                  return (
                    <div 
                      key={notif.id}
                      className={`p-3.5 rounded-xl border flex gap-3 transition-colors ${
                        isSystem 
                          ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' 
                          : 'bg-surface-container-low border-outline-variant/50 hover:bg-surface-container-high'
                      }`}
                    >
                      {/* Icon / Avatar */}
                      <div className="shrink-0">
                        {notif.avatar ? (
                          <img src={notif.avatar} className="w-9 h-9 rounded-full object-cover border border-outline-variant/30" alt="" />
                        ) : (
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white ${isSystem ? 'bg-red-500' : 'bg-primary'}`}>
                            {isSystem ? <ShieldAlert size={16} /> : <Bell size={16} />}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className="font-bold text-[13px] text-on-surface leading-tight truncate">{notif.title}</p>
                          <span className="text-[10px] text-on-surface-variant/70 shrink-0 font-medium font-sans">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[12px] text-on-surface-variant leading-relaxed mt-1 break-words">{notif.body}</p>
                      </div>

                      {/* Remove item */}
                      <button 
                        onClick={() => removeNotification(notif.id)}
                        className="p-1 rounded-full text-on-surface-variant/50 hover:text-on-surface-variant hover:bg-surface-container-high transition-all shrink-0 h-fit"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL OVERLAY 4: CALL DIALING/CONNECTED OVERLAY */}
      {activeCall && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-between bg-neutral-900 text-white p-12 transition-all duration-300">
          {/* Top Status */}
          <div className="text-center">
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
              {activeCall.status === 'dialing' ? 'Dialing...' : `${activeCall.type === 'video' ? '📹' : '📞'} Connected`}
            </span>
            <h3 className="text-3xl font-black mt-2">{activeCall.name}</h3>
            {activeCall.status === 'connected' && (
              <p className="text-neutral-400 font-mono text-lg mt-1">{formatDuration(callDuration)}</p>
            )}
            <p className="text-sm text-neutral-500 mt-1">Blink Encrypted Connection</p>
          </div>

          {/* Center Avatar */}
          <div className="relative">
            {activeCall.pic ? (
              <img src={activeCall.pic} alt={activeCall.name} className="w-32 h-32 rounded-full object-cover border-4 border-primary/40" />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-primary/40 bg-neutral-800 flex items-center justify-center text-4xl font-black uppercase text-primary">
                {activeCall.name?.[0]}
              </div>
            )}
            {activeCall.status === 'dialing' && (
              <div className="absolute -inset-4 rounded-full border border-primary/20 animate-ping"></div>
            )}
          </div>

          {/* Action Panel */}
          <div className="flex flex-col items-center gap-6 w-full max-w-xs">
            <div className="flex justify-around w-full">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-full transition-all cursor-pointer ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
              </button>
              <button
                onClick={() => setIsCamOff(!isCamOff)}
                className={`p-4 rounded-full transition-all cursor-pointer ${
                  isCamOff ? 'bg-red-500 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {isCamOff ? <VideoOff size={22} /> : <Video size={22} />}
              </button>
            </div>
            <button
              onClick={handleEndCall}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/10 transition-colors cursor-pointer"
            >
              <PhoneOff size={20} /> End Call
            </button>
          </div>
        </div>
      )}



      {/* GLOBAL OVERLAY 7: INCOMING CALL BANNER */}
      {incomingCall && !activeCall && (
        <div className="fixed bottom-6 right-6 z-[70] w-[320px] bg-neutral-900 text-white rounded-2xl shadow-2xl border border-white/10 p-4 animate-in slide-in-from-right duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative shrink-0">
              {incomingCall.callerPic ? (
                <img src={incomingCall.callerPic} alt={incomingCall.callerName} className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                  {incomingCall.callerName?.[0]}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-neutral-900 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm">{incomingCall.callerName}</p>
              <p className="text-xs text-neutral-400">
                {incomingCall.type === 'video' ? '📹 Video' : '📞 Voice'} Call incoming...
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRejectCall}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <PhoneOff size={15} /> Decline
            </button>
            <button
              onClick={handleAcceptCall}
              className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Phone size={15} /> Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
