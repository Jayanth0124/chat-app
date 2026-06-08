import { useState } from 'react';
import { X, Loader2, KeyRound } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function UsernameRequestModal({ isOpen, onClose, onSuccess }) {
  const [requestedUsername, setRequestedUsername] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestedUsername || !reason) {
      toast.error("All fields are required");
      return;
    }

    if (reason.length < 10) {
      toast.error("Reason must be at least 10 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosInstance.post('/users/username-request', {
        requestedUsername,
        reason
      });
      toast.success("Request submitted successfully!");
      setRequestedUsername('');
      setReason('');
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#050505]/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-lg bg-[#0A0A0E] border border-white/10 rounded-[24px] shadow-[0_0_80px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-8 pb-6 border-b border-white/5">
              <div className="flex flex-col gap-2">
                <div className="w-12 h-12 rounded-[14px] bg-[#8C6DF0]/10 flex items-center justify-center text-[#8C6DF0] mb-2 border border-[#8C6DF0]/20 shadow-inner">
                  <KeyRound size={24} />
                </div>
                <h2 className="text-2xl font-semibold text-white/95 tracking-tight">Request Username Appeal</h2>
                <p className="text-sm text-white/50 leading-relaxed max-w-[90%]">
                  You have exhausted your username changes. Submit an appeal to the administrators to unlock a new change.
                </p>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors cursor-pointer border border-white/5 mt-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-6">
              
              {/* Desired Username Field */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest pl-1">
                  Desired Username
                </label>
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-medium group-focus-within:text-[#8C6DF0] transition-colors">@</span>
                  <input
                    type="text"
                    value={requestedUsername}
                    onChange={(e) => setRequestedUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="new_username"
                    className="w-full pl-10 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:border-[#8C6DF0] focus:ring-1 focus:ring-[#8C6DF0] outline-none transition-all text-base font-mono"
                  />
                </div>
              </div>

              {/* Reason Field */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest pl-1">
                  Reason for Appeal
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain why you need to change your username again..."
                  rows={4}
                  className="w-full p-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/20 focus:border-[#8C6DF0] focus:ring-1 focus:ring-[#8C6DF0] outline-none transition-all text-base resize-none"
                />
                <div className="flex justify-end">
                  <span className={`text-xs ${reason.length < 10 && reason.length > 0 ? 'text-[#FF3B30]' : 'text-white/30'}`}>
                    {reason.length < 10 ? 'Minimum 10 characters required' : 'Length is sufficient'}
                  </span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/5 mt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-full text-sm font-medium text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || requestedUsername.length < 4 || reason.length < 10}
                  className="px-8 py-3 rounded-full text-sm font-semibold text-black bg-white hover:bg-white/90 disabled:bg-white/20 disabled:text-white/40 transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Appeal'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
