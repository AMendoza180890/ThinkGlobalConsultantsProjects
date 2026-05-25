import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TrendingUp, RotateCcw, History, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ResponsiveContainer, ComposedChart, Area, Line, XAxis, YAxis,
  Tooltip as RechartsTooltip, CartesianGrid,
} from "recharts";
import CQGroupProfiles from "./CQGroupProfiles";
import { QUADRANT_META as PLAYBOOK_META } from "./CQPlaybook";

// ─── CQ Growth (Overview tab) content ────────────────────────────────────────

interface CQScores { drive: number; knowledge: number; strategy: number; action: number }

// 6-month trend arrays (Oct–Mar) per segment, ending values aligned with CQNavigatorTrends latest term
const SEGMENT_TRENDS: Record<string, CQScores[]> = {
  "school:all":         [
    { drive: 6.4, knowledge: 5.9, strategy: 5.6, action: 6.1 },
    { drive: 6.6, knowledge: 6.1, strategy: 5.8, action: 6.3 },
    { drive: 6.8, knowledge: 6.3, strategy: 6.0, action: 6.5 },
    { drive: 7.0, knowledge: 6.5, strategy: 6.2, action: 6.7 },
    { drive: 7.2, knowledge: 6.7, strategy: 6.5, action: 6.9 },
    { drive: 7.5, knowledge: 7.0, strategy: 6.8, action: 7.2 },
  ],
  "role:admin":         [
    { drive: 6.8, knowledge: 6.4, strategy: 6.5, action: 6.5 },
    { drive: 6.9, knowledge: 6.5, strategy: 6.6, action: 6.6 },
    { drive: 7.0, knowledge: 6.6, strategy: 6.7, action: 6.7 },
    { drive: 7.1, knowledge: 6.7, strategy: 6.8, action: 6.8 },
    { drive: 7.2, knowledge: 6.8, strategy: 7.0, action: 6.9 },
    { drive: 7.4, knowledge: 6.9, strategy: 7.1, action: 7.1 },
  ],
  "role:teacher":       [
    { drive: 7.2, knowledge: 6.0, strategy: 5.2, action: 6.6 },
    { drive: 7.3, knowledge: 6.1, strategy: 5.4, action: 6.7 },
    { drive: 7.4, knowledge: 6.3, strategy: 5.5, action: 6.9 },
    { drive: 7.6, knowledge: 6.5, strategy: 5.8, action: 7.1 },
    { drive: 7.7, knowledge: 6.6, strategy: 6.0, action: 7.2 },
    { drive: 7.9, knowledge: 6.8, strategy: 6.2, action: 7.4 },
  ],
  "friction:high":      [
    { drive: 4.9, knowledge: 4.5, strategy: 4.2, action: 4.8 },
    { drive: 5.0, knowledge: 4.6, strategy: 4.3, action: 4.9 },
    { drive: 5.2, knowledge: 4.8, strategy: 4.5, action: 5.1 },
    { drive: 5.4, knowledge: 5.0, strategy: 4.6, action: 5.2 },
    { drive: 5.7, knowledge: 5.2, strategy: 4.9, action: 5.4 },
    { drive: 5.9, knowledge: 5.4, strategy: 5.1, action: 5.6 },
  ],
  "friction:low":       [
    { drive: 7.8, knowledge: 7.0, strategy: 6.7, action: 7.4 },
    { drive: 7.9, knowledge: 7.1, strategy: 6.8, action: 7.5 },
    { drive: 8.0, knowledge: 7.2, strategy: 6.9, action: 7.6 },
    { drive: 8.1, knowledge: 7.3, strategy: 7.0, action: 7.7 },
    { drive: 8.2, knowledge: 7.4, strategy: 7.1, action: 7.8 },
    { drive: 8.4, knowledge: 7.6, strategy: 7.3, action: 8.0 },
  ],
  "tenure:0-2":         [
    { drive: 8.0, knowledge: 5.2, strategy: 4.8, action: 6.4 },
    { drive: 8.1, knowledge: 5.3, strategy: 4.9, action: 6.5 },
    { drive: 8.2, knowledge: 5.4, strategy: 5.0, action: 6.6 },
    { drive: 8.3, knowledge: 5.6, strategy: 5.1, action: 6.7 },
    { drive: 8.4, knowledge: 5.8, strategy: 5.2, action: 6.8 },
    { drive: 8.5, knowledge: 6.0, strategy: 5.4, action: 7.0 },
  ],
  "tenure:3-5":         [
    { drive: 7.4, knowledge: 6.1, strategy: 5.6, action: 6.7 },
    { drive: 7.5, knowledge: 6.3, strategy: 5.7, action: 6.8 },
    { drive: 7.6, knowledge: 6.4, strategy: 5.9, action: 6.9 },
    { drive: 7.7, knowledge: 6.5, strategy: 6.0, action: 7.0 },
    { drive: 7.8, knowledge: 6.6, strategy: 6.1, action: 7.1 },
    { drive: 7.9, knowledge: 6.8, strategy: 6.3, action: 7.3 },
  ],
  "tenure:6-10":        [
    { drive: 7.0, knowledge: 6.8, strategy: 6.4, action: 7.1 },
    { drive: 7.1, knowledge: 6.9, strategy: 6.5, action: 7.2 },
    { drive: 7.2, knowledge: 7.0, strategy: 6.6, action: 7.3 },
    { drive: 7.3, knowledge: 7.1, strategy: 6.7, action: 7.4 },
    { drive: 7.4, knowledge: 7.2, strategy: 6.8, action: 7.5 },
    { drive: 7.5, knowledge: 7.4, strategy: 7.0, action: 7.6 },
  ],
  "tenure:10+":         [
    { drive: 6.4, knowledge: 7.4, strategy: 7.2, action: 6.7 },
    { drive: 6.5, knowledge: 7.5, strategy: 7.3, action: 6.8 },
    { drive: 6.6, knowledge: 7.6, strategy: 7.4, action: 6.9 },
    { drive: 6.7, knowledge: 7.6, strategy: 7.5, action: 6.9 },
    { drive: 6.8, knowledge: 7.7, strategy: 7.6, action: 7.0 },
    { drive: 6.9, knowledge: 7.8, strategy: 7.7, action: 7.1 },
  ],
  "level:elementary":   [
    { drive: 7.2, knowledge: 6.5, strategy: 5.8, action: 6.8 },
    { drive: 7.3, knowledge: 6.6, strategy: 5.9, action: 6.9 },
    { drive: 7.4, knowledge: 6.7, strategy: 6.0, action: 7.0 },
    { drive: 7.5, knowledge: 6.8, strategy: 6.2, action: 7.1 },
    { drive: 7.6, knowledge: 6.9, strategy: 6.3, action: 7.1 },
    { drive: 7.7, knowledge: 7.0, strategy: 6.4, action: 7.2 },
  ],
  "level:middle":       [
    { drive: 6.8, knowledge: 6.1, strategy: 5.3, action: 6.4 },
    { drive: 6.9, knowledge: 6.2, strategy: 5.4, action: 6.5 },
    { drive: 7.0, knowledge: 6.3, strategy: 5.5, action: 6.6 },
    { drive: 7.1, knowledge: 6.4, strategy: 5.6, action: 6.7 },
    { drive: 7.2, knowledge: 6.5, strategy: 5.7, action: 6.8 },
    { drive: 7.3, knowledge: 6.6, strategy: 5.9, action: 6.9 },
  ],
  "level:high":         [
    { drive: 6.7, knowledge: 6.4, strategy: 5.9, action: 6.6 },
    { drive: 6.8, knowledge: 6.5, strategy: 6.0, action: 6.7 },
    { drive: 6.9, knowledge: 6.6, strategy: 6.1, action: 6.8 },
    { drive: 7.0, knowledge: 6.7, strategy: 6.2, action: 6.9 },
    { drive: 7.1, knowledge: 6.8, strategy: 6.3, action: 7.0 },
    { drive: 7.2, knowledge: 6.9, strategy: 6.4, action: 7.1 },
  ],
  "dept:humanities":    [
    { drive: 7.5, knowledge: 6.7, strategy: 5.9, action: 7.0 },
    { drive: 7.6, knowledge: 6.8, strategy: 6.0, action: 7.1 },
    { drive: 7.7, knowledge: 6.9, strategy: 6.1, action: 7.2 },
    { drive: 7.8, knowledge: 7.0, strategy: 6.2, action: 7.3 },
    { drive: 7.9, knowledge: 7.0, strategy: 6.2, action: 7.4 },
    { drive: 8.0, knowledge: 7.1, strategy: 6.3, action: 7.5 },
  ],
  "dept:stem":          [
    { drive: 6.8, knowledge: 6.0, strategy: 5.4, action: 6.4 },
    { drive: 6.9, knowledge: 6.1, strategy: 5.5, action: 6.5 },
    { drive: 7.0, knowledge: 6.2, strategy: 5.6, action: 6.5 },
    { drive: 7.1, knowledge: 6.3, strategy: 5.7, action: 6.7 },
    { drive: 7.2, knowledge: 6.4, strategy: 5.8, action: 6.8 },
    { drive: 7.3, knowledge: 6.5, strategy: 6.0, action: 6.9 },
  ],
  "dept:arts-pe":       [
    { drive: 7.8, knowledge: 6.3, strategy: 5.5, action: 7.1 },
    { drive: 7.9, knowledge: 6.4, strategy: 5.6, action: 7.2 },
    { drive: 8.0, knowledge: 6.5, strategy: 5.7, action: 7.3 },
    { drive: 8.1, knowledge: 6.6, strategy: 5.8, action: 7.4 },
    { drive: 8.2, knowledge: 6.7, strategy: 5.9, action: 7.5 },
    { drive: 8.3, knowledge: 6.8, strategy: 6.0, action: 7.6 },
  ],
  "parent:primary":     [
    { drive: 6.0, knowledge: 5.5, strategy: 5.1, action: 5.7 },
    { drive: 6.1, knowledge: 5.6, strategy: 5.2, action: 5.8 },
    { drive: 6.2, knowledge: 5.7, strategy: 5.3, action: 5.9 },
    { drive: 6.3, knowledge: 5.8, strategy: 5.4, action: 6.0 },
    { drive: 6.4, knowledge: 5.9, strategy: 5.5, action: 6.1 },
    { drive: 6.5, knowledge: 6.0, strategy: 5.6, action: 6.2 },
  ],
  "parent:secondary":   [
    { drive: 6.4, knowledge: 5.8, strategy: 5.4, action: 6.0 },
    { drive: 6.5, knowledge: 5.9, strategy: 5.5, action: 6.1 },
    { drive: 6.6, knowledge: 6.0, strategy: 5.6, action: 6.2 },
    { drive: 6.7, knowledge: 6.1, strategy: 5.7, action: 6.3 },
    { drive: 6.8, knowledge: 6.2, strategy: 5.8, action: 6.4 },
    { drive: 6.9, knowledge: 6.3, strategy: 5.9, action: 6.5 },
  ],
  "parent:high-school": [
    { drive: 6.7, knowledge: 6.1, strategy: 5.8, action: 6.3 },
    { drive: 6.8, knowledge: 6.2, strategy: 5.9, action: 6.4 },
    { drive: 6.9, knowledge: 6.3, strategy: 6.0, action: 6.5 },
    { drive: 7.0, knowledge: 6.4, strategy: 6.1, action: 6.6 },
    { drive: 7.1, knowledge: 6.5, strategy: 6.2, action: 6.7 },
    { drive: 7.2, knowledge: 6.6, strategy: 6.3, action: 6.8 },
  ],
};

