import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import { LayoutDashboard, Users, MessageSquare, AlertCircle, Shield, Activity, Bell, Menu } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-background text-on-surface overflow-hidden font-sans">
      
      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between h-14 px-4 bg-background border-b border-outline-variant/60 shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm shrink-0">
            <img src="/logo.png" alt="Orbit Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-bold text-[16px] tracking-tight">Orbit Admin</h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-on-surface-variant hover:text-primary transition-colors"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar (Responsive) */}
      <AdminSidebar isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} />

      {/* Main Content Area */}
      <main className="flex-1 h-full relative flex flex-col bg-background overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

