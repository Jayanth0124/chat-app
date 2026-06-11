import React, { useState, useRef } from 'react';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import { X, Send, RotateCw, RotateCcw, RefreshCcw } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function MediaCropModal({ imageSrc, onClose, onSend, isSnap = false }) {
  const cropperRef = useRef(null);
  const [caption, setCaption] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(NaN); // NaN = freeform

  const aspectRatios = [
    { label: 'Free', value: NaN },
    { label: '1:1', value: 1 },
    { label: '4:5', value: 4 / 5 },
    { label: '9:16', value: 9 / 16 }
  ];

  const handleAspectRatioChange = (value) => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    
    if (value === 0) {
      // Original
      const imageData = cropper.getImageData();
      cropper.setAspectRatio(imageData.naturalWidth / imageData.naturalHeight);
      setAspectRatio(0);
    } else {
      cropper.setAspectRatio(value);
      setAspectRatio(value);
    }
  };

  const handleRotate = () => {
    cropperRef.current?.cropper.rotate(90);
  };

  const handleReset = () => {
    cropperRef.current?.cropper.reset();
  };

  const handleSend = async () => {
    if (isSending) return;
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    setIsSending(true);
    try {
      // Get the canvas of the cropped area
      const canvas = cropper.getCroppedCanvas({
        imageSmoothingEnabled: true,
        imageSmoothingQuality: 'high',
      });
      const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
      
      await onSend(croppedImage, caption);
      onClose();
    } catch (e) {
      console.error(e);
      setIsSending(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 h-[100dvh] w-[100dvw] z-[200] flex flex-col bg-black animate-in fade-in duration-200 overflow-hidden">
      
      {/* Top Header */}
      <div className="relative z-50 p-4 pt-safe flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-md"
        >
          <X size={22} />
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handleReset}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-md"
            title="Reset"
          >
            <RefreshCcw size={18} />
          </button>
          <button 
            onClick={handleRotate}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-md"
            title="Rotate"
          >
            <RotateCw size={18} />
          </button>
        </div>
      </div>

      {/* Cropper Container */}
      <div className="flex-1 relative w-full min-h-0 bg-black">
        <Cropper
          src={imageSrc}
          style={{ height: '100%', width: '100%' }}
          initialAspectRatio={NaN}
          aspectRatio={aspectRatio}
          guides={true} // rule of thirds
          ref={cropperRef}
          viewMode={1} // restrict crop box to not exceed the canvas
          dragMode="move" // allows panning the image underneath
          background={false} // hide default grid background
          responsive={true}
          autoCropArea={0.8}
          checkOrientation={false} // to avoid issues with some images
        />
      </div>

      {/* Custom CSS overrides for native look */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Hide the cropperjs default dotted lines and make it clean */
        .cropper-view-box { outline: 2px solid rgba(255,255,255,0.9); outline-color: rgba(255,255,255,0.9); }
        .cropper-line { background-color: transparent; }
        .cropper-point { background-color: transparent; opacity: 1; }
        /* Edges */
        .cropper-point.point-n, .cropper-point.point-s, .cropper-point.point-e, .cropper-point.point-w {
           background-color: transparent;
        }
        /* Corners */
        .cropper-point.point-nw, .cropper-point.point-ne, .cropper-point.point-sw, .cropper-point.point-se {
           width: 24px; height: 24px; border-radius: 0; background-color: transparent; border: 4px solid white;
        }
        .cropper-point.point-nw { border-right: none; border-bottom: none; top: -4px; left: -4px; }
        .cropper-point.point-ne { border-left: none; border-bottom: none; top: -4px; right: -4px; }
        .cropper-point.point-sw { border-right: none; border-top: none; bottom: -4px; left: -4px; }
        .cropper-point.point-se { border-left: none; border-top: none; bottom: -4px; right: -4px; }
        .cropper-center { display: none; }
        .cropper-bg { background-image: none !important; background-color: #000; }
        .cropper-modal { background-color: rgba(0,0,0,0.85); opacity: 1; }
      `}} />

      {/* Bottom Controls */}
      <div className="relative z-50 bg-black/95 pb-safe border-t border-white/10 flex flex-col">
        
        {/* Aspect Ratio Toolbar */}
        <div className="flex items-center gap-3 py-3 px-4 overflow-x-auto no-scrollbar justify-center">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.label}
              onClick={() => handleAspectRatioChange(ratio.value)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-colors shrink-0 ${
                (Number.isNaN(aspectRatio) && Number.isNaN(ratio.value)) || aspectRatio === ratio.value 
                  ? 'bg-white text-black' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              {ratio.label}
            </button>
          ))}
        </div>

        {/* Caption & Send */}
        <div className="px-4 pb-4 pt-2 flex items-end gap-3 max-w-[800px] mx-auto w-full">
          <div className="flex-1 bg-white/10 border border-white/10 rounded-3xl px-4 py-2 flex items-center">
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption..."
              rows={1}
              className="w-full bg-transparent text-white placeholder-white/50 text-[15px] resize-none outline-none max-h-24 custom-scrollbar"
              style={{ minHeight: '24px' }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
              }}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={isSending}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${
              isSending 
                ? 'bg-[#0A84FF]/50 text-white/50' 
                : 'bg-[#0A84FF] text-white hover:scale-105 active:scale-95 shadow-[0_4px_12px_rgba(10,132,255,0.4)]'
            }`}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={20} className="ml-1" />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
