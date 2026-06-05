import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, Mic, MicOff, VideoOff, PhoneOff } from 'lucide-react';
import { useState } from 'react';

export default function CallModal({ isOpen, onClose, type = 'audio', user }) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
