import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function ReportsCenter() {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-outline-variant/60 shadow-sm text-on-surface">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <AlertTriangle className="text-primary" /> Reports Center
      </h2>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/60 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded">Spam</span>
                <h4 className="font-bold text-sm text-on-surface">Report against @spammer</h4>
              </div>
              <p className="text-xs text-on-surface-variant">Reported by @user{i} • 2 hours ago</p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <button className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-600 hover:bg-green-500/20 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                <CheckCircle size={14} /> Resolve
              </button>
              <button className="flex-1 md:flex-none flex items-center justify-center gap-1 px-3 py-1.5 bg-surface-container-high text-on-surface-variant hover:bg-outline-variant/30 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                <XCircle size={14} /> Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

