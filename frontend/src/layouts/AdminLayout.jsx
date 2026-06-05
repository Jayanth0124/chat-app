import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { LayoutDashboard, Users, MessageSquare, AlertCircle, Shield, Activity, Bell } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-background text-on-surface overflow-hidden font-sans">
      {/* Sidebar for Desktop/Tablet */}
      <div className="hidden md:block h-full">
        <AdminSidebar />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-full relative flex flex-col bg-background overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar for Admin */}
      <div className="md:hidden flex justify-around items-center bg-surface border-t border-outline-variant/60 px-2 py-1 shrink-0 pb-safe z-30">
        <button 
          onClick={() => navigate('/admin')} 
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/admin' ? 'text-primary' : 'text-on-surface-variant/80'}`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-semibold">Dashboard</span>
        </button>

        <button 
          onClick={() => navigate('/admin/users')} 
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/admin/users' ? 'text-primary' : 'text-on-surface-variant/80'}`}
        >
          <Users size={20} />
          <span className="text-[10px] font-semibold">Users</span>
        </button>

        <button 
          onClick={() => navigate('/admin/reports')} 
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/admin/reports' ? 'text-primary' : 'text-on-surface-variant/80'}`}
        >
          <AlertCircle size={20} />
          <span className="text-[10px] font-semibold">Reports</span>
        </button>

        <button 
          onClick={() => navigate('/admin/moderation')} 
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/admin/moderation' ? 'text-primary' : 'text-on-surface-variant/80'}`}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-semibold">Chats</span>
        </button>

        <button 
          onClick={() => navigate('/admin/notifications')} 
          className={`flex flex-col items-center gap-0.5 p-2 rounded-xl transition-colors ${location.pathname === '/admin/notifications' ? 'text-primary' : 'text-on-surface-variant/80'}`}
        >
          <Bell size={20} />
          <span className="text-[10px] font-semibold">Alerts</span>
        </button>
      </div>
    </div>
  );
}

