import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Phone, Settings, LogOut, Search, Users, Bell, CircleDashed } from 'lucide-react';
import Avatar from './ui/Avatar';
import { useAuthStore } from '../store/useAuthStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useFriendStore } from '../store/useFriendStore';
import { useNotificationStore } from '../store/useNotificationStore';
import { useChatStore } from '../store/useChatStore';
import useStoryStore from '../store/useStoryStore';
import { useEffect } from 'react';

export default function UserSidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const {
    setProfileOpen,
    setCallsOpen,
    setLogoutOpen,
    setSearchFriendsOpen,
    setManageFriendsOpen,
  } = useLayoutStore();

  const { incomingRequests, getRequests } = useFriendStore();
  const { unreadCount } = useNotificationStore();

  // Poll for incoming requests badge on mount
  useEffect(() => {
    getRequests();
  }, [getRequests]);

  const { unreadCounts } = useChatStore();
  const unreadChatsCount = Object.keys(unreadCounts || {}).length;

  const { stories } = useStoryStore();
  const lastStoriesViewed = user?.lastViewed?.stories ? new Date(user.lastViewed.stories) : new Date(0);
  const hasNewStories = stories?.some(s => new Date(s.createdAt) > lastStoriesViewed);

  const { callHistory } = useLayoutStore();
  const lastCallsViewed = user?.lastViewed?.calls ? new Date(user.lastViewed.calls) : new Date(0);
  const hasNewMissedCalls = callHistory?.some(c => 
    (c.status === 'missed' || c.status === 'rejected') && 
    c.receiver?._id === user?._id && 
    new Date(c.startTime) > lastCallsViewed
  );

  const { notifications } = useNotificationStore();
  const lastNotificationsViewed = user?.lastViewed?.notifications ? new Date(user.lastViewed.notifications) : new Date(0);
  const hasNewNotifications = notifications?.some(n => new Date(n.createdAt) > lastNotificationsViewed);

  const navItems = [
    { to: '/', icon: <MessageSquare size={22} />, label: 'Chats', type: 'link', badge: unreadChatsCount > 0 ? unreadChatsCount : null },
    { to: '/stories', icon: <CircleDashed size={22} />, label: 'Stories', type: 'link', badge: hasNewStories ? 'dot' : null },
    { to: '/calls', icon: <Phone size={22} />, label: 'Calls', type: 'link', badge: hasNewMissedCalls ? 'dot' : null },
    {
      to: '/friends',
      icon: <Users size={22} />,
      label: 'Friends',
      type: 'link',
      badge: incomingRequests?.length > 0 ? incomingRequests.length : null,
    },
    {
      to: '/activity',
      icon: <Bell size={22} />,
      label: 'Activity Center',
      type: 'link',
      badge: hasNewNotifications ? 'dot' : null,
    },
    { to: '/settings', icon: <Settings size={22} />, label: 'Settings', type: 'link' },
  ];

  const SidebarItem = ({ item, index }) => {
    const isActive = item.type === 'link' && location.pathname === item.to;

    const renderBadge = () => {
      if (!item.badge) return null;
      if (item.badge === 'dot') {
        return <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-surface shadow-sm"></span>;
      }
      return (
        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-sm">
          {item.badge > 9 ? '9+' : item.badge}
        </span>
      );
    };

    const inner =
      item.type === 'link' ? (
        <Link
          to={item.to}
          className={`relative p-3 rounded-2xl transition-all duration-300 ${
            isActive
              ? 'text-white bg-gradient-to-br from-primary to-primary-container shadow-lg shadow-primary/25 font-bold'
              : 'text-on-surface-variant hover:bg-on-surface/10 hover:text-on-surface'
          }`}
        >
          {item.icon}
          {renderBadge()}
        </Link>
      ) : (
        <button
          onClick={item.onClick}
          className="relative p-3 rounded-2xl text-on-surface-variant hover:bg-on-surface/10 hover:text-on-surface transition-all duration-300 cursor-pointer"
        >
          {item.icon}
          {renderBadge()}
        </button>
      );

    return (
      <div key={index} className="relative group flex items-center justify-center w-full">
        {inner}
        {/* Tooltip */}
        <div className="absolute left-[70px] scale-90 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 bg-surface-container-low backdrop-blur-md border border-outline-variant text-on-surface text-[12px] font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl z-[100]">
          {item.label}
        </div>
      </div>
    );
  };

  return (
    <div className="w-[80px] h-full bg-surface backdrop-blur-xl border-r border-outline-variant flex flex-col items-center py-8 shrink-0 z-50 shadow-2xl justify-between">
      {/* Top: Branding + Nav */}
      <div className="flex flex-col gap-6 w-full items-center flex-1">
        {/* Logo */}
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-primary/10 select-none">
          <img src="/logo.png" alt="Orbit Logo" className="w-full h-full object-cover" />
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-4 w-full items-center mt-6">
          {navItems.map((item, index) => (
            <SidebarItem key={index} item={item} index={index} />
          ))}
        </nav>
      </div>

      {/* Bottom: Profile + Logout */}
      <div className="flex flex-col gap-4 w-full items-center">
        {/* Profile Avatar */}
        <div className="relative group flex items-center justify-center w-full">
          <Link
            to="/profile"
            className="p-1 rounded-full overflow-hidden hover:ring-2 hover:ring-primary/60 transition-all border border-outline-variant/50 cursor-pointer"
          >
            <Avatar 
                src={user?.profilePic} 
                name={user?.displayName || user?.username} 
                sizeClass="w-9 h-9"
            />
          </Link>
          <div className="absolute left-[70px] scale-90 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 bg-surface-container-low backdrop-blur-md border border-outline-variant text-on-surface text-[12px] font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl z-[100]">
            My Profile
          </div>
        </div>

        {/* Logout */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={() => setLogoutOpen(true)}
            className="p-3 rounded-2xl text-on-surface-variant hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 cursor-pointer"
          >
            <LogOut size={22} />
          </button>
          <div className="absolute left-[70px] scale-90 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-300 bg-surface-container-low backdrop-blur-md border border-outline-variant text-on-surface text-[12px] font-semibold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-xl z-[100]">
            Sign Out
          </div>
        </div>
      </div>
    </div>
  );
}
