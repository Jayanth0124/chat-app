import { LayoutDashboard, Users, MessageSquare, AlertCircle, Shield, Activity, Bell, LogOut, Database, X, LifeBuoy, Fingerprint, Settings as SettingsIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminSidebar({ isOpen, setIsOpen }) {
  const { logout } = useAuthStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 md:relative w-64 md:w-[68px] lg:w-64 h-full bg-background md:bg-surface border-r border-outline-variant/60 flex flex-col justify-between shrink-0 shadow-2xl md:shadow-sm transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          {/* Branding Profile/Logo */}
          <div className="h-16 flex items-center justify-between lg:justify-start px-4 border-b border-outline-variant/60 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm shrink-0">
                <img src="/logo.png" alt="Orbit Logo" className="w-full h-full object-cover" />
              </div>
              <h1 className="md:hidden lg:block text-on-surface font-bold text-[16px] tracking-tight">
                Orbit Admin
              </h1>
            </div>
            {/* Mobile Close Button */}
            <button 
              className="md:hidden p-2 bg-surface-container-low rounded-lg text-on-surface hover:text-primary transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto">
          <p className="md:hidden lg:block text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-wider mb-2 ml-2 mt-2">Overview</p>
          <NavItem to="/admin" end icon={<LayoutDashboard size={18} strokeWidth={2.5} />} label="Dashboard" onClick={() => setIsOpen(false)} />
          <NavItem to="/admin/analytics" icon={<Activity size={18} strokeWidth={2.5} />} label="Analytics" onClick={() => setIsOpen(false)} />
          
          <p className="md:hidden lg:block text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-wider mb-2 ml-2 mt-6">Management</p>
          <NavItem to="/admin/users" icon={<Users size={18} strokeWidth={2.5} />} label="Users" onClick={() => setIsOpen(false)} />
          <NavItem to="/admin/reports" icon={<AlertCircle size={18} strokeWidth={2.5} />} label="Reports" onClick={() => setIsOpen(false)} />
          <NavItem to="/admin/moderation" icon={<MessageSquare size={18} strokeWidth={2.5} />} label="Moderation" onClick={() => setIsOpen(false)} />
          <NavItem to="/admin/support" icon={<LifeBuoy size={18} strokeWidth={2.5} />} label="Support Center" onClick={() => setIsOpen(false)} />
          <NavItem to="/admin/username-requests" icon={<Fingerprint size={18} strokeWidth={2.5} />} label="Identity" onClick={() => setIsOpen(false)} />
          
          <p className="md:hidden lg:block text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-wider mb-2 ml-2 mt-6">System</p>
          <NavItem to="/admin/database" icon={<Database size={18} strokeWidth={2.5} />} label="Database Usage" onClick={() => setIsOpen(false)} />
          <NavItem to="/admin/security" icon={<Shield size={18} strokeWidth={2.5} />} label="Security" onClick={() => setIsOpen(false)} />
          <NavItem to="/admin/notifications" icon={<Bell size={18} strokeWidth={2.5} />} label="Notifications" onClick={() => setIsOpen(false)} />
          <NavItem to="/admin/settings" icon={<SettingsIcon size={18} strokeWidth={2.5} />} label="Settings" onClick={() => setIsOpen(false)} />
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-outline-variant/60">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center md:justify-center lg:justify-start gap-3 px-3 py-2.5 text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors group cursor-pointer"
          >
            <LogOut size={18} strokeWidth={2} className="group-hover:text-red-500" />
            <span className="md:hidden lg:block font-medium text-[14px]">Exit Admin</span>
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}

function NavItem({ to, icon, label, end, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) => 
        `flex items-center justify-center md:justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl transition-all ${
          isActive 
            ? 'bg-primary/10 text-primary font-bold shadow-sm border border-primary/20' 
            : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface font-medium'
        }`
      }
    >
      {icon}
      <span className="md:hidden lg:block text-[14px]">{label}</span>
    </NavLink>
  );
}

