import { useState, useEffect } from 'react';
import { Check } from 'lucide-react';

const THEMES = [
  { id: 'light', name: 'Light Mode', color: '#faf9fe', border: '#0058bc' },
  { id: 'dark', name: 'Dark Mode', color: '#0f172a', border: '#adc6ff' },
  { id: 'blue', name: 'Blue Sky', color: '#f0f7ff', border: '#2563eb' },
  { id: 'umbrellad', name: 'Umbrellad', color: '#fffbff', border: '#c64f00' },
  { id: 'midnight', name: 'Midnight', color: '#090514', border: '#9F21E3' },
];

export default function ThemeSwitcher() {
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('orbit-theme') || localStorage.getItem('blink-theme') || 'light';
  });

  const handleThemeChange = (themeId) => {
    setActiveTheme(themeId);
    localStorage.setItem('orbit-theme', themeId);
    document.documentElement.className = `h-full theme-${themeId}`;
  };

  return (
    <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/60 shadow-sm">
      <h2 className="text-xl font-bold mb-1 text-on-surface">Multi-Theme Workspace</h2>
      <p className="text-sm text-on-surface-variant mb-6">Choose a premium palette for your workspace interface.</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:-translate-y-0.5 cursor-pointer ${
              activeTheme === theme.id 
                ? 'border-primary shadow-sm' 
                : 'border-outline-variant hover:border-outline'
            }`}
          >
            <div 
              className="w-12 h-12 rounded-full mb-3 shadow-inner border border-outline-variant"
              style={{ backgroundColor: theme.color }}
            />
            <span className="text-xs font-semibold text-on-surface">{theme.name}</span>
            
            {activeTheme === theme.id && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center text-white shadow-sm">
                <Check size={12} strokeWidth={3} />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

