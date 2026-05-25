import { useState } from "react";
import {
  Zap,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  Layers,
  Brain,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Gate1Branch = "prism" | "cq" | "values";
type Gate2Choice = string;
type Gate3Choice = string;

interface Diagnosis {
  framework: "PRISM" | "CQ Quadrants" | "Cultural Values";
  dimension: string;
  polarity: string;
  description: string;
  advice: string;
}

// ─── Data: Gate 1 — Branch selection ─────────────────────────────────────────

const GATE1_OPTIONS: {
  id: Gate1Branch;
  label: string;
  sublabel: string;
  promptText: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    id: "prism",
    label: "Process & Communication",
    sublabel: "How we work together",
    promptText:
      "The frustration was about the way we work — meetings, decisions, speed, or how information flows.",
    icon: Layers,
    colorHex: "#1a7a7a",
    bgHex: "#f0fafa",
    borderHex: "#99d6d6",
  },
  {
    id: "cq",
    label: "Personal Effort & Interaction",
    sublabel: "My own ability to adapt",
    promptText:
      "The frustration was about my own reaction — something about my motivation, understanding, or how I handled the moment.",
    icon: Brain,
    colorHex: "#2a9d8f",
    bgHex: "#f4fbfa",
    borderHex: "#99d6d6",
  },
  {
    id: "values",
    label: "Professional Principles",
    sublabel: "Deeper values & beliefs",
    promptText:
      "The frustration was about underlying values — how they treat people, authority, or uncertainty.",
    icon: Compass,
    colorHex: "#38b2ac",
    bgHex: "#f0fffe",
    borderHex: "#99d6d6",
  },
];

// ─── Data: Gate 2 — Sub-options per branch ────────────────────────────────────

const GATE2_OPTIONS: Record<
  Gate1Branch,
  { id: string; label: string; sublabel: string; needsDisambiguation?: boolean }[]
> = {
  prism: [
    {
      id: "timing",
      label: "It was about timing.",
      sublabel:
        "Someone moved too fast or too slow — the pace felt completely off.",
      needsDisambiguation: false,
    },
    {
      id: "rules",
      label: "It was about rules and process.",
      sublabel:
        "One person wanted structure and clear procedures; the other wanted to improvise.",
      needsDisambiguation: false,
    },
    {
      id: "power",
      label: "It was about who's in charge.",
      sublabel:
        "There was tension around authority, hierarchy, or who gets to decide.",
      needsDisambiguation: false,
    },
    {
      id: "information",
      label: "It was about how things were said.",
      sublabel:
        "The message didn't land — either too blunt, too vague, or too long-winded.",
      needsDisambiguation: true,
    },
  ],
  cq: [
    {
      id: "drive",
      label: "Honestly? I just didn't want to deal with it.",
      sublabel:
        "I felt resistant, drained, or unmotivated to engage across this difference.",
      needsDisambiguation: false,
    },
    {
      id: "knowledge",
      label: "I didn't understand why they did that.",
      sublabel:
        "Their behavior genuinely confused me — I couldn't make sense of it.",
      needsDisambiguation: false,
    },
    {
      id: "action",
      label: "I knew what to do — I just couldn't make it work in the moment.",
      sublabel:
        "I had the right instinct but my behavior didn't adapt when it mattered.",
      needsDisambiguation: false,
    },
    {
      id: "strategy",
      label: "I was caught off guard. I had no plan for this.",
      sublabel:
        "I hadn't anticipated the cultural difference and had no strategy ready.",
      needsDisambiguation: false,
    },
  ],
  values: [
    {
      id: "individualism",
      label: "They were too focused on themselves or their group.",
      sublabel: "It felt like the individual was prioritized over the team — or vice versa.",
      needsDisambiguation: false,
    },
    {
      id: "task-relationship",
      label: "They were too focused on the task — or too focused on the relationship.",
      sublabel: "We had completely different ideas about whether results or people should come first.",
      needsDisambiguation: false,
    },
    {
      id: "power-distance",
      label: "They don't respect (or over-respect) the chain of command.",
      sublabel: "Power and hierarchy was handled in a way that felt wrong.",
      needsDisambiguation: false,
    },
    {
      id: "uncertainty",
      label: "They were too comfortable (or too scared) with the unknown.",
      sublabel: "Risk, ambiguity, or change was treated in a way that didn't make sense to me.",
      needsDisambiguation: false,
    },
  ],
};

