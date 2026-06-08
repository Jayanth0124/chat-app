import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  Inbox, CheckCircle2, Trash2, X, Bell, ShieldAlert, 
  UserPlus, UserCheck, MessageSquare, Bug, HelpCircle, 
  Search, Check, ChevronRight, CornerDownRight, Clock, Activity as ActivityIcon, CheckSquare
} from 'lucide-react';
import { useNotificationStore } from '../store/useNotificationStore';
import { useFriendStore } from '../store/useFriendStore';
import { useChatStore } from '../store/useChatStore';
import { useLayoutStore } from '../store/useLayoutStore';

export default function Activity() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllRead, clearAll, removeNotification } = useNotificationStore();
  const { acceptRequest, rejectRequest } = useFriendStore();
  const { chats, setSelectedChat, accessChat } = useChatStore();
  const { setActiveAnnouncement } = useLayoutStore();
  
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotif, setSelectedNotif] = useState(null);

  const filters = [
    { id: 'All', label: 'All Activity', icon: Inbox },
    { id: 'Messages', label: 'Messages', icon: MessageSquare },
    { id: 'Friends', label: 'Friends', icon: UserPlus },
    { id: 'Support', label: 'Support', icon: HelpCircle },
    { id: 'System', label: 'System', icon: ShieldAlert },
  ];

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) && !n.body.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (activeFilter === 'All') return true;
      if (activeFilter === 'Messages') return n.type === 'message';
      if (activeFilter === 'Friends') return n.type === 'friendRequest' || n.type === 'friendAccepted';
      if (activeFilter === 'Support') return n.type === 'bug_update' || n.type === 'support_reply';
      if (activeFilter === 'System') return ['system', 'admin', 'adminNotification', 'broadcastNotification'].includes(n.type);
      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  const handleOpenDetail = (notif) => {
    if (!notif.isRead) markAsRead(notif._id || notif.id);
    setSelectedNotif(notif);
  };

  const handleActionClick = async (notif) => {
    if (notif.type === 'message') {
      if (notif.chatId) {
        const chat = chats.find((c) => c._id === notif.chatId);
        if (chat) setSelectedChat(chat);
      } else if (notif.from) {
        accessChat(notif.from);
      }
      navigate('/');
    } else if (notif.type === 'bug_update' || notif.type === 'support_reply') {
      navigate('/settings');
    } else if (notif.type === 'friendRequest' || notif.type === 'friendAccepted') {
      navigate('/friends');
    } else if (['system', 'admin', 'adminNotification', 'broadcastNotification'].includes(notif.type)) {
      setActiveAnnouncement({
        title: notif.title,
        body: notif.body,
        createdAt: notif.createdAt || new Date().toISOString()
      });
    }
  };

  const getNotifStyles = (type) => {
    let Icon = Bell;
    let iconColor = 'text-primary';
    let iconBg = 'bg-primary/10';
    let gradient = 'from-primary/20 to-primary/5';
    let category = 'General';
    let source = 'System';
    
    if (['system', 'admin', 'adminNotification'].includes(type)) { Icon = ShieldAlert; iconColor = 'text-red-500'; iconBg = 'bg-red-500/10'; gradient = 'from-red-500/20 to-red-500/5'; category = 'Announcement'; source = 'Admin'; }
    if (type === 'friendRequest') { Icon = UserPlus; iconColor = 'text-violet-500'; iconBg = 'bg-violet-500/10'; gradient = 'from-violet-500/20 to-violet-500/5'; category = 'Request'; source = 'Network'; }
    if (type === 'friendAccepted') { Icon = UserCheck; iconColor = 'text-green-500'; iconBg = 'bg-green-500/10'; gradient = 'from-green-500/20 to-green-500/5'; category = 'Connection'; source = 'Network'; }
    if (type === 'message') { Icon = MessageSquare; iconColor = 'text-blue-500'; iconBg = 'bg-blue-500/10'; gradient = 'from-blue-500/20 to-blue-500/5'; category = 'Direct Message'; source = 'Chat'; }
    if (type === 'bug_update') { Icon = Bug; iconColor = 'text-amber-500'; iconBg = 'bg-amber-500/10'; gradient = 'from-amber-500/20 to-amber-500/5'; category = 'Issue Update'; source = 'Support'; }
    if (type === 'support_reply') { Icon = HelpCircle; iconColor = 'text-cyan-500'; iconBg = 'bg-cyan-500/10'; gradient = 'from-cyan-500/20 to-cyan-500/5'; category = 'Ticket Reply'; source = 'Support'; }

    return { Icon, iconColor, iconBg, gradient, category, source };
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  // Renders a single notification card
  const NotificationCard = ({ notif, mode }) => {
    const isUnread = !notif.isRead;
    const isSelected = selectedNotif && (selectedNotif._id || selectedNotif.id) === (notif._id || notif.id);
    const { Icon, iconColor, iconBg, category, source } = getNotifStyles(notif.type);

    const isBento = mode === 'bento';
    const isHybrid = mode === 'hybrid';
    
    // Mobile Touch / Swipe State
    const [showMobileActions, setShowMobileActions] = useState(false);
    const controls = useAnimation();
    const timerRef = useRef(null);

    const handleTouchStart = () => {
      timerRef.current = setTimeout(() => {
        setShowMobileActions(true);
        if ('vibrate' in navigator) navigator.vibrate(50);
      }, 500); // 500ms long press
    };

    const handleTouchEnd = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };

    const handleDragEnd = (e, info) => {
      if (info.offset.x < -40) {
        setShowMobileActions(true);
      } else if (info.offset.x > 40) {
        setShowMobileActions(false);
      }
    };
    
    return (
      <motion.div 
        layoutId={`notif-${notif._id || notif.id}`}
        variants={itemVariants}
        initial="hidden" animate="show" exit="exit" layout
        className="relative rounded-3xl overflow-hidden bg-surface-container-highest"
      >
        {/* Hidden Background Actions revealed on drag */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end px-4 gap-2 w-full z-0 bg-red-500/10">
          {isUnread && (
            <button onClick={(e) => { e.stopPropagation(); markAsRead(notif._id || notif.id); setShowMobileActions(false); }} className="p-3 rounded-xl bg-surface-container-high hover:bg-primary/20 text-on-surface-variant hover:text-primary transition-colors shadow-sm" title="Mark as read">
              <Check size={18} strokeWidth={2.5} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); removeNotification(notif._id || notif.id); if (selectedNotif && (selectedNotif._id || selectedNotif.id) === (notif._id || notif.id)) setSelectedNotif(null); }} className="p-3 rounded-xl bg-surface-container-high hover:bg-red-500/20 text-on-surface-variant hover:text-red-500 transition-colors shadow-sm" title="Remove">
            <Trash2 size={18} strokeWidth={2.5} />
          </button>
        </div>

        <motion.div 
          drag="x"
          dragConstraints={{ left: -100, right: 0 }}
          dragElastic={0.1}
          onDragEnd={handleDragEnd}
          animate={{ x: showMobileActions ? -100 : 0 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchMove={handleTouchEnd} // Cancel long press if scrolling
          onClick={(e) => {
            // If actions are visible and they click the card, just close actions instead of opening detail
            if (showMobileActions) {
              e.stopPropagation();
              setShowMobileActions(false);
            } else {
              handleOpenDetail(notif);
            }
          }}
          whileHover={{ scale: 0.995, y: -2 }}
          whileTap={!showMobileActions ? { scale: 0.98 } : {}}
          className={`relative overflow-hidden cursor-pointer group transition-colors duration-300 w-full z-10 ${
            isBento ? 'p-6 rounded-3xl min-h-[200px] flex flex-col justify-between' : 
            isHybrid ? 'p-5 rounded-3xl' : 'p-4 rounded-2xl'
          } ${
            isSelected ? 'bg-surface-container-high shadow-lg border-outline-variant/30' :
            isUnread ? `bg-surface shadow-[0_4px_20px_rgb(0,0,0,0.2)] border border-transparent hover:border-outline-variant/20` : 'bg-surface-container-lowest hover:bg-surface-container-low border border-transparent'
          }`}
        >
        {isUnread && (
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} className={`absolute top-0 bottom-0 left-0 w-1.5 bg-primary shadow-[0_0_15px_rgba(var(--color-primary),0.8)]`} />
        )}

        <div className="flex flex-col h-full z-10 relative">
          <div className="flex gap-4">
            <div className="shrink-0 relative">
              {notif.avatar ? (
                <div className="relative">
                  <img src={notif.avatar} className={`${isBento ? 'w-14 h-14' : 'w-10 h-10'} rounded-full object-cover shadow-sm border border-outline-variant/20`} alt="" />
                  <div className={`absolute -bottom-1 -right-1 ${isBento ? 'w-6 h-6' : 'w-5 h-5'} rounded-full flex items-center justify-center ${iconBg} ${iconColor} border border-surface shadow-sm`}>
                    <Icon size={isBento ? 12 : 10} strokeWidth={2.5} />
                  </div>
                </div>
              ) : (
                <div className={`${isBento ? 'w-14 h-14' : 'w-10 h-10'} rounded-full flex items-center justify-center ${iconBg} ${iconColor} shadow-inner`}>
                  <Icon size={isBento ? 24 : 18} strokeWidth={2} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex justify-between items-start gap-3 mb-1">
                <p className={`${isBento ? 'text-lg' : 'text-[15px]'} leading-tight truncate ${isUnread ? 'font-black text-on-surface' : 'font-bold text-on-surface-variant'}`}>
                  {notif.title}
                </p>
                {isBento && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant/50 bg-surface-container px-2 py-1 rounded-md">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <div className={`flex flex-wrap gap-2 mt-1 ${isBento ? 'mb-2' : ''}`}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 flex items-center gap-1">
                  <ActivityIcon size={10} /> {category}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 flex items-center gap-1">
                  • {source}
                </span>
              </div>
            </div>
          </div>

          <div className={`${isBento ? 'mt-auto pt-4' : 'mt-2 pl-[56px]'} ${isHybrid ? 'pl-[60px]' : ''}`}>
            <p className={`leading-snug ${isBento ? 'text-[14px] line-clamp-3' : 'text-[13px] line-clamp-1'} ${isUnread ? 'text-on-surface-variant font-medium' : 'text-on-surface-variant/60 font-medium'}`}>
              {notif.body}
            </p>
            {!isBento && (
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] text-on-surface-variant/40 font-semibold flex items-center gap-1">
                  <Clock size={10} /> {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {notif.isRead && (
                  <span className="text-[11px] text-on-surface-variant/30 font-semibold flex items-center gap-1">
                    <CheckSquare size={10} /> Read
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        </motion.div>

        {/* Hover Actions (Desktop Only) */}
        <div className="hidden md:flex absolute right-4 top-4 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none group-hover:pointer-events-auto">
          {isUnread && (
            <button onClick={(e) => { e.stopPropagation(); markAsRead(notif._id || notif.id); }} className="p-2 rounded-full bg-surface-container-highest hover:bg-primary/20 hover:text-primary flex items-center justify-center text-on-surface-variant transition-colors shadow-sm" title="Mark as read">
              <Check size={14} strokeWidth={2.5} />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); removeNotification(notif._id || notif.id); if (selectedNotif && (selectedNotif._id || selectedNotif.id) === (notif._id || notif.id)) setSelectedNotif(null); }} className="p-2 rounded-full bg-surface-container-highest hover:bg-red-500/20 hover:text-red-500 flex items-center justify-center text-on-surface-variant transition-colors shadow-sm" title="Remove">
            <Trash2 size={14} strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>
    );
  };

  const today = [];
  const yesterday = [];
  const earlier = [];
  const now = new Date();
  now.setHours(0,0,0,0);
  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);

  filteredNotifications.forEach(n => {
    const d = new Date(n.createdAt);
    if (d >= now) today.push(n);
    else if (d >= yest) yesterday.push(n);
    else earlier.push(n);
  });

  const count = filteredNotifications.length;
  const layoutMode = count === 0 ? 'empty' : count <= 4 ? 'bento' : count <= 15 ? 'hybrid' : 'timeline';

  return (
    <div className="h-full w-full flex bg-background overflow-hidden relative">
      <motion.div layout className={`flex-1 flex flex-col h-full min-w-0 bg-background z-10 ${selectedNotif ? 'hidden lg:flex lg:w-7/12 xl:w-2/3 border-r border-outline-variant/20' : 'w-full'}`}>
        {/* Header */}
        <div className="shrink-0 bg-background/80 backdrop-blur-xl z-20 pt-6 px-4 md:px-8 flex flex-col gap-5 border-b border-outline-variant/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center">
                <Bell size={20} className="text-on-surface" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-on-surface">Inbox</h1>
                {unreadCount > 0 && <p className="text-xs font-bold text-primary uppercase tracking-wider">{unreadCount} Unread</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <>
                  <button onClick={markAllRead} className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-xl transition-colors">
                    <CheckCircle2 size={16} /> Mark All Read
                  </button>
                  <button onClick={clearAll} className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500/80 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors">
                    <Trash2 size={16} /> Clear All
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-surface-container-lowest rounded-xl px-3 py-2.5 border border-outline-variant/30 focus-within:border-primary/50 focus-within:shadow-[0_0_0_2px_rgba(var(--color-primary),0.1)] transition-all">
            <Search size={18} className="text-on-surface-variant" />
            <input type="text" placeholder="Search notifications..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm font-medium text-on-surface w-full placeholder:text-on-surface-variant/50" />
          </div>

          {/* Animated Tabs */}
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-3">
            {filters.map(filter => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              return (
                <button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`relative flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-[13px] font-bold transition-colors ${isActive ? 'text-surface' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}>
                  {isActive && <motion.div layoutId="activeTab" className="absolute inset-0 bg-on-surface rounded-full shadow-md" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />}
                  <span className="relative z-10 flex items-center gap-2"><Icon size={14} />{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 w-full">
          <AnimatePresence mode="wait">
            {layoutMode === 'empty' && (
              <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }} className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto select-none">
                <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="relative mb-6">
                  <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full scale-150"></div>
                  <div className="relative w-20 h-20 rounded-3xl bg-surface-container-lowest border border-outline-variant/50 flex items-center justify-center text-on-surface-variant/30 shadow-2xl rotate-3">
                    {searchQuery ? <Search size={32} /> : <CheckCircle2 size={32} />}
                  </div>
                </motion.div>
                <h3 className="font-bold text-xl tracking-tight text-on-surface mb-2">{searchQuery ? 'No results found' : 'You\'re all caught up'}</h3>
                <p className="text-sm text-on-surface-variant/60 font-medium">{searchQuery ? 'Try adjusting your filters.' : 'No pending activities or announcements.'}</p>
              </motion.div>
            )}

            {layoutMode === 'bento' && (
              <motion.div key="bento" initial="hidden" animate="show" exit="hidden" className="w-full">
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="text-[13px] font-black text-on-surface uppercase tracking-[0.2em]">Recent Highlights</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-outline-variant/30 to-transparent"></div>
                </div>
                <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-4 gap-6">
                  {filteredNotifications.map(notif => <NotificationCard key={notif._id || notif.id} notif={notif} mode="bento" />)}
                </motion.div>
              </motion.div>
            )}

            {layoutMode === 'hybrid' && (
              <motion.div key="hybrid" initial="hidden" animate="show" exit="hidden" className="w-full">
                <div className="mb-6 flex items-center gap-3">
                  <h2 className="text-[13px] font-black text-on-surface uppercase tracking-[0.2em]">Activity Dashboard</h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-outline-variant/30 to-transparent"></div>
                  <span className="text-[11px] font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">{count} Events</span>
                </div>
                <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredNotifications.map(notif => <NotificationCard key={notif._id || notif.id} notif={notif} mode="hybrid" />)}
                </motion.div>
              </motion.div>
            )}

            {layoutMode === 'timeline' && (
              <motion.div key="timeline" initial="hidden" animate="show" exit="hidden" className="w-full">
                {[
                  { title: 'Today', items: today },
                  { title: 'Yesterday', items: yesterday },
                  { title: 'Earlier', items: earlier }
                ].map(({ title, items }) => {
                  if (items.length === 0) return null;
                  return (
                    <motion.div variants={itemVariants} className="mb-10 w-full" key={title}>
                      <div className="flex items-center gap-4 mb-4 px-2">
                        <h2 className="text-[12px] font-black text-on-surface-variant uppercase tracking-[0.2em]">{title}</h2>
                        <div className="flex-1 h-[1px] bg-gradient-to-r from-outline-variant/30 to-transparent"></div>
                      </div>
                      <motion.div variants={containerVariants} className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-3">
                        {items.map(notif => <NotificationCard key={notif._id || notif.id} notif={notif} mode="timeline" />)}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* RIGHT PANE: Detail Panel */}
      <AnimatePresence>
        {selectedNotif && (
          <motion.div 
            initial={{ x: '100%', opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="fixed inset-0 z-50 lg:relative lg:z-auto lg:w-5/12 xl:w-1/3 h-full bg-surface-container-lowest flex flex-col shadow-2xl lg:shadow-none"
          >
            <div className="h-16 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-surface/50 backdrop-blur-md shrink-0">
              <span className="text-xs font-black tracking-widest text-on-surface-variant uppercase flex items-center gap-2">
                <ActivityIcon size={14} /> Event Detail
              </span>
              <button onClick={() => setSelectedNotif(null)} className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-colors">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 md:p-8">
              <motion.div layoutId={`notif-${selectedNotif._id || selectedNotif.id}`} className="flex flex-col items-center text-center">
                {(() => {
                  const { Icon, iconColor, iconBg, gradient, category, source } = getNotifStyles(selectedNotif.type);
                  return (
                    <>
                      <div className="relative mb-6">
                        <div className={`absolute inset-0 ${gradient} blur-2xl rounded-full scale-150`}></div>
                        {selectedNotif.avatar ? (
                          <div className="relative z-10">
                            <img src={selectedNotif.avatar} className="w-24 h-24 rounded-full object-cover shadow-2xl border-4 border-surface" alt="" />
                            <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center ${iconBg} ${iconColor} border-4 border-surface shadow-md`}><Icon size={18} strokeWidth={2.5} /></div>
                          </div>
                        ) : (
                          <div className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center ${iconBg} ${iconColor} border-4 border-surface shadow-2xl`}><Icon size={40} strokeWidth={2} /></div>
                        )}
                      </div>
                      <h2 className="text-2xl font-black text-on-surface mb-2 tracking-tight">{selectedNotif.title}</h2>
                      
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest bg-surface-container px-3 py-1 rounded-full">{category}</span>
                        <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest bg-surface-container px-3 py-1 rounded-full">{source}</span>
                        <span className="text-[10px] font-black text-on-surface-variant/70 uppercase tracking-widest flex items-center gap-1"><Clock size={12} /> {new Date(selectedNotif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      
                      <div className="w-full bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 text-left mb-8 shadow-inner">
                        <p className="text-[15px] leading-relaxed text-on-surface-variant font-medium whitespace-pre-wrap">{selectedNotif.body}</p>
                      </div>

                      <div className="w-full flex flex-col gap-3">
                        {selectedNotif.type === 'friendRequest' && selectedNotif.metadata?.senderId && (
                          <div className="flex gap-3 w-full">
                            <button onClick={async () => { await acceptRequest(selectedNotif.metadata.senderId); removeNotification(selectedNotif._id || selectedNotif.id); setSelectedNotif(null); }} className="flex-1 py-3.5 bg-primary text-white text-sm font-bold rounded-2xl hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5">Accept Request</button>
                            <button onClick={async () => { await rejectRequest(selectedNotif.metadata.senderId); removeNotification(selectedNotif._id || selectedNotif.id); setSelectedNotif(null); }} className="flex-1 py-3.5 bg-surface-container-high text-on-surface font-bold rounded-2xl hover:bg-surface-container-highest transition-colors">Decline</button>
                          </div>
                        )}
                        <button onClick={() => { handleActionClick(selectedNotif); setSelectedNotif(null); }} className="w-full py-3.5 bg-on-surface text-surface text-sm font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">View Context <CornerDownRight size={16} /></button>
                        <button onClick={() => { removeNotification(selectedNotif._id || selectedNotif.id); setSelectedNotif(null); }} className="w-full py-3.5 bg-transparent text-red-500 font-bold text-sm rounded-2xl hover:bg-red-500/10 transition-colors">Delete Notification</button>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
