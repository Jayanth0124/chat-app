import { useState, useEffect } from 'react';
import { axiosInstance } from '../../lib/axios';
import toast from 'react-hot-toast';
import { BellRing, Send, Loader2, Clock, Globe, ShieldAlert, Users, History } from 'lucide-react';

export default function NotificationCenter() {
  const [audience, setAudience] = useState('All Users');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await axiosInstance.get('/admin/notifications/broadcast');
      setHistory(res.data);
    } catch (error) {
      console.error("Failed to fetch broadcast history:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      return toast.error("Message content cannot be blank");
    }

    setIsSending(true);
    try {
      const res = await axiosInstance.post('/admin/notifications/broadcast', {
        audience,
        message: message.trim()
      });
      toast.success(res.data.message || "Broadcast announcement dispatched!");
      setMessage('');
      fetchHistory(); // Refresh history immediately
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to dispatch broadcast");
    } finally {
      setIsSending(false);
    }
  };

  const getAudienceColor = (aud) => {
    if (aud.includes('Moderators')) return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
    if (aud.includes('Active')) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-primary/10 text-primary border-primary/20';
  };

  const getAudienceIcon = (aud) => {
    if (aud.includes('Moderators')) return <ShieldAlert size={12} />;
    if (aud.includes('Active')) return <Clock size={12} />;
    return <Globe size={12} />;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto w-full font-sans text-on-surface grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Compose & Send Form */}
      <div className="lg:col-span-5 bg-surface p-6 rounded-2xl border border-outline-variant/60 shadow-sm h-fit">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <BellRing className="text-primary" /> Broadcast Center
        </h2>

        <form onSubmit={handleSendBroadcast} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Audience</label>
            <select 
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-on-surface text-sm cursor-pointer"
            >
              <option value="All Users">All Users</option>
              <option value="Active Users (Last 24h)">Active Users (Last 24h)</option>
              <option value="Moderators Only">Moderators Only</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Announcement Content</label>
            <textarea 
              rows="4" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your system-wide announcement here..." 
              className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/60 focus:ring-2 focus:ring-primary/15 focus:border-primary outline-none text-on-surface text-sm resize-none transition-all" 
              required
            />
          </div>

          <button 
            type="submit"
            disabled={isSending || !message.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending Announcement...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Broadcast
              </>
            )}
          </button>
        </form>
      </div>

      {/* History Log */}
      <div className="lg:col-span-7 bg-surface p-6 rounded-2xl border border-outline-variant/60 shadow-sm flex flex-col min-h-[400px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <History className="text-on-surface-variant" size={20} /> Announcement History
          </h2>
          <button 
            onClick={fetchHistory}
            className="px-3 py-1.5 text-xs bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/60 rounded-lg transition-colors font-semibold"
          >
            Refresh
          </button>
        </div>

        {isHistoryLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={28} />
          </div>
        ) : history.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-outline-variant/50 rounded-xl bg-surface-container-lowest">
            <Users size={36} className="text-on-surface-variant/40 mb-3" />
            <p className="text-sm font-semibold">No announcements sent yet</p>
            <p className="text-xs text-on-surface-variant/75 mt-1 max-w-xs">Announcements sent from this dashboard will appear here with active timestamps.</p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 max-h-[480px] overflow-y-auto pr-1">
            {history.map((item) => (
              <div 
                key={item._id} 
                className="p-4 rounded-xl border border-outline-variant/60 bg-surface-container-low hover:bg-surface-container-high transition-colors"
              >
                <div className="flex justify-between items-start gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getAudienceColor(item.audience)}`}>
                      {getAudienceIcon(item.audience)}
                      {item.audience}
                    </span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant/85 font-medium flex items-center gap-1 shrink-0">
                    <Clock size={11} />
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </div>
                
                <p className="text-sm text-on-surface leading-relaxed font-medium break-words">
                  {item.message}
                </p>

                <div className="mt-2.5 pt-2.5 border-t border-outline-variant/30 flex items-center justify-between text-[11px] text-on-surface-variant/80">
                  <span className="font-semibold">Sent by: {item.sender?.displayName || item.sender?.username || 'Admin'}</span>
                  <span>@{item.sender?.username}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
