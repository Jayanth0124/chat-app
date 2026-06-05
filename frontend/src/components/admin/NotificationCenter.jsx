import { BellRing, Send } from 'lucide-react';

export default function NotificationCenter() {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-outline-variant/60 shadow-sm text-on-surface">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <BellRing className="text-primary" /> Broadcast Center
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Audience</label>
          <select className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/60 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-on-surface text-sm">
            <option>All Users</option>
            <option>Active Users (Last 24h)</option>
            <option>Moderators Only</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Message</label>
          <textarea 
            rows="3" 
            placeholder="Type your announcement here..." 
            className="w-full px-4 py-2.5 rounded-xl bg-surface border border-outline-variant/60 focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-on-surface text-sm resize-none" 
          />
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:opacity-95 transition-opacity shadow-sm cursor-pointer">
          <Send size={18} /> Send Broadcast
        </button>
      </div>
    </div>
  );
}

