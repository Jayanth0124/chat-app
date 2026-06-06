import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, ShieldAlert, UserMinus, MessageSquare, Clock, Globe } from 'lucide-react';
import { useFriendStore } from '../../store/useFriendStore';
import toast from 'react-hot-toast';

export default function ProfileModal({ isOpen, onClose, user }) {
  const { removeFriend, blockUser } = useFriendStore();

  if (!user) return null;

  const handleUnfriend = async () => {
    if (window.confirm(`Are you sure you want to remove ${user.displayName} from your friends list?`)) {
      await removeFriend(user._id);
      toast.success(`${user.displayName} removed from friends`);
      onClose();
    }
  };

  const handleBlock = async () => {
    if (window.confirm(`Are you sure you want to block ${user.displayName}? You will no longer receive their messages.`)) {
      await blockUser(user._id);
      toast.success(`${user.displayName} blocked successfully`);
      onClose();
    }
  };

  const formattedJoinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : 'Recently';

  const formattedLastSeen = user.lastSeen
    ? new Date(user.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop overlay with blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[360px] bg-surface rounded-[2.5rem] overflow-hidden border border-outline-variant/50 shadow-2xl relative flex flex-col max-h-[90vh]"
          >
            {/* Top Close Button (Glassmorphic) */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white rounded-full transition-all z-20 cursor-pointer backdrop-blur-md active:scale-90"
            >
              <X size={15} />
            </button>

            {/* Premium Gradient Banner Cover */}
            <div className="h-28 bg-gradient-to-tr from-primary to-primary-variant relative shrink-0">
              <div className="absolute inset-0 bg-black/5" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent" />
            </div>
            
            {/* Content Area */}
            <div className="px-6 pb-6 relative flex flex-col items-center -mt-10 overflow-y-auto">
              
              {/* Profile Avatar Container with Double Glow Ring */}
              <div className="relative mb-3.5 shrink-0 group">
                <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary to-primary-variant rounded-full blur opacity-30 group-hover:opacity-50 transition duration-300" />
                <div className="relative p-1 bg-surface rounded-full shadow-md border border-outline-variant/25">
                  <img 
                    src={user.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=random`} 
                    alt={user.displayName} 
                    className="w-20 h-20 rounded-full object-cover bg-surface-container-high"
                  />
                </div>
                
                {/* Active Indicator Badge */}
                <div 
                  className={`absolute bottom-1 right-1 w-4.5 h-4.5 rounded-full border-2 border-surface flex items-center justify-center shadow-md ${
                    user.isOnline ? 'bg-green-500' : 'bg-neutral-500'
                  }`}
                  title={user.isOnline ? 'Online' : 'Offline'}
                >
                  {user.isOnline && <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
                </div>
              </div>

              {/* Name Details */}
              <div className="text-center w-full font-sans">
                <h2 className="text-lg font-black text-on-surface tracking-tight leading-snug">
                  {user.displayName}
                </h2>
                <p className="text-[12px] text-on-surface-variant/80 font-bold tracking-wide">@{user.username}</p>
                
                {/* Online/Offline Last Seen Status */}
                <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs">
                  {user.isOnline ? (
                    <span className="text-green-600 dark:text-green-400 font-bold bg-green-500/10 px-3 py-0.5 rounded-full border border-green-500/10">
                      Online Now
                    </span>
                  ) : (
                    <span 
                      style={{ 
                        backgroundColor: 'color-mix(in srgb, var(--outline-variant) 15%, transparent)',
                        borderColor: 'color-mix(in srgb, var(--outline-variant) 10%, transparent)'
                      }}
                      className="text-on-surface-variant/70 font-semibold px-3 py-0.5 rounded-full border flex items-center gap-1"
                    >
                      <Clock size={11} className="text-primary" />
                      {formattedLastSeen ? `Active at ${formattedLastSeen}` : 'Offline'}
                    </span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <hr className="w-full border-t border-outline-variant/30 my-4" />

              {/* Bio Section */}
              <div 
                style={{ 
                  backgroundColor: 'color-mix(in srgb, var(--surface-container-low) 40%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--outline-variant) 20%, transparent)'
                }}
                className="w-full text-left rounded-2xl p-4 border"
              >
                <span className="text-[9px] font-bold text-on-surface-variant/75 uppercase tracking-wider block mb-1">About</span>
                <p className="text-xs text-on-surface-variant/90 leading-relaxed font-medium">
                  {user.bio || "No status or bio available yet."}
                </p>
              </div>

              {/* Metadata Details */}
              <div className="w-full mt-4 flex flex-col gap-2.5 text-xs text-on-surface-variant/80 pl-1 font-semibold">
                <div className="flex items-center gap-3">
                  <Calendar size={13.5} className="text-primary" />
                  <span>Joined {formattedJoinDate}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe size={13.5} className="text-primary" />
                  <span>Role: {user.role === 'admin' ? 'Admin' : 'Orbit Member'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full grid grid-cols-2 gap-2 mt-6">
                <button
                  onClick={handleUnfriend}
                  className="py-2.5 px-3 rounded-xl border border-outline-variant hover:bg-red-500/5 hover:border-red-500/15 text-red-500 hover:text-red-600 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <UserMinus size={13} />
                  Remove
                </button>
                <button
                  onClick={handleBlock}
                  className="py-2.5 px-3 rounded-xl bg-surface-container-low border border-outline-variant hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 hover:border-red-500/20 transition-all text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                >
                  <ShieldAlert size={13} />
                  Block
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full mt-2.5 py-2.5 bg-primary text-white font-bold rounded-xl text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5 shadow-md shadow-black/10 cursor-pointer active:scale-98"
              >
                <MessageSquare size={13} />
                Message
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
