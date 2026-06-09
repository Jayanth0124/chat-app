import { useState, useEffect } from 'react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  ShieldBan, 
  Trash2, 
  Loader2, 
  Users,
  Search,
  MessageSquare,
  ArrowLeft,
  Calendar,
  MoreVertical,
  CheckSquare,
  Check
} from 'lucide-react';
import { useConfirmStore } from '../../store/useConfirmStore';

export default function ChatModeration() {
  const [step, setStep] = useState('search'); // 'search' | 'profile' | 'conversations' | 'messages'
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Selected state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userConversations, setUserConversations] = useState([]);
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await axiosInstance.get('/admin/users');
      setUsers(res.data);
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setStep('profile');
  };

  const handleViewConversations = async () => {
    setIsLoading(true);
    setStep('conversations');
    try {
      const res = await axiosInstance.get(`/admin/users/${selectedUser._id}/conversations`);
      setUserConversations(res.data);
    } catch (error) {
      toast.error('Failed to fetch conversations');
      setStep('profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenConversation = async (chat) => {
    setSelectedChat(chat);
    setIsLoading(true);
    setStep('messages');
    setSelectedMessageIds(new Set()); // Reset selection
    try {
      const res = await axiosInstance.get(`/admin/conversations/${chat._id}/messages`);
      setChatMessages(res.data);
    } catch (error) {
      toast.error('Failed to fetch messages');
      setStep('conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMessageSelection = (msgId) => {
    const newSelection = new Set(selectedMessageIds);
    if (newSelection.has(msgId)) {
      newSelection.delete(msgId);
    } else {
      newSelection.add(msgId);
    }
    setSelectedMessageIds(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedMessageIds.size === chatMessages.length) {
      setSelectedMessageIds(new Set());
    } else {
      setSelectedMessageIds(new Set(chatMessages.map(m => m._id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMessageIds.size === 0) return;

    const confirmed = await useConfirmStore.getState().confirm({
      title: "Delete Messages",
      message: `Are you sure you want to delete ${selectedMessageIds.size} message(s)? This action cannot be undone.`,
      confirmText: "Delete",
      danger: true
    });
    
    if (!confirmed) return;

    setIsLoading(true);
    try {
      await axiosInstance.post('/admin/messages/bulk-delete', {
        messageIds: Array.from(selectedMessageIds)
      });
      toast.success(`Successfully deleted ${selectedMessageIds.size} messages`);
      
      // Refresh messages
      setSelectedMessageIds(new Set());
      const res = await axiosInstance.get(`/admin/conversations/${selectedChat._id}/messages`);
      setChatMessages(res.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete messages');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = searchQuery.trim().length === 0 ? [] : users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full font-sans text-on-surface h-[calc(100vh-64px)] flex flex-col">
      {/* Header */}
      <div className="mb-6 shrink-0">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-on-surface flex items-center gap-2">
          <ShieldBan className="text-primary" /> Content Moderation
        </h1>
        <p className="text-on-surface-variant text-[13px] sm:text-[15px] mt-1">Drill down into user accounts to inspect and manage communications.</p>
      </div>

      <div className="bg-surface border border-outline-variant/60 rounded-2xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden relative">
        
        {/* Navigation Bar */}
        {step !== 'search' && (
          <div className="px-5 py-3 border-b border-outline-variant/40 bg-surface-container-lowest flex items-center gap-4 shrink-0">
            <button 
              onClick={() => {
                if (step === 'messages') setStep('conversations');
                else if (step === 'conversations') setStep('profile');
                else if (step === 'profile') setStep('search');
              }}
              className="p-1.5 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors cursor-pointer"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-2 text-sm font-semibold text-on-surface">
              <span className={step === 'profile' ? 'text-primary' : 'text-on-surface-variant'}>Profile</span>
              <span className="text-outline-variant">/</span>
              <span className={step === 'conversations' ? 'text-primary' : 'text-on-surface-variant'}>Conversations</span>
              <span className="text-outline-variant">/</span>
              <span className={step === 'messages' ? 'text-primary' : 'text-on-surface-variant'}>Messages</span>
            </div>
          </div>
        )}

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto relative p-5">
          {isLoading && step !== 'messages' ? (
            <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={36} />
            </div>
          ) : null}

          {/* STEP 1: SEARCH */}
          {step === 'search' && (
            <div className="space-y-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" size={16} />
                <input 
                  type="text" 
                  placeholder="Search users by name, handle, or email..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2.5 w-full rounded-xl bg-surface-container-low border border-outline-variant/60 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm shadow-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {searchQuery.trim().length === 0 ? (
                  <div className="col-span-full py-20 text-center text-on-surface-variant flex flex-col items-center gap-3">
                    <Search size={32} className="text-outline-variant/50" />
                    <p className="text-sm font-semibold">Search for a user to begin</p>
                    <p className="text-xs text-on-surface-variant/70">Enter a name, handle, or email address</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-on-surface-variant text-sm">
                    No users found matching "{searchQuery}"
                  </div>
                ) : (
                  filteredUsers.map(user => (
                  <button 
                    key={user._id}
                    onClick={() => handleSelectUser(user)}
                    className="p-4 rounded-xl border border-outline-variant/40 hover:border-primary/40 bg-surface-container-lowest hover:bg-surface-container-low transition-all text-left flex items-start gap-3 group cursor-pointer"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase shrink-0">
                      {(user.displayName || user.username)[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-on-surface text-sm truncate">{user.displayName || user.username}</div>
                      <div className="text-on-surface-variant text-xs truncate">@{user.username}</div>
                      <div className="text-on-surface-variant/70 text-[10px] truncate mt-0.5">{user.email}</div>
                    </div>
                  </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PROFILE */}
          {step === 'profile' && selectedUser && (
            <div className="max-w-2xl mx-auto py-8">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-3xl uppercase mb-4 shadow-sm border border-primary/20">
                  <img src={selectedUser.profilePic || '/logo.png'} alt="Profile" className="w-full h-full rounded-full object-cover" />
                </div>
                <h2 className="text-2xl font-bold text-on-surface">{selectedUser.displayName || selectedUser.username}</h2>
                <p className="text-on-surface-variant text-sm mt-1">@{selectedUser.username} • {selectedUser.email}</p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container border border-outline-variant/40 rounded-full text-xs font-semibold">
                  <Calendar size={12} className="text-on-surface-variant" /> Joined {new Date(selectedUser.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={handleViewConversations}
                  className="p-5 rounded-2xl bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary transition-colors flex flex-col items-center justify-center gap-2 group cursor-pointer"
                >
                  <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-sm">Inspect Conversations</span>
                </button>

                <div className="p-5 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col items-center justify-center gap-2 opacity-50 cursor-not-allowed">
                  <ShieldBan size={24} className="text-on-surface-variant" />
                  <span className="font-bold text-sm text-on-surface-variant">Account Actions</span>
                  <span className="text-[10px] text-on-surface-variant/70 text-center px-2">Manage from User Management</span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: CONVERSATIONS */}
          {step === 'conversations' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-wider mb-4 px-1">
                Active Chats for @{selectedUser.username}
              </h3>
              
              {userConversations.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant text-sm bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/50">
                  This user has no active conversations.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userConversations.map(chat => {
                    const otherParticipants = chat.participants.filter(p => p._id !== selectedUser._id);
                    const isGroup = chat.isGroupChat;
                    const title = isGroup 
                      ? chat.groupName 
                      : otherParticipants.map(p => p.displayName || p.username).join(', ');

                    return (
                      <button 
                        key={chat._id}
                        onClick={() => handleOpenConversation(chat)}
                        className="p-4 rounded-xl border border-outline-variant/40 hover:border-primary/40 bg-surface-container-lowest hover:bg-surface-container-low transition-all text-left flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant/30">
                            <Users size={18} className="text-on-surface-variant" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-on-surface text-sm truncate">{title || 'Unknown'}</div>
                            <div className="text-on-surface-variant text-xs truncate">
                              {isGroup ? 'Group Chat' : 'Direct Message'}
                            </div>
                          </div>
                        </div>
                        <MoreVertical size={16} className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: MESSAGES */}
          {step === 'messages' && (
            <div className="flex flex-col h-full relative">
              {isLoading && (
                <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                  <Loader2 className="animate-spin text-primary" size={36} />
                </div>
              )}
              
              <div className="flex justify-between items-center mb-4 shrink-0">
                <button 
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckSquare size={14} /> 
                  {selectedMessageIds.size === chatMessages.length && chatMessages.length > 0 ? 'Deselect All' : 'Select All'}
                </button>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-on-surface-variant font-bold">{chatMessages.length} Messages</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 pb-20">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-12 text-on-surface-variant text-sm bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/50">
                    No messages found in this conversation.
                  </div>
                ) : (
                  chatMessages.map(msg => {
                    const isSelected = selectedMessageIds.has(msg._id);
                    return (
                      <div 
                        key={msg._id} 
                        onClick={() => handleToggleMessageSelection(msg._id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex gap-3 ${
                          isSelected 
                            ? 'bg-red-500/10 border-red-500/30 ring-1 ring-red-500/20' 
                            : 'bg-surface-container-lowest border-outline-variant/30 hover:bg-surface-container-low'
                        }`}
                      >
                        <div className="shrink-0 mt-0.5">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-outline-variant/50 bg-surface'
                          }`}>
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-on-surface">
                              {msg.sender?.displayName || msg.sender?.username || 'Unknown User'}
                            </span>
                            <span className="text-[10px] text-on-surface-variant/70">
                              {new Date(msg.createdAt).toLocaleString()}
                            </span>
                          </div>
                          
                          {msg.content && (
                            <p className="text-sm text-on-surface leading-snug break-words">
                              {msg.content}
                            </p>
                          )}
                          
                          {msg.mediaUrl && (
                            <div className="mt-2 text-xs text-blue-400 font-semibold flex items-center gap-1">
                              [Media Attachment] 
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Action Bar */}
              <div className={`absolute bottom-4 left-4 right-4 bg-surface border border-outline-variant shadow-xl rounded-2xl p-4 flex justify-between items-center transition-transform duration-300 ${
                selectedMessageIds.size > 0 ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'
              }`}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
                    <Trash2 size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-on-surface">{selectedMessageIds.size} Selected</div>
                    <div className="text-xs text-on-surface-variant">Ready for administrative deletion</div>
                  </div>
                </div>
                <button 
                  onClick={handleDeleteSelected}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Delete Selected
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
