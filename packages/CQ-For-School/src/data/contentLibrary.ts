import { INTERVENTION_LIBRARY, type InterventionEntry } from "./interventionLibrary";
import type { GapType } from "@/lib/cpdEvidenceStrength";

export interface ContentLesson {
  intervention: InterventionEntry;
  gapType: GapType;
  frictionSubItems: string[];
  detailSections: {
    overview: string;
    learningObjectives: string[];
    facilitationNotes: string;
    evidenceAlignment: string;
    resources: string[];
  };
}

const LESSON_DETAILS: Record<string, Omit<ContentLesson, "intervention">> = {
  "cq-meetings-workshop": {
    gapType: "coverage",
    frictionSubItems: ["fi-3", "fi-6"],
    detailSections: {
      overview: "Interactive workshop on running inclusive, productive meetings across cultural lines. Participants practice agenda-setting, turn-taking norms, and de-escalation techniques through role-play scenarios.",
      learningObjectives: [
        "Identify at least 3 cultural norms that affect meeting dynamics",
        "Apply turn-taking protocols that ensure equitable voice",
        "Practice de-escalation techniques for cross-cultural tension",
      ],
      facilitationNotes: "Requires a trained facilitator. Best run in groups of 12–20. Provide printed scenario cards ahead of time.",
      evidenceAlignment: "Completion contributes to C1 School Culture evidence. Attendance and post-session reflections are logged as WASC artifacts.",
      resources: ["Meeting facilitation guide (PDF)", "Scenario cards template", "Post-session reflection form"],
    },
  },
  "cultural-norms-async": {
    gapType: "distribution",
    frictionSubItems: ["fi-7", "fi-5"],
    detailSections: {
      overview: "Self-paced module exploring how cultural backgrounds shape humour, directness, and workplace norms. Includes reflection prompts and scenario exercises.",
      learningObjectives: [
        "Describe how cultural dimensions affect communication styles",
        "Identify personal cultural assumptions in 3 workplace scenarios",
        "Draft a personal action plan for cross-cultural interaction",
      ],
      facilitationNotes: "No facilitator required. Recommend pairing with a follow-up discussion circle within 2 weeks.",
      evidenceAlignment: "Completion contributes to C1 School Culture and A3 Faculty and Staff evidence.",
      resources: ["Cultural dimensions quick-reference card", "Reflection journal template"],
    },
  },
  "leadership-clarity-webinar": {
    gapType: "compliance",
    frictionSubItems: ["fi-9", "fi-1"],
    detailSections: {
      overview: "Webinar addressing how leadership styles vary across cultures, with tools for setting and communicating clear expectations.",
      learningObjectives: [
        "Compare directive vs. collaborative leadership styles across cultures",
        "Create a leadership expectations one-pager for their team",
        "Identify 2 areas where their leadership communication can improve",
      ],
      facilitationNotes: "Can be run live or recorded. Q&A segment strongly recommended.",
      evidenceAlignment: "Directly addresses A2 Leadership and Governance evidence requirements.",
      resources: ["Leadership styles comparison chart", "Expectations template"],
    },
  },
  "belonging-workshop": {
    gapType: "coverage",
    frictionSubItems: ["fi-8", "fi-4"],
    detailSections: {
      overview: "Deep-dive workshop on creating psychological safety, addressing exclusion dynamics, and fostering genuine belonging across difference.",
      learningObjectives: [
        "Define psychological safety and its cultural dimensions",
        "Identify exclusion patterns in team dynamics",
        "Design 2 belonging rituals for their department",
      ],
      facilitationNotes: "High-trust activity — requires experienced facilitator. Groups of 8–15 work best.",
      evidenceAlignment: "Key evidence for C1 School Culture and C2 Systems of Support.",
      resources: ["Belonging assessment tool", "Ritual design worksheet", "Facilitator guide"],
    },
  },
  "active-listening-async": {
    gapType: "distribution",
    frictionSubItems: ["fi-3", "fi-2"],
    detailSections: {
      overview: "Short async module on listening techniques that bridge cultural communication gaps, with practice exercises.",
      learningObjectives: [
        "Practice 3 active listening techniques across cultural contexts",
        "Identify cultural barriers to effective listening",
      ],
      facilitationNotes: "No facilitator needed. Pairs well with the feedback workshop as a prerequisite.",
      evidenceAlignment: "Supports C1 School Culture and A3 Faculty and Staff evidence.",
      resources: ["Listening techniques card", "Practice scenario audio clips"],
    },
  },
  "feedback-workshop": {
    gapType: "alignment",
    frictionSubItems: ["fi-8", "fi-7"],
    detailSections: {
      overview: "Workshop on adapting feedback styles to cultural contexts. Covers direct vs. indirect communication, face-saving, and constructive critique.",
      learningObjectives: [
        "Distinguish direct and indirect feedback preferences across cultures",
        "Practice giving feedback using the SBI (Situation-Behavior-Impact) model",
        "Develop a culturally adaptive feedback plan for one direct report",
      ],
      facilitationNotes: "Requires paired exercises. Ideal for teams that work closely together.",
      evidenceAlignment: "Maps to A3 Faculty and Staff and C1 School Culture.",
      resources: ["SBI feedback template", "Cultural feedback styles reference"],
    },
  },
  "handoffs-async": {
    gapType: "alignment",
    frictionSubItems: ["fi-10", "fi-12"],
    detailSections: {
      overview: "Async module on clear task handoff protocols, follow-up cadences, and accountability norms across cultures.",
      learningObjectives: [
        "Create a handoff checklist for cross-functional projects",
        "Establish follow-up norms that respect cultural time orientation",
      ],
      facilitationNotes: "Self-paced. Recommend managers review outputs with their teams.",
      evidenceAlignment: "Supports A2 Leadership and Governance and A4 Continuous Improvement.",
      resources: ["Handoff checklist template", "Accountability norms one-pager"],
    },
  },
  "parent-comms-webinar": {
    gapType: "coverage",
    frictionSubItems: ["fi-5", "fi-9"],
    detailSections: {
      overview: "Webinar on navigating parent communication across cultural expectations, languages, and relationship-building norms.",
      learningObjectives: [
        "Identify 3 cultural expectations that affect parent-teacher communication",
        "Draft a culturally inclusive parent communication template",
      ],
      facilitationNotes: "Can be recorded for async viewing. Include translator considerations.",
      evidenceAlignment: "Primary evidence source for C3 Community Partnerships.",
      resources: ["Parent communication template pack", "Translation resource guide"],
    },
  },
  "reflective-practice-async": {
    gapType: "alignment",
    frictionSubItems: ["fi-8", "fi-6"],
    detailSections: {
      overview: "Guided async reflection on cultural responsiveness in teaching, with journaling prompts and peer discussion frameworks.",
      learningObjectives: [
        "Complete a cultural responsiveness self-assessment",
        "Write 3 reflective journal entries on classroom practice",
        "Identify 2 changes to implement in teaching approach",
      ],
      facilitationNotes: "Self-paced with optional peer discussion component. Recommend 2-week completion window.",
      evidenceAlignment: "Supports A3 Faculty and Staff and B2 Teaching and Learning.",
      resources: ["Self-assessment rubric", "Journal prompt cards", "Peer discussion guide"],
    },
  },
  "conflict-resolution-workshop": {
    gapType: "coverage",
    frictionSubItems: ["fi-3", "fi-8"],
    detailSections: {
      overview: "Workshop on mediating disagreements when cultural assumptions are at play. Covers de-escalation, perspective-taking, and restorative conversation models.",
      learningObjectives: [
        "Apply restorative conversation models to cross-cultural conflict",
        "Practice perspective-taking exercises",
        "Create a conflict resolution protocol for their team",
      ],
      facilitationNotes: "Requires experienced facilitator. Groups of 10–16 recommended.",
      evidenceAlignment: "Supports C1 School Culture and C2 Systems of Support evidence.",
      resources: ["Restorative conversation guide", "Conflict resolution protocol template"],
    },
  },
  "inclusive-curriculum-webinar": {
    gapType: "distribution",
    frictionSubItems: ["fi-5", "fi-7"],
    detailSections: {
      overview: "Webinar exploring how to embed diverse cultural viewpoints into lesson planning and curriculum design.",
      learningObjectives: [
        "Audit one unit for cultural inclusivity gaps",
        "Identify 3 resources for diversifying curriculum content",
        "Draft an inclusive lesson plan modification",
      ],
      facilitationNotes: "Can be live or recorded. Department-level follow-up sessions recommended.",
      evidenceAlignment: "Maps to B1 Curriculum and B2 Teaching and Learning evidence.",
      resources: ["Curriculum audit checklist", "Diverse resource database link"],
    },
  },
  "data-driven-equity-async": {
    gapType: "compliance",
    frictionSubItems: ["fi-10", "fi-1"],
    detailSections: {
      overview: "Async module on interpreting assessment and survey data through an equity lens. Covers disaggregation techniques and action planning from data insights.",
      learningObjectives: [
        "Disaggregate student data by relevant equity dimensions",
        "Identify 2 equity-related patterns in school data",
        "Create an action plan based on data findings",
      ],
      facilitationNotes: "Self-paced. Recommend providing sample data sets for practice. Follow up with data team review.",
      evidenceAlignment: "Primary evidence for B3 Assessment and A4 Continuous Improvement.",
      resources: ["Data disaggregation guide", "Equity action plan template", "Sample data sets"],
    },
  },
};

// Standards that currently have no content in the library
export const STANDARDS_WITHOUT_CONTENT = ["A1", "A5", "A6", "B1", "B3", "C3", "A2", "A4"];

export function getContentLessons(): ContentLesson[] {
  return INTERVENTION_LIBRARY.map((intervention) => {
    const details = LESSON_DETAILS[intervention.id];
    return {
      intervention,
      gapType: details?.gapType ?? "coverage",
      frictionSubItems: details?.frictionSubItems ?? intervention.targetSubItems,
      detailSections: details?.detailSections ?? {
        overview: intervention.description,
        learningObjectives: ["Complete the learning module"],
        facilitationNotes: "Follow standard facilitation guidelines.",
        evidenceAlignment: `Supports ${intervention.wascAlignment} evidence.`,
        resources: [],
      },
    };
  });
}