// ─── Data: Gate 3 — Disambiguation (only for "information" in PRISM) ──────────

const GATE3_OPTIONS: Record<
  string,
  { id: string; label: string; sublabel: string }[]
> = {
  "prism:information": [
    {
      id: "indirect",
      label: "Too indirect — I couldn't tell what they actually meant.",
      sublabel: "They hinted, implied, or buried the point.",
    },
    {
      id: "too-direct",
      label: "Too direct — it felt blunt, harsh, or inappropriate.",
      sublabel: "They said exactly what they thought without softening it.",
    },
  ],
};

// ─── Data: Diagnoses ──────────────────────────────────────────────────────────

function getDiagnosis(
  branch: Gate1Branch,
  gate2: string,
  gate3?: string
): Diagnosis {
  const map: Record<string, Diagnosis> = {
    // PRISM
    "prism:timing": {
      framework: "PRISM",
      dimension: "Pace",
      polarity: "Fast vs. Slow",
      description:
        "You're experiencing a Pace mismatch. One party operates at a fast, decisive tempo while the other processes more deliberately. Neither is wrong — they're just wired differently.",
      advice:
        "Set explicit time expectations upfront. Name the pace you need: 'I need a quick answer by noon' or 'Can we take a day to think this through?'",
    },
    "prism:rules": {
      framework: "PRISM",
      dimension: "Structure",
      polarity: "Flexible vs. Rigid",
      description:
        "You're experiencing a Structure mismatch. One person thrives with clear processes and written rules; the other sees structure as a constraint that slows them down.",
      advice:
        "Identify the minimum viable structure both sides can live with. Agree on what must be documented vs. what can stay informal.",
    },
    "prism:power": {
      framework: "PRISM",
      dimension: "Authority",
      polarity: "Hierarchy vs. Flat",
      description:
        "You're experiencing an Authority mismatch. One person expects decisions to flow through the hierarchy; the other assumes they have autonomy to act independently.",
      advice:
        "Make the decision-making process explicit. Whose sign-off is required here? State it clearly, even if it feels obvious to you.",
    },
    "prism:information:indirect": {
      framework: "PRISM",
      dimension: "Communication",
      polarity: "Direct vs. Indirect",
      description:
        "You're experiencing a Communication Style mismatch — specifically, an indirect communicator. They rely on context, relationship, and implication to convey meaning. You need it spelled out.",
      advice:
        "Ask clarifying questions that invite directness: 'Can you help me understand what you'd like me to do specifically?' This gives them a graceful path to say it plainly.",
    },
    "prism:information:too-direct": {
      framework: "PRISM",
      dimension: "Communication",
      polarity: "Direct vs. Indirect",
      description:
        "You're experiencing a Communication Style mismatch — specifically, an overly direct communicator. They delivered the message without softening, which landed as blunt or even aggressive.",
      advice:
        "Interpret the message, not the delivery. Their directness is a sign of efficiency and trust, not disrespect. You can ask them to add context: 'Could you walk me through your thinking?'",
    },
    // CQ
    "cq:drive": {
      framework: "CQ Quadrants",
      dimension: "CQ Drive",
      polarity: "Motivation (High vs. Low)",
      description:
        "Your CQ Drive dipped. This is the motivational engine of cultural intelligence — when it's low, everything else stalls. Low drive often signals burnout, overload, or a past bad experience with this person.",
      advice:
        "Don't force engagement right now. Identify one small, genuinely curious question about this person's perspective and start there. Curiosity is the on-ramp back to drive.",
    },
    "cq:knowledge": {
      framework: "CQ Quadrants",
      dimension: "CQ Knowledge",
      polarity: "Cognition (Low)",
      description:
        "Your CQ Knowledge has a gap here. You encountered a cultural norm or behavior you didn't have the framework to decode. That confusion is valuable data — it's pointing directly at a blind spot.",
      advice:
        "Research this specific norm or cultural pattern. Talk to a trusted colleague from that background. The confusion you felt is the exact thing to investigate.",
    },
    "cq:action": {
      framework: "CQ Quadrants",
      dimension: "CQ Action",
      polarity: "Behavioral (Gap between intent and execution)",
      description:
        "Your CQ Action needs work. You had the right instinct but your behavior didn't follow through in the moment. This is the hardest gap to close — it requires practice under real pressure.",
      advice:
        "Debrief the moment. What was the exact point where your behavior diverged from your intent? Practice that specific micro-behavior — the pause, the question, the tone-shift — before the next interaction.",
    },
    "cq:strategy": {
      framework: "CQ Quadrants",
      dimension: "CQ Strategy",
      polarity: "Metacognition (Reactive vs. Planned)",
      description:
        "Your CQ Strategy was reactive rather than planned. You hadn't thought through the cultural dynamics beforehand, so you were improvising under pressure. Strategy is the 'pre-flight checklist' of CQ.",
      advice:
        "Before your next cross-cultural interaction, spend 2 minutes asking: What cultural differences might come up? What's my plan if they do? Anticipation is the skill to build here.",
    },
    // Values
    "values:individualism": {
      framework: "Cultural Values",
      dimension: "Individualism vs. Collectivism",
      polarity: "Self-focused vs. Group-focused",
      description:
        "You've hit an Individualism vs. Collectivism tension. This dimension determines whether someone's primary loyalty is to themselves and their goals, or to the group, team, or community.",
      advice:
        "Neither is selfish nor selfless — they're different frameworks for what 'good' looks like. When you disagree, try naming it: 'I think we see who this decision is for differently.'",
    },
    "values:task-relationship": {
      framework: "Cultural Values",
      dimension: "Task vs. Relationship",
      polarity: "Results-first vs. People-first",
      description:
        "You're experiencing a Task vs. Relationship tension. One person prioritizes getting the work done; the other prioritizes maintaining the relationship as the vehicle for getting work done.",
      advice:
        "Invest 5 minutes of relationship-building before any high-stakes task conversation. For the results-focused person: this isn't wasted time — it's the lubricant that makes the task go faster.",
    },
    "values:power-distance": {
      framework: "Cultural Values",
      dimension: "Power Distance",
      polarity: "High vs. Low",
      description:
        "You're experiencing a Power Distance conflict. High power distance cultures expect authority to be respected and deferred to; low power distance cultures expect everyone to challenge ideas regardless of title.",
      advice:
        "Be explicit about the decision-making culture you're in right now. If you want input from all levels, say it directly: 'I want everyone's honest take, including pushback on my ideas.'",
    },
    "values:uncertainty": {
      framework: "Cultural Values",
      dimension: "Uncertainty Avoidance",
      polarity: "High vs. Low",
      description:
        "You're experiencing an Uncertainty Avoidance conflict. One person needs clarity, plans, and defined outcomes before moving; the other is energized by ambiguity and sees plans as constraints.",
      advice:
        "Give the high-avoidance person the minimum viable certainty they need to move forward — a deadline, a single fixed point, or a clear backstop. This unblocks them without over-structuring the situation.",
    },
  };

  const key3 = gate3 ? `${branch}:${gate2}:${gate3}` : `${branch}:${gate2}`;
  return (
    map[key3] ||
    map[`${branch}:${gate2}`] || {
      framework: "PRISM",
      dimension: "Unknown",
      polarity: "—",
      description: "Diagnosis not found.",
      advice: "",
    }
  );
}

