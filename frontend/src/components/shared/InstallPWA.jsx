import { Download } from 'lucide-react';

export default function InstallPWA() {
  // In a real app, this would use the beforeinstallprompt event
  return (
    <div className="glass p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10 flex items-center justify-between mt-4">
      <div>
        <h4 className="font-semibold text-blue-700 dark:text-blue-400">Install App</h4>
        <p className="text-sm text-blue-600/80 dark:text-blue-300/80">Get the full experience on your device.</p>
      </div>
      <button className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md shadow-blue-500/20 transition-colors">
        <Download size={20} />
      </button>
    </div>
  );
}
