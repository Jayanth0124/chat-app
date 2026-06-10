import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { 
  Loader2, UserRound, Fingerprint, Lock, Monitor, ChevronLeft, Clock,
  Globe, MessageSquare,
  Shield, HelpCircle, Bug, UserX, AlertCircle, FileText, Search,
  PlusCircle, CheckCircle2, Check, RefreshCw, Trash2, ShieldAlert, X, ExternalLink
} from 'lucide-react';
import ThemeSwitcher from '../components/shared/ThemeSwitcher';
import Select from '../components/ui/Select';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from '../components/ui/Avatar';
import { axiosInstance } from '../lib/axios';
import toast from 'react-hot-toast';
import { useFriendStore } from '../store/useFriendStore';
import UsernameRequestModal from '../components/ui/UsernameRequestModal';
import ImageAdjustModal from '../components/modals/ImageAdjustModal';

export default function Settings() {
  const navigate = useNavigate();
  const { user, updateProfile, changeUsername, updatePrivacySettings, isUpdatingProfile } = useAuthStore();

  const [activeTab, setActiveTab] = useState('profile');

  // --- Profile State ---
  const [displayName, setDisplayName] = useState(user?.displayName || 'Jayanth Chowdary');
  const [bio, setBio] = useState(user?.bio || '');
  const [profilePic, setProfilePic] = useState(user?.profilePic || null);
  const [adjustingImage, setAdjustingImage] = useState(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    website: user?.socialLinks?.website || '',
    instagram: user?.socialLinks?.instagram || '',
    twitter: user?.socialLinks?.twitter || '',
    linkedin: user?.socialLinks?.linkedin || '',
    github: user?.socialLinks?.github || '',
    youtube: user?.socialLinks?.youtube || '',
    discord: user?.socialLinks?.discord || ''
  });

  // --- Account State ---
  const [username, setUsername] = useState(user?.username || 'jayanth');
  const [isUsernameRequestModalOpen, setIsUsernameRequestModalOpen] = useState(false);

  // --- Privacy State ---
  const [readReceipts, setReadReceipts] = useState(user?.privacySettings?.readReceipts ?? true);
  const [onlineStatus, setOnlineStatus] = useState(user?.privacySettings?.onlineStatus ?? true);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [blockedSearch, setBlockedSearch] = useState('');
  const [isFetchingBlocked, setIsFetchingBlocked] = useState(false);

  // --- Help Center State ---
  const [helpSearch, setHelpSearch] = useState('');
  const [selectedHelpItem, setSelectedHelpItem] = useState(null);

  // --- Contact Support State ---
  const [supportFormType, setSupportFormType] = useState('ticket'); // 'ticket' | 'bug'
  const [supportSubject, setSupportSubject] = useState('');
  const [supportCategory, setSupportCategory] = useState('Account Issue');
  const [supportDescription, setSupportDescription] = useState('');
  const [tickets, setTickets] = useState([]);
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // --- Bug Report State ---
  const [bugTitle, setBugTitle] = useState('');
  const [bugSteps, setBugSteps] = useState('');
  const [bugExpected, setBugExpected] = useState('');
  const [bugActual, setBugActual] = useState('');
  const [bugNotes, setBugNotes] = useState('');
  const [bugSubmittedSuccess, setBugSubmittedSuccess] = useState(false);
  const [isSubmittingBug, setIsSubmittingBug] = useState(false);

  // --- Admin Support Manager State ---
  const [adminTickets, setAdminTickets] = useState([]);
  const [adminBugs, setAdminBugs] = useState([]);
  const [selectedAdminItem, setSelectedAdminItem] = useState(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilterStatus, setAdminFilterStatus] = useState('All');
  const [adminTab, setAdminTab] = useState('tickets');
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // FAQ Data list
  const faqs = [
    {
      id: 'terms',
      category: 'legal',
      title: 'Terms of Service',
      content: 'Welcome to Orbit. By using our platform, you agree to secure messaging guidelines, strict non-abuse policies, and limitations on username modifications to maintain network identity trust. We reserve the right to ban accounts violating safe behavior...'
    },
    {
      id: 'privacy-policy',
      category: 'legal',
      title: 'Privacy Policy',
      content: 'Your privacy is our highest priority. Orbit utilizes zero-knowledge metadata, optional read-receipt disabling, and local-first activity settings. We do not sell, track, or share your messaging metadata with advertisers or third-parties.'
    },
    {
      id: 'guidelines',
      category: 'legal',
      title: 'Community Guidelines',
      content: 'Maintain respect, prevent spamming or impersonation, and do not exploit platform resources. Username changes are restricted to 3 times to protect user networks from trust spoofing.'
    },
    {
      id: 'account-1',
      category: 'account',
      title: 'How do I change my display name?',
      content: 'You can change your Display Name under the Profile tab in Workspace Settings. Unlike usernames, display names do not have change limits and can include symbols or spaces.'
    },
    {
      id: 'account-2',
      category: 'account',
      title: 'Why is my username change limited?',
      content: 'Usernames are limited to 3 edits to prevent spoofing, network spam, and identity theft. Once you reach this limit, you must contact support to request an administrative reset.'
    },
    {
      id: 'messaging-1',
      category: 'messaging',
      title: 'Are my messages encrypted?',
      content: 'Yes, all message transmissions are secured with Transport Layer Security (TLS) and stored in encrypted format. Expired messages are permanently wiped from all servers.'
    },
    {
      id: 'privacy-1',
      category: 'privacy',
      title: 'How do I hide my active status?',
      content: 'Under the Privacy & Safety tab, you can toggle "Activity Status". When disabled, other users cannot see when you are online or active in the workspace.'
    },
    {
      id: 'calls-1',
      category: 'calls',
      title: 'How do I start a voice or video call?',
      content: 'Navigate to the Calls tab in the main navigation. You can start high-definition encrypted voice or video sessions directly with any active contact.'
    },
    {
      id: 'tech-1',
      category: 'tech',
      title: 'What should I do if the app is slow?',
      content: 'Make sure your browser is up to date, clear cache, or check if compact mode is enabled to reduce UI rendering depth. If problems persist, file a report in the Bug Report tab.'
    }
  ];

  // Fetch Blocked Users
  const fetchBlockedUsers = async () => {
    setIsFetchingBlocked(true);
    try {
      const res = await axiosInstance.get('/users/blocked');
      setBlockedUsers(res.data);
    } catch (err) {
      console.error("Failed to fetch blocked users:", err);
    } finally {
      setIsFetchingBlocked(false);
    }
  };

  // Fetch Tickets
  const fetchTickets = async () => {
    try {
      const res = await axiosInstance.get('/support/tickets');
      setTickets(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Admin Tickets & Bugs
  const fetchAdminData = async () => {
    setIsAdminLoading(true);
    try {
      const [ticketsRes, bugsRes] = await Promise.all([
        axiosInstance.get('/support/admin/tickets'),
        axiosInstance.get('/support/admin/bugs')
      ]);
      setAdminTickets(ticketsRes.data);
      setAdminBugs(bugsRes.data);
      if (adminTab === 'tickets' && ticketsRes.data.length > 0) {
        setSelectedAdminItem({ type: 'ticket', ...ticketsRes.data[0] });
      } else if (adminTab === 'bugs' && bugsRes.data.length > 0) {
        setSelectedAdminItem({ type: 'bug', ...bugsRes.data[0] });
      }
    } catch (err) {
      console.error("Failed to fetch admin support data:", err);
    } finally {
      setIsAdminLoading(false);
    }
  };

  // Tab change triggers
  useEffect(() => {
    if (activeTab === 'privacy') {
      fetchBlockedUsers();
    } else if (activeTab === 'support') {
      fetchTickets();
    } else if (activeTab === 'admin_support' && user?.role === 'admin') {
      fetchAdminData();
    }
  }, [activeTab]);

  const handlePrivacyChange = async (type, value) => {
    if (type === 'readReceipts') setReadReceipts(value);
    if (type === 'onlineStatus') setOnlineStatus(value);
    try {
      await updatePrivacySettings({ [type]: value });
    } catch (err) {
      if (type === 'readReceipts') setReadReceipts(!value);
      if (type === 'onlineStatus') setOnlineStatus(!value);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdjustingImage(reader.result);
        setIsAdjustOpen(true);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
  };

  const handleSaveChanges = async (e, newProfilePic = undefined) => {
    if (e) e.preventDefault();
    try {
      const payload = { displayName, bio, socialLinks };
      
      const picToSave = newProfilePic !== undefined ? newProfilePic : profilePic;
      if (picToSave !== user?.profilePic) {
        payload.profilePic = picToSave === '' ? null : picToSave;
      }

      await updateProfile(payload);
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const handleChangeUsername = async (e) => {
    e.preventDefault();
    if (username.trim() === user?.username) return;
    try {
      await changeUsername(username);
    } catch (err) {
      toast.error('Failed to update username');
    }
  };

  const handleUnblock = async (blockedUserId) => {
    try {
      await axiosInstance.post(`/users/unblock/${blockedUserId}`);
      setBlockedUsers(prev => prev.filter(u => u._id !== blockedUserId));
      useFriendStore.getState().getFriends();
      useFriendStore.getState().getRequests();
      toast.success('User unblocked successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to unblock user');
    }
  };

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      return toast.error("New passwords do not match");
    }
    setIsChangingPassword(true);
    try {
      await axiosInstance.post('/auth/change-password', { oldPassword, newPassword });
      toast.success('Password updated successfully!');
      setIsPasswordFormOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!supportSubject.trim() || !supportDescription.trim()) return;
    setIsSubmittingTicket(true);
    try {
      const res = await axiosInstance.post('/support/tickets', {
        subject: supportSubject,
        category: supportCategory,
        description: supportDescription
      });
      toast.success('Support ticket submitted successfully!');
      setSupportSubject('');
      setSupportDescription('');
      setTickets(prev => [res.data, ...prev]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleSubmitBug = async (e) => {
    e.preventDefault();
    if (!bugTitle.trim() || !bugSteps.trim() || !bugExpected.trim() || !bugActual.trim()) return;
    setIsSubmittingBug(true);
    try {
      await axiosInstance.post('/support/bugs', {
        title: bugTitle,
        stepsToReproduce: bugSteps,
        expectedBehavior: bugExpected,
        actualBehavior: bugActual,
        screenshot: "",
        additionalNotes: bugNotes
      });
      setBugSubmittedSuccess(true);
      toast.success('Bug report filed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit bug report');
    } finally {
      setIsSubmittingBug(false);
    }
  };

  const handleUpdateAdminStatus = async (status) => {
    if (!selectedAdminItem) return;
    const isTicket = selectedAdminItem.type === 'ticket';
    const endpoint = isTicket 
      ? `/support/admin/tickets/${selectedAdminItem._id}`
      : `/support/admin/bugs/${selectedAdminItem._id}`;
    
    try {
      const res = await axiosInstance.put(endpoint, { status });
      toast.success(`Status updated to ${status}`);
      
      // Update local state
      if (isTicket) {
        setAdminTickets(prev => prev.map(t => t._id === selectedAdminItem._id ? { ...t, status: res.data.status } : t));
      } else {
        setAdminBugs(prev => prev.map(b => b._id === selectedAdminItem._id ? { ...b, status: res.data.status } : b));
      }
      setSelectedAdminItem(prev => ({ ...prev, status: res.data.status }));
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const resetBugForm = () => {
    setBugTitle('');
    setBugSteps('');
    setBugExpected('');
    setBugActual('');
    setBugNotes('');
    setBugSubmittedSuccess(false);
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: <UserRound size={16} /> },
    { id: 'account', label: 'Account', icon: <Fingerprint size={16} /> },
    { id: 'privacy', label: 'Privacy & Safety', icon: <Lock size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Monitor size={16} /> },
    { id: 'help', label: 'Help Center', icon: <HelpCircle size={16} /> },
    { id: 'support', label: 'Contact Support', icon: <MessageSquare size={16} /> },
    ...(user?.role === 'admin' ? [{ id: 'admin_support', label: 'Support Manager', icon: <Shield size={16} /> }] : [])
  ];

  // Helper to format url safely
  const formatUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
  };

  const getSocialIcon = (key, iconSize = 16) => {
    switch (key) {
      case 'website':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        );
      case 'instagram':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
          </svg>
        );
      case 'twitter':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
          </svg>
        );
      case 'linkedin':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
            <rect width="4" h="12" x="2" y="9" />
            <circle cx="4" cy="4" r="2" />
          </svg>
        );
      case 'github':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
          </svg>
        );
      case 'youtube':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
            <polygon points="10 15 15 12 10 9" />
          </svg>
        );
      case 'discord':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18.5 4h-13L4 7.5v11l3-3h11.5a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1z" />
            <circle cx="9" cy="9" r="1" />
            <circle cx="15" cy="9" r="1" />
          </svg>
        );
      default: return <ExternalLink size={16} />;
    }
  };

  // --- Password Validation Logic ---
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword);
  const reqsMetCount = [hasMinLength, hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length;
  
  let strengthColor = 'bg-surface-container-high';
  if (newPassword.length > 0) {
    if (reqsMetCount <= 1) strengthColor = 'bg-rose-500';
    else if (reqsMetCount === 2) strengthColor = 'bg-orange-500';
    else if (reqsMetCount === 3) strengthColor = 'bg-yellow-500';
    else if (reqsMetCount === 4) strengthColor = 'bg-emerald-500';
  }

  // Render Profile View
  const renderProfile = () => {
    const activeSocials = Object.entries(socialLinks).filter(([_, val]) => val && val.trim() !== '');
    const memberSince = user?.createdAt 
      ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
      : 'June 2026';

    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Profile Hero Section */}
        <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 relative overflow-hidden flex flex-col lg:flex-row gap-8 items-center lg:items-stretch">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-3xl rounded-full -mr-32 -mt-32 pointer-events-none"></div>
          
          {/* Left: Avatar with Ring and Quick Edit Option */}
          <div className="relative shrink-0 flex flex-col items-center justify-center">
            <div className="relative group">
              <div className="w-32 h-32 md:w-36 md:h-36 rounded-full bg-surface-container-high border-[5px] border-background flex items-center justify-center overflow-hidden ring-1 ring-outline-variant/20 shadow-lg transition-transform duration-300 group-hover:scale-[1.02]">
                  <Avatar src={profilePic} name={displayName || user?.username} sizeClass="w-full h-full" textClass="text-4xl md:text-5xl" />
              </div>
              
              <label className="absolute bottom-1 right-1 w-10 h-10 bg-surface rounded-full border border-outline-variant/30 flex items-center justify-center cursor-pointer shadow-md text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-surface-container transition-all active:scale-90">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><path d="m16 9.5 3 3L10 22H7v-3Z"/></svg>
                <input type="file" accept="image/*" className="hidden" id="hero-avatar-upload" onChange={handleImageChange} />
              </label>
            </div>
          </div>

          {/* Middle: Name, badges, details, bio, and social bar */}
          <div className="flex-1 flex flex-col justify-between text-center lg:text-left gap-4">
            <div>
              {/* Name & Account Badges */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 flex-wrap">
                <h3 className="text-3xl font-black text-on-surface tracking-tight leading-none">{displayName || 'Jayanth Chowdary'}</h3>
                
                <div className="flex items-center gap-2">
                  {/* Account Status Badge */}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active Account
                  </span>
                  
                  {/* Email Verification Status Badge */}
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Email Verified
                  </span>
                </div>
              </div>
              
              {/* Handles & Email */}
              <div className="mt-2.5 flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1.5 text-sm font-semibold text-on-surface-variant">
                <span>@{username || 'jayanth'}</span>
                <span className="hidden sm:inline text-outline-variant/60">•</span>
                <span>{user?.email || 'No email registered'}</span>
                <span className="hidden sm:inline text-outline-variant/60">•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} className="text-primary/70" />
                  Member since {memberSince}
                </span>
              </div>

              {/* Bio Summary inside Hero */}
              <p className="mt-4 text-sm font-medium text-on-surface-variant/90 max-w-2xl leading-relaxed">
                {bio || "No biography provided. Click Edit Profile below to add your bio and tell others about yourself."}
              </p>
            </div>

            {/* Populated Social Links Bar in Hero */}
            <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/10 text-left">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">Verified Connections</span>
              {activeSocials.length > 0 ? (
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  {activeSocials.map(([key, val]) => (
                    <a 
                      key={key} 
                      href={formatUrl(val)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/25 hover:border-primary/40 flex items-center gap-2 text-xs font-bold text-on-surface-variant hover:text-primary transition-all shadow-sm"
                    >
                      {getSocialIcon(key, 13)}
                      <span className="capitalize">{key === 'website' ? 'Portfolio' : key}</span>
                    </a>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-on-surface-variant/40 italic">No social links configured. Add your profiles in the Bento card below.</span>
              )}
            </div>
          </div>

          {/* Right Action Stack: Edit, Upload, Remove */}
          <div className="lg:w-56 flex flex-col justify-center gap-3 pt-6 lg:pt-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-outline-variant/15 shrink-0">
            <button 
              type="button"
              onClick={() => {
                const target = document.getElementById('about-identity-card');
                if (target) {
                  target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  target.classList.add('ring-2', 'ring-primary/50');
                  setTimeout(() => target.classList.remove('ring-2', 'ring-primary/50'), 2000);
                }
              }}
              className="w-full px-4 py-2.5 bg-primary hover:opacity-95 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-black/10 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
              Edit Profile
            </button>

            <label htmlFor="hero-avatar-upload" className="w-full px-4 py-2.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Upload Photo
            </label>

            {profilePic && (
              <button 
                type="button" 
                onClick={() => { setProfilePic(null); handleSaveChanges(null, null); }}
                className="w-full px-4 py-2.5 border border-red-500/20 text-red-500 hover:bg-red-500/5 hover:text-red-600 transition-colors text-xs font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                Remove Photo
              </button>
            )}
          </div>
        </div>

        {/* Identity & Details Form */}
        <form onSubmit={handleSaveChanges} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 text-left">
          
          {/* Card 1: About (lg:col-span-7) */}
          <div id="about-identity-card" className="bg-surface p-8 rounded-3xl border border-outline-variant/20 lg:col-span-7 flex flex-col justify-between transition-all duration-300 relative">
            <div className="mb-4">
              <h4 className="text-base font-black text-on-surface tracking-tight">About Me</h4>
              <p className="text-xs text-on-surface-variant">Update your public identity details.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Display Name</label>
                <input 
                  type="text" 
                  required
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold text-on-surface placeholder:text-on-surface-variant/30" 
                  placeholder="Jayanth Chowdary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Biography</label>
                  <span className="text-[10px] text-on-surface-variant/60 font-semibold">{bio.length}/150</span>
                </div>
                <textarea 
                  value={bio} 
                  maxLength={150}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-medium text-on-surface placeholder:text-on-surface-variant/30 min-h-[96px] resize-none" 
                  placeholder="Tell your friends something about yourself..."
                />
              </div>
            </div>
          </div>

          {/* Card 2: Account Information (lg:col-span-5) */}
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 lg:col-span-5 flex flex-col justify-between relative overflow-hidden">
            <div>
              <h4 className="text-base font-black text-on-surface tracking-tight mb-0.5">Account Information</h4>
              <p className="text-xs text-on-surface-variant mb-4">Core platform and network records.</p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/10">
                <span className="font-bold text-on-surface-variant">Registered Email</span>
                <span className="font-semibold text-on-surface flex items-center gap-1.5">
                  {user?.email || 'N/A'}
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Verified"></span>
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/10">
                <span className="font-bold text-on-surface-variant">Access Level</span>
                <span className="font-semibold text-on-surface uppercase tracking-wide px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px]">
                  {user?.role || 'User'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/10">
                <span className="font-bold text-on-surface-variant">Security Verification</span>
                <span className="font-semibold text-emerald-500 flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="mb-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Profile Secure
                </span>
              </div>
              <div className="flex flex-col gap-1 pt-1">
                <span className="font-bold text-on-surface-variant mb-1">Username History</span>
                <div className="flex flex-wrap gap-1.5">
                  {user?.previousUsernames && user.previousUsernames.length > 0 ? (
                    user.previousUsernames.map((prev, idx) => (
                      <span key={idx} className="px-2 py-1 bg-surface-container rounded-md text-[10px] font-semibold text-on-surface-variant">
                        @{prev}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-on-surface-variant/50 italic">No previous handles recorded.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Social Links Hub (lg:col-span-8) */}
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 lg:col-span-8 flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-base font-black text-on-surface tracking-tight">Social Network Connections</h4>
              <p className="text-xs text-on-surface-variant">Configure URLs to display on your Orbit profile card.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.keys(socialLinks).map((key) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5 capitalize">
                    {getSocialIcon(key, 12)}
                    {key}
                  </label>
                  <input 
                    type="text"
                    value={socialLinks[key]}
                    onChange={(e) => setSocialLinks(prev => ({ ...prev, [key]: e.target.value }))}
                    className="w-full px-3.5 py-2 bg-background border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-xs font-semibold text-on-surface placeholder:text-on-surface-variant/30"
                    placeholder={`e.g. ${key === 'website' ? 'https://example.com' : 'username'}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Preferences & Privacy (lg:col-span-4) */}
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 lg:col-span-4 flex flex-col justify-between">
            <div>
              <h4 className="text-base font-black text-on-surface tracking-tight mb-0.5">Quick Privacy Preferences</h4>
              <p className="text-xs text-on-surface-variant mb-4">Manage receipt status and activity indicators.</p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Read Receipts Checkbox Toggle */}
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-outline-variant/10">
                <div className="text-left">
                  <span className="text-xs font-bold text-on-surface block">Read Receipts</span>
                  <span className="text-[10px] text-on-surface-variant">Let others see when you read messages.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={readReceipts}
                    onChange={() => handlePrivacyChange('readReceipts', !readReceipts)}
                  />
                  <div className="w-9 h-5 bg-outline-variant/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Online Activity Toggle */}
              <div className="flex items-center justify-between p-3 bg-background/50 rounded-xl border border-outline-variant/10">
                <div className="text-left">
                  <span className="text-xs font-bold text-on-surface block">Online Status</span>
                  <span className="text-[10px] text-on-surface-variant">Display active indicator badge.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={onlineStatus}
                    onChange={() => handlePrivacyChange('onlineStatus', !onlineStatus)}
                  />
                  <div className="w-9 h-5 bg-outline-variant/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-surface after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Theme Quick Link */}
              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className="w-full py-2 bg-surface-container hover:bg-surface-container-high text-xs font-bold text-primary rounded-xl transition-all border border-outline-variant/15 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Monitor size={12} />
                Customize Theme
              </button>
            </div>
          </div>

          {/* Save Action Banner */}
          <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 lg:col-span-12 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-left">
              <h4 className="text-sm font-bold text-on-surface mb-1">Orbit Account Synchronization</h4>
              <p className="text-xs font-medium text-on-surface-variant">Changes will sync across all active sessions instantly.</p>
            </div>
            <button 
              type="submit" 
              disabled={isUpdatingProfile}
              className="px-8 py-3 bg-on-surface hover:bg-on-surface/90 text-surface text-sm font-bold rounded-xl transition-transform flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95 w-full sm:w-auto"
            >
              {isUpdatingProfile ? <Loader2 size={18} className="animate-spin" /> : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Render Account View
  const renderAccount = () => (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Username Editor Card */}
      <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 xl:col-span-8 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
        <div className="relative z-10 text-left">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-on-surface tracking-tight mb-1">Orbit Identity</h2>
              <p className="text-sm font-medium text-on-surface-variant">Update your unique platform handle.</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Fingerprint size={24} />
            </div>
          </div>
          
          <form onSubmit={handleChangeUsername} className="space-y-6">
            <div className="relative flex items-center">
              <span className="absolute left-5 text-primary font-black text-xl">@</span>
              <input 
                type="text" 
                disabled={(user?.usernameChanges || 0) >= (user?.maxUsernameChanges || 3)} 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="new_username"
                className={`w-full pl-12 pr-4 py-4 rounded-2xl border-2 text-lg font-bold focus:outline-none transition-all shadow-inner ${
                  (user?.usernameChanges || 0) >= (user?.maxUsernameChanges || 3) 
                    ? 'bg-surface-container border-outline-variant/30 text-on-surface-variant cursor-not-allowed' 
                    : 'bg-surface-container-lowest border-outline-variant/30 focus:border-primary focus:bg-surface text-on-surface'
                }`} 
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isUpdatingProfile || (user?.usernameChanges || 0) >= (user?.maxUsernameChanges || 3) || username === user?.username}
              className="px-6 py-3.5 bg-on-surface hover:bg-on-surface/90 text-surface text-sm font-bold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer w-full sm:w-auto hover:-translate-y-0.5 active:translate-y-0"
            >
              {isUpdatingProfile ? <Loader2 size={16} className="animate-spin" /> : 'Confirm New Identity'}
            </button>
            
            {(user?.usernameChanges || 0) >= (user?.maxUsernameChanges || 3) && (
              <button
                type="button"
                onClick={() => setIsUsernameRequestModalOpen(true)}
                className="mt-4 px-6 py-3.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-bold rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer w-full"
              >
                Request Additional Changes
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Account Limits Card */}
      <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 xl:col-span-4 flex flex-col items-center justify-center text-center relative overflow-hidden group hover:border-primary/30 transition-colors min-h-[250px]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-container-high/50 pointer-events-none"></div>
        <div className="relative z-10 w-24 h-24 rounded-full bg-surface-container-highest border-4 border-surface shadow-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-105">
          <span className={`text-4xl font-black ${(user?.usernameChanges || 0) >= (user?.maxUsernameChanges || 3) ? 'text-red-500' : 'text-primary'}`}>
            {(user?.maxUsernameChanges || 3) - (user?.usernameChanges || 0)}
          </span>
        </div>
        <h3 className="text-base font-black text-on-surface uppercase tracking-widest mb-2">Changes Remaining</h3>
        <p className="text-sm font-medium text-on-surface-variant px-4">
          {(user?.usernameChanges || 0) >= (user?.maxUsernameChanges || 3) 
            ? "You have exhausted your username changes to prevent network spam." 
            : "Use your changes wisely. This limit prevents identity spoofing."}
        </p>
      </div>

      {/* History Card */}
      {user?.previousUsernames && user.previousUsernames.length > 0 && (
        <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 xl:col-span-12 text-left">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center text-on-surface-variant">
              <Clock size={16} />
            </div>
            <h3 className="text-sm font-black text-on-surface-variant uppercase tracking-widest">Public Alias History</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {user.previousUsernames.map((prev, index) => (
              <div key={index} className="flex items-center gap-2 px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/30 text-sm font-bold text-on-surface rounded-xl shadow-sm">
                <span className="text-on-surface-variant">@</span>{prev}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render Privacy View
  const renderPrivacy = () => {
    const filteredBlocked = blockedUsers.filter(u => 
      u.displayName?.toLowerCase().includes(blockedSearch.toLowerCase()) ||
      u.username?.toLowerCase().includes(blockedSearch.toLowerCase())
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Read Receipts Card */}
        <div 
          onClick={() => handlePrivacyChange('readReceipts', !readReceipts)}
          className={`bg-surface p-8 rounded-3xl border-2 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden md:col-span-1 lg:col-span-6 flex flex-col justify-between min-h-[220px] ${readReceipts ? 'border-emerald-500/30 shadow-[0_8px_30px_rgb(16,185,129,0.05)]' : 'border-outline-variant/20'}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent transition-colors ${readReceipts ? 'to-emerald-500/5' : ''}`}></div>
          <div className="relative z-10 flex flex-col h-full text-left">
            <div className="flex justify-between items-start mb-auto">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${readReceipts ? 'bg-emerald-500/10 text-emerald-500' : 'bg-surface-container text-on-surface-variant'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>
              </div>
              <label className="relative inline-flex items-center cursor-pointer pointer-events-none mt-2">
                <input type="checkbox" className="sr-only peer" checked={readReceipts} readOnly />
                <div className="w-12 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
              </label>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-black text-on-surface mb-2">Read Receipts</h3>
              <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
                Broadcast when you've read messages. When disabled, you also lose the ability to see if others have read your messages, enforcing mutual privacy.
              </p>
            </div>
          </div>
        </div>

        {/* Online Status Card */}
        <div 
          onClick={() => handlePrivacyChange('onlineStatus', !onlineStatus)}
          className={`bg-surface p-8 rounded-3xl border-2 cursor-pointer transition-all hover:-translate-y-1 group relative overflow-hidden md:col-span-1 lg:col-span-6 flex flex-col justify-between min-h-[220px] ${onlineStatus ? 'border-primary/30 shadow-[0_8px_30px_rgb(99,102,241,0.05)]' : 'border-outline-variant/20'}`}
        >
          <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent transition-colors ${onlineStatus ? 'to-primary/5' : ''}`}></div>
          <div className="relative z-10 flex flex-col h-full text-left">
            <div className="flex justify-between items-start mb-auto">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${onlineStatus ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                <div className={`w-6 h-6 rounded-full border-4 border-surface ${onlineStatus ? 'bg-emerald-500' : 'bg-on-surface-variant'}`}></div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer pointer-events-none mt-2">
                <input type="checkbox" className="sr-only peer" checked={onlineStatus} readOnly />
                <div className="w-12 h-6 bg-surface-container-high peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
              </label>
            </div>
            <div className="mt-8">
              <h3 className="text-xl font-black text-on-surface mb-2">Activity Status</h3>
              <p className="text-sm font-medium text-on-surface-variant leading-relaxed">
                Allow your network to see when you're actively using Orbit. Hiding your status provides a true stealth communication experience.
              </p>
            </div>
          </div>
        </div>

        {/* Change Password Component - Premium Row Style */}
        <div className="bg-surface border-2 border-outline-variant/10 rounded-2xl overflow-hidden md:col-span-2 lg:col-span-12 transition-all hover:border-outline-variant/30">
          <div 
            className="flex items-center justify-between p-6 cursor-pointer hover:bg-surface-container-lowest/50 transition-colors"
            onClick={() => setIsPasswordFormOpen(!isPasswordFormOpen)}
          >
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isPasswordFormOpen ? 'bg-rose-500/10 text-rose-500' : 'bg-surface-container text-on-surface-variant'}`}>
                <Shield size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-on-surface">Change Password</h3>
                <p className="text-sm font-medium text-on-surface-variant mt-0.5">
                  Update your account password securely.
                </p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant transition-transform duration-300 ${isPasswordFormOpen ? 'rotate-180 bg-rose-500/10 text-rose-500' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          <AnimatePresence>
            {isPasswordFormOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden bg-surface-container-lowest/30"
              >
                <div className="px-6 pb-6 pt-2 border-t border-outline-variant/10">
                  <form onSubmit={handleChangePasswordSubmit} className="max-w-2xl mx-auto mt-6">
                    <div className="space-y-6">
                      
                      {/* Current Password */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Current Password</label>
                        <input 
                          type="password" 
                          required 
                          value={oldPassword} 
                          onChange={(e) => setOldPassword(e.target.value)} 
                          placeholder="Enter your current password" 
                          className="w-full px-4 py-3 bg-background border border-outline-variant/30 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all text-sm font-medium text-on-surface"
                        />
                      </div>

                      <div className="h-px w-full bg-outline-variant/10"></div>
                      
                      {/* New Password & Strength Meter */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">New Password</label>
                        <input 
                          type="password" 
                          required 
                          minLength={8}
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          placeholder="Create a strong password" 
                          className="w-full px-4 py-3 bg-background border border-outline-variant/30 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all text-sm font-medium text-on-surface"
                        />
                        
                        {/* Validation UI */}
                        {newPassword.length > 0 && (
                          <div className="mt-4 p-4 bg-surface rounded-xl border border-outline-variant/20">
                            <div className="flex gap-1.5 h-1.5 w-full mb-4">
                              {[...Array(4)].map((_, i) => (
                                <div key={i} className={`flex-1 rounded-full transition-colors duration-300 ${i < reqsMetCount ? strengthColor : 'bg-surface-container-high'}`}></div>
                              ))}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4">
                              <div className={`flex items-center gap-2 text-xs font-semibold ${hasMinLength ? 'text-emerald-500' : 'text-on-surface-variant'}`}>
                                <Check size={14} className={hasMinLength ? 'opacity-100' : 'opacity-40'}/> 8+ characters
                              </div>
                              <div className={`flex items-center gap-2 text-xs font-semibold ${hasUpperCase ? 'text-emerald-500' : 'text-on-surface-variant'}`}>
                                <Check size={14} className={hasUpperCase ? 'opacity-100' : 'opacity-40'}/> 1 uppercase letter
                              </div>
                              <div className={`flex items-center gap-2 text-xs font-semibold ${hasNumber ? 'text-emerald-500' : 'text-on-surface-variant'}`}>
                                <Check size={14} className={hasNumber ? 'opacity-100' : 'opacity-40'}/> 1 number
                              </div>
                              <div className={`flex items-center gap-2 text-xs font-semibold ${hasSpecialChar ? 'text-emerald-500' : 'text-on-surface-variant'}`}>
                                <Check size={14} className={hasSpecialChar ? 'opacity-100' : 'opacity-40'}/> 1 special character
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider">Confirm New Password</label>
                        <input 
                          type="password" 
                          required 
                          minLength={8}
                          value={confirmNewPassword} 
                          onChange={(e) => setConfirmNewPassword(e.target.value)} 
                          placeholder="Confirm your new password" 
                          className="w-full px-4 py-3 bg-background border border-outline-variant/30 rounded-xl focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all text-sm font-medium text-on-surface"
                        />
                      </div>

                    </div>
                    
                    {/* Action Footer */}
                    <div className="flex justify-end items-center gap-3 mt-8 pt-6 border-t border-outline-variant/10">
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsPasswordFormOpen(false);
                          setOldPassword('');
                          setNewPassword('');
                          setConfirmNewPassword('');
                        }}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={isChangingPassword || reqsMetCount < 4 || newPassword !== confirmNewPassword || !oldPassword}
                        className="px-6 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-rose-500 flex items-center gap-2 shadow-md shadow-rose-500/20"
                      >
                        {isChangingPassword ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Blocked Contacts Management Card */}
        <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 md:col-span-2 lg:col-span-12 flex flex-col text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-black text-on-surface tracking-tight">Blocked Contacts</h3>
              <p className="text-sm font-medium text-on-surface-variant">Manage accounts that you have blocked from contacting you.</p>
            </div>
            
            {/* Search Blocked List */}
            <div className="relative flex items-center w-full sm:w-72">
              <Search className="absolute left-3.5 text-on-surface-variant/40" size={18} />
              <input
                type="text"
                placeholder="Search blocked contacts..."
                value={blockedSearch}
                onChange={(e) => setBlockedSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-outline-variant/30 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold text-on-surface"
              />
            </div>
          </div>

          {/* Blocked Users Grid */}
          {isFetchingBlocked ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          ) : filteredBlocked.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBlocked.map((blockedUser) => (
                <div 
                  key={blockedUser._id}
                  className="flex items-center justify-between p-4 bg-background border border-outline-variant/35 rounded-2xl"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={blockedUser.profilePic || jayanthPic} 
                      alt={blockedUser.displayName} 
                      className="w-10 h-10 rounded-full object-cover bg-surface-container"
                    />
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-on-surface truncate">{blockedUser.displayName}</h4>
                      <p className="text-xs text-on-surface-variant truncate">@{blockedUser.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblock(blockedUser._id)}
                    className="px-3.5 py-1.5 bg-surface hover:bg-surface-container border border-outline-variant text-on-surface text-xs font-bold rounded-xl transition-all hover:text-emerald-500 cursor-pointer"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-background/50 rounded-2xl border border-dashed border-outline-variant/30">
              <UserX className="text-on-surface-variant/30 mb-3" size={40} />
              <h4 className="text-sm font-black text-on-surface-variant uppercase tracking-wider mb-1">No Blocked Contacts</h4>
              <p className="text-xs text-on-surface-variant max-w-sm px-6">
                {blockedSearch ? "No blocked contacts match your search query." : "Accounts you block will appear here. They won't be able to chat, view status, or request you."}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Help Center View
  const renderHelp = () => {
    const filteredFaqs = faqs.filter(faq => 
      faq.title.toLowerCase().includes(helpSearch.toLowerCase()) ||
      faq.content.toLowerCase().includes(helpSearch.toLowerCase())
    );

    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Support Document Reader Modal overlay */}
        {selectedHelpItem && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface max-w-2xl w-full rounded-3xl border border-outline-variant/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="px-8 py-6 border-b border-outline-variant/15 flex items-center justify-between bg-surface-container-low">
                <div className="flex items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  <span className="text-xs font-black uppercase tracking-wider text-on-surface-variant">{selectedHelpItem.category} document</span>
                </div>
                <button 
                  onClick={() => setSelectedHelpItem(null)}
                  className="p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="p-8 max-h-[60vh] overflow-y-auto font-sans leading-relaxed text-on-surface-variant/90 space-y-4 text-left">
                <h2 className="text-2xl font-black text-on-surface tracking-tight mb-4">{selectedHelpItem.title}</h2>
                <div className="text-sm whitespace-pre-wrap">{selectedHelpItem.content}</div>
              </div>
              <div className="px-8 py-5 border-t border-outline-variant/15 flex justify-end bg-surface-container-low">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedHelpItem.content);
                    toast.success('Document copied to clipboard');
                  }}
                  className="px-4 py-2 bg-on-surface text-surface hover:bg-on-surface/90 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Copy Text
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Search Bar Banner */}
        <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary/5 to-transparent pointer-events-none"></div>
          <h2 className="text-2xl font-black text-on-surface tracking-tight mb-2">Knowledge Base & Guides</h2>
          <p className="text-sm text-on-surface-variant mb-6 max-w-lg">
            Search our platform FAQs, community guidelines, and legal documents immediately.
          </p>

          <div className="relative flex items-center w-full max-w-xl">
            <Search className="absolute left-4 text-on-surface-variant/40" size={20} />
            <input
              type="text"
              placeholder="Search help articles..."
              value={helpSearch}
              onChange={(e) => setHelpSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-background border border-outline-variant/30 rounded-2xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm font-semibold text-on-surface"
            />
          </div>
        </div>

        {/* Legal Quick Docs Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => setSelectedHelpItem(faqs[0])}
            className="bg-surface p-6 rounded-2xl border border-outline-variant/25 hover:border-primary/40 cursor-pointer transition-all hover:-translate-y-0.5 text-left"
          >
            <ShieldAlert className="text-primary mb-3" size={24} />
            <h4 className="text-sm font-black text-on-surface uppercase tracking-wider mb-2">Terms of Service</h4>
            <p className="text-xs text-on-surface-variant">Platform rules, account restrictions, and code of conduct.</p>
          </div>
          <div 
            onClick={() => setSelectedHelpItem(faqs[1])}
            className="bg-surface p-6 rounded-2xl border border-outline-variant/25 hover:border-primary/40 cursor-pointer transition-all hover:-translate-y-0.5 text-left"
          >
            <Shield className="text-primary mb-3" size={24} />
            <h4 className="text-sm font-black text-on-surface uppercase tracking-wider mb-2">Privacy Policy</h4>
            <p className="text-xs text-on-surface-variant">How we encrypt data, handle cookies, and safeguard messages.</p>
          </div>
          <div 
            onClick={() => setSelectedHelpItem(faqs[2])}
            className="bg-surface p-6 rounded-2xl border border-outline-variant/25 hover:border-primary/40 cursor-pointer transition-all hover:-translate-y-0.5 text-left"
          >
            <UserRound className="text-primary mb-3" size={24} />
            <h4 className="text-sm font-black text-on-surface uppercase tracking-wider mb-2">Community Guidelines</h4>
            <p className="text-xs text-on-surface-variant">Acceptable behavior standards for safe user communication.</p>
          </div>
        </div>

        {/* FAQs list bento grid */}
        <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 text-left">
          <h3 className="text-lg font-black text-on-surface mb-6">Frequently Asked Questions</h3>
          
          {filteredFaqs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredFaqs.filter(item => item.id !== 'terms' && item.id !== 'privacy-policy' && item.id !== 'guidelines').map(faq => (
                <div 
                  key={faq.id}
                  onClick={() => setSelectedHelpItem(faq)}
                  className="p-5 bg-background border border-outline-variant/30 rounded-2xl hover:border-primary/30 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full inline-block mb-3">
                      {faq.category}
                    </span>
                    <h4 className="text-sm font-bold text-on-surface mb-2">{faq.title}</h4>
                    <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{faq.content}</p>
                  </div>
                  <span className="text-[10px] font-bold text-on-surface-variant/40 mt-4 flex items-center gap-1 group-hover:text-primary">
                    Read Document <ExternalLink size={10} />
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-background/50 rounded-2xl border border-dashed border-outline-variant/30">
              <AlertCircle className="text-on-surface-variant/30 mb-2 mx-auto" size={32} />
              <p className="text-xs text-on-surface-variant">No FAQs found matching your search query.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Contact Support & Bug Report View
  const renderSupport = () => {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Left Form Area (xl:col-span-7) */}
        <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 xl:col-span-7 text-left flex flex-col justify-between">
          <div>
            {/* Unified Header */}
            <h3 className="text-xl font-black text-on-surface tracking-tight mb-1">Support Desk</h3>
            <p className="text-sm text-on-surface-variant mb-6">Need assistance or found an issue? Select an option below to contact our team.</p>

            {/* Segmented Control Switcher */}
            <div className="grid grid-cols-2 p-1 bg-surface-container rounded-2xl border border-outline-variant/15 mb-6">
              <button
                type="button"
                onClick={() => setSupportFormType('ticket')}
                className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  supportFormType === 'ticket'
                    ? 'bg-surface text-on-surface shadow-sm border border-outline-variant/10'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <MessageSquare size={14} />
                General Ticket
              </button>
              <button
                type="button"
                onClick={() => setSupportFormType('bug')}
                className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  supportFormType === 'bug'
                    ? 'bg-surface text-on-surface shadow-sm border border-outline-variant/10'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Bug size={14} />
                Report a Bug
              </button>
            </div>

            {/* Conditional Forms rendering */}
            {supportFormType === 'ticket' ? (
              <form onSubmit={handleSubmitTicket} className="space-y-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Ticket Category</label>
                  <Select
                    value={supportCategory}
                    onChange={(val) => setSupportCategory(val)}
                    options={[
                      'Account Issue',
                      'Messaging Issue',
                      'Privacy Issue',
                      'Technical Issue',
                      'Feature Request',
                      'Other'
                    ]}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Subject</label>
                  <input
                    type="text"
                    required
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    placeholder="e.g. Cannot update display initials"
                    className="w-full px-3.5 py-2.5 bg-background border border-outline-variant/30 rounded-xl focus:border-primary outline-none transition-all text-sm font-semibold text-on-surface"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Detailed Description</label>
                  <textarea
                    required
                    value={supportDescription}
                    onChange={(e) => setSupportDescription(e.target.value)}
                    placeholder="Provide context or explanation about the problem..."
                    className="w-full px-3.5 py-2.5 bg-background border border-outline-variant/30 rounded-xl focus:border-primary outline-none transition-all text-sm font-medium text-on-surface min-h-[140px] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="w-full px-5 py-3 bg-on-surface text-surface hover:bg-on-surface/90 text-sm font-bold rounded-xl transition-transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTicket ? <Loader2 size={16} className="animate-spin" /> : 'Submit Support Ticket'}
                </button>
              </form>
            ) : (
              <div>
                {bugSubmittedSuccess ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-6">
                      <CheckCircle2 size={40} />
                    </div>
                    <h3 className="text-xl font-black text-on-surface tracking-tight mb-2">Bug Report Submitted</h3>
                    <p className="text-xs text-on-surface-variant max-w-sm mb-6">
                      Thank you for helping us improve Orbit! We have received your report and will look into it as soon as possible.
                    </p>
                    <button
                      type="button"
                      onClick={resetBugForm}
                      className="px-6 py-2.5 bg-on-surface text-surface hover:bg-on-surface/90 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Report Another Bug
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitBug} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">What is the issue?</label>
                      <input
                        type="text"
                        required
                        value={bugTitle}
                        onChange={(e) => setBugTitle(e.target.value)}
                        placeholder="e.g. Can't update my display name"
                        className="w-full px-3.5 py-2.5 bg-background border border-outline-variant/30 rounded-xl focus:border-primary outline-none transition-all text-sm font-semibold text-on-surface"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">How can we recreate it?</label>
                        <textarea
                          required
                          value={bugSteps}
                          onChange={(e) => setBugSteps(e.target.value)}
                          placeholder="Describe step-by-step what you did:&#10;1. Open settings&#10;2. Type a new name&#10;3. Click save..."
                          className="w-full px-3.5 py-2 bg-background border border-outline-variant/30 rounded-xl focus:border-primary outline-none transition-all text-xs font-medium text-on-surface min-h-[96px] resize-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">What did you expect?</label>
                        <textarea
                          required
                          value={bugExpected}
                          onChange={(e) => setBugExpected(e.target.value)}
                          placeholder="e.g. My profile details should update and save correctly."
                          className="w-full px-3.5 py-2 bg-background border border-outline-variant/30 rounded-xl focus:border-primary outline-none transition-all text-xs font-medium text-on-surface min-h-[96px] resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">What actually happened?</label>
                      <textarea
                        required
                        value={bugActual}
                        onChange={(e) => setBugActual(e.target.value)}
                        placeholder="e.g. The screen stayed loading forever and didn't update my profile."
                        className="w-full px-3.5 py-2 bg-background border border-outline-variant/30 rounded-xl focus:border-primary outline-none transition-all text-xs font-medium text-on-surface min-h-[72px] resize-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Additional details (Optional)</label>
                      <input
                        type="text"
                        value={bugNotes}
                        onChange={(e) => setBugNotes(e.target.value)}
                        placeholder="e.g. Only seems to happen when using my phone"
                        className="w-full px-3.5 py-2.5 bg-background border border-outline-variant/30 rounded-xl focus:border-primary outline-none transition-all text-xs font-semibold text-on-surface"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingBug}
                      className="w-full px-5 py-3 bg-on-surface text-surface hover:bg-on-surface/90 text-sm font-bold rounded-xl transition-transform active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingBug ? <Loader2 size={16} className="animate-spin" /> : 'Submit Bug Report'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Ticket History (xl:col-span-5) */}
        <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 xl:col-span-5 flex flex-col max-h-[600px] overflow-y-auto text-left">
          <h3 className="text-lg font-black text-on-surface tracking-tight mb-1">Ticket History</h3>
          <p className="text-sm text-on-surface-variant mb-6">Live status updates on your historical support tickets.</p>

          {tickets.length > 0 ? (
            <div className="space-y-4">
              {tickets.map((t) => (
                <div 
                  key={t._id}
                  className="p-4 bg-background border border-outline-variant/35 rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 bg-surface-container rounded-full text-on-surface-variant">
                      {t.category}
                    </span>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      t.status === 'Open' ? 'bg-blue-500/10 text-blue-500' :
                      t.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500' :
                      t.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500' :
                      'bg-on-surface-variant/10 text-on-surface-variant'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-on-surface leading-tight mb-1">{t.subject}</h4>
                    <p className="text-xs text-on-surface-variant/80 line-clamp-2 leading-relaxed">{t.description}</p>
                  </div>
                  <div className="text-[10px] text-on-surface-variant/50 pt-2 border-t border-outline-variant/15 flex items-center gap-1.5">
                    <Clock size={12} />
                    {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-background/50 rounded-2xl border border-dashed border-outline-variant/30 flex-1">
              <MessageSquare className="text-on-surface-variant/30 mb-2" size={32} />
              <p className="text-xs text-on-surface-variant">No submitted tickets found.</p>
            </div>
          )}
        </div>
      </div>
    );
  };


  // Render Admin Support Dashboard
  const renderAdminSupport = () => {
    const listItems = adminTab === 'tickets' ? adminTickets : adminBugs;
    
    // Filter & Search listing
    const filteredList = listItems.filter(item => {
      const matchesStatus = adminFilterStatus === 'All' || item.status === adminFilterStatus;
      
      const titleText = adminTab === 'tickets' ? item.subject : item.title;
      const userText = item.user?.displayName || item.user?.username || '';
      const matchesSearch = titleText?.toLowerCase().includes(adminSearch.toLowerCase()) ||
                            userText?.toLowerCase().includes(adminSearch.toLowerCase());
      
      return matchesStatus && matchesSearch;
    });

    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Left Side: Tickets/Bugs List */}
        <div className="bg-surface p-6 rounded-3xl border border-outline-variant/20 lg:col-span-5 flex flex-col max-h-[700px]">
          
          {/* Dashboard Head */}
          <div className="mb-4">
            <h3 className="text-base font-black text-on-surface tracking-tight mb-3 text-left">Support Manager Desk</h3>
            
            {/* Tab switch */}
            <div className="flex bg-background p-1 rounded-xl mb-4 border border-outline-variant/20">
              <button
                onClick={() => {
                  setAdminTab('tickets');
                  if (adminTickets.length > 0) {
                    setSelectedAdminItem({ type: 'ticket', ...adminTickets[0] });
                  } else {
                    setSelectedAdminItem(null);
                  }
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'tickets' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Tickets ({adminTickets.length})
              </button>
              <button
                onClick={() => {
                  setAdminTab('bugs');
                  if (adminBugs.length > 0) {
                    setSelectedAdminItem({ type: 'bug', ...adminBugs[0] });
                  } else {
                    setSelectedAdminItem(null);
                  }
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  adminTab === 'bugs' ? 'bg-surface text-on-surface shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Bugs ({adminBugs.length})
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex gap-2">
              <div className="relative flex items-center flex-1">
                <Search className="absolute left-3 text-on-surface-variant/40" size={14} />
                <input
                  type="text"
                  placeholder="Search subject/user..."
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-background border border-outline-variant/30 rounded-lg focus:border-primary outline-none text-xs text-on-surface"
                />
              </div>

              <Select
                value={adminFilterStatus}
                onChange={(val) => setAdminFilterStatus(val)}
                options={[
                  { value: 'All', label: 'All Status' },
                  { value: 'Open', label: 'Open' },
                  { value: 'In Progress', label: 'In Progress' },
                  { value: 'Resolved', label: 'Resolved' },
                  { value: 'Closed', label: 'Closed' }
                ]}
              />
            </div>
          </div>

          {/* List area */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {isAdminLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={20} />
              </div>
            ) : filteredList.length > 0 ? (
              filteredList.map((item) => {
                const isSelected = selectedAdminItem && selectedAdminItem._id === item._id;
                const title = adminTab === 'tickets' ? item.subject : item.title;
                return (
                  <div
                    key={item._id}
                    onClick={() => setSelectedAdminItem({ type: adminTab === 'tickets' ? 'ticket' : 'bug', ...item })}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-surface-container-high border-primary'
                        : 'bg-background border-outline-variant/30 hover:border-outline-variant'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="text-[9px] font-bold text-on-surface-variant truncate max-w-[120px]">
                        {item.user?.displayName || 'Unknown'}
                      </span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full ${
                        item.status === 'Open' ? 'bg-blue-500/10 text-blue-500' :
                        item.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500' :
                        item.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-on-surface-variant/10 text-on-surface-variant'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-on-surface truncate leading-tight">{title}</h4>
                    <p className="text-[10px] text-on-surface-variant/50 mt-1">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 text-on-surface-variant/40">
                <AlertCircle className="mx-auto mb-2" size={24} />
                <p className="text-xs">No entries found matching filters.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Selected Details View */}
        <div className="bg-surface p-8 rounded-3xl border border-outline-variant/20 lg:col-span-7 flex flex-col min-h-[500px]">
          {selectedAdminItem ? (
            <div className="flex flex-col justify-between h-full space-y-6">
              <div>
                
                {/* Meta details Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline-variant/15">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedAdminItem.user?.profilePic || jayanthPic}
                      alt={selectedAdminItem.user?.displayName || 'User'}
                      className="w-11 h-11 rounded-full object-cover bg-surface-container"
                    />
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-on-surface">{selectedAdminItem.user?.displayName || 'Unknown User'}</h4>
                      <p className="text-xs text-on-surface-variant">@{selectedAdminItem.user?.username || 'user'} • {selectedAdminItem.user?.email || 'No email'}</p>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-variant font-bold">Status:</span>
                    <Select
                      value={selectedAdminItem.status}
                      onChange={(val) => handleUpdateAdminStatus(val)}
                      options={[
                        'Open',
                        'In Progress',
                        'Resolved',
                        'Closed'
                      ]}
                    />
                  </div>
                </div>

                {/* Info Text Area */}
                <div className="pt-6 text-left space-y-5">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full inline-block mb-2.5">
                      {selectedAdminItem.type === 'ticket' ? `Ticket: ${selectedAdminItem.category}` : 'Developer Bug Report'}
                    </span>
                    <h3 className="text-lg font-black text-on-surface leading-tight tracking-tight">
                      {selectedAdminItem.type === 'ticket' ? selectedAdminItem.subject : selectedAdminItem.title}
                    </h3>
                  </div>

                  {selectedAdminItem.type === 'ticket' ? (
                    <div className="space-y-1">
                      <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-left">Description</h5>
                      <p className="text-sm text-on-surface-variant/90 leading-relaxed bg-background p-4 rounded-xl border border-outline-variant/15 whitespace-pre-wrap">
                        {selectedAdminItem.description}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-left">Steps To Reproduce</h5>
                        <p className="text-xs text-on-surface-variant/95 leading-relaxed bg-background p-3.5 rounded-xl border border-outline-variant/15 whitespace-pre-wrap">
                          {selectedAdminItem.stepsToReproduce}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-left">Expected Behavior</h5>
                          <p className="text-xs text-on-surface-variant/90 leading-relaxed bg-background p-3 rounded-xl border border-outline-variant/15 whitespace-pre-wrap">
                            {selectedAdminItem.expectedBehavior}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-left">Actual Behavior</h5>
                          <p className="text-xs text-on-surface-variant/90 leading-relaxed bg-background p-3 rounded-xl border border-outline-variant/15 whitespace-pre-wrap">
                            {selectedAdminItem.actualBehavior}
                          </p>
                        </div>
                      </div>

                      {selectedAdminItem.screenshot && (
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-left">Screenshot</h5>
                          <div className="max-w-sm rounded-xl overflow-hidden border border-outline-variant/30">
                            <img src={selectedAdminItem.screenshot} alt="Bug Screenshot" className="w-full h-auto" />
                          </div>
                        </div>
                      )}

                      {selectedAdminItem.additionalNotes && (
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider text-left">Additional Notes</h5>
                          <p className="text-xs text-on-surface-variant/80 italic">
                            {selectedAdminItem.additionalNotes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-on-surface-variant/45 pt-4 border-t border-outline-variant/15 flex items-center justify-between">
                <span>Database ID: {selectedAdminItem._id}</span>
                <span>Submitted: {new Date(selectedAdminItem.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center flex-1">
              <ShieldAlert className="text-on-surface-variant/25 mb-3 animate-pulse" size={44} />
              <h4 className="text-sm font-black text-on-surface-variant uppercase tracking-wider mb-1">No Item Selected</h4>
              <p className="text-xs text-on-surface-variant max-w-xs">
                Select a ticket or bug report from the left desk panel to manage and update its status.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Switch content pane
  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfile();
      case 'account': return renderAccount();
      case 'privacy': return renderPrivacy();
      case 'appearance': return <ThemeSwitcher />;
      case 'help': return renderHelp();
      case 'support': return renderSupport();
      case 'admin_support': return user?.role === 'admin' ? renderAdminSupport() : null;
      default: return null;
    }
  };

  return (
    <div className="h-full bg-surface-container-lowest w-full text-on-surface font-sans overflow-y-auto px-6 md:px-12 py-10 pb-32 flex flex-col">
      <div className="max-w-7xl w-full mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Page Hero Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="p-3 bg-surface border border-outline-variant/30 rounded-2xl text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                title="Go Back"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="text-left">
                <h1 className="text-3xl sm:text-4xl font-black text-on-surface tracking-tight leading-none">
                  Workspace Settings
                </h1>
                <p className="text-sm font-medium text-on-surface-variant mt-2">
                  Configure your presence, profile details, safety policies, and design system.
                </p>
              </div>
            </div>
            
            {/* Visual Anchor */}
            <div className="hidden sm:flex items-center gap-3 bg-surface-container-high px-4 py-2.5 rounded-2xl border border-outline-variant/30 text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              Orbit Config
            </div>
          </div>
          
          {/* Horizontal scrollable chips/tabs */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 border-b border-outline-variant/10">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                    isActive
                      ? 'bg-on-surface text-surface border-on-surface shadow-md'
                      : 'bg-surface border-outline-variant/20 text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Pane */}
        <div>
          {renderContent()}
        </div>
      </div>
      
      <UsernameRequestModal 
        isOpen={isUsernameRequestModalOpen} 
        onClose={() => setIsUsernameRequestModalOpen(false)} 
      />

      <ImageAdjustModal
        isOpen={isAdjustOpen}
        imageSrc={adjustingImage}
        onClose={() => setIsAdjustOpen(false)}
        onConfirm={(adjustedDataUrl) => {
          setProfilePic(adjustedDataUrl);
          setIsAdjustOpen(false);
          handleSaveChanges(null, adjustedDataUrl);
        }}
      />
    </div>
  );
}
