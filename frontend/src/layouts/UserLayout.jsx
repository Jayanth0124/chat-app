import { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import UserSidebar from '../components/UserSidebar';
import { MessageSquare, Users, Phone, Search, Settings, User, LogOut, X, Camera, Mic, MicOff, Volume2, VolumeX, PhoneOff, PhoneIncoming, Check, Loader2, Bell, Trash2, ShieldAlert, UserPlus, UserCheck, Bug, HelpCircle, Inbox, CheckCircle2, Video, VideoOff, SwitchCamera, Bluetooth, Maximize, ChevronUp, Smartphone } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useChatStore } from '../store/useChatStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useFriendStore } from '../store/useFriendStore';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import ManageFriends from '../components/ManageFriends';
import { motion, AnimatePresence } from 'framer-motion';
import { audioManager } from '../lib/audioManager';

export default function UserLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    isLogoutOpen, setLogoutOpen,
    activeCall, setActiveCall,
    incomingCall, setIncomingCall,
    isManageFriendsOpen, setManageFriendsOpen,
    activeAnnouncement, setActiveAnnouncement
  } = useLayoutStore();

  const [callHistory, setCallHistory] = useState([]);
  const [callHistoryLoading, setCallHistoryLoading] = useState(false);

  // Audio/Video controls for active call
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false); // Default false per requirements
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [showControls, setShowControls] = useState(true);
  
  // Audio Routing State
  const [audioDevices, setAudioDevices] = useState([]);
  const [hasBluetooth, setHasBluetooth] = useState(false);
  const [showRoutingMenu, setShowRoutingMenu] = useState(false);
  const [currentOutputId, setCurrentOutputId] = useState('default');

  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useState(null);
  const controlsTimeoutRef = useRef(null);

  const { socket, selectedChat, chats, setSelectedChat, accessChat } = useChatStore();
  const { unreadCount } = useNotificationStore();

  // WebRTC Setup
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);

  const activeCallRef = useRef(activeCall);
  const incomingCallRef = useRef(incomingCall);
  const isMutedRef = useRef(isMuted);
  const isVideoEnabledRef = useRef(isVideoEnabled);

  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { incomingCallRef.current = incomingCall; }, [incomingCall]);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  useEffect(() => { isVideoEnabledRef.current = isVideoEnabled; }, [isVideoEnabled]);

  // Fetch notifications and call history on mount
  useEffect(() => {
    useNotificationStore.getState().fetchNotifications();
    fetchCallHistory();
  }, []);

  // Update last viewed time when visiting /calls
  useEffect(() => {
    if (location.pathname === '/calls') {
      localStorage.setItem('orbit_last_viewed_calls', new Date().toISOString());
    }
  }, [location.pathname]);

  // Handle auto-hiding controls for video calls
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (activeCall?.type === 'video' && activeCall?.status === 'connected') {
      controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  useEffect(() => {
    if (!activeCall) return;

    const checkDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true }); 
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        setAudioDevices(outputs);
        
        // Strict Bluetooth keyword filtering
        const btKeywords = ['bluetooth', 'airpods', 'buds', 'bose', 'sony', 'jabra', 'galaxy'];
        const foundBt = outputs.some(d => 
          btKeywords.some(keyword => d.label.toLowerCase().includes(keyword))
        );
        
        setHasBluetooth(foundBt);
      } catch (err) {
        console.error("Error accessing media devices for routing:", err);
      }
    };

    checkDevices();
    navigator.mediaDevices.addEventListener('devicechange', checkDevices);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', checkDevices);
    };
  }, [activeCall]);

  const handleAudioRouteChange = async (deviceId) => {
    setCurrentOutputId(deviceId);
    setShowRoutingMenu(false);
    
    // Attempt to route audio if supported
    if (remoteAudioRef.current && typeof remoteAudioRef.current.setSinkId === 'function') {
      try {
        await remoteAudioRef.current.setSinkId(deviceId === 'speaker' || deviceId === 'earpiece' ? '' : deviceId);
      } catch (err) {
        console.error("Audio routing failed", err);
      }
    }
    
    // Set speaker mode based on selection
    if (deviceId === 'speaker') {
      setIsSpeakerOn(true);
    } else if (deviceId === 'earpiece') {
      setIsSpeakerOn(false);
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => clearTimeout(controlsTimeoutRef.current);
  }, [activeCall?.status, activeCall?.type]);

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

  // Update volume based on speaker mode
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = isSpeakerOn ? 1.0 : 0.05;
    }
    audioManager.setSpeakerMode(isSpeakerOn);
  }, [isSpeakerOn]);

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
      setLocalStream(null);
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    setRemoteStream(null);
  };

  useEffect(() => {
    if (!activeCall) {
      cleanupWebRTC();
      setIsSpeakerOn(false); // Reset speaker preference
      audioManager.stopOutgoing();
    } else {
      setIsVideoEnabled(activeCall.type === 'video');
      // If dialing and outgoing, start outgoing ring
      if (activeCall.status === 'dialing' && activeCall.direction === 'outgoing') {
        audioManager.playOutgoing(() => {
          // 35s Timeout logic
          handleEndCall();
          toast.error('Call timeout. User unavailable.');
        });
      } else {
        // Connected or no longer dialing
        audioManager.stopOutgoing();
      }
    }
  }, [activeCall]);

  useEffect(() => {
    if (incomingCall) {
      audioManager.playIncoming();
    } else {
      audioManager.stopIncoming();
    }
  }, [incomingCall]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isVideoEnabled;
      });
    }
  }, [isVideoEnabled]);

  const toggleCamera = async () => {
    const newMode = !isFrontCamera;
    setIsFrontCamera(newMode);
    
    if (localStreamRef.current && isVideoEnabled) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: newMode ? 'user' : 'environment' } 
        });
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
        if (oldVideoTrack) {
          localStreamRef.current.removeTrack(oldVideoTrack);
          oldVideoTrack.stop();
        }
        
        localStreamRef.current.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(newVideoTrack);
          }
        }
      } catch (err) {
        console.error('Failed to switch camera:', err);
      }
    }
  };

  const getMediaStream = async (type) => {
    const constraints = {
      audio: true,
      video: type === 'video' ? { facingMode: isFrontCamera ? 'user' : 'environment' } : false
    };
    return await navigator.mediaDevices.getUserMedia(constraints);
  };

  useEffect(() => {
    if (activeCall?.status === 'connected') {
      const startWebRTC = async () => {
        try {
          cleanupWebRTC();
          
          const stream = await getMediaStream(activeCall.type);
          localStreamRef.current = stream;
          setLocalStream(stream);

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
            setRemoteStream(event.streams[0]);
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
          toast.error('Could not access media devices');
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
              stream = await getMediaStream(activeCallRef.current?.type || 'voice');
              localStreamRef.current = stream;
              setLocalStream(stream);
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
              setRemoteStream(event.streams[0]);
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
    return () => socket.off('webrtc:signal', handleWebRTCSignal);
  }, [socket]);

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

  const handleRejectCall = () => {
    if (!incomingCall) return;
    if (socket) socket.emit('call:reject', { to: incomingCall.callerId, callId: incomingCall.callId });
    if (incomingCall.callId) {
      try {
        axiosInstance.patch(`/calls/${incomingCall.callId}`, { status: 'rejected', duration: 0 });
      } catch (e) {}
    }
    setIncomingCall(null);
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    const otherId = activeCall.receiverId;
    const isDialing = activeCall.status === 'dialing';
    
    if (socket && otherId) {
      if (isDialing) {
        socket.emit('call:cancel', { to: otherId, callId: activeCall.callId });
      } else {
        socket.emit('call:end', {
          to: otherId,
          callId: activeCall.callId,
          duration: callDuration
        });
      }
    }
    
    if (activeCall.callId) {
      try {
        const finalStatus = isDialing ? 'cancelled' : (activeCall.status === 'connected' ? 'completed' : 'missed');
        await axiosInstance.patch(`/calls/${activeCall.callId}`, {
          status: finalStatus,
          duration: callDuration
        });
      } catch (e) {}
    }
    setActiveCall(null);
  };

  return (
    <div className="relative h-screen w-full flex flex-col md:flex-row overflow-hidden font-sans bg-black text-on-surface">
      <div className="hidden md:block h-full relative z-50">
        <UserSidebar />
      </div>

      <main className="flex-1 h-full relative flex flex-col overflow-hidden bg-transparent">
        <Outlet />
      </main>

      <div className={`md:hidden flex justify-around items-center bg-surface border-t border-outline-variant/60 px-2 py-1 shrink-0 pb-safe ${
        location.pathname === '/' && selectedChat ? 'hidden' : 'flex'
      }`}>
        <button onClick={() => navigate('/')} className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/' ? 'text-primary' : 'text-on-surface-variant/80'}`}>
          <MessageSquare size={20} />
          <span className="text-[10px] font-semibold">Chats</span>
        </button>
        <button onClick={() => navigate('/calls')} className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/calls' ? 'text-primary' : 'text-on-surface-variant/80'}`}>
          <Phone size={20} />
          <span className="text-[10px] font-semibold">Calls</span>
        </button>
        <button onClick={() => navigate('/friends')} className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/friends' ? 'text-primary' : 'text-on-surface-variant/80'}`}>
          <Users size={20} />
          <span className="text-[10px] font-semibold">Friends</span>
        </button>
        <button onClick={() => navigate('/profile')} className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/profile' ? 'text-primary' : 'text-on-surface-variant/80'}`}>
          <User size={20} />
          <span className="text-[10px] font-semibold">Profile</span>
        </button>
        <button onClick={() => navigate('/activity')} className={`relative flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/activity' ? 'text-primary' : 'text-on-surface-variant/80'}`}>
          <Bell size={20} />
          {unreadCount > 0 && <span className="absolute top-1 right-2 w-3 h-3 bg-primary rounded-full border-2 border-surface"></span>}
          <span className="text-[10px] font-semibold">Activity</span>
        </button>
      </div>

      {isLogoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-surface rounded-2xl border border-outline-variant/60 shadow-2xl overflow-hidden p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center mx-auto mb-4">
              <LogOut size={24} />
            </div>
            <h3 className="text-lg font-bold mb-2">Sign Out</h3>
            <p className="text-sm text-on-surface-variant mb-6">Are you sure you want to log out of your Orbit session?</p>
            <div className="flex gap-3">
              <button onClick={() => setLogoutOpen(false)} className="flex-1 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-low transition-colors font-semibold text-sm cursor-pointer">Cancel</button>
              <button onClick={() => { setLogoutOpen(false); logout(); }} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors shadow-md shadow-red-500/10 cursor-pointer">Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL OVERLAY 4: CALL OVERLAY (VOICE & VIDEO) */}
      <AnimatePresence>
        {activeCall && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[60] bg-[#0A0A0E] text-white overflow-hidden flex flex-col"
            onMouseMove={resetControlsTimeout}
            onTouchStart={resetControlsTimeout}
          >
            {/* Deep Space Background / Video Layer */}
            <div className="absolute inset-0 z-0">
              {activeCall.type === 'video' && activeCall.status === 'connected' && remoteStream ? (
                <video 
                  autoPlay 
                  playsInline 
                  ref={(node) => { if (node) node.srcObject = remoteStream; }} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1B1143] via-[#0A0A0E] to-black">
                  {/* Subtle stardust animation could go here */}
                </div>
              )}
            </div>

            {/* Draggable Local Video Preview (Picture in Picture) */}
            {activeCall.type === 'video' && activeCall.status === 'connected' && localStream && isVideoEnabled && (
              <motion.div 
                drag
                dragConstraints={{ top: 20, left: 20, right: window.innerWidth - 140, bottom: window.innerHeight - 200 }}
                className="absolute z-40 w-28 h-40 md:w-40 md:h-56 bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/20 cursor-grab active:cursor-grabbing top-safe right-4 mt-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <video 
                  autoPlay 
                  playsInline 
                  muted 
                  ref={(node) => { if (node) node.srcObject = localStream; }} 
                  className="w-full h-full object-cover"
                />
              </motion.div>
            )}

            {/* Call Header / Info Layer */}
            <AnimatePresence>
              {(showControls || activeCall.status !== 'connected') && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-30 flex flex-col items-center pt-safe mt-12 px-6"
                >
                  <div className="text-center bg-black/30 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-2xl">
                    <span className="text-[10px] tracking-[0.3em] text-[#A084FF] font-bold uppercase block mb-2">
                      {activeCall.status === 'dialing' ? 'Establishing Link...' : 'Orbit Encrypted Connection'}
                    </span>
                    <h3 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70 drop-shadow-md">
                      {activeCall.name}
                    </h3>
                    {activeCall.status === 'connected' && (
                      <p className="text-white/70 font-mono text-xl mt-2 tracking-widest">{formatDuration(callDuration)}</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Voice Call specific Avatar Ring */}
            {activeCall.type === 'voice' && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="relative">
                  {/* Orbit Rings */}
                  {activeCall.status === 'connected' && (
                    <>
                      <div className="absolute inset-0 rounded-full border border-[#8C6DF0]/40 animate-[spin_4s_linear_infinite] scale-[1.3] pointer-events-none" />
                      <div className="absolute inset-0 rounded-full border border-[#8C6DF0]/30 animate-[spin_6s_linear_infinite_reverse] scale-[1.7] pointer-events-none" />
                      <div className="absolute inset-0 rounded-full border border-[#8C6DF0]/15 animate-[spin_8s_linear_infinite] scale-[2.2] pointer-events-none" />
                    </>
                  )}
                  {activeCall.status === 'dialing' && (
                    <div className="absolute -inset-8 rounded-full bg-[#8C6DF0]/30 animate-ping pointer-events-none" />
                  )}
                  {/* Avatar */}
                  {activeCall.pic ? (
                    <img src={activeCall.pic} alt={activeCall.name} className="w-40 h-40 rounded-full object-cover border-[3px] border-[#8C6DF0]/50 shadow-[0_0_60px_rgba(140,109,240,0.4)]" />
                  ) : (
                    <div className="w-40 h-40 rounded-full border-[3px] border-[#8C6DF0]/50 bg-black/60 backdrop-blur-md flex items-center justify-center text-6xl font-black uppercase text-[#8C6DF0] shadow-[0_0_60px_rgba(140,109,240,0.4)]">
                      {activeCall.name?.[0]}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bottom Controls */}
            <AnimatePresence>
              {(showControls || activeCall.status !== 'connected') && (
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 50 }}
                  className="absolute bottom-0 left-0 right-0 z-30 pb-safe mb-8 px-6"
                >
                  <div className="max-w-md mx-auto bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-[2.5rem] shadow-2xl flex flex-col gap-6">
                    <div className="flex justify-between items-center px-4">
                      {/* Audio/Video Toggles */}
                      <div className="flex flex-col items-center gap-2">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className={`w-14 h-14 rounded-full transition-all flex items-center justify-center shadow-lg ${
                            isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                          }`}
                        >
                          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-white/50">{isMuted ? 'Muted' : 'Mic'}</span>
                      </div>
                      
                      {activeCall.type === 'video' ? (
                        <>
                          <div className="flex flex-col items-center gap-2">
                            <button
                              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                              className={`w-14 h-14 rounded-full transition-all flex items-center justify-center shadow-lg ${
                                !isVideoEnabled ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                            >
                              {!isVideoEnabled ? <VideoOff size={24} /> : <Video size={24} />}
                            </button>
                            <span className="text-[10px] font-bold tracking-wider uppercase text-white/50">Camera</span>
                          </div>
                          
                          {isVideoEnabled && (
                            <div className="flex flex-col items-center gap-2 hidden md:flex">
                              <button
                                className={`w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center shadow-lg`}
                              >
                                <Maximize size={24} />
                              </button>
                              <span className="text-[10px] font-bold tracking-wider uppercase text-white/50">Full</span>
                            </div>
                          )}

                          {isVideoEnabled && (
                            <div className="flex flex-col items-center gap-2">
                              <button
                                onClick={toggleCamera}
                                className={`w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center shadow-lg`}
                              >
                                <SwitchCamera size={24} />
                              </button>
                              <span className="text-[10px] font-bold tracking-wider uppercase text-white/50">Flip</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 relative">
                          {!hasBluetooth ? (
                            <button
                              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                              className={`w-14 h-14 rounded-full transition-all flex items-center justify-center shadow-lg ${
                                isSpeakerOn ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
                              }`}
                            >
                              <Volume2 size={24} className={isSpeakerOn ? 'opacity-100' : 'opacity-60'} />
                            </button>
                          ) : (
                            <button
                              onClick={() => setShowRoutingMenu(true)}
                              className={`relative w-14 h-14 rounded-full transition-all flex items-center justify-center shadow-lg bg-white text-black`}
                            >
                              {currentOutputId === 'speaker' || currentOutputId === 'default' ? <Volume2 size={24} /> : 
                               currentOutputId === 'earpiece' ? <Smartphone size={24} /> : 
                               <Bluetooth size={24} />}
                              <div className="absolute -bottom-1 -right-1 bg-[#111111] rounded-full p-0.5 shadow-md">
                                <ChevronUp size={12} className="text-white" />
                              </div>
                            </button>
                          )}
                          <span className="text-[10px] font-bold tracking-wider uppercase text-white/50">
                            {!hasBluetooth ? 'Speaker' : 'Audio'}
                          </span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleEndCall}
                      className="w-full py-5 bg-[#FF3B30] hover:bg-[#FF453A] text-white font-black uppercase tracking-widest rounded-full flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(255,59,48,0.4)] transition-all active:scale-95"
                    >
                      <PhoneOff size={22} /> End Connection
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Audio Routing Bottom Sheet */}
            <AnimatePresence>
              {showRoutingMenu && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm" 
                    onClick={() => setShowRoutingMenu(false)}
                  />
                  <motion.div 
                    initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="absolute bottom-0 left-0 right-0 z-50 bg-[#1C1C1E] rounded-t-[2rem] border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] p-6 pb-safe"
                  >
                    <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
                    <h3 className="text-[15px] font-bold text-white/90 mb-4 px-2 tracking-wide uppercase">Audio Output</h3>
                    
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => handleAudioRouteChange('speaker')}
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentOutputId === 'speaker' ? 'bg-[#0A84FF]/10 text-[#0A84FF]' : 'hover:bg-white/5 text-white/90'}`}
                      >
                        <div className={`p-2 rounded-full ${currentOutputId === 'speaker' ? 'bg-[#0A84FF]/20' : 'bg-white/10'}`}>
                          <Volume2 size={20} />
                        </div>
                        <span className="font-semibold text-[16px]">Speaker</span>
                        {currentOutputId === 'speaker' && <div className="ml-auto w-2 h-2 rounded-full bg-[#0A84FF]" />}
                      </button>

                      {audioDevices.filter(d => 
                        ['bluetooth', 'airpods', 'buds', 'bose', 'sony', 'jabra', 'galaxy'].some(keyword => d.label.toLowerCase().includes(keyword))
                      ).map(device => (
                        <button 
                          key={device.deviceId}
                          onClick={() => handleAudioRouteChange(device.deviceId)}
                          className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentOutputId === device.deviceId ? 'bg-[#0A84FF]/10 text-[#0A84FF]' : 'hover:bg-white/5 text-white/90'}`}
                        >
                          <div className={`p-2 rounded-full ${currentOutputId === device.deviceId ? 'bg-[#0A84FF]/20' : 'bg-white/10'}`}>
                            <Bluetooth size={20} />
                          </div>
                          <span className="font-semibold text-[16px] truncate">{device.label || 'Bluetooth Device'}</span>
                          {currentOutputId === device.deviceId && <div className="ml-auto w-2 h-2 rounded-full bg-[#0A84FF]" />}
                        </button>
                      ))}

                      <button 
                        onClick={() => handleAudioRouteChange('earpiece')}
                        className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentOutputId === 'earpiece' || currentOutputId === 'default' ? 'bg-[#0A84FF]/10 text-[#0A84FF]' : 'hover:bg-white/5 text-white/90'}`}
                      >
                        <div className={`p-2 rounded-full ${currentOutputId === 'earpiece' || currentOutputId === 'default' ? 'bg-[#0A84FF]/20' : 'bg-white/10'}`}>
                          <Smartphone size={20} />
                        </div>
                        <span className="font-semibold text-[16px]">iPhone / Earpiece</span>
                        {(currentOutputId === 'earpiece' || currentOutputId === 'default') && <div className="ml-auto w-2 h-2 rounded-full bg-[#0A84FF]" />}
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL OVERLAY 7: FULL SCREEN INCOMING CALL */}
      <AnimatePresence>
        {incomingCall && !activeCall && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex flex-col items-center justify-between bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1B1143] via-[#0A0A0E] to-black text-white p-8 md:p-12"
          >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-none" />

            <div className="relative z-10 text-center mt-12 md:mt-20">
              <span className={`text-xs md:text-sm tracking-[0.3em] font-black uppercase animate-pulse drop-shadow-[0_0_10px_rgba(140,109,240,0.8)] ${incomingCall.type === 'video' ? 'text-[#0A84FF]' : 'text-[#8C6DF0]'}`}>
                Incoming {incomingCall.type === 'video' ? 'Video' : 'Voice'} Transmission
              </span>
              <h3 className="text-4xl md:text-6xl font-black mt-6 text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 drop-shadow-2xl">
                {incomingCall.callerName}
              </h3>
              <p className="text-sm text-white/50 mt-4 tracking-widest font-mono">Orbit Encrypted Network</p>
            </div>

            <div className="relative z-10 my-8 flex-1 flex items-center justify-center w-full">
              <div className="relative">
                {incomingCall.callerPic ? (
                  <img src={incomingCall.callerPic} alt={incomingCall.callerName} className={`w-48 h-48 md:w-64 md:h-64 object-cover border-4 z-10 relative ${incomingCall.type === 'video' ? 'rounded-3xl border-[#0A84FF] shadow-[0_0_80px_rgba(10,132,255,0.4)]' : 'rounded-full border-[#8C6DF0] shadow-[0_0_80px_rgba(140,109,240,0.4)]'}`} />
                ) : (
                  <div className={`w-48 h-48 md:w-64 md:h-64 border-4 bg-black/60 backdrop-blur-md flex items-center justify-center text-7xl font-black uppercase z-10 relative ${incomingCall.type === 'video' ? 'rounded-3xl border-[#0A84FF] text-[#0A84FF] shadow-[0_0_80px_rgba(10,132,255,0.4)]' : 'rounded-full border-[#8C6DF0] text-[#8C6DF0] shadow-[0_0_80px_rgba(140,109,240,0.4)]'}`}>
                    {incomingCall.callerName?.[0]}
                  </div>
                )}
                
                {/* Ripple effects */}
                {incomingCall.type === 'voice' ? (
                  <>
                    <div className="absolute inset-0 rounded-full border-2 border-[#8C6DF0]/60 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    <div className="absolute inset-0 rounded-full border-4 border-[#8C6DF0]/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] delay-150" />
                    <div className="absolute inset-0 rounded-full border-[8px] border-[#8C6DF0]/10 animate-[ping_4s_cubic-bezier(0,0,0.2,1)_infinite] delay-300" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 rounded-3xl border-2 border-[#0A84FF]/60 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                    <div className="absolute inset-0 rounded-3xl border-4 border-[#0A84FF]/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] delay-150" />
                  </>
                )}
              </div>
            </div>

            <div className="relative z-10 flex gap-10 md:gap-20 mb-12 md:mb-20 w-full justify-center">
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleRejectCall}
                  className="w-20 h-20 md:w-24 md:h-24 bg-black/40 border border-[#FF3B30]/30 hover:bg-[#FF3B30]/20 text-[#FF3B30] rounded-full flex items-center justify-center backdrop-blur-xl shadow-[0_0_40px_rgba(255,59,48,0.2)] transition-all transform hover:scale-105 active:scale-95"
                >
                  <PhoneOff size={32} />
                </button>
                <span className="text-[11px] font-black tracking-widest text-white/50 uppercase">Decline</span>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleAcceptCall}
                  className={`w-20 h-20 md:w-24 md:h-24 text-white rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 animate-bounce ${incomingCall.type === 'video' ? 'bg-[#0A84FF] hover:bg-[#1E90FF] shadow-[0_0_50px_rgba(10,132,255,0.5)]' : 'bg-[#34C759] hover:bg-[#32D74B] shadow-[0_0_50px_rgba(52,199,89,0.5)]'}`}
                  style={{ animationDuration: '2s' }}
                >
                  {incomingCall.type === 'video' ? <Video size={32} /> : <Phone size={32} />}
                </button>
                <span className={`text-[11px] font-black tracking-widest uppercase ${incomingCall.type === 'video' ? 'text-[#0A84FF]' : 'text-[#34C759]'}`}>Accept</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GLOBAL OVERLAY 8: MANAGE FRIENDS DRAWER */}
      {isManageFriendsOpen && <ManageFriends />}

      {/* GLOBAL OVERLAY 9: ANNOUNCEMENT DETAIL MODAL */}
      {activeAnnouncement && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface rounded-2xl border border-outline-variant/60 shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/60 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-on-surface leading-tight truncate">{activeAnnouncement.title}</h3>
                <span className="text-[10px] text-on-surface-variant/70 font-medium font-sans">
                  {new Date(activeAnnouncement.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="text-sm text-on-surface-variant leading-relaxed max-h-[40vh] overflow-y-auto pr-2 mb-6 whitespace-pre-wrap break-words">
              {activeAnnouncement.body}
            </div>

            <div className="flex justify-end">
              <button 
                onClick={() => setActiveAnnouncement(null)}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-sm transition-colors shadow-md shadow-primary/10 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
