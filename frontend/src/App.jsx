import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import ToastProvider from './components/ui/ToastProvider';
import { axiosInstance } from './lib/axios';
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import { useSettingsStore } from './store/useSettingsStore';
import { useLayoutStore } from './store/useLayoutStore';
import Login from './pages/Login';
import Welcome from './pages/Welcome';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import Contacts from './pages/Contacts';
import AddFriends from './pages/AddFriends';
import Discover from './pages/Discover';
import Calls from './pages/Calls';
import Friends from './pages/Friends';
import Stories from './pages/Stories';
import Activity from './pages/Activity';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './components/admin/UserManagement';
import Analytics from './components/admin/Analytics';
import ReportsCenter from './components/admin/ReportsCenter';
import SecurityCenter from './components/admin/SecurityCenter';
import NotificationCenter from './components/admin/NotificationCenter';
import ChatModeration from './components/admin/ChatModeration';
import DatabaseUsage from './pages/admin/DatabaseUsage';
import AdminSupportCenter from './pages/admin/SupportCenter';
import UsernameRequests from './pages/admin/UsernameRequests';
import AdminSettings from './pages/admin/AdminSettings';
import InAppNotification from './components/InAppNotification';
import ConfirmDialog from './components/ui/ConfirmDialog';
import { subscribeUserToPush, unsubscribeUserFromPush } from './lib/pushSubscription';

