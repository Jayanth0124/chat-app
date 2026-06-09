import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useTransform, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Loader2, X } from 'lucide-react';

export default function ImageAdjustModal({ isOpen, imageSrc, onClose, onConfirm }) {
  const [isSaving, setIsSaving] = useState(false);
  const [minScale, setMinScale] = useState(1);
  const [currentScaleState, setCurrentScaleState] = useState(1);
  const [isReady, setIsReady] = useState(false);
  
  const imgSizeRef = useRef({ w: 0, h: 0 });
  const wheelContainerRef = useRef(null);
  
  // Calculate crop size once on mount (Reduced by 25% for premium look)
  const isDesktop = window.innerWidth >= 768;
  const CROP_SIZE = isDesktop ? 240 : 180;

  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Live Preview Math
  const PREVIEW_SIZE = 48;
  const previewRatio = PREVIEW_SIZE / CROP_SIZE;
  const previewX = useTransform(x, v => v * previewRatio);
  const previewY = useTransform(y, v => v * previewRatio);
  const previewScale = useTransform(scale, v => v * previewRatio);

  const [constraints, setConstraints] = useState({ top: 0, left: 0, right: 0, bottom: 0 });

  useMotionValueEvent(scale, "change", (latestScale) => {
    setCurrentScaleState(latestScale);
    const { w, h } = imgSizeRef.current;
    setConstraints({
      left: CROP_SIZE - w * latestScale,
      right: 0,
      top: CROP_SIZE - h * latestScale,
      bottom: 0
    });
  });

  useEffect(() => {
    if (isOpen && imageSrc) {
      setIsReady(false);
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        imgSizeRef.current = { w, h };
        
        // Auto-calculate minimum zoom to fully cover the frame
        const minS = Math.max(CROP_SIZE / w, CROP_SIZE / h);
        setMinScale(minS);
        scale.set(minS);
        
        // Center the image initially
        x.set((CROP_SIZE - w * minS) / 2);
        y.set((CROP_SIZE - h * minS) / 2);
        
        setIsReady(true);
      };
    }
  }, [isOpen, imageSrc, CROP_SIZE, scale, x, y]);

  // Handle Wheel and Pinch Zooming
  useEffect(() => {
    const node = wheelContainerRef.current;
    if (!node || !isOpen || !isReady) return;

    let initialDistance = null;
    let initialScale = null;

    const getDistance = (touches) => {
      return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      );
    };

    const updateScaleAndPos = (newScale) => {
      const oldScale = scale.get();
      const ratio = newScale / oldScale;
      const cx = CROP_SIZE / 2;
      const cy = CROP_SIZE / 2;
      
      let newX = cx - (cx - x.get()) * ratio;
      let newY = cy - (cy - y.get()) * ratio;
      
      const { w, h } = imgSizeRef.current;
      const minX = CROP_SIZE - w * newScale;
      const minY = CROP_SIZE - h * newScale;
      
      newX = Math.max(minX, Math.min(newX, 0));
      newY = Math.max(minY, Math.min(newY, 0));

      scale.set(newScale);
      x.set(newX);
      y.set(newY);
    };

    const onWheel = (e) => {
      e.preventDefault();
      const zoomSensitivity = 0.002;
      const delta = -e.deltaY * zoomSensitivity;
      let newScale = scale.get() * (1 + delta);
      newScale = Math.max(minScale, Math.min(newScale, minScale * 4));
      updateScaleAndPos(newScale);
    };

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        initialDistance = getDistance(e.touches);
        initialScale = scale.get();
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && initialDistance) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const ratio = currentDistance / initialDistance;
        let newScale = initialScale * ratio;
        newScale = Math.max(minScale, Math.min(newScale, minScale * 4));
        updateScaleAndPos(newScale);
      }
    };

    const onTouchEnd = () => {
      initialDistance = null;
      initialScale = null;
    };

    node.addEventListener('wheel', onWheel, { passive: false });
    node.addEventListener('touchstart', onTouchStart, { passive: false });
    node.addEventListener('touchmove', onTouchMove, { passive: false });
    node.addEventListener('touchend', onTouchEnd);

    return () => {
      node.removeEventListener('wheel', onWheel);
      node.removeEventListener('touchstart', onTouchStart);
      node.removeEventListener('touchmove', onTouchMove);
      node.removeEventListener('touchend', onTouchEnd);
    };
  }, [isOpen, isReady, minScale, CROP_SIZE, scale, x, y]);

  const handleSliderChange = (e) => {
    const newScale = parseFloat(e.target.value);
    const oldScale = scale.get();
    const ratio = newScale / oldScale;
    const cx = CROP_SIZE / 2;
    const cy = CROP_SIZE / 2;
    
    let newX = cx - (cx - x.get()) * ratio;
    let newY = cy - (cy - y.get()) * ratio;
    
    const { w, h } = imgSizeRef.current;
    const minX = CROP_SIZE - w * newScale;
    const minY = CROP_SIZE - h * newScale;
    
    newX = Math.max(minX, Math.min(newX, 0));
    newY = Math.max(minY, Math.min(newY, 0));

    scale.set(newScale);
    x.set(newX);
    y.set(newY);
  };

  const handleSave = () => {
    setIsSaving(true);
    
    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const OUTPUT_SIZE = 600; 
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext('2d');
      
      const ratio = OUTPUT_SIZE / CROP_SIZE;
      
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        
        const currentX = x.get();
        const currentY = y.get();
        const currentScale = scale.get();
        
        ctx.translate(currentX * ratio, currentY * ratio);
        ctx.scale(currentScale * ratio, currentScale * ratio);
        ctx.drawImage(img, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        onConfirm(dataUrl);
        setIsSaving(false);
      };
    }, 50);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 image-adjust-modal-container"
        >
          {/* Global styles to safely hide navigation elements underneath without layout shifting */}
          <style dangerouslySetInnerHTML={{ __html: `
            nav, aside, header, .sidebar, .mobile-nav, .bottom-nav, [role="navigation"],
            .floating-action-button, .notification-badge {
              opacity: 0 !important;
              pointer-events: none !important;
              transition: opacity 0.2s ease;
            }
            body { overflow: hidden !important; }
            
            input[type=range]::-webkit-slider-thumb {
              appearance: none;
              width: 16px;
              height: 16px;
              background: white;
              border-radius: 50%;
              box-shadow: 0 0 10px rgba(255,255,255,0.5);
              cursor: pointer;
              transition: transform 0.1s;
            }
            input[type=range]::-webkit-slider-thumb:active {
              transform: scale(1.2);
            }
          ` }} />

          {/* Strong backdrop blur and dark overlay */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-none" />

          {/* Centered Premium Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-[600px] bg-[#12121A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: '85vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#1A1A24]">
              <h2 className="text-white font-bold text-lg">Update Profile Photo</h2>
              <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-white/70 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Editor Area */}
            <div className="relative w-full flex-1 flex flex-col items-center bg-[#0A0A0E] overflow-hidden min-h-[300px]">
               {isReady ? (
                 <>
                   {/* Container for crop bounds (Wheel & Drag) */}
                   <div 
                     ref={wheelContainerRef}
                     className="relative flex-1 w-full flex items-center justify-center touch-none py-8 md:py-12"
                   >
                     <div className="relative" style={{ width: CROP_SIZE, height: CROP_SIZE }}>
                       {/* Draggable Image */}
                       <motion.img
                         src={imageSrc}
                         drag
                         dragConstraints={constraints}
                         dragElastic={0}
                         dragMomentum={true}
                         style={{
                           x,
                           y,
                           width: imgSizeRef.current.w,
                           height: imgSizeRef.current.h,
                           scale,
                           transformOrigin: "0 0"
                         }}
                         className="absolute top-0 left-0 max-w-none pointer-events-auto cursor-grab active:cursor-grabbing will-change-transform"
                         draggable={false}
                       />
                       
                       {/* Mask Overlay (Stronger opacity outside circle) */}
                       <div className="absolute inset-0 pointer-events-none overflow-visible">
                         <div 
                           className="rounded-full w-full h-full"
                           style={{
                             boxShadow: '0 0 0 9999px rgba(10, 10, 14, 0.92)',
                             border: '2px solid rgba(255,255,255,0.1)'
                           }}
                         />
                       </div>
                     </div>
                   </div>

                   {/* Slider & Actions Footer */}
                   <div className="w-full px-6 py-5 bg-[#1A1A24]/80 backdrop-blur-xl border-t border-white/5 flex flex-col gap-5">
                     
                     {/* Zoom Slider */}
                     <div className="flex items-center justify-center gap-4 w-full max-w-[320px] mx-auto">
                        <ZoomOut size={18} className="text-white/40" />
                        <input 
                          type="range"
                          min={minScale}
                          max={minScale * 4}
                          step="0.001"
                          value={currentScaleState}
                          onChange={handleSliderChange}
                          className="flex-1 accent-[#8C6DF0] h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer"
                        />
                        <ZoomIn size={18} className="text-white/40" />
                     </div>

                     {/* Actions */}
                     <div className="flex items-center justify-between mt-2">
                       <button 
                         onClick={onClose}
                         className="px-5 py-2.5 rounded-xl font-bold text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                       >
                         Cancel
                       </button>

                       <div className="flex items-center gap-4">
                         {/* Live Preview Avatar */}
                         <div className="hidden sm:flex items-center gap-3 pr-4 border-r border-white/10">
                           <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Preview</span>
                           <div 
                             className="rounded-full overflow-hidden relative bg-[#000] border border-white/10 shrink-0 shadow-lg"
                             style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
                           >
                             <motion.img 
                               src={imageSrc}
                               style={{
                                 x: previewX,
                                 y: previewY,
                                 width: imgSizeRef.current.w,
                                 height: imgSizeRef.current.h,
                                 scale: previewScale,
                                 transformOrigin: "0 0"
                               }}
                               className="absolute top-0 left-0 max-w-none"
                             />
                           </div>
                         </div>

                         {/* Save Button */}
                         <button 
                           onClick={handleSave}
                           disabled={isSaving}
                           className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#8C6DF0] to-[#7b5bea] hover:brightness-110 text-white font-bold text-sm shadow-[0_4px_20px_rgba(140,109,240,0.4)] transition-all flex items-center gap-2 disabled:opacity-50"
                         >
                           {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Save Photo'}
                         </button>
                       </div>
                     </div>
                   </div>
                 </>
               ) : (
                 <div className="flex-1 flex items-center justify-center min-h-[300px]">
                   <Loader2 size={32} className="animate-spin text-[#8C6DF0]" />
                 </div>
               )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
