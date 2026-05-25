import { useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Layers,
  Brain,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Shared Types ─────────────────────────────────────────────────────────────

export interface DiagnosisResult {
  framework: "PRISM" | "CQ Quadrants" | "Cultural Values";
  dimension: string;
  polarity: string;
  description: string;
  advice: string;
  gate1Branch: string;
  gate2Choice: string;
  gate3Choice: string | null;
}

type Gate1Branch = "prism" | "cq" | "values";

// ─── Data: Gate 1 ─────────────────────────────────────────────────────────────

export const GATE1_OPTIONS: {
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
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/40",
    borderColor: "border-indigo-200 dark:border-indigo-800",
  },
  {
    id: "cq",
    label: "Personal Effort & Interaction",
    sublabel: "My own ability to adapt",
    promptText:
      "The frustration was about my own reaction — something about my motivation, understanding, or how I handled the moment.",
    icon: Brain,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  {
    id: "values",
    label: "Professional Principles",
    sublabel: "Deeper values & beliefs",
    promptText:
      "The frustration was about underlying values — how they treat people, authority, or uncertainty.",
    icon: Compass,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
];

// ─── Data: Gate 2 ─────────────────────────────────────────────────────────────

export const GATE2_OPTIONS: Record<
  Gate1Branch,
  { id: string; label: string; sublabel: string; needsDisambiguation?: boolean }[]
> = {
  prism: [
    {
      id: "timing",
      label: "It was about timing.",
      sublabel: "Someone moved too fast or too slow — the pace felt completely off.",
      needsDisambiguation: true,
    },
    {
      id: "rules",
      label: "It was about rules and process.",
      sublabel: "One person wanted structure and clear procedures; the other wanted to improvise.",
      needsDisambiguation: true,
    },
    {
      id: "power",
      label: "It was about who's in charge.",
      sublabel: "There was tension around authority, hierarchy, or who gets to decide.",
      needsDisambiguation: true,
    },
    {
      id: "information",
      label: "It was about how things were said.",
      sublabel: "The message didn't land — either too blunt, too vague, or too long-winded.",
      needsDisambiguation: true,
    },
  ],
  cq: [
    {
      id: "drive",
      label: "Honestly? I just didn't want to deal with it.",
      sublabel: "I felt resistant, drained, or unmotivated to engage across this difference.",
      needsDisambiguation: true,
    },
    {
      id: "knowledge",
      label: "I didn't understand why they did that.",
      sublabel: "Their behavior genuinely confused me — I couldn't make sense of it.",
      needsDisambiguation: true,
    },
    {
      id: "action",
      label: "I knew what to do — I just couldn't make it work in the moment.",
      sublabel: "I had the right instinct but my behavior didn't adapt when it mattered.",
      needsDisambiguation: true,
    },
    {
      id: "strategy",
      label: "I was caught off guard. I had no plan for this.",
      sublabel: "I hadn't anticipated the cultural difference and had no strategy ready.",
      needsDisambiguation: true,
    },
  ],
  values: [
    {
      id: "individualism",
      label: "They were too focused on themselves or their group.",
      sublabel: "It felt like the individual was prioritized over the team — or vice versa.",
      needsDisambiguation: true,
    },
    {
      id: "task-relationship",
      label: "They were too focused on the task — or too focused on the relationship.",
      sublabel: "We had completely different ideas about whether results or people should come first.",
      needsDisambiguation: true,
    },
    {
      id: "power-distance",
      label: "They don't respect (or over-respect) the chain of command.",
      sublabel: "Power and hierarchy was handled in a way that felt wrong.",
      needsDisambiguation: true,
    },
    {
      id: "uncertainty",
      label: "They were too comfortable (or too scared) with the unknown.",
      sublabel: "Risk, ambiguity, or change was treated in a way that didn't make sense to me.",
      needsDisambiguation: true,
    },
  ],
};

// ─── Data: Gate 3 (disambiguation) ───────────────────────────────────────────

export const GATE3_OPTIONS: Record<
  string,
  { id: string; label: string; sublabel: string }[]
> = {
  // PRISM
  "prism:timing": [
    {
      id: "too-fast",
      label: "They moved too fast — decisions happened before I was ready.",
      sublabel: "Things were decided or acted on before I had time to think, consult, or prepare.",
    },
    {
      id: "too-slow",
      label: "They moved too slow — I was waiting on them and progress stalled.",
      sublabel: "They needed more time than felt reasonable, and it blocked momentum.",
    },
  ],
  "prism:rules": [
    {
      id: "too-rigid",
      label: "Too rigid — they stuck to the rules even when it didn't make sense.",
      sublabel: "They weren't willing to adapt or use judgment, even in clearly exceptional situations.",
    },
    {
      id: "too-flexible",
      label: "Too flexible — they ignored process and made it up as they went.",
      sublabel: "There was no consistency or structure — I couldn't rely on anything being followed.",
    },
  ],
  "prism:power": [
    {
      id: "too-hierarchical",
      label: "Too hierarchical — they deferred to authority instead of thinking for themselves.",
      sublabel: "They wouldn't act, decide, or speak up without explicit approval from above.",
    },
    {
      id: "too-flat",
      label: "Too flat — they acted like they had authority they didn't have.",
      sublabel: "They bypassed the chain of command, made unilateral decisions, or ignored my role.",
    },
  ],
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
  // CQ
  "cq:drive": [
    {
      id: "burned-out",
      label: "I was burned out — I didn't have the energy to engage.",
      sublabel: "Too many cross-cultural interactions had worn me down.",
    },
    {
      id: "past-experience",
      label: "A bad past experience made me reluctant to try again.",
      sublabel: "Something that happened before made me want to disengage with this person or situation.",
    },
  ],
  "cq:knowledge": [
    {
      id: "norms",
      label: "I didn't know their cultural norms or expectations.",
      sublabel: "I was caught off guard by something that was normal for them but not for me.",
    },
    {
      id: "values",
      label: "I didn't understand the values driving their behavior.",
      sublabel: "Their priorities or motivations didn't make sense to me.",
    },
  ],
  "cq:action": [
    {
      id: "froze",
      label: "I froze — I knew what to do but couldn't do it in the moment.",
      sublabel: "The pressure of the situation stopped me from acting on what I knew.",
    },
    {
      id: "defaulted",
      label: "I defaulted to my own style even though I knew it wouldn't work.",
      sublabel: "Old habits took over and I didn't adapt the way I intended.",
    },
  ],
  "cq:strategy": [
    {
      id: "no-anticipation",
      label: "I didn't see it coming — I wasn't thinking about cultural differences beforehand.",
      sublabel: "I went in without any mental preparation for how culture might show up.",
    },
    {
      id: "no-adjustment",
      label: "I saw it coming but didn't adjust my approach in time.",
      sublabel: "I knew the difference was there but didn't change my plan.",
    },
  ],
  // Cultural Values
  "values:individualism": [
    {
      id: "too-individualistic",
      label: "Too individualistic — they prioritized their own goals over the group.",
      sublabel: "They acted for themselves or their sub-group at the expense of the wider team.",
    },
    {
      id: "too-collectivist",
      label: "Too group-focused — they couldn't act without group consensus.",
      sublabel: "Every decision required buy-in, which slowed everything down or created pressure to conform.",
    },
  ],
  "values:task-relationship": [
    {
      id: "too-task",
      label: "Too task-focused — they ignored the relationship and just pushed for results.",
      sublabel: "They treated the interaction like a transaction, with no warmth or relationship-building.",
    },
    {
      id: "too-relational",
      label: "Too relationship-focused — the actual work kept getting deprioritized.",
      sublabel: "There was too much small talk, social check-in, or people-management before getting to the point.",
    },
  ],
  "values:power-distance": [
    {
      id: "over-defers",
      label: "They over-deferred — wouldn't push back or challenge authority at all.",
      sublabel: "They accepted decisions without question even when they clearly disagreed or had useful input.",
    },
    {
      id: "ignores-hierarchy",
      label: "They ignored hierarchy — challenged authority or bypassed the chain of command.",
      sublabel: "They questioned leadership, went around me, or treated titles as irrelevant.",
    },
  ],
  "values:uncertainty": [
    {
      id: "too-cautious",
      label: "Too cautious — they couldn't move without certainty, and it blocked progress.",
      sublabel: "They needed more information, approval, or planning before they were willing to act.",
    },
    {
      id: "too-comfortable",
      label: "Too comfortable with ambiguity — they acted without enough information.",
      sublabel: "They moved forward or made decisions without the clarity I needed to feel confident.",
    },
  ],
};

// ─── Framework config ─────────────────────────────────────────────────────────

export const FRAMEWORK_CONFIG = {
  PRISM: {
    color: "text-indigo-600",
    bg: "bg-indigo-50 dark:bg-indigo-950/40",
    border: "border-indigo-200 dark:border-indigo-700",
    pill: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
    progressLine: "bg-indigo-500",
    icon: Layers,
  },
  "CQ Quadrants": {
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-700",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
    progressLine: "bg-emerald-500",
    icon: Brain,
  },
  "Cultural Values": {
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    border: "border-amber-200 dark:border-amber-700",
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
    progressLine: "bg-amber-500",
    icon: Compass,
  },
};

// ─── Diagnosis map ────────────────────────────────────────────────────────────

export function getDiagnosis(
  branch: Gate1Branch,
  gate2: string,
  gate3?: string
): Omit<DiagnosisResult, "gate1Branch" | "gate2Choice" | "gate3Choice"> {
  const map: Record<string, Omit<DiagnosisResult, "gate1Branch" | "gate2Choice" | "gate3Choice">> = {
    // PRISM — Pace (directional)
    "prism:timing:too-fast": {
      framework: "PRISM", dimension: "Pace", polarity: "Fast vs. Slow",
      description: "You're experiencing a Pace mismatch — specifically, someone who moves faster than you're comfortable with. Decisions were made before you had time to process, consult, or prepare.",
      advice: "Name the time you need explicitly and early. Try: 'Before we decide, can I have until tomorrow to think this through?' Most fast-paced people aren't ignoring you — they just assume silence means agreement.",
    },
    "prism:timing:too-slow": {
      framework: "PRISM", dimension: "Pace", polarity: "Fast vs. Slow",
      description: "You're experiencing a Pace mismatch — specifically, someone who moves slower than you need. Progress felt blocked by deliberation, consultation, or the need for more certainty before acting.",
      advice: "Share your urgency with a reason and a specific ask. Try: 'I need to move on this by Thursday — what would help you feel comfortable enough to decide?' Give them a minimum viable certainty, not pressure.",
    },
    "prism:timing": {
      framework: "PRISM", dimension: "Pace", polarity: "Fast vs. Slow",
      description: "You're experiencing a Pace mismatch. One party operates at a fast, decisive tempo while the other processes more deliberately.",
      advice: "Set explicit time expectations upfront. Name the pace you need: 'I need a quick answer by noon' or 'Can we take a day to think this through?'",
    },
    // PRISM — Structure (directional)
    "prism:rules:too-rigid": {
      framework: "PRISM", dimension: "Structure", polarity: "Flexible vs. Rigid",
      description: "You're experiencing a Structure mismatch — their rigidity is slowing things down. They apply rules even when the situation clearly calls for judgment or exception.",
      advice: "Find the rule behind the rule. Ask: 'What's the intention behind this procedure?' Then show how your approach still honors that intention, even if it looks different on the surface.",
    },
    "prism:rules:too-flexible": {
      framework: "PRISM", dimension: "Structure", polarity: "Flexible vs. Rigid",
      description: "You're experiencing a Structure mismatch — their lack of process is creating unpredictability and frustration. There's no consistency to rely on.",
      advice: "Propose a lightweight agreement: 'Can we agree on just one thing to do consistently?' Start with one process, not a system overhaul. Small structure is better than none.",
    },
    "prism:rules": {
      framework: "PRISM", dimension: "Structure", polarity: "Flexible vs. Rigid",
      description: "You're experiencing a Structure mismatch. One person thrives with clear processes and written rules; the other sees structure as a constraint that slows them down.",
      advice: "Identify the minimum viable structure both sides can live with. Agree on what must be documented vs. what can stay informal.",
    },
    // PRISM — Authority (directional)
    "prism:power:too-hierarchical": {
      framework: "PRISM", dimension: "Authority", polarity: "Hierarchy vs. Flat",
      description: "You're experiencing an Authority mismatch — they're overly deferential. They won't act, push back, or offer input without explicit sign-off from above, even when autonomy is clearly expected.",
      advice: "Explicitly grant permission. Say: 'I want you to make this call — you don't need to check with me.' Some people need the hierarchy to explicitly de-activate before they feel safe to act independently.",
    },
    "prism:power:too-flat": {
      framework: "PRISM", dimension: "Authority", polarity: "Hierarchy vs. Flat",
      description: "You're experiencing an Authority mismatch — they're bypassing the hierarchy. They're making decisions or taking actions that weren't theirs to make, ignoring the chain of command.",
      advice: "Be explicit about decision rights, not just expectations. Clarify: 'For this type of decision, the sign-off needed is X.' Make the structure visible so they can navigate it, not just comply with it.",
    },
    "prism:power": {
      framework: "PRISM", dimension: "Authority", polarity: "Hierarchy vs. Flat",
      description: "You're experiencing an Authority mismatch. One person expects decisions to flow through the hierarchy; the other assumes they have autonomy to act independently.",
      advice: "Make the decision-making process explicit. Whose sign-off is required here? State it clearly, even if it feels obvious to you.",
    },
    // PRISM — Communication (directional)
    "prism:information:indirect": {
      framework: "PRISM", dimension: "Communication", polarity: "Direct vs. Indirect",
      description: "You're experiencing a Communication Style mismatch — specifically, an indirect communicator. They rely on context, relationship, and implication to convey meaning. You need it spelled out.",
      advice: "Ask clarifying questions that invite directness: 'Can you help me understand what you'd like me to do specifically?' This gives them a graceful path to say it plainly.",
    },
    "prism:information:too-direct": {
      framework: "PRISM", dimension: "Communication", polarity: "Direct vs. Indirect",
      description: "You're experiencing a Communication Style mismatch — specifically, an overly direct communicator. They delivered the message without softening, which landed as blunt or even aggressive.",
      advice: "Interpret the message, not the delivery. Their directness is a sign of efficiency and trust, not disrespect. You can ask them to add context: 'Could you walk me through your thinking?'",
    },
    // CQ — Drive (directional)
    "cq:drive:burned-out": {
      framework: "CQ Quadrants", dimension: "CQ Drive", polarity: "Motivation (Low — Burnout)",
      description: "Your CQ Drive is depleted by burnout. When the tank is empty, even interactions you'd normally handle well feel overwhelming. This isn't a character flaw — it's a capacity issue.",
      advice: "Don't force engagement right now. Lower the stakes: aim for one small, genuine moment of curiosity per interaction. Refueling CQ Drive requires rest, not just effort.",
    },
    "cq:drive:past-experience": {
      framework: "CQ Quadrants", dimension: "CQ Drive", polarity: "Motivation (Low — Past Experience)",
      description: "Your CQ Drive is blocked by a previous negative experience. A bad interaction has created a reluctance to try again — which is completely understandable, but worth addressing directly.",
      advice: "Name the experience (to yourself, or a trusted colleague). What specifically went wrong? Separating what happened from what might happen next is the first step to re-engaging.",
    },
    "cq:drive": {
      framework: "CQ Quadrants", dimension: "CQ Drive", polarity: "Motivation (High vs. Low)",
      description: "Your CQ Drive dipped. This is the motivational engine of cultural intelligence — when it's low, everything else stalls.",
      advice: "Don't force engagement right now. Identify one small, genuinely curious question about this person's perspective and start there.",
    },
    // CQ — Knowledge (directional)
    "cq:knowledge:norms": {
      framework: "CQ Quadrants", dimension: "CQ Knowledge", polarity: "Cognition (Norms Gap)",
      description: "Your CQ Knowledge gap is around cultural norms — the unwritten rules of how things are done. You were caught off guard by behavior that was completely normal for them but unexpected for you.",
      advice: "Research this specific norm. A 5-minute conversation with a colleague from that background is worth more than an hour of reading. Ask: 'Is this common in your experience?'",
    },
    "cq:knowledge:values": {
      framework: "CQ Quadrants", dimension: "CQ Knowledge", polarity: "Cognition (Values Gap)",
      description: "Your CQ Knowledge gap is around values — the deeper 'why' behind behavior. You understood what they did but not why it mattered to them, or what principle was driving it.",
      advice: "Ask about priorities, not behavior: 'Help me understand what matters most to you in a situation like this.' Values are rarely explained unless someone asks.",
    },
    "cq:knowledge": {
      framework: "CQ Quadrants", dimension: "CQ Knowledge", polarity: "Cognition (Low)",
      description: "Your CQ Knowledge has a gap here. You encountered a cultural norm or behavior you didn't have the framework to decode.",
      advice: "Research this specific norm or cultural pattern. The confusion you felt is the exact thing to investigate.",
    },
    // CQ — Action (directional)
    "cq:action:froze": {
      framework: "CQ Quadrants", dimension: "CQ Action", polarity: "Behavioral (Froze Under Pressure)",
      description: "Your CQ Action broke down under pressure — you froze. You had the knowledge and the instinct, but the stakes or the surprise of the moment stopped you from acting on it.",
      advice: "Debrief the exact moment you froze. What triggered it? Practice that specific micro-behavior in low-stakes situations first — a pause, a question, a phrase — until it becomes automatic.",
    },
    "cq:action:defaulted": {
      framework: "CQ Quadrants", dimension: "CQ Action", polarity: "Behavioral (Reverted to Default)",
      description: "Your CQ Action broke down because habits overrode intention. You defaulted to your own cultural style even though you knew it probably wouldn't work in this situation.",
      advice: "Anticipation is the fix: before your next interaction, decide the one specific behavior you'll do differently. Pre-commit to it out loud if possible — 'In this meeting, I'm going to pause before responding.'",
    },
    "cq:action": {
      framework: "CQ Quadrants", dimension: "CQ Action", polarity: "Behavioral (Gap between intent and execution)",
      description: "Your CQ Action needs work. You had the right instinct but your behavior didn't follow through in the moment.",
      advice: "Debrief the moment. What was the exact point where your behavior diverged from your intent? Practice that specific micro-behavior before the next interaction.",
    },
    // CQ — Strategy (directional)
    "cq:strategy:no-anticipation": {
      framework: "CQ Quadrants", dimension: "CQ Strategy", polarity: "Metacognition (Not Anticipated)",
      description: "Your CQ Strategy gap was upstream: you didn't identify the cultural dynamics before the interaction. You went in without a mental model for how culture might show up.",
      advice: "Build a 2-minute pre-flight habit: before important interactions, ask yourself 'What cultural differences might show up here, and how will I handle them?' Anticipation is a skill, not a gift.",
    },
    "cq:strategy:no-adjustment": {
      framework: "CQ Quadrants", dimension: "CQ Strategy", polarity: "Metacognition (Anticipated but Didn't Adjust)",
      description: "Your CQ Strategy gap was in the pivot: you saw it coming but didn't change your approach in time. Awareness without adaptation is strategy without execution.",
      advice: "Next time you notice a cultural dynamic mid-interaction, give yourself permission to pause and recalibrate: 'Give me a moment to think.' The pause is the strategy.",
    },
    "cq:strategy": {
      framework: "CQ Quadrants", dimension: "CQ Strategy", polarity: "Metacognition (Reactive vs. Planned)",
      description: "Your CQ Strategy was reactive rather than planned. You hadn't thought through the cultural dynamics beforehand, so you were improvising under pressure.",
      advice: "Before your next cross-cultural interaction, spend 2 minutes asking: What cultural differences might come up? What's my plan if they do?",
    },
    // Values — Individualism (directional)
    "values:individualism:too-individualistic": {
      framework: "Cultural Values", dimension: "Individualism vs. Collectivism", polarity: "Self-focused vs. Group-focused",
      description: "You're experiencing an Individualism tension — they prioritized personal or sub-group goals over the wider team. This can look like credit-seeking, freelancing, or ignoring group norms.",
      advice: "Name the shared goal explicitly. Redirect the conversation to 'What's best for the team here?' without blaming. Collective framing is more effective than individual criticism.",
    },
    "values:individualism:too-collectivist": {
      framework: "Cultural Values", dimension: "Individualism vs. Collectivism", polarity: "Self-focused vs. Group-focused",
      description: "You're experiencing a Collectivism tension — they couldn't (or wouldn't) act without broad group consensus, which slowed everything down or created pressure to conform.",
      advice: "Respect the process while moving things forward: 'I want to make sure everyone's heard. Can we agree to a decision point by [date] after input is gathered?' Timebox the consensus.",
    },
    "values:individualism": {
      framework: "Cultural Values", dimension: "Individualism vs. Collectivism", polarity: "Self-focused vs. Group-focused",
      description: "You've hit an Individualism vs. Collectivism tension. This determines whether someone's primary loyalty is to themselves, or to the group.",
      advice: "When you disagree, try naming it: 'I think we see who this decision is for differently.'",
    },
    // Values — Task vs. Relationship (directional)
    "values:task-relationship:too-task": {
      framework: "Cultural Values", dimension: "Task vs. Relationship", polarity: "Results-first vs. People-first",
      description: "You're experiencing a Task vs. Relationship tension — they treated the interaction as a transaction. Results mattered; the relationship didn't. It felt cold, dismissive, or disrespectful.",
      advice: "Name what you need without framing it as a complaint: 'It helps me work better when we take a few minutes to connect first.' You're educating them on your working style, not criticizing theirs.",
    },
    "values:task-relationship:too-relational": {
      framework: "Cultural Values", dimension: "Task vs. Relationship", polarity: "Results-first vs. People-first",
      description: "You're experiencing a Task vs. Relationship tension — they prioritized rapport and relationship-maintenance over getting the work done. You felt like the task kept getting deprioritized.",
      advice: "Honor the relationship briefly, then bridge to the task: 'I really value our time together — I also want to make sure we leave today with X decided.' Blend both rather than forcing a choice.",
    },
    "values:task-relationship": {
      framework: "Cultural Values", dimension: "Task vs. Relationship", polarity: "Results-first vs. People-first",
      description: "You're experiencing a Task vs. Relationship tension. One person prioritizes getting the work done; the other prioritizes maintaining the relationship as the vehicle for work.",
      advice: "Invest 5 minutes of relationship-building before any high-stakes task conversation.",
    },
    // Values — Power Distance (directional)
    "values:power-distance:over-defers": {
      framework: "Cultural Values", dimension: "Power Distance", polarity: "High vs. Low",
      description: "You're experiencing a Power Distance tension — they over-defer to authority. They won't push back, share concerns, or contribute ideas unless explicitly invited, even when you need their honest input.",
      advice: "Explicitly invite dissent: 'I specifically want to know if you see a problem with this' or 'What would you do differently?' Make it safe — and expected — to speak up.",
    },
    "values:power-distance:ignores-hierarchy": {
      framework: "Cultural Values", dimension: "Power Distance", polarity: "High vs. Low",
      description: "You're experiencing a Power Distance tension — they're ignoring or challenging hierarchy. They bypassed the chain of command, questioned authority, or acted beyond their sanctioned role.",
      advice: "Separate the behavior from the intention. They may be trying to be helpful or efficient. Clarify roles without shaming: 'For this type of decision, I need to be in the loop first.'",
    },
    "values:power-distance": {
      framework: "Cultural Values", dimension: "Power Distance", polarity: "High vs. Low",
      description: "You're experiencing a Power Distance conflict. High power distance cultures expect authority to be respected; low power distance cultures expect everyone to challenge ideas regardless of title.",
      advice: "Be explicit about the decision-making culture you're in right now.",
    },
    // Values — Uncertainty (directional)
    "values:uncertainty:too-cautious": {
      framework: "Cultural Values", dimension: "Uncertainty Avoidance", polarity: "High vs. Low",
      description: "You're experiencing an Uncertainty Avoidance tension — they need more certainty than you have to give. They're blocked without a plan, approval, or more data, and it's stalling progress.",
      advice: "Give them the minimum viable certainty: a deadline, one fixed point, or a clear backstop. 'We won't go past X without checking in again.' This unblocks them without over-structuring.",
    },
    "values:uncertainty:too-comfortable": {
      framework: "Cultural Values", dimension: "Uncertainty Avoidance", polarity: "High vs. Low",
      description: "You're experiencing an Uncertainty Avoidance tension — they're too comfortable with ambiguity. They acted or decided without the clarity you needed to feel confident in the direction.",
      advice: "Slow it down with a specific ask: 'Before we commit, can we agree on just these two things?' You don't need all the answers — just enough structure to feel anchored.",
    },
    "values:uncertainty": {
      framework: "Cultural Values", dimension: "Uncertainty Avoidance", polarity: "High vs. Low",
      description: "You're experiencing an Uncertainty Avoidance conflict. One person needs clarity, plans, and defined outcomes; the other is energized by ambiguity and sees plans as constraints.",
      advice: "Give the high-avoidance person the minimum viable certainty they need to move forward.",
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

// ─── Sub-components ───────────────────────────────────────────────────────────

export function ChoiceCard({
  label,
  sublabel,
  icon: Icon,
  color,
  bgColor,
  borderColor,
  selected,
  onClick,
}: {
  label: string;
  sublabel: string;
  icon?: React.ElementType;
  color?: string;
  bgColor?: string;
  borderColor?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 hover:shadow-md group",
        selected
          ? cn("shadow-md", bgColor, borderColor)
          : "border-border bg-card hover:border-primary/30 hover:bg-accent/30"
      )}
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div
            className={cn(
              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
              selected ? bgColor : "bg-secondary group-hover:bg-primary/10"
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-colors",
                selected ? color : "text-muted-foreground group-hover:text-primary"
              )}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={cn("font-semibold text-sm leading-snug", selected ? color : "text-foreground")}>
            {label}
          </p>
          {sublabel && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{sublabel}</p>
          )}
        </div>
        <ArrowRight
          className={cn(
            "h-4 w-4 shrink-0 mt-0.5 transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5",
            selected ? cn(color, "opacity-100") : "text-muted-foreground"
          )}
        />
      </div>
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
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

// ─── Main FrictionDiagnoser component ────────────────────────────────────────
//
// Props
//   onComplete  — called when a diagnosis is reached (or null if user opts out)
//   showOptOut  — show a "No friction this week" skip link (default true)

interface FrictionDiagnoserProps {
  onComplete: (result: DiagnosisResult | null) => void;
  showOptOut?: boolean;
}

type GateState = 1 | 2 | 3 | "done";

export function FrictionDiagnoser({
  onComplete,
  showOptOut = true,
}: FrictionDiagnoserProps) {
  const [gate, setGate] = useState<GateState>(1);
  const [branch, setBranch] = useState<Gate1Branch | null>(null);
  const [gate2Choice, setGate2Choice] = useState<string | null>(null);
  const [gate3Choice, setGate3Choice] = useState<string | null>(null);

  const activeBranchConfig = branch ? GATE1_OPTIONS.find((o) => o.id === branch) : null;
  const gate2Options = branch ? GATE2_OPTIONS[branch] : [];
  const selectedGate2 = gate2Options.find((o) => o.id === gate2Choice);
  const disambigKey = branch && gate2Choice ? `${branch}:${gate2Choice}` : null;
  const gate3Options = disambigKey ? GATE3_OPTIONS[disambigKey] ?? [] : [];

  const handleGate1Select = (id: Gate1Branch) => {
    setBranch(id);
    setGate2Choice(null);
    setGate3Choice(null);
    setGate(2);
  };

  const handleGate2Select = (id: string) => {
    setGate2Choice(id);
    const g2 = GATE2_OPTIONS[branch!].find((o) => o.id === id);
    const dKey = `${branch}:${id}`;
    if (g2?.needsDisambiguation && GATE3_OPTIONS[dKey]) {
      setGate3Choice(null);
      setGate(3);
    } else {
      const raw = getDiagnosis(branch!, id);
      const result: DiagnosisResult = { ...raw, gate1Branch: branch!, gate2Choice: id, gate3Choice: null };
      onComplete(result);
      setGate("done");
    }
  };

  const handleGate3Select = (id: string) => {
    setGate3Choice(id);
    const raw = getDiagnosis(branch!, gate2Choice!, id);
    const result: DiagnosisResult = { ...raw, gate1Branch: branch!, gate2Choice: gate2Choice!, gate3Choice: id };
    onComplete(result);
    setGate("done");
  };

  const handleBack = () => {
    if (gate === 3) setGate(2);
    else if (gate === 2) { setBranch(null); setGate(1); }
  };

  if (gate === "done") return null; // parent handles the result display

  return (
    <div className="space-y-3">
      {/* Gate 1 */}
      {gate === 1 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-sm font-medium">Where did the frustration come from?</p>
          {GATE1_OPTIONS.map((opt) => (
            <ChoiceCard
              key={opt.id}
              label={opt.label}
              sublabel={opt.promptText}
              icon={opt.icon}
              color={opt.color}
              bgColor={opt.bgColor}
              borderColor={opt.borderColor}
              selected={branch === opt.id}
              onClick={() => handleGate1Select(opt.id)}
            />
          ))}
          {showOptOut && (
            <button
              type="button"
              onClick={() => onComplete(null)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors mt-1"
            >
              No friction this week — skip this section →
            </button>
          )}
        </div>
      )}

      {/* Gate 2 */}
      {gate === 2 && branch && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {activeBranchConfig && (
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
              <activeBranchConfig.icon className={cn("h-3.5 w-3.5 shrink-0", activeBranchConfig.color)} />
              <span className={cn("text-xs font-semibold", activeBranchConfig.color)}>
                {activeBranchConfig.label}
              </span>
            </div>
          )}
          <p className="text-sm font-medium">What was the specific friction?</p>
          {gate2Options.map((opt) => (
            <ChoiceCard
              key={opt.id}
              label={opt.label}
              sublabel={opt.sublabel}
              selected={gate2Choice === opt.id}
              onClick={() => handleGate2Select(opt.id)}
            />
          ))}
          <BackBtn onClick={handleBack} />
        </div>
      )}

      {/* Gate 3 — disambiguation */}
      {gate === 3 && selectedGate2 && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
            <p className="text-xs text-muted-foreground">You said:</p>
            <p className="text-sm font-medium mt-0.5">{selectedGate2.label}</p>
          </div>
          <p className="text-sm font-medium">Was the frustration that they were…</p>
          {gate3Options.map((opt) => (
            <ChoiceCard
              key={opt.id}
              label={opt.label}
              sublabel={opt.sublabel}
              selected={gate3Choice === opt.id}
              onClick={() => handleGate3Select(opt.id)}
            />
          ))}
          <BackBtn onClick={handleBack} />
        </div>
      )}
    </div>
  );
}

// ─── Compact result badge (used in Survey.tsx after diagnosis is set) ─────────

export function DiagnosisBadge({
  result,
  onClear,
}: {
  result: DiagnosisResult;
  onClear: () => void;
}) {
  const cfg = FRAMEWORK_CONFIG[result.framework];
  return (
    <div className={cn("rounded-xl border p-4 flex items-center gap-3", cfg.bg, cfg.border)}>
      <cfg.icon className={cn("h-5 w-5 shrink-0", cfg.color)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5", cfg.pill)}>
            {result.framework}
          </span>
          <span className={cn("text-sm font-bold", cfg.color)}>{result.dimension}</span>
          <span className="text-xs text-muted-foreground">— {result.polarity}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
          {result.description}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <CheckCircle2 className={cn("h-4 w-4", cfg.color)} />
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          Change
        </button>
      </div>
    </div>
  );
}
