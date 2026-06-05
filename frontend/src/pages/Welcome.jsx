import { Link } from 'react-router-dom';
import { MessageSquare, ShieldAlert, Sparkles, Zap, ArrowRight, EyeOff } from 'lucide-react';

export default function Welcome() {
  return (
    <div className="min-h-screen w-full bg-background text-on-surface flex flex-col font-sans relative overflow-hidden select-none">
      {/* Radiant Glow Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square rounded-full bg-primary/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] aspect-square rounded-full bg-secondary/10 blur-[120px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="w-full h-20 px-6 md:px-12 flex items-center justify-between z-10 shrink-0 border-b border-outline-variant/30 bg-surface/30 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-3">
          <img src="/logo.png" className="w-9 h-9 rounded-lg object-cover" alt="Orbit Logo" />
          <span className="text-xl font-black text-primary tracking-tight">Orbit</span>
        </div>
        <div className="flex items-center gap-4">
          <Link 
            to="/login" 
            className="text-sm font-semibold hover:text-primary transition-colors px-4 py-2"
          >
            Login
          </Link>
          <Link 
            to="/signup" 
            className="text-sm font-bold bg-primary text-white px-5 py-2.5 rounded-full hover:opacity-90 transition-all shadow-md shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 z-10 max-w-6xl mx-auto w-full">
        {/* Floating Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/25 text-xs font-bold mb-8 animate-pulse shadow-sm">
          <Sparkles size={12} /> Introducing Orbit 2.0
        </div>

        {/* Hero Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-center tracking-tight leading-[1.1] mb-6 max-w-4xl">
          Secure communication, <br />
          <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            elevated to perfection.
          </span>
        </h1>

        <p className="text-base md:text-lg text-on-surface-variant/80 text-center max-w-2xl leading-relaxed mb-10">
          Experience a beautiful, privacy-centric messaging app with vanish mode, real-time delivery and seen ticks, custom profile history, and professional dashboard management.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center mb-20">
          <Link 
            to="/signup" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold text-base px-8 py-4 rounded-2xl hover:opacity-95 shadow-lg shadow-primary/20 transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            Create Free Account <ArrowRight size={18} />
          </Link>
          <Link 
            to="/login" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface border border-outline-variant/60 hover:bg-surface-container-low text-on-surface font-semibold text-base px-8 py-4 rounded-2xl transition-all hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            Sign In
          </Link>
        </div>

        {/* Features Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-12">
          {/* Card 1: Vanish Mode */}
          <div className="bg-surface-container-low border border-outline-variant/60 p-6 rounded-3xl hover:border-primary/40 transition-all hover:shadow-md group">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <EyeOff size={20} />
            </div>
            <h3 className="font-bold text-lg mb-2">Vanish Mode</h3>
            <p className="text-sm text-on-surface-variant/85 leading-relaxed">
              Send view-once photos or timed texts that disappear completely from both the screen and server after reading.
            </p>
          </div>

          {/* Card 2: Real-time Indicators */}
          <div className="bg-surface-container-low border border-outline-variant/60 p-6 rounded-3xl hover:border-primary/40 transition-all hover:shadow-md group">
            <div className="w-10 h-10 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
              <Zap size={20} />
            </div>
            <h3 className="font-bold text-lg mb-2">Real-Time Syncing</h3>
            <p className="text-sm text-on-surface-variant/85 leading-relaxed">
              Track when your messages are sent, delivered, and seen instantly. Toggle online/offline statuses transparently.
            </p>
          </div>

          {/* Card 3: Administrative Auditing */}
          <div className="bg-surface-container-low border border-outline-variant/60 p-6 rounded-3xl hover:border-primary/40 transition-all hover:shadow-md group">
            <div className="w-10 h-10 rounded-2xl bg-error/10 flex items-center justify-center text-error mb-4 group-hover:scale-110 transition-transform">
              <ShieldAlert size={20} />
            </div>
            <h3 className="font-bold text-lg mb-2">Regulated Account Settings</h3>
            <p className="text-sm text-on-surface-variant/85 leading-relaxed">
              Admin audit logs record bans and security events, while user usernames are securely limited to 3 edits.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full h-16 border-t border-outline-variant/20 flex items-center justify-center text-xs text-on-surface-variant/60 z-10">
        © 2026 Orbit Technologies Inc. All rights reserved.
      </footer>
    </div>
  );
}
