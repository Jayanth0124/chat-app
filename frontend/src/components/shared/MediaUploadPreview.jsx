import { X, Image as ImageIcon, Send, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MediaUploadPreview({ isOpen, onClose, imageSrc, onSend }) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed inset-0 z-50 bg-white dark:bg-slate-900 flex flex-col"
        >
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <X className="dark:text-white" />
            </button>
            <h2 className="font-semibold dark:text-white">Preview Media</h2>
            <div className="w-10"></div> {/* Spacer */}
          </div>

          {/* Preview Area */}
          <div className="flex-1 flex items-center justify-center bg-slate-100 dark:bg-black p-4 relative">
            {imageSrc ? (
              <img src={imageSrc} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
            ) : (
              <div className="text-slate-400 flex flex-col items-center gap-4">
                <ImageIcon size={64} />
                <p>No image selected</p>
              </div>
            )}
            
            {/* Snap Toggle (One-time view) */}
            <div className="absolute bottom-6 right-6">
              <button className="flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full hover:bg-black/70 transition-colors border border-white/10">
                <Zap size={16} className="text-yellow-400" />
                <span className="text-sm font-medium">Send as Snap</span>
              </button>
            </div>
          </div>

          {/* Caption & Send Area */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="max-w-3xl mx-auto flex gap-3">
              <input 
                type="text" 
                placeholder="Add a caption..." 
                className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
              />
              <button 
                onClick={onSend}
                className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white transition-colors shadow-lg shadow-blue-500/30"
              >
                <Send size={20} className="ml-1" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
