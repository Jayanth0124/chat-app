import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, Phone, Settings, LogOut, Search, Users } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useLayoutStore } from '../store/useLayoutStore';
import { useFriendStore } from '../store/useFriendStore';
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

  // Poll for incoming requests badge on mount
  useEffect(() => {
    getRequests();
  }, [getRequests]);

  const navItems = [
    { to: '/', icon: <MessageSquare size={22} />, label: 'Chats', type: 'link' },
    { to: '/calls', icon: <Phone size={22} />, label: 'Calls', type: 'link' },
    {
      to: '/friends',
      icon: <Users size={22} />,
      label: 'Friends',
      type: 'link',
      badge: incomingRequests.length > 0 ? incomingRequests.length : null,
    },
    { to: '/settings', icon: <Settings size={22} />, label: 'Settings', type: 'link' },
  ];

  const SidebarItem = ({ item, index }) => {
    const isActive = item.type === 'link' && location.pathname === item.to;

    const inner =
      item.type === 'link' ? (
        <Link
          to={item.to}
          className={`p-3 rounded-xl transition-all duration-200 ${
            isActive
              ? 'text-primary bg-primary/10 font-bold'
              : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
          }`}
        >
          {item.icon}
        </Link>
      ) : (
        <button
          onClick={item.onClick}
          className="relative p-3 rounded-xl text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-all duration-200 cursor-pointer"
        >
          {item.icon}
          {item.badge && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary rounded-full text-white text-[9px] font-bold flex items-center justify-center">
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}
        </button>
      );

    return (
      <div key={index} className="relative group flex items-center justify-center w-full">
        {inner}
        {/* Active bar */}
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary rounded-r-full" />
        )}
        {/* Tooltip */}
        <div className="absolute left-[80px] scale-90 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-neutral-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-md z-50">
          {item.label}
        </div>
      </div>
    );
  };

  return (
    <div className="w-[72px] h-full bg-surface border-r border-outline-variant/60 flex flex-col items-center py-6 shrink-0 z-20 shadow-sm justify-between">
      {/* Top: Branding + Nav */}
      <div className="flex flex-col gap-6 w-full items-center flex-1">
        {/* Logo */}
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-primary/10 select-none">
          B
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-3 w-full items-center mt-4">
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
            className="p-1 rounded-full overflow-hidden hover:ring-2 hover:ring-primary/40 transition-all border border-outline-variant/30"
          >
            <img
              src={
                user?.profilePic ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=random`
              }
              alt="profile"
              className="w-9 h-9 rounded-full object-cover"
            />
          </Link>
          <div className="absolute left-[80px] scale-90 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-neutral-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-md z-50">
            My Profile
          </div>
        </div>

        {/* Logout */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            onClick={() => setLogoutOpen(true)}
            className="p-3 rounded-xl text-on-surface-variant hover:bg-red-500/10 hover:text-red-500 transition-all duration-200 cursor-pointer"
          >
            <LogOut size={22} />
          </button>
          <div className="absolute left-[80px] scale-90 opacity-0 pointer-events-none group-hover:scale-100 group-hover:opacity-100 transition-all duration-200 bg-neutral-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-md z-50">
            Sign Out
          </div>
        </div>
      </div>
    </div>
  );
}
