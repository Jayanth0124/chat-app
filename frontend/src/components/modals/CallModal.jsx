import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff, Volume2, Bluetooth, Headphones, Smartphone, ChevronUp } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function CallModal({ isOpen, onClose, type = 'audio', user }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  
  // Audio Routing State
  const [audioDevices, setAudioDevices] = useState([]);
  const [hasBluetooth, setHasBluetooth] = useState(false);
  const [showRoutingMenu, setShowRoutingMenu] = useState(false);
  const [currentOutputId, setCurrentOutputId] = useState('default');

  useEffect(() => {
    if (!isOpen) return;

    const checkDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission to see labels
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter(d => d.kind === 'audiooutput');
        setAudioDevices(outputs);
        
        // Detect if any output device is a Bluetooth headset
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
  }, [isOpen]);

  const handleAudioRouteChange = async (deviceId) => {
    setCurrentOutputId(deviceId);
    setShowRoutingMenu(false);
    
    // In a real WebRTC implementation, you would apply this to the remote audio element:
    // const remoteAudioElement = document.getElementById('remote-audio');
    // if (remoteAudioElement && typeof remoteAudioElement.setSinkId === 'function') {
    //   await remoteAudioElement.setSinkId(deviceId);
    // }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
        >
          {type === 'video' && !isVideoOff ? (
            <div className="absolute inset-0 z-0">
              {/* Fake video background */}
              <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                <p className="text-white/50">Camera feed would be here</p>
              </div>
              {/* Mini self view */}
              <div className="absolute top-4 right-4 w-32 h-48 bg-black rounded-xl border-2 border-white/20 overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb" className="w-full h-full object-cover opacity-80" alt="Self view" />
              </div>
            </div>
          ) : null}

          <div className="relative z-10 flex flex-col items-center">
            {/* User DP for audio or when video is off */}
            {(type === 'audio' || isVideoOff) && (
              <motion.div 
                animate={{ scale: [1, 1.1, 1] }} 
                transition={{ repeat: Infinity, duration: 2 }}
                className="relative mb-8"
              >
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-50 animate-pulse"></div>
                <img src={user?.avatar || "https://i.pravatar.cc/150"} alt="Avatar" className="w-32 h-32 rounded-full border-4 border-white/10 relative z-10 shadow-2xl" />
              </motion.div>
            )}

            <h2 className="text-3xl font-bold text-white mb-2">{user?.displayName || "User Name"}</h2>
            <p className="text-white/70 mb-12">00:04:23</p>

            <div className="flex items-center gap-6">
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className={`p-4 rounded-full backdrop-blur-md transition-all ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
              >
                {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
              </button>

              {/* Audio Routing Toggle */}
              {!hasBluetooth ? (
                <button 
                  onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                  className={`p-4 rounded-full backdrop-blur-md transition-all ${isSpeakerOn ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
                >
                  <Volume2 size={24} className={isSpeakerOn ? 'opacity-100' : 'opacity-60'} />
                </button>
              ) : (
                <button 
                  onClick={() => setShowRoutingMenu(true)}
                  className={`relative p-4 rounded-full backdrop-blur-md transition-all bg-white text-black flex items-center justify-center`}
                >
                  {currentOutputId === 'speaker' || currentOutputId === 'default' ? <Volume2 size={24} /> : 
                   currentOutputId === 'earpiece' ? <Smartphone size={24} /> : 
                   <Bluetooth size={24} />}
                  <div className="absolute -bottom-1 -right-1 bg-[#111111] rounded-full p-0.5">
                    <ChevronUp size={12} className="text-white" />
                  </div>
                </button>
              )}

              {type === 'video' && (
                <button 
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`p-4 rounded-full backdrop-blur-md transition-all ${isVideoOff ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
                >
                  {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                </button>
              )}

              <button 
                onClick={onClose}
                className="p-5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all shadow-lg shadow-red-500/30"
              >
                <PhoneOff size={28} />
              </button>
            </div>
          </div>

          {/* Audio Routing Bottom Sheet */}
          <AnimatePresence>
            {showRoutingMenu && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 z-40 bg-black/50" 
                  onClick={() => setShowRoutingMenu(false)}
                />
                <motion.div 
                  initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="absolute bottom-0 left-0 right-0 z-50 bg-[#1C1C1E] rounded-t-3xl border-t border-white/10 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] p-6 pb-10"
                >
                  <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
                  <h3 className="text-[15px] font-bold text-white/90 mb-4 px-2 tracking-wide">Audio Output</h3>
                  
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
                      className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${currentOutputId === 'earpiece' ? 'bg-[#0A84FF]/10 text-[#0A84FF]' : 'hover:bg-white/5 text-white/90'}`}
                    >
                      <div className={`p-2 rounded-full ${currentOutputId === 'earpiece' ? 'bg-[#0A84FF]/20' : 'bg-white/10'}`}>
                        <Smartphone size={20} />
                      </div>
                      <span className="font-semibold text-[16px]">iPhone / Earpiece</span>
                      {currentOutputId === 'earpiece' && <div className="ml-auto w-2 h-2 rounded-full bg-[#0A84FF]" />}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
