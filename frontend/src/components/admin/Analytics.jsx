import { BarChart3, TrendingUp } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-outline-variant/60 shadow-sm text-on-surface">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="text-primary" /> Advanced Analytics
      </h2>

      <div className="space-y-6">
        <div className="h-48 border-2 border-dashed border-outline-variant/60 rounded-xl flex items-center justify-center relative overflow-hidden group">
           <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
           <p className="text-on-surface-variant font-medium flex items-center gap-2 z-10"><TrendingUp /> Active Users Graph Component</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold mb-1">Peak Hours</p>
            <p className="text-lg font-bold">8:00 PM - 11:00 PM</p>
          </div>
          <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold mb-1">User Growth</p>
            <p className="text-lg font-bold text-emerald-500">+4.5% this week</p>
          </div>
        </div>
      </div>
    </div>
  );
}

