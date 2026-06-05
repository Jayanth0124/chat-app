import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useChatStore } from '../store/useChatStore';
import { useFriendStore } from '../store/useFriendStore';
import { axiosInstance } from '../lib/axios';
import { Phone, PhoneOff, PhoneCall, Loader2, ArrowLeft, Inbox, Clock, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Calls() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setActiveCall } = useLayoutStore();
  const { socket } = useChatStore();
  const { friends, getFriends, isLoading: isFriendsLoading } = useFriendStore();

  const [callHistory, setCallHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // all, missed, friends

  useEffect(() => {
    fetchCallHistory();
    getFriends();
  }, []);

  const fetchCallHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axiosInstance.get('/calls');
      setCallHistory(res.data);
    } catch (e) {
      console.error('Error fetching call history:', e);
      toast.error('Failed to load call history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleStartCall = async (otherUser) => {
    if (!otherUser) return;
    toast(`Initiating voice call to ${otherUser.displayName}...`, { icon: '📞' });

    try {
      // Create call record in DB
      const res = await axiosInstance.post('/calls', {
        receiverId: otherUser._id,
        type: 'voice'
      });
      const callRecord = res.data;

      // Set active call in layout
      setActiveCall({
        callId: callRecord._id,
        name: otherUser.displayName,
        pic: otherUser.profilePic,
        type: 'voice',
        status: 'dialing',
        receiverId: otherUser._id,
        direction: 'outgoing'
      });

      // Emit socket offer to receiver
      if (socket) {
        socket.emit('call:offer', {
          to: otherUser._id,
          callData: {
            callId: callRecord._id,
            callerId: user._id,
            callerName: user.displayName,
            callerPic: user.profilePic,
            type: 'voice'
          }
        });
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast.error('Could not initiate call');
    }
  };

  const formatDuration = (s) => {
    if (!s) return '';
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  const filteredHistory = (callHistory || []).filter((call) => {
    if (activeTab === 'missed') {
      return call && call.status === 'missed' && call.caller?._id !== user?._id;
    }
    return true;
  });

  return (
    <div className="flex-1 h-full flex flex-col w-full bg-background overflow-hidden border-l border-outline-variant/60">
      {/* Header */}
      <div className="h-[60px] bg-surface flex items-center justify-between px-6 shrink-0 border-b border-outline-variant/60 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-1 text-on-surface-variant hover:text-on-surface transition-colors md:hidden flex items-center"
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-xl font-bold tracking-tight">Calls</h2>
        </div>
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-outline-variant/40 bg-surface shrink-0 px-6 py-2 gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-primary/10 text-primary'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          Recent Calls
        </button>
        <button
          onClick={() => setActiveTab('missed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'missed'
              ? 'bg-red-500/10 text-red-500'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          Missed
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'friends'
              ? 'bg-primary/10 text-primary'
              : 'text-on-surface-variant hover:bg-surface-container-low'
          }`}
        >
          Start New Call
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 bg-background">
        <div className="max-w-2xl mx-auto space-y-4">
          {activeTab === 'friends' ? (
            <div>
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 pl-1">Call a Friend</h3>
              {isFriendsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-primary w-6 h-6" />
                </div>
              ) : (friends || []).length === 0 ? (
                <div className="text-center py-12 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm">
                  <UserPlus className="mx-auto text-on-surface-variant/40 mb-3" size={32} />
                  <p className="text-sm font-bold">No friends available</p>
                  <p className="text-xs text-on-surface-variant/80 mt-1">Add friends first to start voice calling them!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {(friends || []).map((friend) => (
                    <div
                      key={friend._id}
                      className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={friend.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.displayName)}`}
                          alt={friend.displayName}
                          className="w-11 h-11 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-sm text-on-surface">{friend.displayName}</p>
                          <p className="text-xs text-on-surface-variant">@{friend.username}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartCall(friend)}
                        className="p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all cursor-pointer"
                        title="Start Voice Call"
                      >
                        <Phone size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
               <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-4 pl-1">
                {activeTab === 'missed' ? 'Missed Calls' : 'Recent Calls'}
              </h3>

              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-primary w-6 h-6" />
                </div>
              ) : (filteredHistory || []).length === 0 ? (
                <div className="text-center py-16 bg-surface rounded-2xl border border-outline-variant/60 shadow-sm">
                  <Clock className="mx-auto text-on-surface-variant/30 mb-3" size={36} />
                  <p className="text-sm font-bold">No call history</p>
                  <p className="text-xs text-on-surface-variant/80 mt-1">Calls you make or receive will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(filteredHistory || []).map((call) => {
                    const isOutgoing = call.caller?._id === user?._id;
                    const other = isOutgoing ? call.receiver : call.caller;
                    const label = call.status === 'missed' ? 'Missed' : isOutgoing ? 'Outgoing' : 'Incoming';
                    const isMissed = call.status === 'missed';
                    const callDate = new Date(call.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' });
                    const callTime = new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <div
                        key={call._id}
                        className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-outline-variant/60 hover:shadow transition-shadow shadow-sm"
                      >
                        <div className="flex items-center gap-3.5">
                          <img
                            src={other?.profilePic || `https://ui-avatars.com/api/?name=${encodeURIComponent(other?.displayName || '?')}`}
                            alt={other?.displayName}
                            className="w-11 h-11 rounded-full object-cover shadow-sm shrink-0"
                          />
                          <div>
                            <p className="font-bold text-sm text-on-surface">{other?.displayName || 'Unknown User'}</p>
                            <p className={`text-xs font-semibold flex items-center gap-1.5 mt-0.5 capitalize ${
                              isMissed ? 'text-red-500' : isOutgoing ? 'text-on-surface-variant' : 'text-green-600'
                            }`}>
                              {isMissed ? <PhoneOff size={11} /> : <PhoneCall size={11} />}
                              {label} • {callDate} at {callTime}
                              {call.duration > 0 && ` (${formatDuration(call.duration)})`}
                            </p>
                          </div>
                        </div>

                        {other && (
                          <button
                            onClick={() => handleStartCall(other)}
                            className="p-3 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-xl transition-all cursor-pointer"
                            title="Call Back"
                          >
                            <Phone size={16} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
