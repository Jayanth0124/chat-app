import { toast, Toaster, resolveValue } from 'react-hot-toast';
import { X, CheckCircle2, AlertCircle, Info, Loader2 } from 'lucide-react';

const CustomToast = ({ t }) => {
  const duration = t.duration || 4000;
  
  let accentColor = '#3b82f6';
  let Icon = Info;
  let defaultTitle = 'Notification';

  if (t.type === 'success') {
    accentColor = '#10b981'; // Emerald
    Icon = CheckCircle2;
    defaultTitle = 'Success';
  } else if (t.type === 'error') {
    accentColor = '#ef4444'; // Red
    Icon = AlertCircle;
    defaultTitle = 'Error';
  } else if (t.type === 'loading') {
    accentColor = '#8b5cf6'; // Violet
    Icon = Loader2;
    defaultTitle = 'Processing';
  }

  // Linear / Arc inspired aesthetic: solid dark card, subtle border, sharp or slightly rounded corners
  return (
    <div
      style={{
        animation: t.visible 
          ? 'toastEnter 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
          : 'toastLeave 0.3s cubic-bezier(0.5, 0, 0.2, 1) forwards',
        pointerEvents: 'auto',
      }}
      className="relative flex flex-col w-[340px] bg-[#1c1c1e] border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)] rounded-xl overflow-hidden group"
    >
      <div className="flex items-start p-4 pb-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          <Icon className={`w-[18px] h-[18px] ${t.type === 'loading' ? 'animate-spin' : ''}`} style={{ color: accentColor }} />
        </div>

        {/* Content */}
        <div className="ml-3 flex-1 flex flex-col pt-[1px]">
          <span className="text-[13px] font-semibold text-[#f4f4f5] tracking-tight leading-none mb-1.5">
            {defaultTitle}
          </span>
          <div className="text-[13px] leading-relaxed text-[#a1a1aa] break-words pr-2">
            {resolveValue(t.message, t)}
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
          className="flex-shrink-0 p-1 rounded-md text-[#71717a] hover:bg-white/10 hover:text-white transition-all duration-200 focus:outline-none flex items-center justify-center -mr-1 -mt-1"
        >
          <X className="w-[14px] h-[14px]" />
        </button>
      </div>

      {/* Progress Line */}
      {t.type !== 'loading' && (
        <div className="w-full h-[2px] bg-white/5">
          <div
            className="h-full rounded-r-full"
            style={{
              backgroundColor: accentColor,
              animation: `shrinkProgress ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
};

export default function ToastProvider() {
  return (
    <>
      <style>
        {`
          @keyframes toastEnter {
            0% {
              opacity: 0;
              transform: translate3d(calc(100% + 24px), 0, 0) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }
          @keyframes toastLeave {
            0% {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
            100% {
              opacity: 0;
              transform: translate3d(calc(100% + 24px), 0, 0) scale(0.95);
            }
          }
          @keyframes shrinkProgress {
            0% { width: 100%; }
            100% { width: 0%; }
          }
        `}
      </style>
      <Toaster position="bottom-right" gutter={12}>
        {(t) => <CustomToast t={t} />}
      </Toaster>
    </>
  );
}
