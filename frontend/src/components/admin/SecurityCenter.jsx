import { ShieldAlert, LogIn, MonitorSmartphone } from 'lucide-react';

export default function SecurityCenter() {
  return (
    <div className="bg-surface p-6 rounded-2xl border border-outline-variant/60 shadow-sm text-on-surface">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <ShieldAlert className="text-primary" /> Security Center
      </h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-on-surface-variant mb-3 flex items-center gap-2">
            <LogIn size={16} /> Failed Login Attempts
          </h3>
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <div>
                  <p className="text-sm font-bold text-red-600">user{i}@example.com</p>
                  <p className="text-xs text-red-500/70">IP: 192.168.1.{i}4 • 5 attempts</p>
                </div>
                <span className="text-xs font-semibold text-red-500">10m ago</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-on-surface-variant mb-3 flex items-center gap-2">
            <MonitorSmartphone size={16} /> Suspicious Device Logs
          </h3>
          <div className="space-y-2">
            {[1].map((i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <div>
                  <p className="text-sm font-bold text-amber-700">Unknown Device (Russia)</p>
                  <p className="text-xs text-amber-600">Account: @admin_jayanth</p>
                </div>
                <button className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer">
                  Block IP
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

