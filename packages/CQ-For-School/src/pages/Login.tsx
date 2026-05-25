import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DEMO_EMAIL = "demo@thinkglobalconsultants.com";
const DEMO_PASSWORD = "TGCdemo2025";

export default function Login() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already authenticated (real or demo) — go straight to dashboard
  if (!loading && (user || localStorage.getItem("demo_auth"))) {
    return <Navigate to="/quarterly-action-plan" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    // Demo bypass — no Supabase needed
    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem("demo_auth", "true");
      navigate("/quarterly-action-plan", { replace: true });
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setSubmitting(false);
      return;
    }

    navigate("/quarterly-action-plan", { replace: true });
  }

  return (
    <div className="min-h-screen flex font-sans bg-[#f7f8fa]">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between pt-12 pb-12 px-12 bg-gradient-to-br from-[#0d3d3d] via-[#1a7a7a] to-[#1d8f8f] relative overflow-hidden">
        {/* grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <img src="/TGC-logo.png" alt="Think Global Consultants" className="relative z-10 h-20 w-auto object-contain self-start" />

        <div className="relative z-10 flex flex-col items-center text-center mb-16">
          <ul className="text-white/95 text-5xl font-display font-bold leading-none w-full space-y-6 list-disc list-inside whitespace-nowrap">
            <li>See the friction.</li>
            <li>Fix the culture.</li>
            <li>Keep your best people.</li>
          </ul>
        </div>

        <div className="relative z-10 flex gap-6 text-white/50 text-xs">
          <span>Cultural Intelligence</span>
          <span>Staff Wellness</span>
          <span>Retention Analytics</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link to="/">
            <img src="/TGC-logo.png" alt="Think Global Consultants" className="h-16 w-auto object-contain" />
          </Link>
        </div>

        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-bold text-slate-800 mb-1">Welcome back</h1>
          <p className="text-slate-500 text-sm mb-8">Sign in to your dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a7a7a]/30 focus:border-[#1a7a7a]/50 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {/* TODO: forgot password flow */}}
                  className="text-xs text-[#1a7a7a] hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a7a7a]/30 focus:border-[#1a7a7a]/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1a7a7a] text-white font-semibold text-sm hover:bg-[#155f5f] disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm mt-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Don't have an account?{" "}
            <a href="mailto:info@thinkglobalconsultants.com" className="text-[#1a7a7a] font-medium hover:underline">
              Contact us
            </a>
          </p>
        </div>

        <Link to="/" className="mt-10 text-xs text-slate-400 hover:text-slate-600 transition-colors">
          &larr; Back to home
        </Link>
      </div>
    </div>
  );
}