export default function App() {
  const { isAuthenticated, user, checkAuth, isCheckingAuth } = useAuthStore();
  const { connectSocket, disconnectSocket } = useChatStore();
  const location = useLocation();

  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    checkAuth();

    // Enforce 2 second minimum display duration for splash screen
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [checkAuth]);

  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated, fetchSettings]);

  const [isScreenshotBlocked, setIsScreenshotBlocked] = useState(false);

  useEffect(() => {
    if (settings.screenCapturePrivacy !== true) return;

    const handleKey = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isScreenshot =
        e.key === 'PrintScreen' ||
        e.code === 'PrintScreen' ||
        (isMac && e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) ||
        (!isMac && e.shiftKey && (e.metaKey || e.ctrlKey || e.key === 'Meta') && (e.key === 's' || e.key === 'S'));

      if (isScreenshot) {
        setIsScreenshotBlocked(true);

        // Zero-latency DOM manipulation to beat the OS screen freeze
        const mask = document.getElementById('zero-latency-mask');
        if (mask) {
          mask.style.opacity = '1';
          mask.style.pointerEvents = 'auto';
        }

        // Hide content temporarily without showing any warning message
        setTimeout(() => {
          setIsScreenshotBlocked(false);
          if (mask) {
            mask.style.opacity = '0';
            mask.style.pointerEvents = 'none';
          }
        }, 3000);
      }
    };

    window.addEventListener('keydown', handleKey, { capture: true, passive: false });
    window.addEventListener('keyup', handleKey, { capture: true, passive: false });

    return () => {
      window.removeEventListener('keydown', handleKey, { capture: true });
      window.removeEventListener('keyup', handleKey, { capture: true });
    };
  }, [settings.screenCapturePrivacy]);
  useEffect(() => {
    if (user) {
      connectSocket(user);
      subscribeUserToPush();
    } else if (!isCheckingAuth) {
      // Only disconnect and unsubscribe if we are CERTAIN the user is logged out
      // (not just because the app is still initially checking auth on load)
      disconnectSocket();
      unsubscribeUserFromPush();
    }
  }, [user, isCheckingAuth, connectSocket, disconnectSocket]);

  const { setActiveCall } = useLayoutStore();

  useEffect(() => {
    const handleServiceWorkerMessage = async (event) => {
      if (event.data && event.data.type === 'CALL_ACTION') {
        const { action, callData } = event.data;
        
        // Verify call status from backend before launching any UI
        try {
          const res = await axiosInstance.get(`/calls/${callData.callId}`);
          const callStatus = res.data.status;
          
          if (callStatus !== 'ringing' && callStatus !== 'in_progress') {
            toast.error('This call has already ended.', { icon: '📞' });
            return; // Ignore stale action completely
          }
        } catch (e) {
          console.error('Failed to verify call status:', e);
          toast.error('This call has already ended.', { icon: '📞' });
          return;
        }

        if (action === 'accept_call') {
          setActiveCall({
            callId: callData.callId,
            name: callData.callerName,
            pic: callData.callerPic,
            type: callData.callType,
            status: 'connected',
            receiverId: user?._id,
            callerId: callData.callerId,
            direction: 'incoming'
          });
          const { socket } = useChatStore.getState();
          if (socket) {
            socket.emit('call:answer', { to: callData.callerId, callId: callData.callId });
          }
        } else if (action === 'decline_call') {
          const { socket } = useChatStore.getState();
          if (socket) {
            socket.emit('call:reject', { to: callData.callerId, callId: callData.callId });
          }
          // Clear any incoming call UI if the app happened to be open
          window.dispatchEvent(new CustomEvent('orbit:callEnded', { detail: { callId: callData.callId } }));
        } else if (action === 'view_call') {
          // Trigger the incoming call UI directly via store
          useLayoutStore.getState().setIncomingCall(callData);
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [setActiveCall, user]);

  if (isCheckingAuth || showSplash) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-neutral-950 text-white font-sans overflow-hidden">
        <div className="relative flex flex-col items-center select-none animate-in fade-in zoom-in duration-700">

          {/* Splash Screen Logo */}
          <img src="/logo.svg" alt="Orbit Logo" className="w-[225px] h-[225px] object-contain mb-8 animate-pulse" />

          <h1 className="text-4xl font-spacetron tracking-[0.15em] text-white uppercase mt-2 leading-none">
            ORBIT
          </h1>
          <p className="text-neutral-400 text-xs tracking-wider uppercase mt-1">
            Premium Secured Messenger
          </p>
        </div>
      </div>
    );
  }

  const userRole = user?.role || 'user'; // dynamic role from logged-in user

  return (
    <>
      {/* Zero Latency DOM Mask to beat OS screenshot freeze */}
      <div
        id="zero-latency-mask"
        className="fixed inset-0 z-[10000] bg-black transition-opacity duration-75"
        style={{ opacity: 0, pointerEvents: 'none' }}
      ></div>

      {/* React State Privacy Mask for screenshots (No messages or alerts) */}
      {isScreenshotBlocked && (
        <div className="fixed inset-0 z-[10000] bg-black"></div>
      )}

      <Routes>
        {/* Welcome Page or Main Workspace */}
        <Route path="/" element={
          !isAuthenticated ? (location.pathname === '/' ? <Welcome /> : <Navigate to="/" replace />) :
            userRole === 'admin' ? <Navigate to="/admin" replace /> :
              <UserLayout />
        }>
          <Route index element={<Chat />} />
          <Route path="stories" element={<Stories />} />
          <Route path="calls" element={<Calls />} />
          <Route path="friends" element={<Friends />} />
          <Route path="activity" element={<Activity />} />
          <Route path="profile" element={<Profile />} />
          <Route path="user-profile/:id" element={<UserProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="contacts" element={<Friends />} />
          <Route path="add-friends" element={<Friends />} />
          <Route path="discover" element={<Discover />} />
        </Route>

        {/* Public Authentication Routes */}
        <Route path="/login" element={!isAuthenticated ? <Login initialMode="login" /> : <Navigate to={userRole === 'admin' ? "/admin" : "/"} />} />
        <Route path="/signup" element={!isAuthenticated ? <Login initialMode="signup" /> : <Navigate to={userRole === 'admin' ? "/admin" : "/"} />} />
        <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/" />} />
        <Route path="/reset-password/:token" element={!isAuthenticated ? <ResetPassword /> : <Navigate to="/" />} />

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
            <Route path="database" element={<DatabaseUsage />} />
            <Route path="support" element={<AdminSupportCenter />} />
            <Route path="username-requests" element={<UsernameRequests />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        )}

        {/* Redirect unauthorized access */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
      </Routes>
      <ToastProvider />
      <InAppNotification />
      <ConfirmDialog />
    </>
  );
}
