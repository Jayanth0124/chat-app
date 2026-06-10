import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

export default function Login() {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  
  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(formData);
  };

  const handleDemoUser = () => {
    login({ identifier: 'jayanth', password: 'password123' });
  };

  const handleDemoAdmin = () => {
    login({ identifier: 'admin', password: 'admin123' });
  };

  return (
    <div className="bg-background text-on-surface h-screen flex w-full overflow-hidden">
      {/* Left Side: Illustration / Branding (Hidden on mobile) */}
      <div className="hidden md:flex w-1/2 bg-surface-container-low flex-col justify-between p-10 border-r border-outline-variant relative overflow-hidden shrink-0">
        {/* Decorative Background Element */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, var(--primary-container) 0%, transparent 50%)' }}></div>
        
        <div className="z-10 flex items-center gap-4">
          <img src="/logo.png" className="w-10 h-10 rounded-xl object-cover shadow-sm" alt="Orbit Logo" />
          <span className="text-2xl font-black text-primary tracking-tight">Orbit</span>
        </div>
        
        <div className="z-10 max-w-md my-auto">
          <div className="w-full aspect-square rounded-2xl bg-surface-container-lowest mb-6 border border-outline-variant/60 shadow-sm overflow-hidden relative p-4 flex items-center justify-center">
            <img 
              className="w-full h-full object-cover rounded-xl" 
              alt="Orbit Connection Illustration" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9DpIUrpMc9GiR67Q-6JWiUP_Qb4h0JqY4D09x4Tdlx9T97VHUnqHf7YQFdnx5NpXAW9DYz6KKMPTYotEuJjgpAvDzoSh6VRlO6GR9ts8IQWQHaelHdjky9iMXH6HnTuQ8evky2oc8tJ3qE-rD4QldnsvpufjynJRDAX6iC6_KKT8rxgtfaUgVZ-NFzWk1aANoBhhV0nvwgX1qYB1WOKSq_e1pgxWXUYOhKHuDSDmXHuqw_-cs1uhli_aNuCeuRURTXr_Odun6vJ-y"
            />
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-on-surface mb-3 tracking-tight">Connect with clarity.</h1>
          <p className="text-base text-on-surface-variant leading-relaxed">Experience premium messaging designed for focused teams. Fast, secure, and beautifully simple.</p>
        </div>
        
        <div className="z-10 text-xs text-on-surface-variant/70">
          © 2026 Orbit Technologies Inc.
        </div>
      </div>

      {/* Right Side: Authentication Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 bg-surface-container-lowest overflow-y-auto">
        {/* Mobile Logo (Visible only on mobile) */}
        <div className="md:hidden absolute top-6 left-6 flex items-center gap-3">
          <img src="/logo.png" className="w-8 h-8 rounded-lg object-cover shadow-sm" alt="Orbit Logo" />
          <span className="text-lg font-black text-primary tracking-tight">Orbit</span>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-[400px] bg-surface-container-lowest rounded-xl p-8 shadow-sm border border-outline-variant/60">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-on-surface mb-2 tracking-tight">Welcome back</h2>
            <p className="text-sm text-on-surface-variant">Enter your credentials to access your account.</p>
          </div>
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Email/Username Field */}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider" htmlFor="identifier">Email or Username</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">mail</span>
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-outline/80" 
                  id="identifier" 
                  name="identifier" 
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  placeholder="Username or Email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider" htmlFor="password">Password</label>
                <Link className="text-xs font-medium text-primary hover:underline transition-colors" to="/forgot-password">Forgot Password?</Link>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input 
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-sm text-on-surface focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-outline/80" 
                  id="password" 
                  name="password" 
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input 
                className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface cursor-pointer" 
                id="remember" 
                name="remember" 
                type="checkbox"
              />
              <label className="ml-2 text-xs text-on-surface-variant cursor-pointer select-none" htmlFor="remember">Remember for 30 days</label>
            </div>

            {/* Submit Button */}
            <button 
              className="w-full bg-primary text-white font-semibold py-2.5 rounded-lg hover:bg-primary-container transition-colors shadow-sm active:scale-[0.98] flex items-center justify-center gap-2" 
              type="submit"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? <Loader2 size={18} className="animate-spin" /> : 'Log in'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-on-surface-variant">
            Don't have an account? <Link className="text-primary font-semibold hover:underline transition-colors" to="/signup">Create one</Link>
          </div>

          {/* Development Access */}
          <div className="mt-8 pt-5 border-t border-outline-variant/60">
            <p className="text-[10px] font-bold text-outline uppercase tracking-widest text-center mb-3">Development Access</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleDemoUser} 
                className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant text-center hover:bg-surface transition-colors cursor-pointer text-left focus:outline-none"
              >
                <p className="text-[10px] font-semibold text-on-surface-variant mb-0.5">User Role</p>
                <p className="text-xs font-bold text-on-surface">jayanth</p>
                <p className="text-[10px] text-outline">pw: password123</p>
              </button>
              <button 
                onClick={handleDemoAdmin} 
                className="p-2.5 bg-surface-container-low rounded-lg border border-outline-variant text-center hover:bg-surface transition-colors cursor-pointer text-left focus:outline-none"
              >
                <p className="text-[10px] font-semibold text-primary mb-0.5">Admin Role</p>
                <p className="text-xs font-bold text-on-surface">admin</p>
                <p className="text-[10px] text-outline">pw: admin123</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

