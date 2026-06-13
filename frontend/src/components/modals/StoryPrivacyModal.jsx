import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Users, Globe, Check, Eye } from 'lucide-react';
import { useFriendStore } from '../../store/useFriendStore';

export default function StoryPrivacyModal({ onConfirm, onClose, isSending, initialPrivacy, initialAllowedUsers, initialShowBadge, isEditing }) {
  const { friends, getFriends } = useFriendStore();
  const [privacy, setPrivacy] = useState(initialPrivacy || 'everyone'); // 'everyone' | 'custom'
  const [showBadge, setShowBadge] = useState(initialShowBadge ?? true);
  const [selectedFriends, setSelectedFriends] = useState(initialAllowedUsers || []);

  useEffect(() => {
    if (friends.length === 0) {
      getFriends();
    }
  }, [friends.length, getFriends]);

  const toggleFriend = (id) => {
    setSelectedFriends((prev) => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm({
      privacy,
      allowedUsers: privacy === 'custom' ? selectedFriends : [],
      showBadge: privacy === 'custom' ? showBadge : true
    });
  };

  const modalContent = (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#1C1C1E] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="relative p-5 border-b border-white/10 flex items-center justify-center shrink-0">
          <button 
            onClick={onClose}
            className="absolute left-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition-colors"
          >
            <X size={18} />
          </button>
          <h2 className="text-lg font-bold text-white">Story Privacy</h2>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar flex flex-col gap-6">
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setPrivacy('everyone')}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                privacy === 'everyone' ? 'bg-[#0A84FF]/10 border-[#0A84FF] text-white' : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${privacy === 'everyone' ? 'bg-[#0A84FF]' : 'bg-white/10'}`}>
                <Globe size={20} className={privacy === 'everyone' ? 'text-white' : 'text-white/50'} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-[15px] mb-1 text-white">Everyone</h3>
                <p className="text-[13px] opacity-70">Share with all your friends and connections.</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${privacy === 'everyone' ? 'border-[#0A84FF] bg-[#0A84FF]' : 'border-white/20'}`}>
                {privacy === 'everyone' && <Check size={14} className="text-white" />}
              </div>
            </button>

            <button 
              onClick={() => setPrivacy('custom')}
              className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                privacy === 'custom' ? 'bg-green-500/10 border-green-500 text-white' : 'bg-white/5 border-transparent text-white/70 hover:bg-white/10'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${privacy === 'custom' ? 'bg-green-500' : 'bg-white/10'}`}>
                <Users size={20} className={privacy === 'custom' ? 'text-white' : 'text-white/50'} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-[15px] mb-1 text-white">Selected Friends</h3>
                <p className="text-[13px] opacity-70">Share only with specific people you choose.</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${privacy === 'custom' ? 'border-green-500 bg-green-500' : 'border-white/20'}`}>
                {privacy === 'custom' && <Check size={14} className="text-white" />}
              </div>
            </button>
          </div>

          {privacy === 'custom' && (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                    <Eye size={16} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-medium text-white">Show Badge</h4>
                    <p className="text-[12px] text-white/50">Let them know they are a selected friend</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={showBadge} 
                    onChange={(e) => setShowBadge(e.target.checked)} 
                  />
                  <div className="w-11 h-6 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <h4 className="text-[13px] font-semibold text-white/70 uppercase tracking-wider px-2">Select Friends</h4>
                {friends.length === 0 ? (
                  <p className="text-[14px] text-white/50 p-4 text-center bg-white/5 rounded-2xl">No friends found.</p>
                ) : (
                  <div className="flex flex-col gap-1 max-h-[250px] overflow-y-auto custom-scrollbar p-1">
                    {friends.map(friend => (
                      <button
                        key={friend._id}
                        onClick={() => toggleFriend(friend._id)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <img 
                            src={friend.profilePic || `https://ui-avatars.com/api/?name=${friend.displayName}&background=random`} 
                            alt={friend.displayName}
                            className="w-10 h-10 rounded-full object-cover bg-white/10"
                          />
                          <span className="text-[15px] font-medium text-white">{friend.displayName}</span>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${selectedFriends.includes(friend._id) ? 'bg-green-500 border-green-500' : 'border-white/20'}`}>
                          {selectedFriends.includes(friend._id) && <Check size={14} className="text-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 shrink-0">
          <button
            onClick={handleConfirm}
            disabled={isSending || (privacy === 'custom' && selectedFriends.length === 0)}
            className={`w-full py-3.5 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2 transition-all ${
              isSending || (privacy === 'custom' && selectedFriends.length === 0)
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-[#0A84FF] text-white hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#0A84FF]/20'
            }`}
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              isEditing ? 'Save Settings' : (privacy === 'custom' ? `Share with ${selectedFriends.length} Friends` : 'Post to Everyone')
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
