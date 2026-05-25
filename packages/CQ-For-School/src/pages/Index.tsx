import { ArrowRight, BarChart3, Users, Clock, ShieldCheck, Zap, LineChart, MessageSquare, Briefcase } from "lucide-react";
import { Link } from "react-router-dom";

// ─── Component: Glassmorphic Card ───────────────────────────────────────────
function GlassCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/20 bg-white/60 p-8 shadow-xl backdrop-blur-md transition-all hover:bg-white/80 hover:shadow-2xl ${className}`}>
      {children}
    </div>
  );
}

// ─── Component: Case Study Card ─────────────────────────────────────────────
function CaseStudy({
  title,
  subtitle,
  problem,
  cause,
  intervention,
  result,
  icon: Icon,
  color,
}: {
  title: string;
  subtitle: string;
  problem: string;
  cause: string[];
  intervention: string;
  result: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="flex flex-col h-full rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300 hover:shadow-lg overflow-hidden group">
      <div className={`h-2 w-full ${color}`} />
      <div className="p-8 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-wide text-xs">{subtitle}</h3>
            <h4 className="text-2xl font-black text-slate-900 mt-1 leading-tight">{title}</h4>
          </div>
          <div className={`p-3 rounded-xl ${color} bg-opacity-10 text-slate-800`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">The Invisible Divide</p>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              <span className="text-indigo-600 bg-indigo-50 px-1 rounded mr-1">Root Cause</span>
              <span className="font-bold text-slate-800">{cause[0]}</span> vs <span className="font-bold text-slate-800">{cause[1]}</span>
            </p>
          </div>
          <div className="h-px bg-slate-100" />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">The Friction</p>
            <p className="text-sm text-slate-600 leading-relaxed">{problem}</p>
          </div>
          <div className="h-px bg-slate-100" />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Targeted Action</p>
            <p className="text-sm text-slate-600 leading-relaxed">{intervention}</p>
          </div>
        </div>

        <div className="mt-8 select-none">
          <div className={`rounded-xl p-4 bg-gradient-to-r ${color} shadow-inner`}>
            <p className="text-[10px] font-black text-white/80 uppercase tracking-wider mb-1">Measurable Result</p>
            <p className="text-lg font-bold text-white leading-tight">{result}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Landing Page ──────────────────────────────────────────────────────
export default function Index() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Navbar Minimal */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm w-8 h-8 flex items-center justify-center">
              <BarChart3 className="text-white h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">Culture<span className="text-indigo-600">Quantified</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#value-prop" className="hover:text-indigo-600 transition-colors">Value Prop</a>
            <a href="#case-studies" className="hover:text-indigo-600 transition-colors">Case Studies</a>
            <Link to="/login" className="text-slate-900 hover:text-indigo-600 transition-colors">Sign In</Link>
            <Link to="/admin" className="px-5 py-2.5 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md hover:shadow-lg">Platform Demo</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-[-10%] w-[50%] h-[50%] bg-indigo-400/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[20%] left-[20%] w-[20%] h-[20%] bg-rose-300/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 mb-8 max-w-fit mx-auto">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-xs font-bold text-indigo-700 tracking-wide">CULTURE & RETENTION MADE SIMPLE</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8 max-w-4xl mx-auto">
            Find the friction. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-500">
              Fix the culture.
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
            Stop guessing why teachers are stressed or why parents are complaining. We show you exactly where your school's cultural blind spots are, and give you the 15-minute tools to fix them.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/admin" className="px-8 py-4 rounded-full bg-indigo-600 text-white font-bold inline-flex items-center gap-2 hover:bg-indigo-700 hover:scale-105 transition-all shadow-xl shadow-indigo-600/20 w-fit">
              Explore the Dashboards <ArrowRight className="h-5 w-5" />
            </Link>
            <a href="#case-studies" className="px-8 py-4 rounded-full bg-white text-slate-700 font-bold border border-slate-200 inline-flex items-center gap-2 hover:bg-slate-50 transition-colors w-fit shadow-sm">
              Read Case Studies
            </a>
          </div>

          {/* Abstract Dashboard Graphic */}
          <div className="mt-20 mx-auto max-w-5xl rounded-t-3xl border-t border-l border-r border-white/40 bg-white/40 p-4 shadow-2xl backdrop-blur-xl ring-1 ring-slate-900/5 relative">
            <div className="h-4 w-48 mx-auto bg-slate-200/50 rounded-full mb-6 mt-2" />
            <div className="grid grid-cols-3 gap-6 opacity-70">
              <div className="h-32 bg-white rounded-xl border border-slate-100 shadow-sm col-span-2"></div>
              <div className="h-32 bg-white rounded-xl border border-slate-100 shadow-sm"></div>
              <div className="h-48 bg-white rounded-xl border border-slate-100 shadow-sm col-span-3"></div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section id="value-prop" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Why we quantify the invisible.</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Traditional PD relies on "good vibes". We rely on data. Our platform calculates the true cost of cultural misalignment across the exact dimensions driving conflict.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            <GlassCard>
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-6 text-rose-600 shadow-inner">
                <LineChart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Measure "Soft" Metrics</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Culture is usually a feeling. We score it across 5 distinct dimensions (Power Distance, Risk Tolerance, etc.) removing guesswork entirely.
              </p>
            </GlassCard>

            <GlassCard>
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 text-indigo-600 shadow-inner">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Target Costly Friction</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                We don't just find gaps; we calculate the "Cost of Misalignment" in raw hours lost to unproductive deliberation or conflict resolution.
              </p>
            </GlassCard>

            <GlassCard>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-6 text-emerald-600 shadow-inner">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Precision Interventions</h3>
              <p className="text-slate-600 leading-relaxed text-sm">
                Stop forcing irrelevant full-staff PD days. Automatically assign 15-minute targeted webinars to only the specific highly-misaligned cohorts.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section id="case-studies" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-[-20%] w-[60%] h-[100%] bg-indigo-900/20 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">The Real-World Impact.</h2>
            <p className="text-lg text-slate-400 max-w-2xl">See exactly how uncovering hidden cultural data radically shifts retention, collaboration, and parent satisfaction.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <CaseStudy
              subtitle="Case 1 // Onboarding"
              title="The First-Year Friction"
              cause={["Egalitarian Expectations", "Hierarchical Administration"]}
              problem="Early-career teachers were struggling to integrate, reporting high frustration with decision-making speed and 'bureaucracy' during their critical first two years."
              intervention="Dashboard identified a huge 35pt gap in Power Distance. Admin launched short 'Navigating Hierarchy' PD specifically for the 0-2 Tenure group, clarifying processes."
              result="Accelerated alignment and significantly reduced early-career frustration."
              icon={Users}
              color="from-rose-500 to-orange-500"
            />
            
            <CaseStudy
              subtitle="Case 2 // Parent Comms"
              title="The Communication Clash"
              cause={["Indirect Teachers", "Direct High-School Parents"]}
              problem="Teachers reported exhaustion from 'demanding' parents, while parents claimed the school was frustratingly 'evasive' when discussing student progress."
              intervention="Data revealed a massive Communication Style divide. Admin assigned localized PD on 'Direct Communication' to HS staff and restructured newsletters to put the 'bottom-line' up front."
              result="De-escalated everyday tensions and established mutual understanding."
              icon={MessageSquare}
              color="from-blue-500 to-indigo-500"
            />

            <CaseStudy
              subtitle="Case 3 // Productivity"
              title="The Department Silo"
              cause={["Low-Risk Humanities", "High-Risk STEM"]}
              problem="Cross-curricular initiatives stalled. STEM and Humanities departments consistently misunderstood each other, labeling the other side 'stubborn' or 'reckless'."
              intervention="Instead of generic 'collaboration' talks, Leadership presented the Group Profile data on Risk Tolerance. They established new project workflows validating both approaches."
              result="Streamlined project timelines by addressing the invisible root cause of delay."
              icon={Briefcase}
              color="from-emerald-500 to-teal-500"
            />
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="bg-slate-50 border-t border-slate-200 py-24 text-center">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl font-black text-slate-900 mb-6">Ready to quantify your culture?</h2>
          <p className="text-xl text-slate-600 mb-10">Jump into the live dashboards with mock data and see the insights for yourself.</p>
          <Link to="/admin" className="px-10 py-5 rounded-full bg-slate-900 text-white font-bold text-lg inline-flex items-center gap-2 hover:bg-slate-800 hover:scale-105 transition-all shadow-2xl">
            Launch Platform Demo <Zap className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