// ─── Framework config ─────────────────────────────────────────────────────────

const FRAMEWORK_CONFIG = {
  PRISM: {
    colorHex: "#1a7a7a",
    bgHex: "#f0fafa",
    borderHex: "#99d6d6",
    progressBg: "#1a7a7a",
    icon: Layers,
  },
  "CQ Quadrants": {
    colorHex: "#2a9d8f",
    bgHex: "#f4fbfa",
    borderHex: "#99d6d6",
    progressBg: "#2a9d8f",
    icon: Brain,
  },
  "Cultural Values": {
    colorHex: "#38b2ac",
    bgHex: "#f0fffe",
    borderHex: "#99d6d6",
    progressBg: "#38b2ac",
    icon: Compass,
  },
};

// ─── Choice Card component ────────────────────────────────────────────────────

function ChoiceCard({
  label,
  sublabel,
  icon: Icon,
  colorHex,
  bgHex,
  borderHex,
  selected,
  onClick,
}: {
  label: string;
  sublabel: string;
  icon?: React.ElementType;
  colorHex?: string;
  bgHex?: string;
  borderHex?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-md group"
      style={selected && colorHex ? { backgroundColor: bgHex, borderColor: borderHex, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" } : {}}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors bg-secondary group-hover:bg-primary/10"
            style={selected && bgHex ? { backgroundColor: bgHex } : {}}
          >
            <Icon
              className="h-4 w-4 transition-colors text-muted-foreground group-hover:text-primary"
              style={selected && colorHex ? { color: colorHex } : {}}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p
            className="font-semibold text-sm leading-snug text-foreground"
            style={selected && colorHex ? { color: colorHex } : {}}
          >
            {label}
          </p>
          {sublabel && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {sublabel}
            </p>
          )}
        </div>
        <ArrowRight
          className="h-4 w-4 shrink-0 mt-0.5 transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 text-muted-foreground"
          style={selected && colorHex ? { color: colorHex, opacity: 1 } : {}}
        />
      </div>
    </button>
  );
}

// ─── Progress dots ────────────────────────────────────────────────────────────

function ProgressDots({
  total,
  current,
  activeColorHex,
}: {
  total: number;
  current: number;
  activeColorHex: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-1.5 rounded-full transition-all duration-300"
          style={i < current
            ? { width: "1rem", backgroundColor: activeColorHex }
            : i === current
            ? { width: "1.5rem", backgroundColor: activeColorHex }
            : { width: "0.375rem", backgroundColor: "hsl(var(--muted))" }}
        />
      ))}
    </div>
  );
}

