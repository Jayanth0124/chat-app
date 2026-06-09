import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Check, Users } from 'lucide-react';
import { useFriendStore } from '../../store/useFriendStore';
import { useAuthStore } from '../../store/useAuthStore';
import Avatar from '../ui/Avatar';

export default function SpecificFriendsModal({ isOpen, onClose }) {
  const { friends, getFriends } = useFriendStore();
  const { user, updatePrivacySettings } = useAuthStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFriends, setSelectedFriends] = useState(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getFriends();
      // Initialize selected friends from user's privacy settings
      const allowed = user?.privacySettings?.onlineStatusAllowed || [];
      setSelectedFriends(new Set(allowed.map(id => id.toString())));
    }
  }, [isOpen, getFriends, user]);

  const filteredFriends = friends.filter(f => 
    f.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFriend = (id) => {
    const newSet = new Set(selectedFriends);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedFriends(newSet);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePrivacySettings({
        onlineStatus: 'specific_friends',
        onlineStatusAllowed: Array.from(selectedFriends)
      });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-[#0A0A0E]/80 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-[#12121A] border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-white/5 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-xl font-bold text-white/90">Specific Friends</h2>
              <p className="text-xs text-white/50 mt-1">Select who can see your online status</p>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="px-8 py-4 shrink-0 border-b border-white/5 bg-[#0A0A0E]/30">
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#12121A] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-white focus:border-[#8C6DF0] focus:ring-1 focus:ring-[#8C6DF0] outline-none transition-all placeholder:text-white/30"
              />
            </div>
          </div>

          {/* Friends List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => {
                const isSelected = selectedFriends.has(friend._id.toString());
                return (
                  <button
                    key={friend._id}
                    onClick={() => toggleFriend(friend._id.toString())}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                      isSelected 
                        ? 'bg-[#8C6DF0]/10 border-[#8C6DF0]/30' 
                        : 'bg-transparent border-transparent hover:bg-white/5'
                    }`}
                  >
                    <Avatar
                      src={friend.profilePic}
                      name={friend.displayName || friend.username}
                      sizeClass="w-12 h-12"
                    />
                    <div className="flex-1 text-left">
                      <h4 className="text-sm font-bold text-white/90">{friend.displayName}</h4>
                      <p className="text-xs font-mono text-white/50">@{friend.username}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-[#8C6DF0] border-[#8C6DF0]' : 'border-white/20'
                    }`}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
                <Users size={48} className="mb-4 text-white/30" />
                <p className="text-sm font-medium text-white/80">No friends found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-[#0A0A0E]/30 shrink-0">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-4 bg-white text-black hover:bg-white/90 disabled:opacity-50 text-sm font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center"
            >
              {isSaving ? 'Saving...' : `Save ${selectedFriends.size} Selected`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
