import { useState } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';

export default function UsernameRequestModal({ isOpen, onClose }) {
  const [requestedUsername, setRequestedUsername] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

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
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container border border-outline-variant/30 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/20 bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <AlertCircle size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-on-surface">Request Username Change</h2>
              <p className="text-sm font-medium text-on-surface-variant">Submit an appeal to administrators</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 ml-1">Desired Username</label>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-primary font-black text-lg">@</span>
                <input
                  type="text"
                  value={requestedUsername}
                  onChange={(e) => setRequestedUsername(e.target.value)}
                  placeholder="new_username"
                  className="w-full pl-10 pr-4 py-3.5 bg-surface-container-lowest border-2 border-outline-variant/30 rounded-2xl text-on-surface focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-on-surface mb-2 ml-1">Reason for Request</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you need an additional username change (min 10 characters)..."
                rows={4}
                className="w-full p-4 bg-surface-container-lowest border-2 border-outline-variant/30 rounded-2xl text-on-surface focus:border-primary focus:outline-none transition-colors resize-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-full text-sm font-bold text-on-surface bg-surface-container-high hover:bg-surface-container-highest transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-full text-sm font-bold text-surface bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Request'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
