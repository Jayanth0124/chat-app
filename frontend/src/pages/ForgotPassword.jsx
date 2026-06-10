import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { Mail, Loader2, ArrowLeft } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { forgotPassword } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setIsSuccess(true);
    } catch (error) {
      // Error handled by store
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center p-4">
      {/* Premium Orbit Branding */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <h1 className="text-2xl font-spacetron tracking-[0.15em] text-white uppercase leading-none">
          ORBIT
        </h1>
      </div>

      <div className="w-full max-w-md bg-[#0A0A0E] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#8C6DF0] rounded-full blur-[100px] opacity-20 pointer-events-none" />

        <div className="relative z-10 text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Reset Password</h2>
          <p className="text-neutral-400">Enter your email to receive a recovery link.</p>
        </div>

        {isSuccess ? (
          <div className="text-center relative z-10 space-y-6">
            <div className="w-16 h-16 bg-[#34C759]/10 rounded-full flex items-center justify-center mx-auto border border-[#34C759]/20">
              <Mail className="text-[#34C759]" size={28} />
            </div>
            <div className="space-y-2">
              <p className="text-lg text-white font-medium">Check your inbox</p>
              <p className="text-neutral-400 text-sm leading-relaxed">
                We've sent a password reset link to <span className="text-white">{email}</span>. It will expire in 15 minutes.
              </p>
            </div>
            <Link
              to="/login"
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors border border-white/5"
            >
              <ArrowLeft size={18} />
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-[#8C6DF0] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-[#12121A] border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8C6DF0] focus:ring-1 focus:ring-[#8C6DF0] transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="w-full py-3 px-4 bg-[#8C6DF0] hover:bg-[#7b5bea] disabled:bg-[#8C6DF0]/50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center shadow-[0_0_20px_rgba(140,109,240,0.3)]"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Send Reset Link"}
            </button>

            <div className="text-center">
              <Link to="/login" className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center justify-center gap-2 mt-4">
                <ArrowLeft size={14} />
                Back to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
