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
    <div className="bg-background text-on-surface h-screen flex w-full overflow-hidden">
      {/* Left Side: Premium Flagship Layout (Hidden on mobile) */}
      <div className="hidden md:flex w-1/2 bg-[#090b14] relative overflow-hidden shrink-0 flex-col items-center justify-center">
        
        {/* Deep Dark Gradient & Lighting */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-[#090b14] to-[#05060a] pointer-events-none"></div>

        {/* Top: Pure Orbit Branding */}
        <div className="absolute top-12 left-12 z-20 flex items-center gap-4">
          <img src="/logo.png" className="w-12 h-12 rounded-xl object-cover shadow-lg" alt="Orbit Logo" />
          <span className="text-3xl font-spacetron tracking-[0.2em] text-white uppercase mt-1 drop-shadow-md">Orbit</span>
        </div>
        
        {/* Center: Premium Hero Illustration */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
          <img 
            src={loginImage} 
            alt="Orbit Flagship Illustration" 
            className="w-[135%] min-w-[800px] h-auto object-contain relative z-10 drop-shadow-[0_20px_40px_rgba(0,0,0,0.4)] -ml-8"
          />
        </div>
        
        {/* Bottom Overlay Gradient for Text Readability */}
        <div className="absolute bottom-0 left-0 right-0 h-72 bg-gradient-to-t from-[#090b14] to-transparent pointer-events-none z-10"></div>

        {/* Bottom: Typography */}
        <div className="absolute bottom-12 left-12 right-12 z-20">
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

      {/* Right Side: Authentication Panel */}
      <div className="w-full md:w-1/2 flex flex-col p-6 sm:p-12 bg-surface-container-lowest overflow-y-auto relative">
        <div className="w-full max-w-[420px] mx-auto flex flex-col my-auto relative">
          
          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-center gap-3 mb-10">
            <img src="/logo.png" className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="Orbit Logo" />
            <span className="text-2xl font-spacetron tracking-[0.15em] text-primary uppercase mt-1">Orbit</span>
          </div>

          {/* Global Validation Error */}
          <AnimatePresence>
            {validationError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute -top-16 left-0 w-full p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-3 z-50"
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
                  <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">Welcome back</h2>
                  <p className="text-sm font-medium text-on-surface-variant">Sign in to your account to continue.</p>
                </div>
                
                <form className="w-full space-y-5" onSubmit={handleLoginSubmit} noValidate>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="login-identifier">
                      Email or Username
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">
                        <Mail size={18} />
                      </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant/80" 
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
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="login-password">
                        Password
                      </label>
                      <button 
                        type="button" 
                        onClick={() => handleModeSwitch('forgot_password')} 
                        className="text-xs font-bold text-primary hover:text-primary/80 transition-colors focus:outline-none"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">
                        <Lock size={18} />
                      </div>
                      <input 
                        className="w-full pl-11 pr-12 py-3 bg-surface border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant/80" 
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
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface transition-colors focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 mt-4 ${
                      lockoutTimer > 0 
                        ? 'bg-surface-variant text-on-surface-variant shadow-none cursor-not-allowed opacity-70 active:scale-100' 
                        : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
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

                <div className="mt-8 text-center text-sm font-medium text-on-surface-variant">
                  Don't have an account? <button onClick={() => handleModeSwitch('signup')} className="text-primary font-bold hover:underline transition-colors focus:outline-none">Create one now</button>
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
                  <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">Create an account</h2>
                  <p className="text-sm font-medium text-on-surface-variant">Join Orbit for premium messaging.</p>
                </div>
                
                <form className="w-full space-y-4" onSubmit={handleSignupSubmit} noValidate>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="signup-display">
                      Full Name
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">
                        <UserIcon size={18} />
                      </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant/80" 
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
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="signup-username">
                        Username
                      </label>
                      {renderUsernameFeedback()}
                    </div>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors font-bold">
                        @
                      </div>
                      <input 
                        className={`w-full pl-11 pr-4 py-3 bg-surface border rounded-xl text-sm font-medium focus:ring-1 outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant/80 ${isUsernameAvailable === false ? 'border-rose-500 text-rose-500 focus:border-rose-500 focus:ring-rose-500' : 'border-outline-variant/40 text-on-surface focus:border-primary focus:ring-primary'}`}
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
                    <p className="text-[10px] font-medium text-on-surface-variant/60 ml-1">
                      Only letters, numbers, underscores (8-24 chars).
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="signup-email">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">
                        <Mail size={18} />
                      </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant/80" 
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
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="signup-password">
                        Password
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">
                          <Lock size={18} />
                        </div>
                        <input 
                          className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant/80" 
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
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="signup-confirm">
                        Confirm
                      </label>
                      <div className="relative group">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">
                          <ShieldCheck size={18} />
                        </div>
                        <input 
                          className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant/80" 
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
                    className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-4" 
                    type="submit"
                    disabled={isSigningUp || isCheckingUsername || isUsernameAvailable === false}
                  >
                    {isSigningUp ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
                  </button>
                </form>

                <div className="mt-8 text-center text-sm font-medium text-on-surface-variant">
                  Already have an account? <button onClick={() => handleModeSwitch('login')} className="text-primary font-bold hover:underline transition-colors focus:outline-none">Sign in</button>
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
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-surface border border-outline-variant hover:bg-surface-container transition-colors focus:outline-none"
                    aria-label="Back to login"
                  >
                    <ArrowLeft size={18} className="text-on-surface" />
                  </button>
                </div>
                
                <div className="w-full text-left mb-8">
                  <h2 className="text-3xl font-extrabold text-on-surface tracking-tight mb-2">Reset password</h2>
                  <p className="text-sm font-medium text-on-surface-variant">Enter your email and we'll send you a recovery link.</p>
                </div>
                
                <form className="w-full space-y-5" onSubmit={handleForgotPasswordSubmit} noValidate>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider" htmlFor="forgot-email">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50 group-focus-within:text-primary transition-colors">
                        <Mail size={18} />
                      </div>
                      <input 
                        className="w-full pl-11 pr-4 py-3 bg-surface border border-outline-variant/40 rounded-xl text-sm font-medium text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-on-surface-variant/40 hover:border-outline-variant/80" 
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
                    className="w-full bg-primary text-white font-bold py-3.5 rounded-xl hover:bg-primary/90 transition-all shadow-md shadow-primary/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-4" 
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
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                  <CheckCircle size={32} className="text-emerald-500" />
                </div>
                
                <h2 className="text-2xl font-extrabold text-on-surface tracking-tight mb-3">Check your inbox</h2>
                <p className="text-sm font-medium text-on-surface-variant mb-8 px-4">
                  We've sent a password recovery link to <span className="font-bold text-on-surface">{forgotPasswordEmail}</span>. Please check your spam folder if you don't see it.
                </p>

                <button 
                  onClick={() => handleModeSwitch('login')}
                  className="w-full bg-surface text-on-surface border border-outline-variant font-bold py-3.5 rounded-xl hover:bg-surface-container transition-all active:scale-[0.98] focus:outline-none" 
                >
                  Return to Login
                </button>
              </motion.div>
            )}

          </AnimatePresence>

          {/* Trust Signals */}
          <div className="w-full mt-10 pt-8 border-t border-outline-variant/30 grid grid-cols-3 gap-2">
            <div className="flex flex-col items-center justify-center text-center gap-1.5 group">
              <ShieldCheck size={16} className="text-on-surface-variant/50 group-hover:text-emerald-500 transition-colors" />
              <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">Secure</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center gap-1.5 group">
              <Lock size={16} className="text-on-surface-variant/50 group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">Encrypted</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center gap-1.5 group">
              <Zap size={16} className="text-on-surface-variant/50 group-hover:text-amber-500 transition-colors" />
              <span className="text-[10px] font-bold text-on-surface-variant/70 uppercase tracking-wider">Real-Time</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