// ─── Animated wrapper ─────────────────────────────────────────────────────────

function GateSlide({ children, gateKey }: { children: React.ReactNode; gateKey: string }) {
  return (
    <div key={gateKey} className="animate-in fade-in slide-in-from-right-4 duration-300">
      {children}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FrictionDiagnosisSurvey() {
  // Auth + Supabase save deferred to phase 2
  // const { user } = useAuth();

  // State machine
  const [gate, setGate] = useState<0 | 1 | 2 | 3 | "result">(0);
  const [branch, setBranch] = useState<Gate1Branch | null>(null);
  const [gate2Choice, setGate2Choice] = useState<Gate2Choice | null>(null);
  const [gate3Choice, setGate3Choice] = useState<Gate3Choice | null>(null);
  // Save state kept for when auth is wired up in phase 2
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Computed
  const activeBranchConfig = branch ? GATE1_OPTIONS.find((o) => o.id === branch) : null;
  const gate2Options = branch ? GATE2_OPTIONS[branch] : [];
  const selectedGate2 = gate2Options.find((o) => o.id === gate2Choice);
  const disambigKey = branch && gate2Choice ? `${branch}:${gate2Choice}` : null;
  const gate3Options = disambigKey ? GATE3_OPTIONS[disambigKey] ?? [] : [];
  const hasGate3 = gate3Options.length > 0;

  const totalGates = hasGate3 ? 4 : 3;
  const currentGateIndex =
    gate === "result" ? totalGates : typeof gate === "number" ? gate : 0;

  const diagnosis =
    gate === "result" && branch && gate2Choice
      ? getDiagnosis(branch, gate2Choice, hasGate3 ? gate3Choice ?? undefined : undefined)
      : null;

  const frameworkCfg = diagnosis
    ? FRAMEWORK_CONFIG[diagnosis.framework]
    : FRAMEWORK_CONFIG["PRISM"];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleGate1Select = (id: Gate1Branch) => {
    setBranch(id);
    setGate2Choice(null);
    setGate3Choice(null);
    setGate(2); // advance to Gate 2 (sub-options)
  };

  const handleGate2Select = (id: string) => {
    setGate2Choice(id);
    const g2 = GATE2_OPTIONS[branch!].find((o) => o.id === id);
    const dKey = `${branch}:${id}`;
    if (g2?.needsDisambiguation && GATE3_OPTIONS[dKey]) {
      setGate3Choice(null);
      setGate(3);
    } else {
      setGate("result");
    }
  };

  const handleGate3Select = (id: string) => {
    setGate3Choice(id);
    setGate("result");
  };

  const handleBack = () => {
    if (gate === "result") {
      if (hasGate3 && gate3Choice) {
        setGate(3);
      } else {
        setGate(2);
      }
    } else if (gate === 3) {
      setGate(2);
    } else if (gate === 2) {
      setGate(1); // back to branch selection
    } else if (gate === 1) {
      setBranch(null);
      setGate(0); // back to intro
    }
  };

  const handleReset = () => {
    setBranch(null);
    setGate2Choice(null);
    setGate3Choice(null);
    setSaved(false);
    setGate(0);
  };

  const handleSave = async () => {
    // Auth + new diagnosis_responses table — wired up in phase 2
    setSaved(true);
  };

  // ── Active progress-line color ───────────────────────────────────────────

  const progressColorHex = branch
    ? FRAMEWORK_CONFIG[
        branch === "prism"
          ? "PRISM"
          : branch === "cq"
          ? "CQ Quadrants"
          : "Cultural Values"
      ].progressBg
    : "#1a7a7a";

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="container max-w-2xl py-10 space-y-6">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-3 mb-1.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="font-sans text-2xl font-semibold leading-tight">
              Survey v2
            </h1>
            <p className="text-xs text-muted-foreground">
              3-step branching diagnostic · ~1 minute
            </p>
          </div>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {gate !== 0 && (
        <div className="flex items-center gap-3">
          <ProgressDots
            total={totalGates + 1}
            current={currentGateIndex}
            activeColorHex={progressColorHex}
          />
          <span className="text-xs text-muted-foreground ml-auto">
            {gate === "result"
              ? "Diagnosis ready"
              : `Gate ${currentGateIndex} of ${totalGates}`}
          </span>
        </div>
      )}

      {/* ══ Gate 0: Intro / trigger ══════════════════════════════════════════ */}
      {gate === 0 && (
        <GateSlide gateKey="gate0">
          <div className="rounded-2xl border border-border bg-card p-8 text-center space-y-6 shadow-sm">
            <div>
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">
                "I had a frustrating interaction."
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                This tool helps you identify <em>exactly why</em> it was frustrating — and what to
                do about it. Answer 2–3 quick questions. We'll give you a precise cultural diagnosis.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground">
              {[
                { icon: Layers, label: "PRISM Framework", sub: "How we work" },
                { icon: Brain, label: "CQ Quadrants", sub: "How I adapt" },
                { icon: Compass, label: "Cultural Values", sub: "Why we clash" },
              ].map(({ icon: Icon, label, sub }) => (
                <div
                  key={label}
                  className="rounded-xl border border-border bg-secondary/30 p-3 space-y-1"
                >
                  <Icon className="h-4 w-4 mx-auto text-muted-foreground" />
                  <p className="font-medium text-foreground">{label}</p>
                  <p>{sub}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setGate(1)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm"
            >
              Diagnose this friction <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </GateSlide>
      )}

      {/* ══ Gate 1: Branch selection ══════════════════════════════════════════ */}
      {gate === 1 && (
        <GateSlide gateKey="gate1">
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Gate 1 — Category
              </p>
              <h2 className="text-lg font-bold">
                Where did the frustration come from?
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Pick the one that feels closest to the root of it.
              </p>
            </div>
            <div className="space-y-3">
              {GATE1_OPTIONS.map((opt) => (
                <ChoiceCard
                  key={opt.id}
                  label={opt.label}
                  sublabel={opt.promptText}
                  icon={opt.icon}
                  colorHex={opt.colorHex}
                  bgHex={opt.bgHex}
                  borderHex={opt.borderHex}
                  selected={branch === opt.id}
                  onClick={() => handleGate1Select(opt.id)}
                />
              ))}
            </div>
            <BackButton onClick={handleBack} />
          </div>
        </GateSlide>
      )}

      {/* ══ Gate 2: Sub-options ═══════════════════════════════════════════════ */}
      {gate === 2 && branch && (
        <GateSlide gateKey={`gate2-${branch}`}>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Gate 2 — Specific
              </p>
              <h2 className="text-lg font-bold">
                What was the specific friction?
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Choose the frustration that matches most closely.
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-secondary/20 px-4 py-2.5 flex items-center gap-2">
              {activeBranchConfig && (
                <>
                  <activeBranchConfig.icon
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: activeBranchConfig.colorHex }}
                  />
                  <span className="text-xs font-semibold" style={{ color: activeBranchConfig.colorHex }}>
                    {activeBranchConfig.label}
                  </span>
                </>
              )}
            </div>
            <div className="space-y-3">
              {gate2Options.map((opt) => (
                <ChoiceCard
                  key={opt.id}
                  label={opt.label}
                  sublabel={opt.sublabel}
                  selected={gate2Choice === opt.id}
                  onClick={() => handleGate2Select(opt.id)}
                />
              ))}
            </div>
            <BackButton onClick={handleBack} />
          </div>
        </GateSlide>
      )}

      {/* ══ Gate 3: Disambiguation ════════════════════════════════════════════ */}
      {gate === 3 && selectedGate2 && (
        <GateSlide gateKey={`gate3-${gate2Choice}`}>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                Gate 3 — Clarify
              </p>
              <h2 className="text-lg font-bold">
                Was the frustration that they were…
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Your answer will pinpoint the exact dimension.
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-secondary/20 px-4 py-2.5">
              <p className="text-xs text-muted-foreground">You said:</p>
              <p className="text-sm font-medium mt-0.5">{selectedGate2.label}</p>
            </div>
            <div className="space-y-3">
              {gate3Options.map((opt) => (
                <ChoiceCard
                  key={opt.id}
                  label={opt.label}
                  sublabel={opt.sublabel}
                  selected={gate3Choice === opt.id}
                  onClick={() => handleGate3Select(opt.id)}
                />
              ))}
            </div>
            <BackButton onClick={handleBack} />
          </div>
        </GateSlide>
      )}

      {/* ══ Result screen ════════════════════════════════════════════════════ */}
      {gate === "result" && diagnosis && (
        <GateSlide gateKey="result">
          <div className="space-y-4">
            {/* Main diagnosis card */}
            <div
              className="rounded-2xl border-2 p-6 space-y-5"
              style={{ backgroundColor: frameworkCfg.bgHex, borderColor: frameworkCfg.borderHex }}
            >
              {/* Framework badge + icon */}
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white/60">
                  <frameworkCfg.icon className="h-5 w-5" style={{ color: frameworkCfg.colorHex }} />
                </div>
                <div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5"
                    style={{ backgroundColor: `${frameworkCfg.colorHex}18`, color: frameworkCfg.colorHex }}
                  >
                    {diagnosis.framework}
                  </span>
                </div>
                <CheckCircle2 className="h-5 w-5 ml-auto" style={{ color: frameworkCfg.colorHex }} />
              </div>

              {/* Dimension + polarity */}
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                  Diagnosis
                </p>
                <h2 className="text-2xl font-black" style={{ color: frameworkCfg.colorHex }}>
                  {diagnosis.dimension}
                </h2>
                <p className="text-sm text-muted-foreground font-medium mt-0.5">
                  {diagnosis.polarity}
                </p>
              </div>

              {/* Description */}
              <div className="rounded-xl bg-white/50 dark:bg-black/20 p-4">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  What's happening
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {diagnosis.description}
                </p>
              </div>

              {/* Advice */}
              <div className="rounded-xl bg-white/50 dark:bg-black/20 p-4">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                  What to do next
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {diagnosis.advice}
                </p>
              </div>
            </div>

            {/* Path summary */}
            <div className="rounded-xl border border-border bg-secondary/20 px-4 py-3 flex items-start gap-3">
              <Zap className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Your path: </span>
                {activeBranchConfig?.label}
                {gate2Choice && (
                  <>
                    {" → "}
                    {GATE2_OPTIONS[branch!]?.find((o) => o.id === gate2Choice)?.label}
                  </>
                )}
                {gate3Choice && (
                  <>
                    {" → "}
                    {gate3Options.find((o) => o.id === gate3Choice)?.label}
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              {!saved ? (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all shadow-sm",
                    "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                  )}
                >
                  {saving ? "Saving…" : "Save this diagnosis"}
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold dark:bg-emerald-900/40 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </div>
              )}

              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Go back
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-auto"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Start over
              </button>
            </div>
          </div>
        </GateSlide>
      )}
    </div>
  );
}

// ─── Sub-component: Back button ───────────────────────────────────────────────

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back
    </button>
  );
}
