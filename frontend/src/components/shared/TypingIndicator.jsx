export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 max-w-[70px] bg-[#f1f5f9] rounded-2xl rounded-bl-[4px] border border-[#e2e8f0]/50 animate-in slide-in-from-bottom-2 duration-300">
      <div className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
      <div className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
      <div className="w-1.5 h-1.5 bg-[#94a3b8] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
  );
}
