import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { resetPassword } = useAuthStore();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (password.length < 6 || !hasLetter || !hasNumber) {
      return setError("Password must be at least 6 characters and contain both letters and numbers.");
    }

    setIsSubmitting(true);
    try {
      await resetPassword(token, password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      // toast error is handled in store
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
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">Create New Password</h2>
          <p className="text-neutral-400">Enter a new secure password for your account.</p>
        </div>

        {isSuccess ? (
          <div className="text-center relative z-10 space-y-6">
            <div className="w-16 h-16 bg-[#34C759]/10 rounded-full flex items-center justify-center mx-auto border border-[#34C759]/20">
              <CheckCircle2 className="text-[#34C759]" size={32} />
            </div>
            <div className="space-y-2">
              <p className="text-lg text-white font-medium">Password Reset Successful</p>
              <p className="text-neutral-400 text-sm leading-relaxed">
                You will be redirected to the login page momentarily.
              </p>
            </div>
            <Link
              to="/login"
              className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#8C6DF0] hover:bg-[#7b5bea] text-white rounded-xl font-medium transition-colors shadow-[0_0_20px_rgba(140,109,240,0.3)]"
            >
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-[#8C6DF0] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-[#12121A] border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8C6DF0] focus:ring-1 focus:ring-[#8C6DF0] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-300 ml-1">Confirm New Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-500 group-focus-within:text-[#8C6DF0] transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 bg-[#12121A] border border-white/10 rounded-xl text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#8C6DF0] focus:ring-1 focus:ring-[#8C6DF0] transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className="w-full py-3 px-4 bg-[#8C6DF0] hover:bg-[#7b5bea] disabled:bg-[#8C6DF0]/50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center mt-2 shadow-[0_0_20px_rgba(140,109,240,0.3)]"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
