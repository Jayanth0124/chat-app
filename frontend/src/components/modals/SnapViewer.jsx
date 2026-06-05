import { motion, AnimatePresence } from 'framer-motion';
import { X, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SnapViewer({ isOpen, onClose, imageUrl }) {
  const [timeLeft, setTimeLeft] = useState(10); // 10 seconds to view

  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose(); // Automatically close when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 z-[60] flex flex-col"
        >
          {/* Snap Header */}
          <div className="p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent absolute top-0 left-0 right-0 z-10">
            <div className="flex items-center gap-3">
              <img src="https://i.pravatar.cc/150" alt="Sender" className="w-10 h-10 rounded-full border border-white/20" />
              <div>
                <p className="text-white font-semibold">User 1</p>
                <p className="text-xs text-white/70">1m ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Timer */}
              <div className="w-10 h-10 rounded-full border-2 border-white/30 flex items-center justify-center relative">
                <span className="text-white font-bold">{timeLeft}</span>
                <svg className="absolute top-0 left-0 w-full h-full -rotate-90">
                  <circle 
                    cx="18" cy="18" r="18" 
                    fill="none" stroke="white" strokeWidth="2" 
                    strokeDasharray="113" 
                    strokeDashoffset={113 - (113 * timeLeft) / 10} 
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
              </div>
              
              <button onClick={onClose} className="text-white/80 hover:text-white p-2">
                <X size={28} />
              </button>
            </div>
          </div>

          {/* Snap Image */}
          <div className="flex-1 flex items-center justify-center p-4 relative">
            <img 
              src={imageUrl || "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba"} 
              alt="Snap" 
              className="max-w-full max-h-full object-contain rounded-2xl"
            />
            
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md px-4 py-2 rounded-full text-white/80 text-sm">
              <EyeOff size={16} />
              <span>One-time view</span>
            </div>
          </div>

          {/* Progress Bar Top */}
          <div className="absolute top-0 left-0 w-full h-1 bg-white/20">
            <div 
              className="h-full bg-white transition-all duration-1000 ease-linear"
              style={{ width: `${(timeLeft / 10) * 100}%` }}
            ></div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
