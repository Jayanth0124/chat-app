export default function SkeletonLoader({ type = 'chat' }) {
  if (type === 'chat') {
    return (
      <div className="flex items-center gap-4 p-3 animate-pulse">
        <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full shrink-0"></div>
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (type === 'message') {
    return (
      <div className="flex flex-col gap-2 w-full animate-pulse px-4 py-2">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-2xl rounded-bl-sm w-1/2"></div>
        <div className="h-10 bg-slate-300 dark:bg-slate-600 rounded-2xl rounded-br-sm w-1/3 self-end"></div>
      </div>
    );
  }

  if (type === 'card') {
    return (
      <div className="glass p-6 rounded-2xl border border-slate-200 dark:border-slate-800 animate-pulse">
        <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4"></div>
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
      </div>
    );
  }

  return null;
}
