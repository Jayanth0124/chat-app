import { useState } from 'react';
import { Check, Send } from 'lucide-react';
import jayanthPic from '../../assets/images/jayanth.jpg';

const THEMES = [
  { id: 'deep-space', name: 'Deep Space', color: '#030712', border: '#6366F1' },
  { id: 'nebula', name: 'Nebula Purple', color: '#0F0617', border: '#A855F7' },
  { id: 'midnight', name: 'Midnight Blue', color: '#020617', border: '#38BDF8' },
  { id: 'aurora', name: 'Aurora', color: '#041C1C', border: '#14B8A6' },
  { id: 'black-hole', name: 'Black Hole', color: '#000000', border: '#6D28D9' },
];

export default function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('orbit-theme') || 'deep-space';
  });

  const handleThemeChange = (themeId) => {
    setActiveTheme(themeId);
    localStorage.setItem('orbit-theme', themeId);
    document.documentElement.className = `h-full theme-${themeId}`;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-6xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Theme Selection Bento */}
      <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-outline-variant/20 flex flex-col h-full relative overflow-hidden">
        <div className="relative z-10 mb-8">
          <h2 className="text-xl font-black text-on-surface tracking-tight mb-1">Color Systems</h2>
          <p className="text-sm font-medium text-on-surface-variant">Select your primary workspace aesthetic.</p>
        </div>
        
        <div className="flex flex-col gap-3 relative z-10">
          {THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer hover:-translate-y-0.5 ${
                activeTheme === theme.id 
                  ? 'border-primary bg-primary/5 shadow-sm' 
                  : 'border-outline-variant/40 hover:border-outline-variant/80 hover:bg-surface-container-low'
              }`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div 
                  className="w-10 h-10 rounded-full shadow-inner border border-outline-variant/30 flex shrink-0"
                  style={{ backgroundColor: theme.color }}
                />
                <span className={`text-sm font-bold truncate ${activeTheme === theme.id ? 'text-primary' : 'text-on-surface'}`}>
                  {theme.name}
                </span>
              </div>
              {activeTheme === theme.id && (
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shadow-md shrink-0 ml-2">
                  <Check size={14} strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview Bento */}
      <div className="bg-surface p-6 sm:p-8 rounded-3xl border border-outline-variant/20 xl:col-span-2 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-primary/5 pointer-events-none"></div>
        <div className="relative z-10 mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-on-surface tracking-tight mb-1">Live Interface Preview</h2>
            <p className="text-sm font-medium text-on-surface-variant">Changes map directly to the communication engine.</p>
          </div>
        </div>

        {/* Mock Chat Window */}
        <div className="relative z-10 flex-1 bg-background rounded-2xl border border-outline-variant/30 overflow-hidden flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.12)] min-h-[360px]">
          {/* Mock Header */}
          <div className="h-[64px] bg-surface-container-lowest border-b border-outline-variant/30 px-4 sm:px-6 flex items-center gap-4 shrink-0">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/30 flex items-center justify-center overflow-hidden">
                <img src={jayanthPic} alt="Jayanth Chowdary" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.parentElement.innerHTML = '<span class="text-primary font-bold">J</span>'; }} />
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-surface-container-lowest"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">Jayanth Chowdary</p>
              <p className="text-[11px] font-medium text-on-surface-variant">@jayanth</p>
            </div>
          </div>

          {/* Mock Messages */}
          <div className="flex-1 p-6 flex flex-col gap-4 overflow-hidden relative bg-surface-container-lowest/50">
            <div className="flex justify-start relative z-10">
              <div className="bg-surface-container-high text-on-surface px-5 py-3 rounded-2xl rounded-tl-sm max-w-[80%] shadow-sm">
                <p className="text-sm font-medium leading-relaxed">The new workspace layout is incredibly fluid. It feels like a native desktop app!</p>
                <p className="text-[10px] text-on-surface-variant mt-1 text-right">10:42 AM</p>
              </div>
            </div>

            <div className="flex justify-end relative z-10">
              <div className="bg-primary text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[80%] shadow-md">
                <p className="text-sm font-medium leading-relaxed">Wait until you see how the color tokens cascade. Notice the exact shade of this bubble.</p>
                <p className="text-[10px] text-white/70 mt-1 text-right">10:43 AM</p>
              </div>
            </div>
          </div>

          {/* Mock Input */}
          <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 shrink-0">
            <div className="h-12 bg-surface-container rounded-full flex items-center px-4 gap-3 border border-outline-variant/20 shadow-inner">
              <div className="flex-1">
                <div className="w-48 h-2 bg-on-surface-variant/20 rounded-full"></div>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shrink-0 shadow-sm cursor-pointer hover:bg-primary/90 transition-colors">
                <Send size={14} className="ml-0.5" />
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

