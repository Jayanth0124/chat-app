import { useEffect, useState } from 'react';
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
import InAppNotification from './components/InAppNotification';
import { subscribeUserToPush, unsubscribeUserFromPush } from './lib/pushSubscription';

export default function App() {
  const { isAuthenticated, user, checkAuth, isCheckingAuth } = useAuthStore();
  const { connectSocket, disconnectSocket } = useChatStore();

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Enforce 2 second minimum display duration for splash screen
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkAuth]);

  useEffect(() => {
    if (user) {
      connectSocket(user);
      subscribeUserToPush();
    } else {
      disconnectSocket();
      unsubscribeUserFromPush();
    }
  }, [user, connectSocket, disconnectSocket]);

  if (isCheckingAuth || showSplash) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-white font-sans overflow-hidden">
        <div className="relative flex flex-col items-center select-none animate-in fade-in zoom-in duration-700">
          <div className="relative w-28 h-28 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full border border-dashed border-primary/30 animate-[spin_12s_linear_infinite]"></div>
            <div className="absolute -inset-3 rounded-full border border-primary/10 animate-[spin_8s_linear_infinite_reverse]"></div>
            <img 
              src="/logo.png" 
              alt="Orbit Logo" 
              className="w-20 h-20 rounded-2xl object-cover shadow-2xl relative z-10 animate-[pulse_2s_ease-in-out_infinite]"
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase mt-2">
            Orbit
          </h1>
          <p className="text-neutral-400 text-xs tracking-wider uppercase mt-1">
            Premium Secured Messenger
          </p>
          <div className="w-32 h-[3px] bg-neutral-800 rounded-full overflow-hidden mt-8">
            <div className="h-full bg-primary rounded-full animate-[loading-bar_1.5s_infinite_ease-in-out]"></div>
          </div>
        </div>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes loading-bar {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
        `}} />
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
      <InAppNotification />
    </>
  );
}
