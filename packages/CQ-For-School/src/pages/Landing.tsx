import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Brain,
  Globe2,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Cultural Intelligence Analytics",
    desc: "Measure and grow CQ across your organisation with validated surveys and real-time dashboards.",
  },
  {
    icon: BarChart3,
    title: "Benchmarking & Comparisons",
    desc: "Compare staff retention, turnover, and wellness metrics against sector benchmarks.",
  },
  {
    icon: TrendingUp,
    title: "Friction Diagnosis",
    desc: "Identify root causes of staff friction and receive targeted intervention recommendations.",
  },
  {
    icon: Users,
    title: "Staff Wellbeing Tracking",
    desc: "Monitor team wellbeing over time and act before issues escalate.",
  },
  {
    icon: Globe2,
    title: "Multi-School Management",
    desc: "Oversee multiple campuses from a single platform with per-school filtering.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & Compliant",
    desc: "Enterprise-grade security with role-based access and data residency controls.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <img src="/TGC-logo.png" alt="Think Global Consultants" className="h-16 w-auto object-contain" />
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2 rounded-full bg-[#1a7a7a] text-white text-sm font-semibold hover:bg-[#155f5f] transition-colors shadow-sm"
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-24 overflow-hidden bg-gradient-to-br from-[#0d3d3d] via-[#1a7a7a] to-[#1d8f8f]">
        {/* subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/15 text-white/90 text-xs font-semibold tracking-widest uppercase">
            Cultural Intelligence Platform
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Build schools where<br />every person belongs
          </h1>
          <p className="mt-6 text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
            Think Global Consultants helps school leaders measure cultural intelligence, reduce staff turnover, and create environments where teams thrive.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3.5 rounded-full bg-white text-[#1a7a7a] font-bold text-base hover:bg-slate-50 transition-colors shadow-lg"
            >
              Access your dashboard
            </button>
            <a
              href="https://thinkglobalconsultants.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 rounded-full border-2 border-white/40 text-white font-semibold text-base hover:bg-white/10 transition-colors"
            >
              Learn more
            </a>
          </div>
        </div>

        {/* wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-12 sm:h-16">
            <path d="M0 60V30C240 0 480 60 720 30C960 0 1200 60 1440 30V60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-800">
              Everything your leadership team needs
            </h2>
            <p className="mt-3 text-slate-500 text-lg max-w-xl mx-auto">
              One platform for culture analytics, staff wellbeing, and continuous professional development.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group p-6 rounded-2xl border border-slate-100 hover:border-[#1a7a7a]/25 hover:shadow-md transition-all duration-200 bg-white"
              >
                <div className="w-11 h-11 rounded-xl bg-[#1a7a7a]/10 flex items-center justify-center mb-4 group-hover:bg-[#1a7a7a]/15 transition-colors">
                  <Icon className="w-5 h-5 text-[#1a7a7a]" />
                </div>
                <h3 className="font-semibold text-slate-800 mb-1.5">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA band */}
      <section className="py-16 px-6 bg-[#f7f8fa]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-slate-800">
            Ready to get started?
          </h2>
          <p className="mt-3 text-slate-500">
            Sign in to your organisation's dashboard or contact us to request access.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-8 px-10 py-3.5 rounded-full bg-[#1a7a7a] text-white font-bold text-base hover:bg-[#155f5f] transition-colors shadow-md"
          >
            Sign in to your account
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <img src="/TGC-logo.png" alt="Think Global Consultants" className="h-10 w-auto object-contain opacity-70" />
          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} Think Global Consultants. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
