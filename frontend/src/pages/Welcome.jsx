import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Play, Phone, Video, Mic, CheckCheck,
  Shield, Activity, Clock, PhoneOff, Lock,
  Zap, Satellite, Moon, Globe, Radar, Sparkles, Star, Download, X
} from 'lucide-react';

export default function Welcome() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isStandaloneMode);

    const checkDismissal = () => {
      const dismissedAt = localStorage.getItem('pwa_install_dismissed');
      if (!dismissedAt) return true;
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      return Date.now() - parseInt(dismissedAt, 10) > sevenDays;
    };

    const isMobile = window.innerWidth < 768;
    if (isMobile && checkDismissal() && !isStandaloneMode) {
      setShowBanner(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      // Ensure banner is shown when event fires if not already
      if (isMobile && checkDismissal()) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert('To install Orbit, use your browser\'s "Install App" or "Add to Home Screen" option.');
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setShowBanner(false);
    }
  };

  const handleDismissBanner = () => {
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
    setShowBanner(false);
  };

  const connectionStages = [
    { name: 'Encounter', icon: Zap },
    { name: 'Alignment', icon: Satellite },
    { name: 'Link', icon: Moon },
    { name: 'Bond', icon: Globe },
    { name: 'Sync', icon: Radar },
    { name: 'Resonance', icon: Sparkles },
    { name: 'Infinity', icon: Star }
  ];

  return (
    <div className="bg-black text-white selection:bg-blue-600/30 selection:text-white min-h-screen w-full font-sans overflow-x-hidden flex flex-col relative">


      {/* Mobile Floating Install Banner */}
      {showBanner && !isStandalone && (
        <div className="fixed bottom-4 left-4 right-4 z-[100] md:hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[#111]/90 backdrop-blur-2xl border border-white/10 rounded-[1.5rem] p-4 flex items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-[48px] h-[48px] shrink-0 flex items-center justify-center">
                <img src="/logo.svg" alt="Orbit Logo" className="w-full h-full object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-white leading-tight mb-0.5">Install Orbit App</span>
                <span className="text-[10px] text-white/50 leading-tight">Get faster access, notifications, and a native app experience.</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0 ml-2">
              <button
                onClick={handleInstallClick}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-full transition-colors shadow-sm"
              >
                Install
              </button>
              <button
                onClick={handleDismissBanner}
                className="px-4 py-1.5 bg-transparent hover:bg-white/5 text-white/60 text-[11px] font-medium rounded-full transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 1 — HERO + LIVE PRODUCT */}
      <section className="relative w-full flex flex-col lg:flex-row items-center pt-10 sm:pt-16 pb-20 px-[clamp(1.5rem,4vw,3rem)] gap-[clamp(2rem,5vw,4rem)] max-w-[1800px] mx-auto lg:min-h-[100svh]">

        {/* Left: Branding & Copy */}
        <div className="flex flex-col justify-center z-20 items-center lg:items-start text-center lg:text-left pt-6 lg:pt-0 w-full lg:w-[45%] xl:w-1/2 shrink-0">

          <div className="flex flex-col items-center lg:items-start mb-[clamp(2rem,4vw,4rem)]">
            <div className="flex items-center justify-center lg:justify-start gap-[clamp(0.25rem,1vw,0.5rem)]">
              <div className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 relative flex items-center justify-center">
                <img src="/logo.png" alt="Orbit Logo" className="absolute w-24 h-24 sm:w-32 sm:h-32 object-contain max-w-none" />
              </div>
              <span className="font-['Spacetron',_sans-serif] text-[clamp(1.5rem,3vw,2rem)] tracking-wider uppercase text-white relative z-10 mt-1">Orbit</span>
            </div>

            {/* Install Button (under logo) */}
            {!isStandalone && (
              <div className="mt-2 sm:mt-3 flex justify-center lg:justify-start w-full">
                <button
                  onClick={handleInstallClick}
                  className="flex items-center gap-2 px-4 py-1.5 bg-[#1A1A1A]/80 hover:bg-[#222] backdrop-blur-md border border-white/10 text-white font-medium rounded-full transition-colors text-xs"
                >
                  <Download size={14} className="text-blue-500" />
                  Install Orbit
                </button>
              </div>
            )}
          </div>

          <h1 className="font-['Spectron',_sans-serif] text-[clamp(2.5rem,5vw,5.5rem)] leading-[1.05] tracking-tight mb-[clamp(1.5rem,3vw,2rem)] break-words">
            Private conversations.<br />
            <span className="text-white/40">Designed to disappear.</span>
          </h1>

          <p className="text-[clamp(0.875rem,1.2vw+0.5rem,1.25rem)] text-white/60 max-w-[480px] leading-relaxed mb-[clamp(2rem,4vw,3rem)] font-light mx-auto lg:mx-0">
            An encrypted communication protocol where every message, call, and footprint is systematically erased from existence.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 w-full">
            <Link to="/signup" className="flex-1 sm:flex-none min-w-[140px] px-8 py-4 bg-white text-black font-semibold rounded-2xl hover:bg-neutral-200 transition-colors text-sm text-center">
              Get Started
            </Link>
            <Link to="/login" className="flex-1 sm:flex-none min-w-[140px] px-8 py-4 bg-[#111] border border-white/10 text-white font-medium rounded-2xl hover:bg-[#1a1a1a] transition-colors text-sm text-center">
              Login
            </Link>
          </div>
        </div>

        {/* Right: Massive Live Product Showcase */}
        <div className="flex items-center justify-center mt-4 sm:mt-8 lg:mt-0 relative z-10 w-full lg:w-[55%] xl:w-1/2">
          <div className="w-full max-w-[700px] min-h-[460px] sm:min-h-[550px] lg:min-h-[600px] h-auto lg:aspect-[4/3] bg-[#0A0A0A] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] overflow-hidden shadow-2xl relative flex flex-col z-20">
            {/* Base layer: Chat UI Header */}
            <div className="h-16 sm:h-20 border-b border-white/10 flex items-center px-4 sm:px-6 lg:px-8 justify-between bg-[#050505] shrink-0 z-10 relative">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-neutral-900 rounded-full border border-white/10 flex items-center justify-center text-sm sm:text-base font-medium">J</div>
                <div>
                  <h3 className="text-xs sm:text-sm lg:text-base font-medium text-white">Jayanth Chowdary</h3>
                  <div className="text-[10px] text-white/40 font-mono tracking-wider">@jayanth</div>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center text-white/60"><Phone size={14} className="sm:w-4 sm:h-4" /></div>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#111] border border-white/10 flex items-center justify-center text-white/60"><Video size={14} className="sm:w-4 sm:h-4" /></div>
              </div>
            </div>

            {/* Chat Body & In-Flow Elements for Mobile & Laptop */}
            <div className="flex-1 p-5 sm:p-6 lg:p-8 flex flex-col gap-4 sm:gap-6 justify-end relative bg-black/50 overflow-y-auto">

              {/* 3. Orbit Connection Badge */}
              <div className="flex items-center gap-4 bg-[#0A0A0A]/90 backdrop-blur-xl border border-white/10 rounded-[1.5rem] p-4 shadow-2xl z-10 w-fit self-start mt-auto">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
                  <Activity size={14} className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-white/40 font-mono tracking-widest uppercase mb-1">Connection</div>
                  <div className="text-sm font-medium text-white leading-none">Level 5 — Sync</div>
                </div>
              </div>

              {/* 2. Active Call Card */}
              <div className="bg-[#111]/90 backdrop-blur-2xl border border-white/10 rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 shadow-2xl z-30 w-[220px] self-end">
                <div className="flex justify-between items-center mb-4 sm:mb-5 gap-4 sm:gap-8">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-[8px] sm:text-[10px] font-mono text-white/60 tracking-wider">SECURE CALL</span>
                  </div>
                  <span className="text-[8px] sm:text-[10px] font-mono text-white">12:04</span>
                </div>
                <div className="flex justify-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#1A1A1A] border border-white/5 flex items-center justify-center"><Mic size={14} className="sm:w-4 sm:h-4" /></div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/20 text-red-500 border border-red-500/20 flex items-center justify-center"><PhoneOff size={14} className="sm:w-4 sm:h-4" /></div>
                </div>
              </div>

              {/* Blue Message (In Flow) */}
              <div className="flex flex-col items-end gap-2 w-full z-10">
                <div className="bg-blue-600 text-white p-3 sm:p-4 rounded-2xl rounded-tr-sm text-xs sm:text-sm font-medium w-fit max-w-[85%] shadow-lg">
                  The orbital uplink is secured. Awaiting packet transfer.
                </div>
                <div className="flex items-center gap-2 text-blue-500 pr-2">
                  <span className="text-[10px] font-mono tracking-widest uppercase">Decaying</span>
                  <CheckCheck size={14} />
                </div>
              </div>

              {/* 1. Voice Note Player */}
              <div className="bg-[#141414] border border-white/10 p-2 sm:p-3 rounded-2xl sm:rounded-[2rem] shadow-2xl backdrop-blur-xl z-20 flex items-center gap-3 sm:gap-4 w-full sm:w-auto max-w-full sm:max-w-[340px] self-start">
                <button className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center text-white shrink-0">
                  <Play size={16} className="ml-0.5 sm:ml-1" />
                </button>
                <div className="flex-1 flex items-center gap-1 opacity-60">
                  {[2, 4, 3, 5, 2, 6, 8, 4, 3, 5, 2, 3].map((h, i) => (
                    <div key={i} className="w-1 bg-white rounded-full shrink-0" style={{ height: `${Math.max(h * 3, 4)}px` }} />
                  ))}
                </div>
                <span className="text-[10px] font-mono text-white/40 pr-2 sm:pr-3">0:24</span>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* SECTION 2 — ORBIT ECOSYSTEM */}
      <section className="w-full px-6 lg:px-12 pb-20 max-w-[1800px] mx-auto">
        <div className="w-full bg-[#0A0A0A] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] p-6 sm:p-8 lg:p-12 xl:p-16 grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-12 xl:gap-16 items-center">

          {/* Left: Progression Hierarchy */}
          <div className="w-full flex flex-col gap-3 sm:gap-4 relative">
            <div className="absolute left-[23px] sm:left-[27px] lg:left-[35px] top-4 bottom-4 w-px bg-white/10" />
            {connectionStages.map((stage, i) => {
              const Icon = stage.icon;
              return (
                <div key={stage.name} className="flex items-center gap-4 sm:gap-6 relative z-10">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-[72px] lg:h-[72px] rounded-2xl border ${i >= 4 ? 'bg-blue-600 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)] text-white' : 'bg-[#141414] border-white/10 text-white/40'} flex items-center justify-center shrink-0 transition-colors`}>
                    <Icon size={20} className={`sm:w-6 sm:h-6 ${i >= 4 ? 'text-white' : 'text-white/40'}`} />
                  </div>
                  <div>
                    <div className="text-[8px] sm:text-[10px] font-mono tracking-widest text-white/40 uppercase mb-1">Stage 0{i + 1}</div>
                    <div className={`text-xs sm:text-sm lg:text-base font-medium ${i >= 4 ? 'text-white' : 'text-white/60'}`}>{stage.name}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Center: Ecosystem Copy */}
          <div className="w-full flex flex-col items-center xl:items-start text-center xl:text-left">
            <h2 className="font-['Spectron',_sans-serif] text-3xl sm:text-4xl lg:text-5xl leading-tight mb-4 sm:mb-6">
              The architecture <br className="hidden sm:block" /> of trust.
            </h2>
            <p className="text-white/50 text-sm sm:text-base lg:text-lg leading-relaxed mb-4 sm:mb-6 lg:mb-8 max-w-[500px]">
              Every interaction fuels the Orbit Connection core. Relationships evolve through 7 discrete cryptographic stages based on sustained peer-to-peer engagement.
            </p>
            <p className="text-white/50 text-sm sm:text-base lg:text-lg leading-relaxed max-w-[500px]">
              This metric is localized. No centralized database records your hierarchy. If the connection decays, the rank disintegrates.
            </p>
          </div>

          {/* Right: Live Telemetry Dashboard */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <div className="flex-1 bg-[#111] border border-white/10 rounded-2xl sm:rounded-[2rem] p-6 lg:p-8 flex flex-col justify-center gap-4 shadow-lg">
                <Shield className="text-blue-500" size={20} />
                <div>
                  <div className="text-2xl sm:text-3xl font-['Spectron',_sans-serif] text-white mb-1">256-bit</div>
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">E2E Encryption</div>
                </div>
              </div>
              <div className="flex-1 bg-[#111] border border-white/10 rounded-2xl sm:rounded-[2rem] p-6 lg:p-8 flex flex-col justify-center gap-4 shadow-lg">
                <Clock className="text-white/60" size={20} />
                <div>
                  <div className="text-2xl sm:text-3xl font-['Spectron',_sans-serif] text-white mb-1">24h</div>
                  <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Total Data Decay</div>
                </div>
              </div>
            </div>
            <div className="w-full bg-[#111] border border-white/10 rounded-2xl sm:rounded-[2rem] p-6 lg:p-8 flex items-center justify-between gap-4 shadow-lg">
              <div>
                <div className="text-xl sm:text-2xl font-['Spectron',_sans-serif] text-white mb-1">Zero Logs</div>
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Server Retention Policy</div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[3px] border-blue-600 flex items-center justify-center shrink-0">
                <CheckCheck className="text-blue-500" size={16} />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 3 — FEATURES + CTA */}
      <section className="w-full px-6 lg:px-12 pb-20 max-w-[1800px] mx-auto flex-1">
        <div className="bg-[#0A0A0A] border border-white/10 rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] p-3 sm:p-4 flex flex-col gap-3 sm:gap-4 h-full">

          {/* Asymmetric Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 h-full">

            {/* Left: 24 Hour Messaging (Content-Driven Tall Layout) */}
            <div className="bg-[#111] border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 flex flex-col overflow-hidden shadow-lg h-full min-h-[350px]">
              <div className="mb-8 sm:mb-10 relative z-10 text-center sm:text-left">
                <h3 className="font-['Spectron',_sans-serif] text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4">Absolute Ephemerality</h3>
                <p className="text-white/50 text-xs sm:text-sm lg:text-base max-w-[340px] mx-auto sm:mx-0">Nothing survives the orbit. Texts, images, and coordinates vanish precisely 24 hours after execution.</p>
              </div>

              {/* Product UI Mockup (Secured Inside) */}
              <div className="mt-auto bg-[#0A0A0A] border border-white/10 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 lg:p-8 flex flex-col gap-3 sm:gap-4 w-full shadow-xl relative z-10">
                <div className="self-end bg-blue-600 p-3 sm:p-4 rounded-2xl rounded-tr-sm w-fit max-w-[85%] text-[10px] sm:text-xs lg:text-sm font-medium shadow-md">
                  The extraction protocol is initiated.
                </div>
                <div className="self-end flex items-center gap-1.5 sm:gap-2 px-1 sm:px-2">
                  <Clock size={12} className="text-blue-500" />
                  <span className="text-[8px] sm:text-[10px] lg:text-xs font-mono text-blue-500">Decays in 23:59:58</span>
                </div>

                <div className="self-start bg-[#1A1A1A] border border-white/5 p-3 sm:p-4 rounded-2xl rounded-tl-sm w-fit max-w-[85%] text-[10px] sm:text-xs lg:text-sm text-white/40 italic mt-2 sm:mt-4 shadow-sm">
                  [ Message Permanently Deleted ]
                </div>
              </div>
            </div>

            {/* Right Stack */}
            <div className="flex flex-col gap-3 sm:gap-4 h-full">

              {/* Top Right: Privacy Controls */}
              <div className="bg-[#111] border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row justify-center sm:justify-between items-center sm:items-center gap-6 sm:gap-8 flex-1 shadow-lg overflow-hidden min-h-[220px]">
                <div className="shrink-0 text-center sm:text-left w-full sm:w-auto">
                  <h3 className="font-['Spectron',_sans-serif] text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4">Total Control</h3>
                  <p className="text-white/50 text-xs sm:text-sm lg:text-base max-w-[220px] mx-auto sm:mx-0">Manipulate read receipts, typing indicators, and presence.</p>
                </div>

                {/* Toggles UI */}
                <div className="flex flex-col gap-3 sm:gap-4 w-full sm:w-auto min-w-[200px] lg:min-w-[240px] bg-[#0A0A0A] border border-white/10 rounded-2xl lg:rounded-[2rem] p-5 lg:p-6 shadow-xl shrink-0">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[10px] sm:text-xs font-medium text-white/80 shrink-0">Read Receipts</span>
                    <div className="w-9 sm:w-10 h-5 sm:h-6 bg-[#222] rounded-full p-1 transition-colors shrink-0"><div className="w-3 sm:w-4 h-3 sm:h-4 bg-white/40 rounded-full" /></div>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[10px] sm:text-xs font-medium text-white/80 shrink-0">Typing Status</span>
                    <div className="w-9 sm:w-10 h-5 sm:h-6 bg-blue-600 rounded-full p-1 flex justify-end transition-colors shrink-0"><div className="w-3 sm:w-4 h-3 sm:h-4 bg-white rounded-full" /></div>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-[10px] sm:text-xs font-medium text-white/80 shrink-0">Discoverability</span>
                    <div className="w-9 sm:w-10 h-5 sm:h-6 bg-[#222] rounded-full p-1 transition-colors shrink-0"><div className="w-3 sm:w-4 h-3 sm:h-4 bg-white/40 rounded-full" /></div>
                  </div>
                </div>
              </div>

              {/* Bottom Right: Encrypted Calls */}
              <div className="bg-[#111] border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 flex flex-col sm:flex-row justify-between items-center gap-6 sm:gap-8 flex-1 shadow-lg overflow-hidden min-h-[220px]">
                <div className="z-10 text-center sm:text-left w-full sm:w-auto">
                  <h3 className="font-['Spectron',_sans-serif] text-xl sm:text-2xl lg:text-3xl mb-3 sm:mb-4">Invisible Comms</h3>
                  <p className="text-white/50 text-xs sm:text-sm lg:text-base max-w-[220px] mx-auto sm:mx-0">Zero-log voice and video lines.</p>
                </div>

                {/* Waveform UI */}
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 opacity-40 shrink-0 w-full sm:w-auto">
                  {[2, 3, 5, 2, 8, 4, 3, 9, 4, 3, 5, 2, 4].map((h, i) => (
                    <div key={i} className="w-1 sm:w-1.5 bg-blue-500 rounded-full" style={{ height: `${Math.max(h * 4, 8)}px` }} />
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* CTA Strip */}
          <div className="bg-[#111] border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] p-6 sm:p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8 text-center md:text-left shadow-lg">
            <div className="w-full md:w-auto">
              <h2 className="font-['Spectron',_sans-serif] text-2xl sm:text-3xl lg:text-5xl mb-2 sm:mb-4">Start your first Orbit.</h2>
              <p className="text-white/50 text-xs sm:text-sm lg:text-lg font-mono tracking-widest uppercase">The network is live.</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shrink-0 w-full md:w-auto">
              <Link to="/login" className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-[#1A1A1A] border border-white/10 text-white font-medium rounded-2xl hover:bg-[#222] transition-colors flex justify-center text-sm sm:text-base">
                Login
              </Link>
              <Link to="/signup" className="w-full sm:w-auto px-8 sm:px-10 py-4 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 transition-colors shadow-[0_0_30px_rgba(37,99,235,0.3)] flex justify-center text-sm sm:text-base">
                Get Started
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* SECTION 4 — PREMIUM FOOTER */}
      <footer className="w-full mt-auto bg-[#050505] border-t border-white/10 py-10 sm:py-12 px-6 lg:px-12">
        <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">

          {/* Footer Left: Branding & Copy */}
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-8 h-8 sm:w-12 sm:h-12 shrink-0 relative flex items-center justify-center">
                <img src="/logo.png" alt="Orbit Logo" className="absolute w-20 h-20 sm:w-28 sm:h-28 object-contain" />
              </div>
              <span className="font-['Spacetron',_sans-serif] text-xl sm:text-2xl tracking-wider uppercase text-white relative z-10 mt-1">Orbit</span>
            </div>
            <p className="text-xs sm:text-sm text-white/40 font-light max-w-[260px]">
              Private conversations designed to disappear.
            </p>
          </div>

          {/* Footer Right: Social Icons */}
          <div className="flex items-center gap-4">
            <a href="https://www.instagram.com/jayanth.chowdary__" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 bg-[#0A0A0A] flex items-center justify-center text-white/50 hover:text-white hover:bg-[#111] transition-all" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></svg>
            </a>
            <a href="https://github.com/jayanth0124" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 bg-[#0A0A0A] flex items-center justify-center text-white/50 hover:text-white hover:bg-[#111] transition-all" aria-label="GitHub">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.18-.35 6.5-1.59 6.5-7.17A5.2 5.2 0 0 0 19 5.2a5.2 5.2 0 0 0-.5-3.2s-1.4-.5-4.4 1.5a15.4 15.4 0 0 0-8 0c-3-2-4.4-1.5-4.4-1.5a5.2 5.2 0 0 0-.5 3.2 5.2 5.2 0 0 0 1.5 4.6c0 5.58 3.32 6.82 6.5 7.17A4.8 4.8 0 0 0 8 18v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
            </a>
            <a href="https://www.linkedin.com/in/jayanth-donavalli" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 bg-[#0A0A0A] flex items-center justify-center text-white/50 hover:text-white hover:bg-[#111] transition-all" aria-label="LinkedIn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
            </a>
            <a href="mailto:jayanthdonavalli0124@gmail.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-white/10 bg-[#0A0A0A] flex items-center justify-center text-white/50 hover:text-white hover:bg-[#111] transition-all" aria-label="Mail">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
            </a>
          </div>

        </div>
      </footer>

    </div>
  );
}