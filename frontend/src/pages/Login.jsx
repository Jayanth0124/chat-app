import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Eye, EyeOff, Mail, Lock, ShieldCheck, Zap, User as UserIcon, ArrowLeft, CheckCircle } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';
import useDebounce from '../hooks/useDebounce';
import loginImage from '../assets/images/login.png';

export default function Login({ initialMode = 'login' }) {
  const [authMode, setAuthMode] = useState(initialMode);
  const navigate = useNavigate();
  const location = useLocation();

  // Login State
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: ''
  });
  
  // Signup State
  const [signupData, setSignupData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Forgot Password State
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [lockoutTimer, setLockoutTimer] = useState(0);
  
  const { login, signup, isLoggingIn, isSigningUp } = useAuthStore();

  // Username Availability State
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState(null);
  const debouncedUsername = useDebounce(signupData.username, 500);

  useEffect(() => {
    // If URL changes, update mode but allow internal toggles (like forgot-password) to not change URL if desired
    if (location.pathname === '/signup') setAuthMode('signup');
    else if (location.pathname === '/login') setAuthMode('login');
  }, [location.pathname]);

  // Lockout Timer Countdown
  useEffect(() => {
    let timer;
    if (lockoutTimer > 0) {
      timer = setInterval(() => {
        setLockoutTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockoutTimer]);

  // Check Username Availability
  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (authMode !== 'signup') return;
      
      const isValidFormat = /^[a-zA-Z0-9_]{8,24}$/.test(debouncedUsername);
      if (!isValidFormat) {
        setIsUsernameAvailable(null);
        return;
      }

      setIsCheckingUsername(true);
      try {
        const res = await axiosInstance.post('/auth/check-username', { username: debouncedUsername });
        setIsUsernameAvailable(res.data.available);
      } catch (error) {
        setIsUsernameAvailable(false);
      } finally {
        setIsCheckingUsername(false);
      }
    };
    checkUsernameAvailability();
  }, [debouncedUsername, authMode]);

  const handleModeSwitch = (mode) => {
    setValidationError('');
    setAuthMode(mode);
    if (mode === 'login' || mode === 'signup') {
      navigate(`/${mode}`, { replace: true });
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    
    if (!loginData.identifier.trim()) {
      return setValidationError('Please enter your email or username.');
    }
    if (!loginData.password) {
      return setValidationError('Please enter your password.');
    }
    
    try {
      await login(loginData);
    } catch (error) {
      if (error.response?.data?.remainingTime) {
        setLockoutTimer(Math.ceil(error.response.data.remainingTime));
      }
    }
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (!signupData.displayName.trim() || !signupData.username.trim() || !signupData.email.trim() || !signupData.password) {
      return setValidationError('Please fill in all required fields.');
    }
    
    const isValidFormat = /^[a-zA-Z0-9_]{8,24}$/.test(signupData.username);
    if (!isValidFormat) {
      return setValidationError('Username must be 8-24 characters long and can only contain letters, numbers, and underscores.');
    }

    if (isUsernameAvailable === false) {
      return setValidationError('This username is already taken.');
    }
    if (signupData.password.length < 8) {
      return setValidationError('Password must be at least 8 characters.');
    }
    if (signupData.password !== signupData.confirmPassword) {
      return setValidationError('Passwords do not match.');
    }

    signup({
      displayName: signupData.displayName.trim(),
      username: signupData.username.trim(),
      email: signupData.email.trim(),
      password: signupData.password
    });
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!forgotPasswordEmail.trim()) {
      return setValidationError('Please enter your email address.');
    }

    setIsSendingReset(true);
    try {
      await axiosInstance.post('/auth/forgot-password', { email: forgotPasswordEmail });
      setAuthMode('forgot_password_success');
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsSendingReset(false);
    }
  };

  const renderUsernameFeedback = () => {
    if (signupData.username.length === 0) return null;
    
    if (signupData.username.length < 8) {
      return <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Too Short (Min 8)</span>;
    }
    if (signupData.username.length > 24) {
      return <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Too Long (Max 24)</span>;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(signupData.username)) {
      return <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Invalid Characters</span>;
    }
    if (isCheckingUsername) {
      return <Loader2 size={12} className="animate-spin text-on-surface-variant" />;
    }
    if (isUsernameAvailable === true) {
      return <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Available</span>;
    }
    if (isUsernameAvailable === false) {
      return <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Taken</span>;
    }
    return null;
  };

  return (
    <div className="bg-[#090b14] h-[100svh] w-full overflow-hidden relative text-white">
      
      {/* Left Side / Background: Premium Flagship Layout */}
      <div className="absolute inset-0 z-0 flex flex-col items-center md:items-start justify-center overflow-hidden">
        
        {/* Deep Dark Gradient & Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-[#090b14] to-[#05060a] pointer-events-none"></div>

        {/* Top: Pure Orbit Branding (Desktop) */}
        <div className="hidden md:flex absolute top-8 left-6 md:top-12 md:left-12 z-20 items-center gap-3 md:gap-4">
          <img src="/logo.png" className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover shadow-lg" alt="Orbit Logo" />
          <span className="text-2xl md:text-3xl font-spacetron tracking-[0.2em] text-white uppercase mt-1 drop-shadow-md">Orbit</span>
        </div>
        
        {/* Mobile-Only Hero Content (Top 40%) */}
        <div className="md:hidden absolute top-0 left-0 right-0 h-[40svh] flex flex-col items-center justify-center px-6 text-center z-20 pt-4">
          <div className="flex items-center gap-3 mb-6">
            <img src="/logo.png" className="w-12 h-12 rounded-xl object-cover shadow-lg" alt="Orbit Logo" />
            <span className="text-3xl font-spacetron tracking-[0.2em] text-white uppercase mt-1 drop-shadow-md">Orbit</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-3 tracking-tight leading-[1.1] drop-shadow-lg">
            Connect with absolute clarity.
          </h1>
          <p className="text-sm text-white/70 font-medium leading-relaxed max-w-[280px]">
            Experience premium messaging designed for focused conversations.
          </p>
        </div>

        {/* Center: Premium Hero Illustration (Desktop Only) */}
        <div className="hidden md:flex absolute inset-0 items-start pt-[10svh] md:pt-0 md:items-center justify-center md:justify-start overflow-visible pointer-events-none">
          <img 
            src={loginImage} 
            alt="Orbit Flagship Illustration" 
            className="w-[160%] max-w-[800px] md:w-[120%] lg:w-[100%] md:min-w-[800px] h-auto object-contain relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)] md:-ml-12 lg:ml-0"
          />
        </div>
        
        {/* Bottom Overlay Gradient for Text Readability (Desktop Only) */}
        <div className="hidden md:block absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-[#090b14] via-[#090b14]/80 to-transparent pointer-events-none z-10"></div>

        {/* Typography (Desktop) */}
        <div className="hidden md:block absolute bottom-12 left-12 z-20 w-[50%] lg:w-[55%]">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white mb-6 tracking-tight leading-[1.1] drop-shadow-lg max-w-lg">
            Connect with absolute clarity.
          </h1>
          <p className="text-lg text-white/70 font-medium leading-relaxed mb-8 max-w-md">
            Experience premium messaging designed for focused conversations. Fast, secure, and beautifully simple.
          </p>
          
          <div className="flex items-center gap-3 text-xs font-semibold text-white/40 uppercase tracking-wider">
            <span>© {new Date().getFullYear()} Orbit Technologies</span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
            <span>Enterprise Grade</span>
          </div>
        </div>
      </div>

      {/* Right Side: Authentication Panel (Floating Curved Sheet) */}
      <div className="absolute bottom-0 left-0 right-0 h-[65svh] md:top-0 md:bottom-0 md:h-full md:right-0 md:left-auto w-full md:w-[50%] lg:w-[45%] z-20 bg-[#0A0C14]/60 backdrop-blur-3xl border-t md:border-t-0 md:border-l border-white/10 rounded-t-[40px] md:rounded-tr-none md:rounded-l-[80px] shadow-[0_-20px_60px_rgba(0,0,0,0.6)] md:shadow-[-20px_0_60px_rgba(0,0,0,0.5)] flex flex-col shrink-0">
        
        {/* Scrollable Container */}
        <div className="flex-1 overflow-y-auto px-6 py-6 md:p-12 w-full custom-scrollbar flex flex-col">
          <div className="w-full sm:w-[85%] md:w-[85%] lg:w-[80%] max-w-[420px] mx-auto flex flex-col relative py-2 mt-4 mb-8 md:my-auto">
            
            {/* Mobile Drag Indicator */}
            <div className="md:hidden w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6 absolute -top-2 left-1/2 -translate-x-1/2"></div>


          <AnimatePresence>
            {validationError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 w-full p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 z-50"
              >
                <ShieldCheck className="text-rose-500 shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-semibold text-rose-500 leading-snug">{validationError}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {authMode === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full flex flex-col"
              >
                <div className="w-full text-center md:text-left mb-8">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Welcome back</h2>
                  <p className="text-sm font-medium text-white/60">Sign in to your account to continue.</p>
                </div>
                
                <form className="w-full space-y-5" onSubmit={handleLoginSubmit} noValidate>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider" htmlFor="login-identifier">
                      Email or Username
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors">
                        <Mail size={18} />
                      </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm font-medium text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/30 hover:border-white/20 shadow-inner" 
                        id="login-identifier" 
                        type="text"
                        required
                        value={loginData.identifier}
                        onChange={(e) => {
                          setLoginData({ ...loginData, identifier: e.target.value });
                          if (validationError) setValidationError('');
                        }}
                        placeholder="Enter your email or username"
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider" htmlFor="login-password">
                        Password
                      </label>
                      <button 
                        type="button" 
                        onClick={() => handleModeSwitch('forgot_password')} 
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors">
                        <Lock size={18} />
                      </div>
                      <input 
                        className="w-full pl-11 pr-12 py-3 bg-black/20 border border-white/10 rounded-xl text-sm font-medium text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/30 hover:border-white/20 shadow-inner" 
                        id="login-password" 
                        type={showPassword ? "text" : "password"}
                        required
                        value={loginData.password}
                        onChange={(e) => {
                          setLoginData({ ...loginData, password: e.target.value });
                          if (validationError) setValidationError('');
                        }}
                        placeholder="••••••••"
                        autoComplete="current-password"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white transition-colors focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 mt-4 ${
                      lockoutTimer > 0 
                        ? 'bg-white/5 text-white/40 border border-white/10 shadow-none cursor-not-allowed opacity-70 active:scale-100' 
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.2)]'
                    }`} 
                    type="submit"
                    disabled={isLoggingIn || lockoutTimer > 0}
                  >
                    {lockoutTimer > 0 ? (
                      `Try again in ${lockoutTimer}s`
                    ) : isLoggingIn ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      'Sign In to Orbit'
                    )}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm font-medium text-white/60">
                  Don't have an account? <button onClick={() => handleModeSwitch('signup')} className="text-blue-400 font-bold hover:underline transition-colors focus:outline-none">Create one now</button>
                </div>
              </motion.div>
            )}

            {authMode === 'signup' && (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full flex flex-col"
              >
                <div className="w-full text-center md:text-left mb-8">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Create an account</h2>
                  <p className="text-sm font-medium text-white/60">Join Orbit for premium messaging.</p>
                </div>
                
                <form className="w-full space-y-4" onSubmit={handleSignupSubmit} noValidate>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider" htmlFor="signup-display">
                      Full Name
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors">
                        <UserIcon size={18} />
                      </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm font-medium text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/30 hover:border-white/20 shadow-inner" 
                        id="signup-display" 
                        type="text"
                        required
                        value={signupData.displayName}
                        onChange={(e) => {
                          setSignupData({ ...signupData, displayName: e.target.value });
                          if (validationError) setValidationError('');
                        }}
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider" htmlFor="signup-username">
                        Username
                      </label>
                      {renderUsernameFeedback()}
                    </div>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors font-bold">
                        @
                      </div>
                      <input 
                        className={`w-full pl-11 pr-4 py-3 bg-black/20 border rounded-xl text-sm font-medium focus:ring-1 outline-none transition-all placeholder:text-white/30 hover:border-white/20 shadow-inner ${isUsernameAvailable === false ? 'border-rose-500 text-rose-500 focus:border-rose-500/50 focus:ring-rose-500/50' : 'border-white/10 text-white focus:border-blue-500/50 focus:ring-blue-500/50'}`}
                        id="signup-username" 
                        type="text"
                        required
                        value={signupData.username}
                        onChange={(e) => {
                          setSignupData({ ...signupData, username: e.target.value });
                          if (validationError) setValidationError('');
                        }}
                        placeholder="johndoe"
                      />
                    </div>
                    <p className="text-[10px] font-medium text-white/40 ml-1">
                      Only letters, numbers, underscores (8-24 chars).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider" htmlFor="signup-email">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors">
                        <Mail size={18} />
                      </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm font-medium text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/30 hover:border-white/20 shadow-inner" 
                        id="signup-email" 
                        type="email"
                        required
                        value={signupData.email}
                        onChange={(e) => {
                          setSignupData({ ...signupData, email: e.target.value });
                          if (validationError) setValidationError('');
                        }}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider" htmlFor="signup-password">
                        Password
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors">
                          <Lock size={18} />
                        </div>
                        <input 
                          className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm font-medium text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/30 hover:border-white/20 shadow-inner" 
                          id="signup-password" 
                          type="password"
                          required
                          value={signupData.password}
                          onChange={(e) => {
                            setSignupData({ ...signupData, password: e.target.value });
                            if (validationError) setValidationError('');
                          }}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-white/50 uppercase tracking-wider" htmlFor="signup-confirm">
                        Confirm
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors">
                          <ShieldCheck size={18} />
                        </div>
                        <input 
                          className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm font-medium text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/30 hover:border-white/20 shadow-inner" 
                          id="signup-confirm" 
                          type="password"
                          required
                          value={signupData.confirmPassword}
                          onChange={(e) => {
                            setSignupData({ ...signupData, confirmPassword: e.target.value });
                            if (validationError) setValidationError('');
                          }}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 mt-4" 
                    type="submit"
                    disabled={isSigningUp || isCheckingUsername || isUsernameAvailable === false}
                  >
                    {isSigningUp ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm font-medium text-white/60">
                  Already have an account? <button onClick={() => handleModeSwitch('login')} className="text-blue-400 font-bold hover:underline transition-colors focus:outline-none">Sign in</button>
                </div>
              </motion.div>
            )}

            {authMode === 'forgot_password' && (
              <motion.div
                key="forgot_password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full flex flex-col"
              >
                <div className="mb-6">
                  <button 
                    onClick={() => handleModeSwitch('login')}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors focus:outline-none"
                    aria-label="Back to login"
                  >
                    <ArrowLeft size={18} className="text-white/80" />
                  </button>
                </div>
                
                <div className="w-full text-left mb-8">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Reset password</h2>
                  <p className="text-sm font-medium text-white/60">Enter your email and we'll send you a recovery link.</p>
                </div>
                
                <form className="w-full space-y-5" onSubmit={handleForgotPasswordSubmit} noValidate>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider" htmlFor="forgot-email">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-400 transition-colors">
                        <Mail size={18} />
                      </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm font-medium text-white focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/30 hover:border-white/20 shadow-inner" 
                        id="forgot-email" 
                        type="email"
                        required
                        value={forgotPasswordEmail}
                        onChange={(e) => {
                          setForgotPasswordEmail(e.target.value);
                          if (validationError) setValidationError('');
                        }}
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <button 
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)] active:scale-[0.98] flex items-center justify-center gap-2 mt-4" 
                    type="submit"
                    disabled={isSendingReset}
                  >
                    {isSendingReset ? <Loader2 size={18} className="animate-spin" /> : 'Send Reset Link'}
                  </button>
                </form>
              </motion.div>
            )}

            {authMode === 'forgot_password_success' && (
              <motion.div
                key="forgot_password_success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="w-full flex flex-col items-center text-center py-10"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                
                <h2 className="text-2xl font-extrabold text-white tracking-tight mb-3">Check your inbox</h2>
                <p className="text-sm font-medium text-white/60 mb-8 px-4">
                  We've sent a password recovery link to <span className="font-bold text-white">{forgotPasswordEmail}</span>. Please check your spam folder if you don't see it.
                </p>

                <button 
                  onClick={() => handleModeSwitch('login')}
                  className="w-full bg-white/5 text-white border border-white/10 font-bold py-3.5 rounded-xl hover:bg-white/10 transition-all active:scale-[0.98] focus:outline-none" 
                >
                  Return to Login
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Trust Signals */}
          <div className="w-full mt-10 pt-8 border-t border-white/10 grid grid-cols-3 gap-2 pb-6 md:pb-0">
            <div className="flex flex-col items-center justify-center text-center gap-1.5 group">
              <ShieldCheck size={16} className="text-white/30 group-hover:text-emerald-500 transition-colors" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Secure</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center gap-1.5 group">
              <Lock size={16} className="text-white/30 group-hover:text-blue-400 transition-colors" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Encrypted</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center gap-1.5 group">
              <Zap size={16} className="text-white/30 group-hover:text-amber-500 transition-colors" />
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Real-Time</span>
            </div>
          </div>

        </div>
        </div>
      </div>
    </div>
  );
}
