import { useEffect, useState, useRef } from 'react';
import { X, MessageSquare, UserPlus, UserCheck, Phone, Video, ShieldAlert, Clock, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';
import { useChatStore } from '../store/useChatStore';
import { useLayoutStore } from '../store/useLayoutStore';

const CATEGORY_CONFIG = {
  message: {
    icon: MessageSquare,
    color: 'text-[#0A84FF]',
    bg: 'bg-[#0A84FF]/10',
    border: 'border-[#0A84FF]/20',
    label: 'COMMUNICATION'
  },
  friendRequest: {
    icon: UserPlus,
    color: 'text-[#BF5AF2]',
    bg: 'bg-[#BF5AF2]/10',
    border: 'border-[#BF5AF2]/20',
    label: 'NETWORK'
  },
  friendAccepted: {
    icon: UserCheck,
    color: 'text-[#32D74B]',
    bg: 'bg-[#32D74B]/10',
    border: 'border-[#32D74B]/20',
    label: 'NETWORK'
  },
  callIncoming: {
    icon: Phone,
    color: 'text-[#32D74B]',
    bg: 'bg-[#32D74B]/10',
    border: 'border-[#32D74B]/20',
    label: 'VOICE LINK'
  },
  callVideo: {
    icon: Video,
    color: 'text-[#0A84FF]',
    bg: 'bg-[#0A84FF]/10',
    border: 'border-[#0A84FF]/20',
    label: 'VIDEO LINK'
  },
  system: {
    icon: ShieldAlert,
    color: 'text-[#FF453A]',
    bg: 'bg-[#FF453A]/10',
    border: 'border-[#FF453A]/20',
    label: 'SYSTEM ALERT'
  },
};

function ToastItem({ notif, onDismiss }) {
  const [isClosing, setIsClosing] = useState(false);
  const [progress, setProgress] = useState(100);
  const navigate = useNavigate();
  const { chats, setSelectedChat, accessChat } = useChatStore();
  const { setManageFriendsOpen, setActiveAnnouncement } = useLayoutStore();
  const duration = 5000;
  
  const touchStartX = useRef(0);
  const isActionTriggered = useRef(false);

  useEffect(() => {
    let start = Date.now();
    let rAF;

    const tick = () => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (elapsed < duration) {
        rAF = requestAnimationFrame(tick);
      } else {
        closeToast();
      }
    };
    
    rAF = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rAF);
  }, []);

  const closeToast = () => {
    if (isClosing) return;
    setIsClosing(true);
    setTimeout(onDismiss, 300);
  };

  const handleClick = (e) => {
    if (isActionTriggered.current) return;
    isActionTriggered.current = true;
    
    closeToast();

    // Trigger action
    if (notif.type === 'message' && notif.chatId) {
      const chat = chats.find((c) => c._id === notif.chatId);
      if (chat) {
        setSelectedChat(chat);
      } else if (notif.from) {
        accessChat(notif.from);
      }
      navigate('/');
    } else if (notif.type === 'friendRequest' || notif.type === 'friendAccepted') {
      setManageFriendsOpen(true);
    } else if (notif.type === 'system') {
      setActiveAnnouncement({
        title: notif.title,
        body: notif.body,
        createdAt: notif.createdAt || new Date().toISOString()
      });
    }
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const distance = touchEndX - touchStartX.current;
    if (distance > 50) {
      closeToast();
    }
  };

  const config = CATEGORY_CONFIG[notif.type] || CATEGORY_CONFIG.message;
  const Icon = config.icon;
  const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`relative overflow-hidden flex flex-col w-[340px] max-w-[calc(100vw-32px)] bg-[#111111]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] cursor-pointer transition-all duration-300 transform select-none ${
        isClosing 
          ? 'opacity-0 translate-x-12 scale-95 pointer-events-none' 
          : 'opacity-100 translate-x-0 scale-100 animate-in slide-in-from-right-8 fade-in zoom-in-95'
      }`}
    >
      {/* Glow Effect behind content */}
      <div className={`absolute top-0 left-0 w-32 h-32 rounded-full blur-[50px] opacity-20 pointer-events-none ${config.bg.replace('/10', '')}`} />

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/5 relative z-10">
        <div className="flex items-center gap-2">
          <div className={`w-5 h-5 rounded-md flex items-center justify-center border ${config.bg} ${config.border} ${config.color}`}>
            <Icon size={11} strokeWidth={2.5} />
          </div>
          <span className="text-[9px] font-bold tracking-widest text-white/50 uppercase">{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-white/30 tracking-wider flex items-center gap-1">
            <Clock size={10} /> {timeString}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); closeToast(); }}
            className="w-5 h-5 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex items-start gap-3 relative z-10">
        {/* Large Premium Avatar */}
        <div className="relative shrink-0">
          {notif.avatar ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/50">
              <img src={notif.avatar} alt="Sender" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${config.bg} ${config.border} ${config.color} shadow-lg`}>
              <Icon size={20} strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[48px]">
          <h4 className="text-[14px] font-semibold text-white/90 truncate pr-2">{notif.title}</h4>
          <p className="text-[12px] text-white/60 line-clamp-2 leading-relaxed mt-0.5 pr-2">{notif.body}</p>
        </div>

        <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight size={16} className="text-white/20" />
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full h-[3px] bg-white/5 relative z-10">
        <div 
          className={`h-full transition-all duration-[100ms] ease-linear ${config.bg.replace('/10', '')} opacity-80`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function InAppNotification() {
  const { notifications } = useNotificationStore();
  const [activeToasts, setActiveToasts] = useState([]);
  const seenIds = useRef(new Set());

  useEffect(() => {
    // Find new notifications that are not historical and haven't been queued yet
    const newNotifs = notifications.filter(n => !n.isHistorical && !seenIds.current.has(n.id));
    
    if (newNotifs.length > 0) {
      newNotifs.forEach(n => seenIds.current.add(n.id));
      setActiveToasts(prev => {
        // Prepend new notifications and limit to 3 visible at a time
        const next = [...newNotifs, ...prev];
        return next.slice(0, 3);
      });
    }
  }, [notifications]);

  const handleDismiss = (id) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed top-4 md:top-6 right-4 md:right-6 z-[9999] flex flex-col gap-3 pointer-events-none items-end">
      {activeToasts.map((notif) => (
        <div key={notif.id} className="pointer-events-auto group">
          <ToastItem notif={notif} onDismiss={() => handleDismiss(notif.id)} />
        </div>
      ))}
    </div>
  );
}
