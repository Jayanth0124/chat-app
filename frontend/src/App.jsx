import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Welcome from './pages/Welcome';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Contacts from './pages/Contacts';
import AddFriends from './pages/AddFriends';
import Discover from './pages/Discover';
import Calls from './pages/Calls';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import Analytics from './components/admin/Analytics';
import ReportsCenter from './components/admin/ReportsCenter';
import SecurityCenter from './components/admin/SecurityCenter';
import NotificationCenter from './components/admin/NotificationCenter';
import ChatModeration from './components/admin/ChatModeration';

export default function App() {
  const { isAuthenticated, user, checkAuth, isCheckingAuth } = useAuthStore();
  const { connectSocket, disconnectSocket } = useChatStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      connectSocket(user);
    } else {
      disconnectSocket();
    }
  }, [user, connectSocket, disconnectSocket]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const userRole = user?.role || 'user'; // dynamic role from logged-in user

  return (
    <>
      <Routes>
        {/* Welcome Page or Main Workspace */}
        <Route path="/" element={!isAuthenticated ? <Welcome /> : <UserLayout />}>
          <Route index element={<Chat />} />
          <Route path="calls" element={<Calls />} />
          <Route path="friends" element={<Friends />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="contacts" element={<Friends />} />
          <Route path="add-friends" element={<Friends />} />
          <Route path="discover" element={<Discover />} />
        </Route>

        {/* Public Authentication Routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={userRole === 'admin' ? "/admin" : "/"} />} />
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to={userRole === 'admin' ? "/admin" : "/"} />} />
        
        {/* Fallback for old /auth route during transition */}
        <Route path="/auth" element={<Navigate to="/login" replace />} />

        {/* Protected Admin Routes */}
        {isAuthenticated && userRole === 'admin' && (
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="reports" element={<ReportsCenter />} />
            <Route path="security" element={<SecurityCenter />} />
            <Route path="notifications" element={<NotificationCenter />} />
            <Route path="moderation" element={<ChatModeration />} />
          </Route>
        )}

        {/* Redirect unauthorized access */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
      <Toaster position="top-center" />
    </>
  );
}