function avgTrends(keys: string[]): CQScores[] | null {
  const valid = keys.filter(k => k in SEGMENT_TRENDS);
  if (valid.length === 0) return null;
  return Array.from({ length: 6 }, (_, i) => {
    const sum = valid.reduce(
      (acc, k) => { const s = SEGMENT_TRENDS[k][i]; return { drive: acc.drive + s.drive, knowledge: acc.knowledge + s.knowledge, strategy: acc.strategy + s.strategy, action: acc.action + s.action }; },
      { drive: 0, knowledge: 0, strategy: 0, action: 0 }
    );
    const n = valid.length;
    return { drive: Math.round((sum.drive/n)*10)/10, knowledge: Math.round((sum.knowledge/n)*10)/10, strategy: Math.round((sum.strategy/n)*10)/10, action: Math.round((sum.action/n)*10)/10 };
  });
}

interface FilterOption { key: string; label: string }
interface FilterGroup  { label: string; options: FilterOption[] }

const FILTER_GROUPS: FilterGroup[] = [
  { label: "School", options: [{ key: "school:all", label: "Whole School" }] },
  { label: "Role", options: [{ key: "role:admin", label: "Administration" }, { key: "role:teacher", label: "All Teachers" }, { key: "friction:high", label: "High-Friction Staff" }, { key: "friction:low", label: "Low-Friction Staff" }] },
  { label: "Tenure", options: [{ key: "tenure:0-2", label: "0–2 Years" }, { key: "tenure:3-5", label: "3–5 Years" }, { key: "tenure:6-10", label: "6–10 Years" }, { key: "tenure:10+", label: "10+ Years" }] },
  { label: "School Level", options: [{ key: "level:elementary", label: "Elementary" }, { key: "level:middle", label: "Middle School" }, { key: "level:high", label: "High School" }] },
  { label: "Department", options: [{ key: "dept:humanities", label: "Humanities" }, { key: "dept:stem", label: "STEM" }, { key: "dept:arts-pe", label: "Arts & PE" }] },
  { label: "Parents", options: [{ key: "parent:primary", label: "Primary Parents" }, { key: "parent:secondary", label: "Secondary Parents" }, { key: "parent:high-school", label: "HS Parents" }] },
];
const ALL_OPTIONS: FilterOption[] = FILTER_GROUPS.flatMap(g => g.options);
function labelForKeys(keys: string[]) { return keys.length === 0 ? "None" : keys.map(k => ALL_OPTIONS.find(o => o.key === k)?.label ?? k).join(" + "); }

