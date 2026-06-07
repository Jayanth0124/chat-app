import { useConfirmStore } from '../../store/useConfirmStore';

export default function ConfirmDialog() {
  const { isOpen, title, message, confirmText, cancelText, danger, handleConfirm, handleCancel } = useConfirmStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-6">
      {/* Immersive Cinematic Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 animate-in fade-in duration-500"
        onClick={handleCancel}
      />

      {/* Premium Action Sheet / Architectural Panel */}
      <div className="relative w-full max-w-[540px] bg-[#0A0A0C] sm:rounded-[28px] rounded-t-[28px] shadow-[0_60px_120px_rgba(0,0,0,0.9),_0_0_0_1px_rgba(255,255,255,0.06)] overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 fade-in duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col">
        
        {/* Subtle top lighting / layered surface effect */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-50" />
        <div className="absolute top-1 left-0 right-0 h-[300px] bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

        {/* --- Content Zone --- */}
        <div className="relative z-10 px-6 pt-8 pb-10 sm:px-10 sm:pt-10 sm:pb-12 flex flex-col">
          
          {/* Integrated Orbit Signature */}
          <div className="flex items-center gap-4 border-b border-white/5 pb-6 mb-8">
            <div className="w-8 h-8 rounded-md bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              <span className="font-black tracking-tighter text-[16px]">O</span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[12px] font-bold tracking-[0.3em] text-white/80 uppercase">
                Orbit OS
              </span>
              <span className="text-[11px] font-medium tracking-[0.1em] text-white/30 uppercase mt-0.5">
                System Authorization
              </span>
            </div>
          </div>

          {/* Editorial Typography Area */}
          <div className="max-w-[460px]">
            <h2 className="text-[32px] sm:text-[36px] font-semibold tracking-[-0.03em] leading-[1.15] text-white mb-4">
              {title}
            </h2>
            <p className="text-[16px] sm:text-[17px] leading-[1.6] text-white/40 font-medium">
              {message}
            </p>
          </div>
        </div>

        {/* --- Action Zone --- */}
        <div className="relative z-10 bg-[#121214] border-t border-white/[0.06] p-5 sm:p-6 flex flex-col-reverse sm:flex-row gap-3 sm:items-center sm:justify-end">
          
          {/* Decorative Status Marker (Desktop Only) */}
          <div className="absolute left-10 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${danger ? 'bg-[#E5484D] shadow-[0_0_10px_#E5484D]' : 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]'}`} />
            <span className="text-[11px] font-bold text-white/20 uppercase tracking-[0.2em]">
              Action Required
            </span>
          </div>

          <button
            onClick={handleCancel}
            className="w-full sm:w-auto px-6 py-3 sm:py-4 rounded-[16px] font-semibold text-[14px] sm:text-[15px] text-white/50 hover:text-white/90 hover:bg-white/[0.04] active:bg-white/[0.02] transition-all duration-300 tracking-wide select-none"
          >
            {cancelText}
          </button>
          
          <button
            onClick={handleConfirm}
            className={`w-full sm:w-auto px-8 py-3 sm:py-4 rounded-[16px] font-bold text-[14px] sm:text-[15px] tracking-wide transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] select-none ${
              danger
                ? 'bg-[#E5484D] text-white hover:bg-[#FF5A5F] shadow-[0_10px_30px_rgba(229,72,77,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-[0_15px_40px_rgba(229,72,77,0.35),inset_0_1px_0_rgba(255,255,255,0.3)]'
                : 'bg-white text-black hover:bg-[#F2F2F2] shadow-[0_10px_30px_rgba(255,255,255,0.1),inset_0_-2px_0_rgba(0,0,0,0.1)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.2),inset_0_-2px_0_rgba(0,0,0,0.1)]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
