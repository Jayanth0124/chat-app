import { Outlet } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';

export default function AdminLayout() {
  return (
    <div className="h-screen w-full flex bg-background text-on-surface overflow-hidden font-sans">
      <AdminSidebar />
      <main className="flex-1 h-full relative flex flex-col bg-background overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