const SEGMENT_N: Record<string, number> = {
  "role:admin": 8, "role:teacher": 75, "friction:high": 27, "friction:low": 48,
  "tenure:0-2": 22, "tenure:3-5": 26, "tenure:6-10": 21, "tenure:10+": 17,
  "level:elementary": 24, "level:middle": 25, "level:high": 26,
  "dept:humanities": 29, "dept:stem": 27, "dept:arts-pe": 19,
  "parent:all": 38, "parent:primary": 14, "parent:secondary": 13, "parent:high-school": 11,
};

const HIST_FILTER_GROUPS: FilterGroup[] = [
  { label: "Role", options: [
    { key: "role:admin",    label: "Administration" },
    { key: "role:teacher",  label: "All Teachers" },
    { key: "friction:high", label: "High-Friction Staff" },
    { key: "friction:low",  label: "Low-Friction Staff" },
  ]},
  { label: "Tenure", options: [
    { key: "tenure:0-2",  label: "0–2 Years" },
    { key: "tenure:3-5",  label: "3–5 Years" },
    { key: "tenure:6-10", label: "6–10 Years" },
    { key: "tenure:10+",  label: "10+ Years" },
  ]},
  { label: "School Level", options: [
    { key: "level:elementary", label: "Elementary" },
    { key: "level:middle",     label: "Middle School" },
    { key: "level:high",       label: "High School" },
  ]},
  { label: "Department", options: [
    { key: "dept:humanities", label: "Humanities" },
    { key: "dept:stem",       label: "STEM" },
    { key: "dept:arts-pe",    label: "Arts & PE" },
  ]},
  { label: "Parents", options: [
    { key: "parent:all",         label: "All Parents" },
    { key: "parent:primary",     label: "Primary Parents" },
    { key: "parent:secondary",   label: "Secondary Parents" },
    { key: "parent:high-school", label: "HS Parents" },
  ]},
];

