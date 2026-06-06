import { useEffect, useState } from 'react';
import { X, MessageSquare, UserPlus, UserCheck, Phone, Video, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';
import { useChatStore } from '../store/useChatStore';
import { useLayoutStore } from '../store/useLayoutStore';

const ICONS = {
  message: MessageSquare,
  friendRequest: UserPlus,
  friendAccepted: UserCheck,
  callIncoming: Phone,
  callVideo: Video,
  system: ShieldAlert,
};

const COLORS = {
  message: 'bg-primary',
  friendRequest: 'bg-violet-500',
  friendAccepted: 'bg-green-500',
  callIncoming: 'bg-emerald-500',
  callVideo: 'bg-blue-500',
  system: 'bg-red-500',
};

function ToastItem({ notif, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { chats, setSelectedChat, accessChat } = useChatStore();
  const { setManageFriendsOpen, setActiveAnnouncement } = useLayoutStore();
  const { removeNotification } = useNotificationStore();

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss after 4.5s
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(notif.id), 300);
    }, 4500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [notif.id, onDismiss]);

  const Icon = ICONS[notif.type] || MessageSquare;
  const iconBg = COLORS[notif.type] || 'bg-primary';

  const handleClick = () => {
    setVisible(false);
    setTimeout(() => onDismiss(notif.id), 300);

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

  return (
    <div
      onClick={handleClick}
      className={`flex items-start gap-3 w-[320px] bg-surface border border-outline-variant/60 rounded-2xl shadow-xl p-3.5 cursor-pointer hover:shadow-2xl transition-all duration-300 select-none ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
      }`}
    >
      {/* Avatar or Icon */}
      <div className="relative shrink-0">
        {notif.avatar ? (
          <img
            src={notif.avatar}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center text-white`}>
            <Icon size={18} />
          </div>
        )}
        <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${iconBg} rounded-full flex items-center justify-center`}>
          <Icon size={9} className="text-white" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-black text-on-surface truncate">{notif.title}</p>
        <p className="text-[11px] text-on-surface-variant/80 line-clamp-2 leading-relaxed mt-0.5">{notif.body}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
          setTimeout(() => onDismiss(notif.id), 300);
        }}
        className="p-1 rounded-full hover:bg-surface-container-high text-on-surface-variant/60 transition-colors shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function InAppNotification() {
  const { notifications } = useNotificationStore();
  const [shownIds, setShownIds] = useState([]);

  const handleDismiss = (id) => {
    setShownIds((prev) => [...prev, id]);
  };

  // Only show the most recent 4 notifications that have not been shown/dismissed as toasts and are NOT historical
  const visible = notifications.filter((notif) => !notif.isHistorical && !shownIds.includes(notif.id)).slice(0, 4);

  if (visible.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {visible.map((notif) => (
        <div key={notif.id} className="pointer-events-auto">
          <ToastItem notif={notif} onDismiss={handleDismiss} />
        </div>
      ))}
    </div>
  );
}
