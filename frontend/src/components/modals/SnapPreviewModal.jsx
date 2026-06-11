import { useState, useRef, useEffect } from 'react';
import { X, Send, Camera, Image as ImageIcon } from 'lucide-react';
import Avatar from '../ui/Avatar';

import { createPortal } from 'react-dom';

export default function SnapPreviewModal({ isOpen, imageSrc, mediaSource, onClose, onConfirm, user }) {
  const [caption, setCaption] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCaption('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isVideo = imageSrc?.match(/\.(mp4|webm|ogg)$/i) || imageSrc?.startsWith('data:video');

  const handleSend = () => {
    onConfirm(caption.trim(), imageSrc, mediaSource);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col animate-in fade-in zoom-in-95 duration-200">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe z-50 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white backdrop-blur-md transition-colors cursor-pointer"
        >
          <X size={24} />
        </button>
        <span className="text-white font-bold tracking-widest text-sm uppercase opacity-80">Snap</span>
        <div className="w-10 h-10"></div> {/* Placeholder for balance */}
      </div>

      {/* Media Preview */}
      <div className="flex-1 w-full h-full flex items-center justify-center relative">
        {isVideo ? (
          <video 
            src={imageSrc} 
            autoPlay 
            loop
            className="w-full h-full object-contain"
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
          />
        ) : (
          <img 
            src={imageSrc} 
            alt="Snap Preview" 
            className="w-full h-full object-contain select-none" 
            draggable={false}
          />
        )}
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe z-50 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col gap-4">
        
        {/* Caption Input */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full pl-4 pr-1.5 py-1.5 border border-white/20 shadow-xl">
          <input
            ref={inputRef}
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Add a caption..."
            className="flex-1 bg-transparent text-white placeholder-white/50 text-[15px] outline-none"
          />
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:scale-105 transition-transform cursor-pointer shadow-lg"
          >
            <Send size={18} className="pl-0.5" />
          </button>
        </div>

        {/* Indicator */}
        <div className="flex items-center gap-2 pl-4 pb-2 opacity-60">
          {mediaSource === 'camera' ? (
            <>
              <Camera size={14} className="text-white" />
              <span className="text-white text-[11px] font-semibold tracking-wider uppercase">Camera</span>
            </>
          ) : (
            <>
              <ImageIcon size={14} className="text-white" />
              <span className="text-white text-[11px] font-semibold tracking-wider uppercase">Gallery</span>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