const DEPARTED_FILTER_GROUPS: FilterGroup[] = [
  { label: "Role", options: [
    { key: "d-role:teacher",   label: "All Departed Teachers" },
    { key: "d-friction:high",  label: "High-Friction Departed" },
    { key: "d-friction:low",   label: "Low-Friction Departed" },
  ]},
  { label: "Tenure at Departure", options: [
    { key: "d-tenure:0-2",  label: "0–2 Years" },
    { key: "d-tenure:3-5",  label: "3–5 Years" },
    { key: "d-tenure:6-10", label: "6–10 Years" },
    { key: "d-tenure:10+",  label: "10+ Years" },
  ]},
  { label: "School Level", options: [
    { key: "d-level:elementary", label: "Elementary" },
    { key: "d-level:middle",     label: "Middle School" },
    { key: "d-level:high",       label: "High School" },
  ]},
  { label: "Department", options: [
    { key: "d-dept:humanities", label: "Humanities" },
    { key: "d-dept:stem",       label: "STEM" },
    { key: "d-dept:arts-pe",    label: "Arts & PE" },
  ]},
];

const DEPARTED_N: Record<string, number> = {
  "d-role:teacher": 12, "d-friction:high": 12, "d-friction:low": 0,
  "d-tenure:0-2": 5, "d-tenure:3-5": 5, "d-tenure:6-10": 2, "d-tenure:10+": 0,
  "d-level:elementary": 3, "d-level:middle": 4, "d-level:high": 5,
  "d-dept:humanities": 4, "d-dept:stem": 5, "d-dept:arts-pe": 3,
};

const CQ_AXES = [
  { key: "drive",     label: "Drive",     question: "Do I want to engage?" },
  { key: "knowledge", label: "Knowledge", question: "Do I understand?" },
  { key: "strategy",  label: "Strategy",  question: "Do I plan effectively?" },
  { key: "action",    label: "Action",    question: "Can I adapt?" },
];

