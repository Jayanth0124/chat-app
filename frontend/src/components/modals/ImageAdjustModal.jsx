import { useState, useRef, useEffect } from 'react';
import { X, RotateCw, ZoomIn, ZoomOut, Sliders, Check, RotateCcw, Crop, Image as ImageIcon } from 'lucide-react';

export default function ImageAdjustModal({ isOpen, imageSrc, onClose, onConfirm, aspectMode = 'original' }) {
  const [cropMode, setCropMode] = useState(aspectMode); // 'circle' | 'square' | 'original'
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeTab, setActiveTab] = useState('transform'); // 'transform' | 'filters'

  // Adjustment Filters
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [sepia, setSepia] = useState(0);

  const imgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Reset adjustments on open
      setCropMode(aspectMode);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setGrayscale(0);
      setSepia(0);
    }
  }, [isOpen, imageSrc, aspectMode]);

  if (!isOpen) return null;

  // Drag Handlers for Panning (only if not 'original' mode)
  const handleMouseDown = (e) => {
    if (cropMode === 'original') return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || cropMode === 'original') return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for Mobile Devices (only if not 'original' mode)
  const handleTouchStart = (e) => {
    if (cropMode === 'original') return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1 || cropMode === 'original') return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setGrayscale(0);
    setSepia(0);
  };

  const handleApply = () => {
    if (!imgRef.current) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Common filter settings
      const filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) sepia(${sepia}%)`;

      if (cropMode === 'original') {
        // --- 1. No Cropping Mode ---
        // Determine canvas dimensions based on rotation
        const isRotated90 = rotation === 90 || rotation === 270;
        const width = isRotated90 ? img.naturalHeight : img.naturalWidth;
        const height = isRotated90 ? img.naturalWidth : img.naturalHeight;

        canvas.width = width;
        canvas.height = height;

        // Apply filters
        ctx.filter = filterString;

        // Draw rotated image in full resolution
        ctx.translate(width / 2, height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight);
      } else {
        // --- 2. Cropping Mode (Circle or Square) ---
        // Calculate the scale factor between natural image dimensions and DOM rendered dimensions
        const renderWidth = imgRef.current.offsetWidth;
        const renderHeight = imgRef.current.offsetHeight;
        const scaleFactor = img.naturalWidth / renderWidth;

        // The crop frame size in UI is 240px
        const uiCropSize = 240;
        canvas.width = uiCropSize * scaleFactor;
        canvas.height = uiCropSize * scaleFactor;

        // Fill background with black
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Apply filters
        ctx.filter = filterString;

        // Center origin
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(zoom, zoom);
        // Translate the pan scaled by high-res scale factor
        ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor);

        // Draw image in scaled dimensions
        const drawWidth = renderWidth * scaleFactor;
        const drawHeight = renderHeight * scaleFactor;
        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      }

      // Output as high-quality JPEG
      const resultDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      onConfirm(resultDataUrl);
    };
  };

  // Generate CSS preview transform style
  const isOriginal = cropMode === 'original';
  const filterStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) sepia(${sepia}%)`,
    transform: isOriginal 
      ? `rotate(${rotation}deg)` 
      : `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
    transition: isDragging ? 'none' : 'transform 0.15s ease-out'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-outline-variant/60 flex items-center justify-between bg-surface-container-low select-none">
          <div>
            <h3 className="text-lg font-bold text-on-surface">Adjust Image</h3>
            <p className="text-xs text-on-surface-variant/80 mt-0.5">Scale, rotate, and filter your image before saving</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Editor Area */}
        <div className="p-6 flex-1 flex flex-col items-center justify-center bg-black/40 min-h-[320px] relative">
          
          {/* Main Viewport Container */}
          <div 
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-[280px] h-[280px] bg-black/80 rounded-2xl relative overflow-hidden border border-outline-variant/30 flex items-center justify-center shadow-inner"
            style={{ cursor: isOriginal ? 'default' : 'move' }}
          >
            {/* Base Image */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Adjustment preview"
              style={filterStyle}
              className="max-w-[240px] max-h-[240px] object-contain pointer-events-none select-none transition-all"
            />

            {/* Overlapping Crop Frame overlay (hidden in original mode) */}
            {!isOriginal && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div 
                  className={`w-[240px] h-[240px] border border-white/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] transition-all ${
                    cropMode === 'circle' ? 'rounded-full' : 'rounded-xl'
                  }`}
                />
              </div>
            )}
          </div>
          
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-3 select-none">
            {isOriginal 
              ? 'Original size • Panning and Zooming disabled' 
              : 'Drag to pan image • Use slider or pinch to zoom'
            }
          </span>
        </div>

        {/* Crop Mode Selection Tabs (Only show if aspectMode is not fixed to circle) */}
        {aspectMode !== 'circle' && (
          <div className="px-6 py-2 bg-surface-container-low border-t border-outline-variant/30 flex gap-2 justify-center select-none">
            <span className="text-[11px] font-bold text-on-surface-variant/70 self-center uppercase tracking-wider mr-2">Crop Style:</span>
            <button
              onClick={() => { setCropMode('original'); setZoom(1); setPan({ x: 0, y: 0 }); }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                cropMode === 'original' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-surface border border-outline-variant/60 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <ImageIcon size={12} /> Original (No Crop)
            </button>
            <button
              onClick={() => setCropMode('square')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                cropMode === 'square' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-surface border border-outline-variant/60 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Crop size={12} /> Square Crop
            </button>
            <button
              onClick={() => setCropMode('circle')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                cropMode === 'circle' 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-surface border border-outline-variant/60 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Crop size={12} /> Circle Crop
            </button>
          </div>
        )}

        {/* Tab Selection */}
        <div className="flex border-t border-outline-variant/60 bg-surface-container-low select-none">
          <button 
            onClick={() => setActiveTab('transform')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'transform' 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <RotateCw size={14} /> Position & Rotation
          </button>
          <button 
            onClick={() => setActiveTab('filters')}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'filters' 
                ? 'border-primary text-primary bg-primary/5' 
                : 'border-transparent text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <Sliders size={14} /> Adjust Filters
          </button>
        </div>

        {/* Control Controls Panel */}
        <div className="p-6 bg-surface-container-lowest border-t border-outline-variant/40 max-h-[200px] overflow-y-auto">
          {activeTab === 'transform' ? (
            <div className="space-y-4">
              {/* Zoom Control (Disabled in original mode) */}
              <div className={`space-y-1.5 ${isOriginal ? 'opacity-40 pointer-events-none' : ''}`}>
                <div className="flex justify-between items-center text-xs font-bold text-on-surface-variant">
                  <span className="flex items-center gap-1.5"><ZoomIn size={13} /> Zoom</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setZoom(Math.max(1, zoom - 0.1))} 
                    className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-outline-variant/60 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <button 
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))} 
                    className="p-1 hover:bg-surface-container-high rounded text-on-surface-variant hover:text-on-surface cursor-pointer"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>

              {/* Rotation Control */}
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs font-bold text-on-surface-variant">Rotate Angle</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)}
                    className="px-3 py-1.5 bg-surface border border-outline-variant/60 rounded-xl text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw size={12} /> -90°
                  </button>
                  <button
                    onClick={() => setRotation((prev) => (prev + 90) % 360)}
                    className="px-3 py-1.5 bg-surface border border-outline-variant/60 rounded-xl text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw size={12} /> +90°
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Brightness */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                  <span>Brightness</span>
                  <span>{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-outline-variant/60 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                  <span>Contrast</span>
                  <span>{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-outline-variant/60 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                  <span>Saturation</span>
                  <span>{saturation}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-outline-variant/60 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>

              {/* Grayscale */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-on-surface-variant">
                  <span>Grayscale</span>
                  <span>{grayscale}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grayscale}
                  onChange={(e) => setGrayscale(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-outline-variant/60 rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/60 flex justify-between gap-3 select-none">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-outline-variant/60 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Reset
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-surface hover:bg-surface-container-low border border-outline-variant/60 text-on-surface-variant hover:text-on-surface text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={14} /> Apply Adjustments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
