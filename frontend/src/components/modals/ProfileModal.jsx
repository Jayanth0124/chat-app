import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Link as LinkIcon } from 'lucide-react';

export default function ProfileModal({ isOpen, onClose, user }) {
  if (!user) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl relative"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full backdrop-blur-md transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
              
              <div className="px-6 pb-6 relative">
                <div className="flex justify-between items-end -mt-12 mb-4">
                  <img 
                    src={user.avatar || 'https://i.pravatar.cc/150'} 
                    alt="profile" 
                    className="w-24 h-24 rounded-2xl border-4 border-white dark:border-slate-900 object-cover shadow-lg"
                  />
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30">
                    Message
                  </button>
                </div>

                <div>
                  <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                    {user.displayName}
                    <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" title="Online"></div>
                  </h2>
                  <p className="text-slate-500 font-medium">@{user.username}</p>
                </div>

                <p className="mt-4 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {user.bio || "No bio yet."}
                </p>

                <div className="mt-6 flex flex-col gap-3 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-3">
                    <Calendar size={18} />
                    <span>Joined {user.joinedDate || 'September 2023'}</span>
                  </div>
                  {user.location && (
                    <div className="flex items-center gap-3">
                      <MapPin size={18} />
                      <span>{user.location}</span>
                    </div>
                  )}
                  {user.website && (
                    <div className="flex items-center gap-3 text-blue-500">
                      <LinkIcon size={18} />
                      <a href={user.website} target="_blank" rel="noreferrer" className="hover:underline">{user.website}</a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
