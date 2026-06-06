import { LayoutDashboard, Users, MessageSquare, AlertCircle, Shield, Activity, Bell, LogOut, Database } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

export default function AdminSidebar() {
  const { logout } = useAuthStore();

  return (
    <aside className="w-[68px] lg:w-64 h-full bg-surface border-r border-outline-variant/60 flex flex-col justify-between shrink-0 transition-all duration-300 z-20 shadow-sm">
      <div className="flex flex-col h-full">
        {/* Branding Profile/Logo */}
        <div className="h-16 flex items-center justify-center lg:justify-start px-4 border-b border-outline-variant/60 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm shrink-0">
              <img src="/logo.png" alt="Orbit Logo" className="w-full h-full object-cover" />
            </div>
            <h1 className="hidden lg:block text-on-surface font-bold text-[16px] tracking-tight">
              Orbit Admin
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto">
          <p className="hidden lg:block text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-wider mb-2 ml-2 mt-2">Overview</p>
          <NavItem to="/admin" end icon={<LayoutDashboard size={18} strokeWidth={2.5} />} label="Dashboard" />
          <NavItem to="/admin/analytics" icon={<Activity size={18} strokeWidth={2.5} />} label="Analytics" />
          
          <p className="hidden lg:block text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-wider mb-2 ml-2 mt-6">Management</p>
          <NavItem to="/admin/users" icon={<Users size={18} strokeWidth={2.5} />} label="Users" />
          <NavItem to="/admin/reports" icon={<AlertCircle size={18} strokeWidth={2.5} />} label="Reports" />
          <NavItem to="/admin/moderation" icon={<MessageSquare size={18} strokeWidth={2.5} />} label="Moderation" />
          
          <p className="hidden lg:block text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-wider mb-2 ml-2 mt-6">System</p>
          <NavItem to="/admin/database" icon={<Database size={18} strokeWidth={2.5} />} label="Database Usage" />
          <NavItem to="/admin/security" icon={<Shield size={18} strokeWidth={2.5} />} label="Security" />
          <NavItem to="/admin/notifications" icon={<Bell size={18} strokeWidth={2.5} />} label="Notifications" />
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-outline-variant/60">
          <button 
            onClick={logout}
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-colors group cursor-pointer"
          >
            <LogOut size={18} strokeWidth={2} className="group-hover:text-red-500" />
            <span className="hidden lg:block font-medium text-[14px]">Exit Admin</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ to, icon, label, end }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => 
        `flex items-center justify-center lg:justify-start gap-3 px-3 py-2.5 rounded-xl transition-all ${
          isActive 
            ? 'bg-primary/10 text-primary font-bold shadow-sm border border-primary/20' 
            : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface font-medium'
        }`
      }
    >
      {icon}
      <span className="hidden lg:block text-[14px]">{label}</span>
    </NavLink>
  );
}