function SegmentSelector({ slot, color, keys, onChange }: { slot: "A" | "B"; color: string; keys: string[]; onChange: (keys: string[]) => void }) {
  function toggle(key: string) { onChange(keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key]); }
  const hasAny = keys.length > 0;
  return (
    <Card className="border-2" style={{ borderColor: color + "40" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <CardTitle className="text-sm font-bold uppercase tracking-wider" style={{ color }}>
              Group {slot}
            </CardTitle>
          </div>
          {hasAny && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => onChange([])}>
              <RotateCcw className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
        {!hasAny && (
          <p className="text-xs text-muted-foreground mt-1">Select one or more segments below</p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {FILTER_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</p>
            <div className="space-y-1.5">
              {group.options.map(opt => (
                <div key={opt.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`${slot}-${opt.key}`}
                    checked={keys.includes(opt.key)}
                    onCheckedChange={() => toggle(opt.key)}
                  />
                  <Label htmlFor={`${slot}-${opt.key}`} className="text-xs cursor-pointer flex-1">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const TREND_MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

type SchoolYear = "2021-22" | "2022-23" | "2023-24";
const SCHOOL_YEARS: SchoolYear[] = ["2021-22", "2022-23", "2023-24"];

// Historical CQ scores per school year (all-staff averages for that year)
const HISTORICAL_TRENDS: Record<SchoolYear, CQScores[]> = {
  "2021-22": [
    { drive: 5.8, knowledge: 5.4, strategy: 5.0, action: 5.6 },
    { drive: 5.9, knowledge: 5.5, strategy: 5.1, action: 5.7 },
    { drive: 6.0, knowledge: 5.6, strategy: 5.2, action: 5.8 },
    { drive: 6.1, knowledge: 5.7, strategy: 5.3, action: 5.9 },
    { drive: 6.2, knowledge: 5.8, strategy: 5.4, action: 6.0 },
    { drive: 6.3, knowledge: 5.9, strategy: 5.5, action: 6.1 },
  ],
  "2022-23": [
    { drive: 6.1, knowledge: 5.7, strategy: 5.3, action: 5.9 },
    { drive: 6.2, knowledge: 5.8, strategy: 5.5, action: 6.0 },
    { drive: 6.3, knowledge: 5.9, strategy: 5.6, action: 6.1 },
    { drive: 6.4, knowledge: 6.1, strategy: 5.7, action: 6.3 },
    { drive: 6.5, knowledge: 6.2, strategy: 5.9, action: 6.4 },
    { drive: 6.6, knowledge: 6.3, strategy: 6.0, action: 6.5 },
  ],
  "2023-24": [
    { drive: 6.2, knowledge: 5.8, strategy: 5.5, action: 6.0 },
    { drive: 6.3, knowledge: 5.9, strategy: 5.6, action: 6.1 },
    { drive: 6.5, knowledge: 6.1, strategy: 5.8, action: 6.3 },
    { drive: 6.6, knowledge: 6.3, strategy: 6.0, action: 6.5 },
    { drive: 6.8, knowledge: 6.5, strategy: 6.1, action: 6.6 },
    { drive: 7.0, knowledge: 6.6, strategy: 6.3, action: 6.8 },
  ],
};

// Departed staff CQ trends per departure year
const DEPARTED_TRENDS: Record<SchoolYear, CQScores[]> = {
  "2021-22": [
    { drive: 5.2, knowledge: 4.8, strategy: 4.4, action: 5.0 },
    { drive: 5.2, knowledge: 4.8, strategy: 4.4, action: 5.0 },
    { drive: 5.3, knowledge: 4.9, strategy: 4.5, action: 5.1 },
    { drive: 5.1, knowledge: 4.7, strategy: 4.3, action: 4.9 },
    { drive: 5.0, knowledge: 4.6, strategy: 4.2, action: 4.8 },
    { drive: 4.9, knowledge: 4.5, strategy: 4.1, action: 4.7 },
  ],
  "2022-23": [
    { drive: 5.5, knowledge: 5.1, strategy: 4.7, action: 5.2 },
    { drive: 5.5, knowledge: 5.0, strategy: 4.7, action: 5.2 },
    { drive: 5.4, knowledge: 5.0, strategy: 4.6, action: 5.1 },
    { drive: 5.3, knowledge: 4.9, strategy: 4.5, action: 5.0 },
    { drive: 5.2, knowledge: 4.8, strategy: 4.4, action: 4.9 },
    { drive: 5.1, knowledge: 4.7, strategy: 4.3, action: 4.8 },
  ],
  "2023-24": [
    { drive: 5.8, knowledge: 5.3, strategy: 4.9, action: 5.5 },
    { drive: 5.7, knowledge: 5.3, strategy: 4.9, action: 5.4 },
    { drive: 5.6, knowledge: 5.2, strategy: 4.8, action: 5.3 },
    { drive: 5.5, knowledge: 5.1, strategy: 4.7, action: 5.2 },
    { drive: 5.4, knowledge: 5.0, strategy: 4.6, action: 5.1 },
    { drive: 5.3, knowledge: 4.9, strategy: 4.5, action: 5.0 },
  ],
};


const TREND_COLORS: Record<string, string> = {
  drive:     "#1a7a7a",
  knowledge: "#2a9d8f",
  strategy:  "#38b2ac",
  action:    "#4db8b8",
};

const COLORS = { A: "#1a7a7a", B: "#f97316", C: "#2563eb", D: "#7c3aed" } as const;

function HistoricalPanel({ keys, onKeysChange, year, onYearChange }: {
  keys: string[]; onKeysChange: (k: string[]) => void;
  year: SchoolYear | null; onYearChange: (y: SchoolYear | null) => void;
}) {
  const color = COLORS.C;
  const hasAny = keys.length > 0 || !!year;
  function toggle(key: string) { onKeysChange(keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key]); }
  return (
    <Card className="border-2" style={{ borderColor: color + "40" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <CardTitle className="text-sm font-bold uppercase tracking-wider" style={{ color }}>Group C — Historical</CardTitle>
          </div>
          {hasAny && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { onKeysChange([]); onYearChange(null); }}>
              <RotateCcw className="h-3 w-3 mr-1" />Clear
            </Button>
          )}
        </div>
        {!hasAny && <p className="text-xs text-muted-foreground mt-1">Optional — overlay a historical school year on the radar</p>}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {HIST_FILTER_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</p>
            <div className="space-y-1.5">
              {group.options.map(opt => (
                <div key={opt.key} className="flex items-center gap-2">
                  <Checkbox id={`C-${opt.key}`} checked={keys.includes(opt.key)} onCheckedChange={() => toggle(opt.key)} />
                  <Label htmlFor={`C-${opt.key}`} className="text-xs cursor-pointer flex-1">{opt.label}</Label>
                  <span className="text-[10px] text-muted-foreground">{SEGMENT_N[opt.key] ?? 0}n</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="border-t border-border/40 pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <History className="h-3 w-3" />School Year
          </p>
          <Select value={year ?? ""} onValueChange={val => onYearChange((val as SchoolYear) || null)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select school year…" /></SelectTrigger>
            <SelectContent>
              {SCHOOL_YEARS.map(yr => <SelectItem key={yr} value={yr} className="text-xs">{yr} School Year</SelectItem>)}
            </SelectContent>
          </Select>
          {year && <button className="text-[10px] text-muted-foreground hover:text-foreground underline mt-1" onClick={() => onYearChange(null)}>Clear year</button>}
        </div>
      </CardContent>
    </Card>
  );
}

function DepartedPanel({ keys, onKeysChange, year, onYearChange }: {
  keys: string[]; onKeysChange: (k: string[]) => void;
  year: SchoolYear | null; onYearChange: (y: SchoolYear | null) => void;
}) {
  const color = COLORS.D;
  const hasAny = keys.length > 0 || !!year;
  function toggle(key: string) { onKeysChange(keys.includes(key) ? keys.filter(k => k !== key) : [...keys, key]); }
  return (
    <Card className="border-2" style={{ borderColor: color + "40" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <CardTitle className="text-sm font-bold uppercase tracking-wider" style={{ color }}>Group D — Departed</CardTitle>
          </div>
          {hasAny && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => { onKeysChange([]); onYearChange(null); }}>
              <RotateCcw className="h-3 w-3 mr-1" />Clear
            </Button>
          )}
        </div>
        {!hasAny && <p className="text-xs text-muted-foreground mt-1">Optional — overlay departed teachers on the radar</p>}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {DEPARTED_FILTER_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</p>
            <div className="space-y-1.5">
              {group.options.map(opt => (
                <div key={opt.key} className="flex items-center gap-2">
                  <Checkbox id={`D-${opt.key}`} checked={keys.includes(opt.key)} onCheckedChange={() => toggle(opt.key)} />
                  <Label htmlFor={`D-${opt.key}`} className="text-xs cursor-pointer flex-1">{opt.label}</Label>
                  <span className="text-[10px] text-muted-foreground">{DEPARTED_N[opt.key] ?? 0}n</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div className="border-t border-border/40 pt-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <History className="h-3 w-3" />Year of Departure
          </p>
          <Select value={year ?? ""} onValueChange={val => onYearChange((val as SchoolYear) || null)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select school year…" /></SelectTrigger>
            <SelectContent>
              {SCHOOL_YEARS.map(yr => <SelectItem key={yr} value={yr} className="text-xs">{yr} School Year</SelectItem>)}
            </SelectContent>
          </Select>
          {year && <button className="text-[10px] text-muted-foreground hover:text-foreground underline mt-1" onClick={() => onYearChange(null)}>Clear year</button>}
        </div>
      </CardContent>
    </Card>
  );
}

function QuadrantTrendChart({ quadrant, trendsA, labelA, trendsB, labelB, historicalYear, departedYear }: {
  quadrant: typeof CQ_AXES[0];
  trendsA: CQScores[] | null; labelA: string;
  trendsB: CQScores[] | null; labelB: string;
  historicalYear: SchoolYear | null;
  departedYear: SchoolYear | null;
}) {
  const color = TREND_COLORS[quadrant.key];
  const dim = quadrant.key as keyof CQScores;
  const latestA = trendsA ? trendsA[5][dim] : null;
  const firstA  = trendsA ? trendsA[0][dim]  : null;
  const delta = latestA !== null && firstA !== null ? Math.round((latestA - firstA) * 10) / 10 : null;
  const histData = historicalYear ? HISTORICAL_TRENDS[historicalYear] : null;
  const deptData = departedYear ? DEPARTED_TRENDS[departedYear] : null;
  const histLabel = historicalYear ? `Historical ${historicalYear}` : "";
  const deptLabel = departedYear ? `Departed ${departedYear}` : "";

  const chartData = TREND_MONTHS.map((month, i) => {
    const pt: Record<string, string | number> = { month };
    if (trendsA) pt["groupA"] = trendsA[i][dim];
    if (trendsB) pt["groupB"] = trendsB[i][dim];
    if (histData) pt[histLabel] = histData[i][dim];
    if (deptData) pt[deptLabel] = deptData[i][dim];
    return pt;
  });

  const allVals = chartData.flatMap(d =>
    Object.entries(d).filter(([k]) => k !== "month").map(([, v]) => v as number)
  );
  const yMin = Math.floor(Math.min(...allVals) * 10) / 10 - 0.2;
  const yMax = Math.ceil(Math.max(...allVals) * 10) / 10 + 0.2;

  const latestB = trendsB ? trendsB[5][dim] : null;

  const LOW_THRESHOLD = 6.5;
  const isLow = latestA !== null && latestA < LOW_THRESHOLD;
  const playbookMeta = PLAYBOOK_META.find(m => m.id === quadrant.key);
  const gradId = `cq-fill-${quadrant.key}`;

  return (
    <div className={`rounded-2xl border bg-white shadow-sm overflow-hidden${isLow ? " ring-1 ring-amber-300" : ""}`}>
      <div className="flex items-start justify-between px-4 pt-4 pb-1">
        <div>
          <p className="text-sm font-semibold text-slate-900">{quadrant.label} Trend</p>
          <p className="text-xs text-slate-400 mt-0.5">6-month score progression</p>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {latestB !== null && trendsB && (
            <span className="rounded-full border px-2 py-0.5 text-xs font-bold"
              style={{ borderColor: `${COLORS.B}60`, color: COLORS.B, backgroundColor: `${COLORS.B}10` }}>
              {latestB.toFixed(1)}
            </span>
          )}
          {latestA !== null && delta !== null && (
            <span className="rounded-full border px-2.5 py-0.5 text-sm font-bold"
              style={{ backgroundColor: `${color}10`, borderColor: `${color}40`, color }}>
              {latestA}
              <span className={`ml-1 text-xs font-semibold ${delta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {delta >= 0 ? "+" : ""}{delta}
              </span>
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
              <stop offset="95%" stopColor={color} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
          <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
          <YAxis domain={[yMin, yMax]} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={28} tickFormatter={(v: number) => v.toFixed(1)} />
          <RechartsTooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0", padding: "4px 10px" }}
            formatter={(v: number, name: string) => [
              (v as number).toFixed(1),
              name === "groupB" ? labelB : name === "groupA" ? labelA : name,
            ]} />
          {trendsA && (
            <Area type="monotone" dataKey="groupA" stroke={COLORS.A} strokeWidth={2.5}
              fill={`url(#${gradId})`}
              dot={{ r: 4, fill: COLORS.A, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 5 }} name="groupA" />
          )}
          {trendsB && (
            <Line type="monotone" dataKey="groupB" stroke={COLORS.B} strokeWidth={2.5}
              strokeDasharray="5 3"
              dot={{ r: 3, fill: COLORS.B, strokeWidth: 2, stroke: "#fff" }} name="groupB" />
          )}
          {histData && (
            <Line type="monotone" dataKey={histLabel} stroke={COLORS.C} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          )}
          {deptData && (
            <Line type="monotone" dataKey={deptLabel} stroke={COLORS.D} strokeWidth={1.5} strokeDasharray="2 3" dot={false} />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      {isLow && playbookMeta && (
        <div className="mx-4 mb-4 mt-1 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2">
          <Lightbulb className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-amber-800">
              Low {quadrant.label} pattern: <span className="font-normal italic">{playbookMeta.low.pattern}</span>
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">PD focus: {playbookMeta.pdFocus}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CQTrends() {
  const [keysA, setKeysA] = useState<string[]>(["school:all"]);
  const [keysB, setKeysB] = useState<string[]>(["tenure:0-2"]);
  const [histKeys, setHistKeys] = useState<string[]>([]);
  const [histYear, setHistYear] = useState<SchoolYear | null>(null);
  const [deptKeys, setDeptKeys] = useState<string[]>([]);
  const [deptYear, setDeptYear] = useState<SchoolYear | null>(null);
  const trendsA = useMemo(() => avgTrends(keysA), [keysA]);
  const trendsB = useMemo(() => avgTrends(keysB), [keysB]);
  const labelA = keysA.length ? labelForKeys(keysA) : "Group A";
  const labelB = keysB.length ? labelForKeys(keysB) : "Group B";
  const historicalYear = histYear ?? (histKeys.length > 0 ? "2023-24" : null);
  const departedYear = deptYear ?? (deptKeys.length > 0 ? "2023-24" : null);

  return (
    <section>
      <div className="mb-3">
        <h2 className="text-lg font-semibold">1. CQ quadrant trends</h2>
        <p className="text-sm text-muted-foreground mt-0.5">6-month score progression for each CQ dimension.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4 mb-4">
        {CQ_AXES.map(ax => (
          <QuadrantTrendChart
            key={ax.key}
            quadrant={ax}
            trendsA={trendsA} labelA={labelA}
            trendsB={trendsB} labelB={labelB}
            historicalYear={historicalYear}
            departedYear={departedYear}
          />
        ))}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t">
        <SegmentSelector slot="A" color={COLORS.A} keys={keysA} onChange={setKeysA} />
        <SegmentSelector slot="B" color={COLORS.B} keys={keysB} onChange={setKeysB} />
        <HistoricalPanel keys={histKeys} onKeysChange={setHistKeys} year={histYear} onYearChange={setHistYear} />
        <DepartedPanel keys={deptKeys} onKeysChange={setDeptKeys} year={deptYear} onYearChange={setDeptYear} />
      </div>
    </section>
  );
}

function CQOverview() {
  return (
    <div className="space-y-0">
      <div className="px-6 pt-8 pb-10">
        <CQTrends />
      </div>
    </div>
  );
}

// ─── CQ Group Rankings ────────────────────────────────────────────────────────

interface CQGroupRow {
  key: string;
  label: string;
  category: string;
  n: number;
  drive: number;
  knowledge: number;
  strategy: number;
  action: number;
  overall: number;
}

const RANKING_GROUPS: { key: string; label: string; category: string }[] = [
  { key: "role:admin",          label: "Administration",       category: "Role"         },
  { key: "role:teacher",        label: "All Teachers",         category: "Role"         },
  { key: "friction:high",       label: "High-Friction Staff",  category: "Role"         },
  { key: "friction:low",        label: "Low-Friction Staff",   category: "Role"         },
  { key: "tenure:0-2",          label: "0–2 Years",            category: "Tenure"       },
  { key: "tenure:3-5",          label: "3–5 Years",            category: "Tenure"       },
  { key: "tenure:6-10",         label: "6–10 Years",           category: "Tenure"       },
  { key: "tenure:10+",          label: "10+ Years",            category: "Tenure"       },
  { key: "level:elementary",    label: "Elementary",           category: "School Level" },
  { key: "level:middle",        label: "Middle School",        category: "School Level" },
  { key: "level:high",          label: "High School",          category: "School Level" },
  { key: "dept:humanities",     label: "Humanities",           category: "Department"   },
  { key: "dept:stem",           label: "STEM",                 category: "Department"   },
  { key: "dept:arts-pe",        label: "Arts & PE",            category: "Department"   },
  { key: "parent:primary",      label: "Primary Parents",      category: "Parents"      },
  { key: "parent:secondary",    label: "Secondary Parents",    category: "Parents"      },
  { key: "parent:high-school",  label: "HS Parents",           category: "Parents"      },
];

function buildGroupRows(): CQGroupRow[] {
  return RANKING_GROUPS
    .filter(g => g.key in SEGMENT_TRENDS)
    .map(g => {
      const latest = SEGMENT_TRENDS[g.key][5];
      const overall = parseFloat(((latest.drive + latest.knowledge + latest.strategy + latest.action) / 4).toFixed(2));
      return {
        key: g.key,
        label: g.label,
        category: g.category,
        n: SEGMENT_N[g.key] ?? 0,
        drive: latest.drive,
        knowledge: latest.knowledge,
        strategy: latest.strategy,
        action: latest.action,
        overall,
      };
    })
    .sort((a, b) => b.overall - a.overall);
}



type CQRankSort = "overall" | "drive" | "knowledge" | "strategy" | "action" | "n";

function CQGroupRankings({ mode }: { mode: "top" | "bottom" }) {
  const allRows = useMemo(() => buildGroupRows(), []);
  const baseRows = mode === "top" ? allRows.slice(0, 10) : [...allRows].reverse().slice(0, 10);

  const [sortKey, setSortKey] = useState<CQRankSort>("overall");
  const [sortAsc, setSortAsc] = useState(mode === "bottom");

  const rows = useMemo(() => {
    return [...baseRows].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      return (a[sortKey] - b[sortKey]) * dir;
    });
  }, [baseRows, sortKey, sortAsc]);

  const schoolAvg = SEGMENT_TRENDS["school:all"][5];
  const schoolOverall = parseFloat(((schoolAvg.drive + schoolAvg.knowledge + schoolAvg.strategy + schoolAvg.action) / 4).toFixed(2));

  const isTop = mode === "top";
  const accentColor = isTop ? "text-emerald-600" : "text-red-500";
  const badgeCls = isTop
    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
    : "bg-red-50 text-red-700 border border-red-200";

  const handleSort = (key: CQRankSort) => {
    if (sortKey === key) setSortAsc(v => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  const cols: { key: CQRankSort; label: string }[] = [
    { key: "overall",   label: "Overall"   },
    { key: "drive",     label: "Drive"     },
    { key: "knowledge", label: "Knowledge" },
    { key: "strategy",  label: "Strategy"  },
    { key: "action",    label: "Action"    },
    { key: "n",         label: "n"         },
  ];

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(["drive", "knowledge", "strategy", "action"] as const).map(key => {
          const label = key.charAt(0).toUpperCase() + key.slice(1);
          const avgVal = rows.reduce((s, r) => s + r[key], 0) / rows.length;
          const school = schoolAvg[key];
          const diff = avgVal - school;
          return (
            <div key={key} className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
              <p className={`text-2xl font-bold tabular-nums ${accentColor}`}>{avgVal.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                vs school avg {school.toFixed(1)}{" "}
                <span className={diff >= 0 ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
                  {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                </span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Sortable table */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b bg-slate-50/60">
          <p className="font-semibold text-slate-900 text-sm">
            {isTop ? "Highest CQ Groups" : "Lowest CQ Groups"}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            School-wide baseline: {schoolOverall.toFixed(1)} · click any column header to sort
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="text-left px-5 py-2.5">Group</th>
                {cols.map(col => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-center px-4 py-2.5 cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap"
                  >
                    {col.label}
                    <span className="ml-1 opacity-40 text-[9px]">
                      {sortKey === col.key ? (sortAsc ? "▲" : "▼") : "▲▼"}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {/* Baseline row */}
              <tr className="bg-slate-50/80">
                <td className="px-5 py-2.5">
                  <span className="text-xs font-semibold text-slate-500 italic">School-wide baseline</span>
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className="text-xs font-semibold text-slate-500 tabular-nums">{schoolOverall.toFixed(1)}</span>
                </td>
                {(["drive", "knowledge", "strategy", "action"] as const).map(k => (
                  <td key={k} className="px-4 py-2.5 text-center">
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">{schoolAvg[k].toFixed(1)}</span>
                  </td>
                ))}
                <td className="px-4 py-2.5 text-center">
                  <span className="text-xs text-slate-400 tabular-nums">86</span>
                </td>
              </tr>

              {rows.map(row => {
                const diff = row.overall - schoolOverall;
                return (
                  <tr key={row.key} className="hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{row.label}</span>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeCls}`}>
                          {row.category}
                        </span>
                      </div>
                    </td>
                    {/* Overall */}
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold tabular-nums ${accentColor}`}>{row.overall.toFixed(1)}</span>
                      <span className={`ml-1.5 text-xs font-semibold ${diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                        {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
                      </span>
                    </td>
                    {/* Per-dim */}
                    {(["drive", "knowledge", "strategy", "action"] as const).map(k => {
                      const dimDiff = row[k] - schoolAvg[k];
                      return (
                        <td key={k} className="px-4 py-3 text-center">
                          <span className="tabular-nums text-xs font-semibold text-foreground/80">{row[k].toFixed(1)}</span>
                          <span className={`ml-1 text-[10px] font-semibold ${dimDiff >= 0.3 ? "text-emerald-600" : dimDiff <= -0.3 ? "text-red-500" : "text-slate-400"}`}>
                            {dimDiff >= 0.3 ? "↑" : dimDiff <= -0.3 ? "↓" : "→"}
                          </span>
                        </td>
                      );
                    })}
                    {/* n */}
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-muted-foreground tabular-nums">{row.n}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-2.5 border-t bg-slate-50/40 text-[10px] text-slate-400">
          Overall = avg of Drive + Knowledge + Strategy + Action · ↑↓ vs school-wide baseline · click column headers to sort
        </div>
      </div>
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview",       label: "School Summary"       },
  { id: "top10",          label: "Highest CQ Groups"    },
  { id: "bottom10",       label: "Lowest CQ Groups"     },
  { id: "group-profiles", label: "Group Profiles"       },
] as const;

type TabId = typeof TABS[number]["id"];

export default function CQNavigator() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const activeTab: TabId = TABS.find(t => t.id === tab)?.id ?? "overview";

  function handleTabChange(id: TabId) {
    navigate(`/analytics/cq-navigator/${id}`, { replace: true });
  }

  return (
    <div className="flex flex-col min-h-0">
      {/* Page header */}
      <div className="border-b bg-background">
        <div className="px-6 pt-8 pb-0">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-7 w-7 text-primary shrink-0" />
            <div>
              <h1 className="font-sans text-3xl font-semibold leading-tight">CQ Navigator</h1>
              <p className="text-muted-foreground text-sm">Track cultural intelligence scores across staff, roles, and time.</p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 -mb-px overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={cn(
                  "inline-flex items-center px-4 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap",
                  activeTab === t.id
                    ? "border-foreground font-semibold text-foreground"
                    : "border-transparent font-normal text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {activeTab === "overview"       && <CQOverview />}
        {activeTab === "group-profiles" && <CQGroupProfiles />}
        {activeTab === "top10"          && <CQGroupRankings mode="top" />}
        {activeTab === "bottom10"       && <CQGroupRankings mode="bottom" />}
      </div>
    </div>
  );
}
