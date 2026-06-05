import { Eye, ShieldBan, Trash2 } from 'lucide-react';

export default function ChatModeration() {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-outline-variant/60 shadow-sm text-on-surface">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <ShieldBan className="text-primary" /> Chat Moderation
      </h2>
      
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/60">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-1 bg-red-500/10 text-red-600 rounded-lg">Flagged</span>
                <span className="text-xs text-on-surface-variant">Chat ID: #CH{i}982A</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"><Eye size={16} /></button>
                <button className="text-on-surface-variant hover:text-red-500 transition-colors cursor-pointer"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <div className="bg-surface p-3 rounded-lg text-sm text-on-surface border border-outline-variant/30">
              <p><span className="font-bold text-primary">User A:</span> This is a flagged message content...</p>
              <p className="mt-1"><span className="font-bold text-secondary">User B:</span> Another message here...</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

