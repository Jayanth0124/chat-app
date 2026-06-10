import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import useDebounce from '../hooks/useDebounce';
import { useAuthStore } from '../store/useAuthStore';
import { axiosInstance } from '../lib/axios';

export default function Signup() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [profilePic, setProfilePic] = useState(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const debouncedUsername = useDebounce(formData.username, 500);

  const { signup, isSigningUp } = useAuthStore();

  useEffect(() => {
    const checkUsernameAvailability = async () => {
      if (debouncedUsername.length > 3) {
        setIsChecking(true);
        try {
          const res = await axiosInstance.post('/auth/check-username', { username: debouncedUsername });
          setIsAvailable(res.data.available);
        } catch (error) {
          setIsAvailable(false);
        } finally {
          setIsChecking(false);
        }
      } else {
        setIsAvailable(null);
      }
    };
    checkUsernameAvailability();
  }, [debouncedUsername]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (!formData.email || formData.password.length < 6) return;
    if (formData.password !== formData.confirmPassword) {
      // Could show toast here
      return;
    }
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isAvailable === false) return;

    await signup({
      displayName: formData.displayName.trim(),
      username: formData.username,
      email: formData.email,
      password: formData.password
    });

    // If they uploaded an image, we attempt to upload it to their profile.
    if (profilePic) {
      try {
        await axiosInstance.put('/user/update-profile', { profilePic });
      } catch (error) {
        console.error("Error setting avatar during signup:", error);
      }
    }
  };

  return (
    <div className="bg-background text-on-surface min-h-screen flex items-center justify-center p-6 font-body-base w-full">
      {/* Main Container */}
      <main className="w-full max-w-[440px] bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-6 flex flex-col items-center border-b border-outline-variant bg-surface">
          <img src="/logo.png" className="h-12 w-12 rounded-lg mb-4 shadow-sm object-cover" alt="Orbit Logo" />
          <h1 className="text-xl font-bold text-on-surface mb-1 text-center">Create your account</h1>
          <p className="text-sm text-on-surface-variant text-center">Join Orbit for premium messaging.</p>
        </div>

        {/* Progress Indicator */}
        <div className="h-1 bg-surface-container-high w-full flex">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-in-out" 
            style={{ width: step === 1 ? '50%' : '100%' }}
          ></div>
        </div>

        {/* Form Area */}
        <div className="p-8 relative min-h-[360px] flex flex-col justify-between">
          
          {step === 1 ? (
            /* Step 1: Credentials */
            <form onSubmit={handleNextStep} className="space-y-5 flex-grow">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1.5 tracking-wider" htmlFor="email">Email Address</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">mail</span>
                  <input 
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-outline/80" 
                    id="email" 
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1.5 tracking-wider" htmlFor="password">Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                  <input 
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-outline/80" 
                    id="password" 
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                <p className="text-[10px] text-on-surface-variant/80 mt-1">Must be at least 6 characters</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1.5 tracking-wider" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock_reset</span>
                  <input 
                    className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-outline/80" 
                    id="confirmPassword" 
                    type="password"
                    required
                    minLength={6}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                  />
                </div>
                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold">Passwords do not match</p>
                )}
              </div>

              <button 
                className="w-full bg-primary hover:bg-primary-container text-white py-2.5 rounded-lg font-semibold text-sm transition-colors mt-6 flex items-center justify-center gap-2" 
                type="submit"
              >
                Continue
                <span className="material-symbols-outlined !text-[18px]">arrow_forward</span>
              </button>

              <p className="text-center text-xs text-on-surface-variant mt-4">
                Already have an account? <Link className="text-primary hover:underline font-semibold" to="/login">Log in</Link>
              </p>
            </form>
          ) : (
            /* Step 2: Profile Setup */
            <form onSubmit={handleSubmit} className="space-y-5 flex-grow">
              
              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative w-20 h-20 rounded-full bg-surface-container border-2 border-dashed border-outline-variant flex items-center justify-center cursor-pointer hover:border-primary hover:bg-surface-container-high transition-colors group overflow-hidden">
                  {profilePic ? (
                    <img src={profilePic} alt="Selected Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors !text-[28px]">add_a_photo</span>
                  )}
                  {/* Hidden File Input */}
                  <input 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    type="file"
                    onChange={handleImageChange}
                  />
                </div>
                <span className="text-xs text-on-surface-variant mt-2 font-medium">Upload Profile Photo</span>
              </div>

              {/* Display Name */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1.5 tracking-wider" htmlFor="displayName">Display Name</label>
                <input 
                  className="w-full px-3 py-2 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all" 
                  id="displayName" 
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Jane Doe"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase mb-1.5 tracking-wider" htmlFor="username">Username</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-outline text-sm">@</span>
                  <input 
                    className={`w-full pl-7 pr-10 py-2 bg-surface border ${isAvailable === false ? 'border-red-400 focus:border-red-500' : 'border-outline-variant focus:border-primary'} rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all`} 
                    id="username" 
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/\s/g, '') })}
                    placeholder="janedoe"
                  />
                  {/* Availability Indicator */}
                  <div className="absolute right-3 flex items-center pointer-events-none">
                    {isChecking && <Loader2 size={16} className="animate-spin text-outline" />}
                    {!isChecking && isAvailable === true && (
                      <span className="material-symbols-outlined text-primary !text-[18px]">check_circle</span>
                    )}
                    {!isChecking && isAvailable === false && (
                      <span className="material-symbols-outlined text-red-500 !text-[18px]">cancel</span>
                    )}
                  </div>
                </div>
                {isAvailable === false && (
                  <p className="text-[10px] text-red-500 mt-1 font-semibold">Username is already taken</p>
                )}
                {isAvailable === true && (
                  <p className="text-[10px] text-primary mt-1 font-semibold">Username is available!</p>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button 
                  className="flex-1 bg-surface-container hover:bg-surface-container-high text-on-surface py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-1.5" 
                  onClick={handlePrevStep} 
                  type="button"
                >
                  <span className="material-symbols-outlined !text-[18px]">arrow_back</span>
                  Back
                </button>
                <button 
                  className="flex-[2] bg-primary hover:bg-primary-container text-white py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2" 
                  type="submit"
                  disabled={isSigningUp || isAvailable === false || !formData.username}
                >
                  {isSigningUp ? <Loader2 size={18} className="animate-spin" /> : 'Complete Sign Up'}
                </button>
              </div>
            </form>
          )}

        </div>
      </main>
    </div>
  );
}
