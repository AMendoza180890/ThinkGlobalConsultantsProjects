import { useState, useMemo } from "react";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
} from "recharts";
import {
  SlidersHorizontal, Info,
  TrendingUp, TrendingDown, Minus, RotateCcw, Link, Check,
  History,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

interface DimensionScore {
  dimension: string;
  field: string;
  score: number;
  lowLabel: string;
  highLabel: string;
}

interface SegmentFingerprint {
  label: string;
  respondents: number;
  dimensions: DimensionScore[];
}

const DIMENSION_META: Omit<DimensionScore, "score">[] = [
  { dimension: "Power Distance",        field: "powerDistance",            lowLabel: "Egalitarian",   highLabel: "Hierarchical"  },
  { dimension: "Risk Tolerance",        field: "riskTolerance",            lowLabel: "Risk-Averse",   highLabel: "Flexible"      },
  { dimension: "Decision Speed",        field: "decisionSpeed",            lowLabel: "Deliberate",    highLabel: "Fast"          },
  { dimension: "Communication Style",   field: "communicationStyle",       lowLabel: "Indirect",      highLabel: "Direct"        },
  { dimension: "Group vs Individual",   field: "individualismCollectivism",lowLabel: "Individual",    highLabel: "Group-Focused" },
];

// ─── Individual respondent records (mirrors real Supabase user_profiles + survey_responses) ───

type Role = "admin" | "teacher" | "parent";
type Tenure = "0-2" | "3-5" | "6-10" | "10+";
type GradeLevel = "elementary" | "middle" | "high";
type Department = "humanities" | "stem" | "arts-pe" | "admin-support" | null;
type FrictionLevel = "high" | "low";
type ParentLevel = "primary" | "secondary" | "high-school" | null;
type SchoolYear = "2021-22" | "2022-23" | "2023-24" | "2024-25";
type Nationality = "American" | "British" | "Filipino" | "Indian" | "Lebanese" | "South African" | "Korean" | "Australian";

interface Respondent {
  id: number;
  role: Role;
  tenure: Tenure | null;
  gradeLevel: GradeLevel | null;
  department: Department;
  frictionLevel: FrictionLevel;
  parentLevel: ParentLevel;
  nationality: Nationality;
  departed: boolean;
  schoolYear: SchoolYear;
  // 5 dimension scores 0–100
  powerDistance: number;
  riskTolerance: number;
  decisionSpeed: number;
  communicationStyle: number;
  individualismCollectivism: number;
}

const SCHOOL_YEARS: SchoolYear[] = ["2021-22", "2022-23", "2023-24", "2024-25"];

// 80 current + 12 departed + 32 historical = 124 respondents
const MOCK_RESPONDENTS: Respondent[] = [
  // ── Administration (8) — current, 2024-25 ────────────────────────────────────
  { id:1,  role:"admin", tenure:"10+",  gradeLevel:null,          department:"admin-support", frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:78, riskTolerance:32, decisionSpeed:25, communicationStyle:44, individualismCollectivism:72 },
  { id:2,  role:"admin", tenure:"10+",  gradeLevel:null,          department:"admin-support", frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:72, riskTolerance:38, decisionSpeed:28, communicationStyle:50, individualismCollectivism:65 },
  { id:3,  role:"admin", tenure:"6-10", gradeLevel:null,          department:"admin-support", frictionLevel:"low",  parentLevel:null, nationality:"British",       departed:false, schoolYear:"2024-25", powerDistance:70, riskTolerance:40, decisionSpeed:32, communicationStyle:48, individualismCollectivism:70 },
  { id:4,  role:"admin", tenure:"10+",  gradeLevel:null,          department:"admin-support", frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:76, riskTolerance:35, decisionSpeed:30, communicationStyle:52, individualismCollectivism:68 },
  { id:5,  role:"admin", tenure:"6-10", gradeLevel:null,          department:"admin-support", frictionLevel:"low",  parentLevel:null, nationality:"Australian",    departed:false, schoolYear:"2024-25", powerDistance:74, riskTolerance:36, decisionSpeed:34, communicationStyle:46, individualismCollectivism:66 },
  { id:6,  role:"admin", tenure:"10+",  gradeLevel:null,          department:"admin-support", frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:80, riskTolerance:30, decisionSpeed:28, communicationStyle:45, individualismCollectivism:74 },
  { id:7,  role:"admin", tenure:"3-5",  gradeLevel:null,          department:"admin-support", frictionLevel:"low",  parentLevel:null, nationality:"British",       departed:false, schoolYear:"2024-25", powerDistance:68, riskTolerance:42, decisionSpeed:35, communicationStyle:55, individualismCollectivism:62 },
  { id:8,  role:"admin", tenure:"6-10", gradeLevel:null,          department:"admin-support", frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:72, riskTolerance:34, decisionSpeed:28, communicationStyle:44, individualismCollectivism:70 },

  // ── Teachers: 0–2 yrs (11) — current ────────────────────────────────────────
  { id:9,  role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"humanities",    frictionLevel:"high", parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:22, riskTolerance:72, decisionSpeed:70, communicationStyle:80, individualismCollectivism:30 },
  { id:10, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"stem",          frictionLevel:"high", parentLevel:null, nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:28, riskTolerance:68, decisionSpeed:72, communicationStyle:76, individualismCollectivism:34 },
  { id:11, role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"stem",          frictionLevel:"high", parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:25, riskTolerance:75, decisionSpeed:65, communicationStyle:82, individualismCollectivism:38 },
  { id:12, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"humanities",    frictionLevel:"high", parentLevel:null, nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:30, riskTolerance:70, decisionSpeed:68, communicationStyle:78, individualismCollectivism:35 },
  { id:13, role:"teacher", tenure:"0-2", gradeLevel:"elementary", department:"arts-pe",       frictionLevel:"low",  parentLevel:null, nationality:"South African", departed:false, schoolYear:"2024-25", powerDistance:26, riskTolerance:74, decisionSpeed:66, communicationStyle:76, individualismCollectivism:40 },
  { id:14, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"stem",          frictionLevel:"high", parentLevel:null, nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:32, riskTolerance:66, decisionSpeed:70, communicationStyle:80, individualismCollectivism:32 },
  { id:15, role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:28, riskTolerance:70, decisionSpeed:68, communicationStyle:74, individualismCollectivism:38 },
  { id:16, role:"teacher", tenure:"0-2", gradeLevel:"elementary", department:"arts-pe",       frictionLevel:"low",  parentLevel:null, nationality:"Korean",        departed:false, schoolYear:"2024-25", powerDistance:24, riskTolerance:72, decisionSpeed:64, communicationStyle:78, individualismCollectivism:36 },
  { id:17, role:"teacher", tenure:"0-2", gradeLevel:"high",       department:"humanities",    frictionLevel:"high", parentLevel:null, nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:30, riskTolerance:68, decisionSpeed:72, communicationStyle:80, individualismCollectivism:34 },
  { id:18, role:"teacher", tenure:"0-2", gradeLevel:"middle",     department:"stem",          frictionLevel:"low",  parentLevel:null, nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:26, riskTolerance:73, decisionSpeed:67, communicationStyle:76, individualismCollectivism:40 },
  { id:19, role:"teacher", tenure:"0-2", gradeLevel:"elementary", department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:29, riskTolerance:69, decisionSpeed:65, communicationStyle:78, individualismCollectivism:38 },

  // ── Teachers: 3–5 yrs (14) — current ────────────────────────────────────────
  { id:20, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:38, riskTolerance:65, decisionSpeed:55, communicationStyle:76, individualismCollectivism:45 },
  { id:21, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"stem",          frictionLevel:"low",  parentLevel:null, nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:42, riskTolerance:62, decisionSpeed:58, communicationStyle:74, individualismCollectivism:50 },
  { id:22, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"arts-pe",       frictionLevel:"high", parentLevel:null, nationality:"South African", departed:false, schoolYear:"2024-25", powerDistance:40, riskTolerance:60, decisionSpeed:56, communicationStyle:72, individualismCollectivism:48 },
  { id:23, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"stem",          frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:44, riskTolerance:64, decisionSpeed:60, communicationStyle:76, individualismCollectivism:46 },
  { id:24, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:39, riskTolerance:63, decisionSpeed:57, communicationStyle:75, individualismCollectivism:49 },
  { id:25, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"stem",          frictionLevel:"high", parentLevel:null, nationality:"Korean",        departed:false, schoolYear:"2024-25", powerDistance:45, riskTolerance:65, decisionSpeed:62, communicationStyle:73, individualismCollectivism:47 },
  { id:26, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"arts-pe",       frictionLevel:"low",  parentLevel:null, nationality:"British",       departed:false, schoolYear:"2024-25", powerDistance:41, riskTolerance:61, decisionSpeed:55, communicationStyle:74, individualismCollectivism:52 },
  { id:27, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:43, riskTolerance:63, decisionSpeed:58, communicationStyle:73, individualismCollectivism:48 },
  { id:28, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"stem",          frictionLevel:"low",  parentLevel:null, nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:40, riskTolerance:62, decisionSpeed:56, communicationStyle:75, individualismCollectivism:46 },
  { id:29, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:42, riskTolerance:64, decisionSpeed:59, communicationStyle:74, individualismCollectivism:50 },
  { id:30, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"arts-pe",       frictionLevel:"high", parentLevel:null, nationality:"South African", departed:false, schoolYear:"2024-25", powerDistance:38, riskTolerance:66, decisionSpeed:57, communicationStyle:72, individualismCollectivism:47 },
  { id:31, role:"teacher", tenure:"3-5", gradeLevel:"high",       department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:41, riskTolerance:60, decisionSpeed:55, communicationStyle:76, individualismCollectivism:49 },
  { id:32, role:"teacher", tenure:"3-5", gradeLevel:"elementary", department:"stem",          frictionLevel:"low",  parentLevel:null, nationality:"Korean",        departed:false, schoolYear:"2024-25", powerDistance:43, riskTolerance:63, decisionSpeed:58, communicationStyle:74, individualismCollectivism:48 },
  { id:33, role:"teacher", tenure:"3-5", gradeLevel:"middle",     department:"arts-pe",       frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:40, riskTolerance:62, decisionSpeed:56, communicationStyle:73, individualismCollectivism:50 },

  // ── Teachers: 6–10 yrs (10) — current ───────────────────────────────────────
  { id:34, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"humanities",   frictionLevel:"low",  parentLevel:null, nationality:"British",       departed:false, schoolYear:"2024-25", powerDistance:48, riskTolerance:57, decisionSpeed:44, communicationStyle:66, individualismCollectivism:54 },
  { id:35, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"stem",         frictionLevel:"low",  parentLevel:null, nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:52, riskTolerance:54, decisionSpeed:47, communicationStyle:64, individualismCollectivism:50 },
  { id:36, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"arts-pe",      frictionLevel:"low",  parentLevel:null, nationality:"South African", departed:false, schoolYear:"2024-25", powerDistance:50, riskTolerance:56, decisionSpeed:45, communicationStyle:65, individualismCollectivism:52 },
  { id:37, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"stem",         frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:49, riskTolerance:55, decisionSpeed:46, communicationStyle:67, individualismCollectivism:53 },
  { id:38, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"humanities",   frictionLevel:"low",  parentLevel:null, nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:51, riskTolerance:53, decisionSpeed:44, communicationStyle:63, individualismCollectivism:51 },
  { id:39, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"humanities",   frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:50, riskTolerance:56, decisionSpeed:46, communicationStyle:66, individualismCollectivism:52 },
  { id:40, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"arts-pe",      frictionLevel:"low",  parentLevel:null, nationality:"Korean",        departed:false, schoolYear:"2024-25", powerDistance:48, riskTolerance:58, decisionSpeed:45, communicationStyle:64, individualismCollectivism:54 },
  { id:41, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"stem",         frictionLevel:"low",  parentLevel:null, nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:52, riskTolerance:54, decisionSpeed:46, communicationStyle:65, individualismCollectivism:50 },
  { id:42, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"humanities",   frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:50, riskTolerance:55, decisionSpeed:44, communicationStyle:67, individualismCollectivism:53 },
  { id:43, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"stem",         frictionLevel:"low",  parentLevel:null, nationality:"Australian",    departed:false, schoolYear:"2024-25", powerDistance:49, riskTolerance:57, decisionSpeed:47, communicationStyle:65, individualismCollectivism:51 },

  // ── Teachers: 10+ yrs (7) — current ─────────────────────────────────────────
  { id:44, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:60, riskTolerance:44, decisionSpeed:36, communicationStyle:58, individualismCollectivism:62 },
  { id:45, role:"teacher", tenure:"10+", gradeLevel:"middle",     department:"stem",          frictionLevel:"low",  parentLevel:null, nationality:"British",       departed:false, schoolYear:"2024-25", powerDistance:64, riskTolerance:40, decisionSpeed:38, communicationStyle:56, individualismCollectivism:60 },
  { id:46, role:"teacher", tenure:"10+", gradeLevel:"high",       department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:62, riskTolerance:42, decisionSpeed:40, communicationStyle:60, individualismCollectivism:58 },
  { id:47, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"arts-pe",       frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:60, riskTolerance:44, decisionSpeed:36, communicationStyle:58, individualismCollectivism:64 },
  { id:48, role:"teacher", tenure:"10+", gradeLevel:"high",       department:"stem",          frictionLevel:"low",  parentLevel:null, nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:63, riskTolerance:41, decisionSpeed:39, communicationStyle:57, individualismCollectivism:60 },
  { id:49, role:"teacher", tenure:"10+", gradeLevel:"middle",     department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"South African", departed:false, schoolYear:"2024-25", powerDistance:62, riskTolerance:43, decisionSpeed:38, communicationStyle:59, individualismCollectivism:62 },
  { id:50, role:"teacher", tenure:"10+", gradeLevel:"elementary", department:"arts-pe",       frictionLevel:"low",  parentLevel:null, nationality:"Korean",        departed:false, schoolYear:"2024-25", powerDistance:61, riskTolerance:42, decisionSpeed:37, communicationStyle:58, individualismCollectivism:63 },

  // ── Parents: Primary (14) — current ─────────────────────────────────────────
  { id:51, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:60, riskTolerance:38, decisionSpeed:30, communicationStyle:42, individualismCollectivism:74 },
  { id:52, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:56, riskTolerance:42, decisionSpeed:34, communicationStyle:46, individualismCollectivism:70 },
  { id:53, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:58, riskTolerance:40, decisionSpeed:32, communicationStyle:44, individualismCollectivism:72 },
  { id:54, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:62, riskTolerance:36, decisionSpeed:28, communicationStyle:40, individualismCollectivism:76 },
  { id:55, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:58, riskTolerance:40, decisionSpeed:32, communicationStyle:44, individualismCollectivism:72 },
  { id:56, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:60, riskTolerance:38, decisionSpeed:30, communicationStyle:42, individualismCollectivism:74 },
  { id:57, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:56, riskTolerance:42, decisionSpeed:34, communicationStyle:46, individualismCollectivism:70 },
  { id:58, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"Korean",        departed:false, schoolYear:"2024-25", powerDistance:59, riskTolerance:39, decisionSpeed:31, communicationStyle:43, individualismCollectivism:73 },
  { id:59, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:57, riskTolerance:41, decisionSpeed:33, communicationStyle:45, individualismCollectivism:71 },
  { id:60, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:61, riskTolerance:37, decisionSpeed:29, communicationStyle:41, individualismCollectivism:75 },
  { id:61, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:58, riskTolerance:40, decisionSpeed:32, communicationStyle:44, individualismCollectivism:72 },
  { id:62, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:60, riskTolerance:38, decisionSpeed:30, communicationStyle:42, individualismCollectivism:74 },
  { id:63, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"South African", departed:false, schoolYear:"2024-25", powerDistance:55, riskTolerance:43, decisionSpeed:35, communicationStyle:47, individualismCollectivism:69 },
  { id:64, role:"parent", tenure:null, gradeLevel:"elementary",  department:null,             frictionLevel:"low",  parentLevel:"primary",    nationality:"Korean",        departed:false, schoolYear:"2024-25", powerDistance:59, riskTolerance:39, decisionSpeed:31, communicationStyle:43, individualismCollectivism:73 },

  // ── Parents: Secondary (13) — current ───────────────────────────────────────
  { id:65, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:54, riskTolerance:46, decisionSpeed:38, communicationStyle:50, individualismCollectivism:66 },
  { id:66, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"South African", departed:false, schoolYear:"2024-25", powerDistance:56, riskTolerance:44, decisionSpeed:36, communicationStyle:48, individualismCollectivism:68 },
  { id:67, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:52, riskTolerance:48, decisionSpeed:40, communicationStyle:52, individualismCollectivism:64 },
  { id:68, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"Korean",        departed:false, schoolYear:"2024-25", powerDistance:55, riskTolerance:45, decisionSpeed:37, communicationStyle:49, individualismCollectivism:67 },
  { id:69, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:53, riskTolerance:47, decisionSpeed:39, communicationStyle:51, individualismCollectivism:65 },
  { id:70, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:54, riskTolerance:46, decisionSpeed:38, communicationStyle:50, individualismCollectivism:66 },
  { id:71, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:56, riskTolerance:44, decisionSpeed:36, communicationStyle:48, individualismCollectivism:68 },
  { id:72, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:53, riskTolerance:47, decisionSpeed:39, communicationStyle:51, individualismCollectivism:65 },
  { id:73, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:55, riskTolerance:45, decisionSpeed:37, communicationStyle:49, individualismCollectivism:67 },
  { id:74, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"Korean",        departed:false, schoolYear:"2024-25", powerDistance:54, riskTolerance:46, decisionSpeed:38, communicationStyle:50, individualismCollectivism:66 },
  { id:75, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"South African", departed:false, schoolYear:"2024-25", powerDistance:52, riskTolerance:48, decisionSpeed:40, communicationStyle:52, individualismCollectivism:64 },
  { id:76, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:55, riskTolerance:45, decisionSpeed:37, communicationStyle:49, individualismCollectivism:67 },
  { id:77, role:"parent", tenure:null, gradeLevel:"middle",      department:null,             frictionLevel:"low",  parentLevel:"secondary",  nationality:"British",       departed:false, schoolYear:"2024-25", powerDistance:56, riskTolerance:44, decisionSpeed:36, communicationStyle:48, individualismCollectivism:68 },

  // ── Parents: High School (11) — current ─────────────────────────────────────
  { id:78,  role:"parent", tenure:null, gradeLevel:"high",       department:null,             frictionLevel:"low",  parentLevel:"high-school", nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:50, riskTolerance:48, decisionSpeed:42, communicationStyle:52, individualismCollectivism:62 },
  { id:79,  role:"parent", tenure:null, gradeLevel:"high",       department:null,             frictionLevel:"low",  parentLevel:"high-school", nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:52, riskTolerance:46, decisionSpeed:40, communicationStyle:50, individualismCollectivism:64 },
  { id:80,  role:"parent", tenure:null, gradeLevel:"high",       department:null,             frictionLevel:"low",  parentLevel:"high-school", nationality:"British",       departed:false, schoolYear:"2024-25", powerDistance:48, riskTolerance:50, decisionSpeed:44, communicationStyle:54, individualismCollectivism:60 },
  { id:81,  role:"parent", tenure:null, gradeLevel:"high",       department:null,             frictionLevel:"low",  parentLevel:"high-school", nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:51, riskTolerance:47, decisionSpeed:41, communicationStyle:51, individualismCollectivism:63 },
  { id:82,  role:"parent", tenure:null, gradeLevel:"high",       department:null,             frictionLevel:"low",  parentLevel:"high-school", nationality:"Indian",        departed:false, schoolYear:"2024-25", powerDistance:49, riskTolerance:49, decisionSpeed:43, communicationStyle:53, individualismCollectivism:61 },
  { id:83,  role:"parent", tenure:null, gradeLevel:"high",       department:null,             frictionLevel:"low",  parentLevel:"high-school", nationality:"Korean",        departed:false, schoolYear:"2024-25", powerDistance:50, riskTolerance:48, decisionSpeed:42, communicationStyle:52, individualismCollectivism:62 },
  { id:84,  role:"parent", tenure:null, gradeLevel:"high",       department:null,             frictionLevel:"low",  parentLevel:"high-school", nationality:"American",      departed:false, schoolYear:"2024-25", powerDistance:52, riskTolerance:46, decisionSpeed:40, communicationStyle:50, individualismCollectivism:64 },
  { id:85,  role:"parent", tenure:null, gradeLevel:"high",       department:null,             frictionLevel:"low",  parentLevel:"high-school", nationality:"Filipino",      departed:false, schoolYear:"2024-25", powerDistance:48, riskTolerance:50, decisionSpeed:44, communicationStyle:54, individualismCollectivism:60 },
  { id:86,  role:"parent", tenure:null, gradeLevel:"high",       department:null,             frictionLevel:"low",  parentLevel:"high-school", nationality:"South African", departed:false, schoolYear:"2024-25", powerDistance:51, riskTolerance:47, decisionSpeed:41, communicationStyle:51, individualismCollectivism:63 },
  { id:87,  role:"parent", tenure:null, gradeLevel:"high",       department:null,             frictionLevel:"low",  parentLevel:"high-school", nationality:"Lebanese",      departed:false, schoolYear:"2024-25", powerDistance:49, riskTolerance:49, decisionSpeed:43, communicationStyle:53, individualismCollectivism:61 },
  { id:88,  role:"parent", tenure:null, gradeLevel:"high",       department:null,             frictionLevel:"low",  parentLevel:"high-school", nationality:"Australian",    departed:false, schoolYear:"2024-25", powerDistance:50, riskTolerance:48, decisionSpeed:42, communicationStyle:52, individualismCollectivism:62 },

  // ── Departed Teachers (12) ────────────────────────────────────────────────────
  { id:89,  role:"teacher", tenure:"0-2",  gradeLevel:"high",       department:"humanities",    frictionLevel:"high", parentLevel:null, nationality:"Filipino",      departed:true, schoolYear:"2023-24", powerDistance:18, riskTolerance:82, decisionSpeed:78, communicationStyle:88, individualismCollectivism:24 },
  { id:90,  role:"teacher", tenure:"0-2",  gradeLevel:"middle",     department:"stem",          frictionLevel:"high", parentLevel:null, nationality:"Indian",        departed:true, schoolYear:"2023-24", powerDistance:20, riskTolerance:80, decisionSpeed:76, communicationStyle:86, individualismCollectivism:28 },
  { id:91,  role:"teacher", tenure:"3-5",  gradeLevel:"high",       department:"humanities",    frictionLevel:"high", parentLevel:null, nationality:"Lebanese",      departed:true, schoolYear:"2023-24", powerDistance:24, riskTolerance:78, decisionSpeed:74, communicationStyle:84, individualismCollectivism:30 },
  { id:92,  role:"teacher", tenure:"3-5",  gradeLevel:"elementary", department:"stem",          frictionLevel:"high", parentLevel:null, nationality:"Filipino",      departed:true, schoolYear:"2022-23", powerDistance:22, riskTolerance:76, decisionSpeed:72, communicationStyle:82, individualismCollectivism:32 },
  { id:93,  role:"teacher", tenure:"0-2",  gradeLevel:"middle",     department:"arts-pe",       frictionLevel:"high", parentLevel:null, nationality:"South African", departed:true, schoolYear:"2022-23", powerDistance:19, riskTolerance:84, decisionSpeed:80, communicationStyle:86, individualismCollectivism:26 },
  { id:94,  role:"teacher", tenure:"3-5",  gradeLevel:"high",       department:"stem",          frictionLevel:"high", parentLevel:null, nationality:"Korean",        departed:true, schoolYear:"2022-23", powerDistance:26, riskTolerance:77, decisionSpeed:75, communicationStyle:83, individualismCollectivism:29 },
  { id:95,  role:"teacher", tenure:"0-2",  gradeLevel:"elementary", department:"humanities",    frictionLevel:"high", parentLevel:null, nationality:"Filipino",      departed:true, schoolYear:"2021-22", powerDistance:20, riskTolerance:81, decisionSpeed:77, communicationStyle:87, individualismCollectivism:25 },
  { id:96,  role:"teacher", tenure:"3-5",  gradeLevel:"middle",     department:"stem",          frictionLevel:"high", parentLevel:null, nationality:"Indian",        departed:true, schoolYear:"2021-22", powerDistance:23, riskTolerance:79, decisionSpeed:73, communicationStyle:85, individualismCollectivism:27 },
  { id:97,  role:"teacher", tenure:"0-2",  gradeLevel:"high",       department:"arts-pe",       frictionLevel:"high", parentLevel:null, nationality:"Lebanese",      departed:true, schoolYear:"2023-24", powerDistance:17, riskTolerance:85, decisionSpeed:79, communicationStyle:89, individualismCollectivism:22 },
  { id:98,  role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"humanities",    frictionLevel:"high", parentLevel:null, nationality:"South African", departed:true, schoolYear:"2022-23", powerDistance:30, riskTolerance:74, decisionSpeed:70, communicationStyle:80, individualismCollectivism:35 },
  { id:99,  role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"stem",          frictionLevel:"high", parentLevel:null, nationality:"Korean",        departed:true, schoolYear:"2021-22", powerDistance:28, riskTolerance:76, decisionSpeed:72, communicationStyle:82, individualismCollectivism:32 },
  { id:100, role:"teacher", tenure:"3-5",  gradeLevel:"elementary", department:"arts-pe",       frictionLevel:"high", parentLevel:null, nationality:"Filipino",      departed:true, schoolYear:"2021-22", powerDistance:25, riskTolerance:78, decisionSpeed:71, communicationStyle:84, individualismCollectivism:30 },

  // ── Historical: 2021-22 (8) ───────────────────────────────────────────────────
  { id:101, role:"admin",   tenure:"10+",  gradeLevel:null,         department:"admin-support", frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, schoolYear:"2021-22", powerDistance:76, riskTolerance:34, decisionSpeed:26, communicationStyle:46, individualismCollectivism:70 },
  { id:102, role:"teacher", tenure:"0-2",  gradeLevel:"middle",     department:"humanities",    frictionLevel:"high", parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2021-22", powerDistance:24, riskTolerance:70, decisionSpeed:68, communicationStyle:78, individualismCollectivism:32 },
  { id:103, role:"teacher", tenure:"3-5",  gradeLevel:"high",       department:"stem",          frictionLevel:"low",  parentLevel:null, nationality:"Indian",        departed:false, schoolYear:"2021-22", powerDistance:40, riskTolerance:63, decisionSpeed:56, communicationStyle:74, individualismCollectivism:48 },
  { id:104, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"arts-pe",       frictionLevel:"low",  parentLevel:null, nationality:"South African", departed:false, schoolYear:"2021-22", powerDistance:50, riskTolerance:55, decisionSpeed:44, communicationStyle:64, individualismCollectivism:52 },
  { id:105, role:"teacher", tenure:"10+",  gradeLevel:"middle",     department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"Lebanese",      departed:false, schoolYear:"2021-22", powerDistance:62, riskTolerance:43, decisionSpeed:37, communicationStyle:59, individualismCollectivism:61 },
  { id:106, role:"teacher", tenure:"0-2",  gradeLevel:"high",       department:"stem",          frictionLevel:"high", parentLevel:null, nationality:"Korean",        departed:false, schoolYear:"2021-22", powerDistance:27, riskTolerance:69, decisionSpeed:71, communicationStyle:79, individualismCollectivism:33 },
  { id:107, role:"teacher", tenure:"3-5",  gradeLevel:"elementary", department:"arts-pe",       frictionLevel:"low",  parentLevel:null, nationality:"British",       departed:false, schoolYear:"2021-22", powerDistance:41, riskTolerance:62, decisionSpeed:55, communicationStyle:73, individualismCollectivism:49 },
  { id:108, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2021-22", powerDistance:51, riskTolerance:54, decisionSpeed:45, communicationStyle:65, individualismCollectivism:51 },

  // ── Historical: 2022-23 (8) ───────────────────────────────────────────────────
  { id:109, role:"admin",   tenure:"10+",  gradeLevel:null,         department:"admin-support", frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, schoolYear:"2022-23", powerDistance:77, riskTolerance:33, decisionSpeed:26, communicationStyle:45, individualismCollectivism:71 },
  { id:110, role:"teacher", tenure:"0-2",  gradeLevel:"high",       department:"stem",          frictionLevel:"high", parentLevel:null, nationality:"Indian",        departed:false, schoolYear:"2022-23", powerDistance:26, riskTolerance:71, decisionSpeed:69, communicationStyle:79, individualismCollectivism:33 },
  { id:111, role:"teacher", tenure:"3-5",  gradeLevel:"middle",     department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"Lebanese",      departed:false, schoolYear:"2022-23", powerDistance:39, riskTolerance:64, decisionSpeed:57, communicationStyle:75, individualismCollectivism:47 },
  { id:112, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"stem",          frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2022-23", powerDistance:50, riskTolerance:55, decisionSpeed:45, communicationStyle:65, individualismCollectivism:52 },
  { id:113, role:"teacher", tenure:"10+",  gradeLevel:"high",       department:"arts-pe",       frictionLevel:"low",  parentLevel:null, nationality:"South African", departed:false, schoolYear:"2022-23", powerDistance:61, riskTolerance:43, decisionSpeed:38, communicationStyle:58, individualismCollectivism:60 },
  { id:114, role:"teacher", tenure:"0-2",  gradeLevel:"middle",     department:"arts-pe",       frictionLevel:"high", parentLevel:null, nationality:"Korean",        departed:false, schoolYear:"2022-23", powerDistance:25, riskTolerance:73, decisionSpeed:67, communicationStyle:80, individualismCollectivism:36 },
  { id:115, role:"teacher", tenure:"3-5",  gradeLevel:"high",       department:"stem",          frictionLevel:"low",  parentLevel:null, nationality:"British",       departed:false, schoolYear:"2022-23", powerDistance:43, riskTolerance:62, decisionSpeed:58, communicationStyle:74, individualismCollectivism:47 },
  { id:116, role:"teacher", tenure:"6-10", gradeLevel:"middle",     department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2022-23", powerDistance:51, riskTolerance:54, decisionSpeed:46, communicationStyle:64, individualismCollectivism:51 },

  // ── Historical: 2023-24 (8) ───────────────────────────────────────────────────
  { id:117, role:"admin",   tenure:"10+",  gradeLevel:null,         department:"admin-support", frictionLevel:"low",  parentLevel:null, nationality:"American",      departed:false, schoolYear:"2023-24", powerDistance:77, riskTolerance:33, decisionSpeed:26, communicationStyle:45, individualismCollectivism:71 },
  { id:118, role:"teacher", tenure:"0-2",  gradeLevel:"middle",     department:"stem",          frictionLevel:"high", parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2023-24", powerDistance:25, riskTolerance:72, decisionSpeed:70, communicationStyle:80, individualismCollectivism:33 },
  { id:119, role:"teacher", tenure:"3-5",  gradeLevel:"elementary", department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"Indian",        departed:false, schoolYear:"2023-24", powerDistance:40, riskTolerance:64, decisionSpeed:56, communicationStyle:75, individualismCollectivism:48 },
  { id:120, role:"teacher", tenure:"6-10", gradeLevel:"high",       department:"stem",          frictionLevel:"low",  parentLevel:null, nationality:"Lebanese",      departed:false, schoolYear:"2023-24", powerDistance:50, riskTolerance:55, decisionSpeed:46, communicationStyle:66, individualismCollectivism:52 },
  { id:121, role:"teacher", tenure:"10+",  gradeLevel:"elementary", department:"arts-pe",       frictionLevel:"low",  parentLevel:null, nationality:"South African", departed:false, schoolYear:"2023-24", powerDistance:61, riskTolerance:43, decisionSpeed:37, communicationStyle:58, individualismCollectivism:62 },
  { id:122, role:"teacher", tenure:"0-2",  gradeLevel:"high",       department:"humanities",    frictionLevel:"high", parentLevel:null, nationality:"Korean",        departed:false, schoolYear:"2023-24", powerDistance:28, riskTolerance:70, decisionSpeed:69, communicationStyle:79, individualismCollectivism:35 },
  { id:123, role:"teacher", tenure:"3-5",  gradeLevel:"middle",     department:"arts-pe",       frictionLevel:"low",  parentLevel:null, nationality:"British",       departed:false, schoolYear:"2023-24", powerDistance:39, riskTolerance:63, decisionSpeed:57, communicationStyle:73, individualismCollectivism:48 },
  { id:124, role:"teacher", tenure:"6-10", gradeLevel:"elementary", department:"humanities",    frictionLevel:"low",  parentLevel:null, nationality:"Filipino",      departed:false, schoolYear:"2023-24", powerDistance:49, riskTolerance:57, decisionSpeed:44, communicationStyle:66, individualismCollectivism:53 },
];

// ─── Filter definitions ────────────────────────────────────────────────────────

type FilterKey = string;

interface FilterOption {
  key: FilterKey;
  label: string;
  match: (r: Respondent) => boolean;
}

interface FilterGroup {
  label: string;
  options: FilterOption[];
}

const FILTER_GROUPS: FilterGroup[] = [
  {
    label: "Role",
    options: [
      { key: "role:admin",        label: "Administration",      match: r => r.role === "admin" },
      { key: "role:teacher",      label: "All Teachers",        match: r => r.role === "teacher" },
      { key: "friction:high",     label: "High-Friction Staff", match: r => r.role === "teacher" && r.frictionLevel === "high" },
      { key: "friction:low",      label: "Low-Friction Staff",  match: r => r.role === "teacher" && r.frictionLevel === "low" },
    ],
  },
  {
    label: "Tenure",
    options: [
      { key: "tenure:0-2",  label: "0–2 Years",  match: r => r.tenure === "0-2" },
      { key: "tenure:3-5",  label: "3–5 Years",  match: r => r.tenure === "3-5" },
      { key: "tenure:6-10", label: "6–10 Years", match: r => r.tenure === "6-10" },
      { key: "tenure:10+",  label: "10+ Years",  match: r => r.tenure === "10+" },
    ],
  },
  {
    label: "School Level",
    options: [
      { key: "level:elementary", label: "Elementary",   match: r => r.role !== "parent" && r.gradeLevel === "elementary" },
      { key: "level:middle",     label: "Middle School", match: r => r.role !== "parent" && r.gradeLevel === "middle" },
      { key: "level:high",       label: "High School",   match: r => r.role !== "parent" && r.gradeLevel === "high" },
    ],
  },
  {
    label: "Department",
    options: [
      { key: "dept:humanities", label: "Humanities", match: r => r.department === "humanities" },
      { key: "dept:stem",       label: "STEM",        match: r => r.department === "stem" },
      { key: "dept:arts-pe",    label: "Arts & PE",   match: r => r.department === "arts-pe" },
    ],
  },
  {
    label: "Parents",
    options: [
      { key: "parent:all",         label: "All Parents",      match: r => r.role === "parent" },
      { key: "parent:primary",     label: "Primary Parents",  match: r => r.parentLevel === "primary" },
      { key: "parent:secondary",   label: "Secondary Parents",match: r => r.parentLevel === "secondary" },
      { key: "parent:high-school", label: "HS Parents",       match: r => r.parentLevel === "high-school" },
    ],
  },
  {
    label: "Nationality",
    options: [
      { key: "nat:american",     label: "American",      match: r => r.nationality === "American" },
      { key: "nat:british",      label: "British",       match: r => r.nationality === "British" },
      { key: "nat:filipino",     label: "Filipino",      match: r => r.nationality === "Filipino" },
      { key: "nat:indian",       label: "Indian",        match: r => r.nationality === "Indian" },
      { key: "nat:lebanese",     label: "Lebanese",      match: r => r.nationality === "Lebanese" },
      { key: "nat:southafrican", label: "South African", match: r => r.nationality === "South African" },
      { key: "nat:korean",       label: "Korean",        match: r => r.nationality === "Korean" },
      { key: "nat:australian",   label: "Australian",    match: r => r.nationality === "Australian" },
    ],
  },
];

// Flat lookup: key → FilterOption
const FILTER_OPTION_MAP = new Map<FilterKey, FilterOption>(
  FILTER_GROUPS.flatMap(g => g.options.map(o => [o.key, o]))
);

// ─── Aggregate respondents into a SegmentFingerprint ─────────────────────────

function aggregateRespondents(respondents: Respondent[], label: string): SegmentFingerprint {
  const n = respondents.length;
  const fields: (keyof Respondent)[] = ["powerDistance","riskTolerance","decisionSpeed","communicationStyle","individualismCollectivism"];
  const dimensions = DIMENSION_META.map((meta, i) => ({
    ...meta,
    score: n === 0 ? 0 : Math.round(respondents.reduce((s, r) => s + (r[fields[i]] as number), 0) / n),
  }));
  return { label, respondents: n, dimensions };
}

// Group selected keys by their filter category
function keysByCategory(keys: FilterKey[]): Map<string, FilterOption[]> {
  const map = new Map<string, FilterOption[]>();
  for (const key of keys) {
    const opt = FILTER_OPTION_MAP.get(key);
    if (!opt) continue;
    const cat = FILTER_GROUPS.find(g => g.options.some(o => o.key === key))?.label ?? "Other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(opt);
  }
  return map;
}

// Within each category: OR (e.g. tenure:0-2 OR tenure:6-10)
// Between categories: AND or OR depending on mode
//   AND mode → respondent must satisfy at least one option in EVERY category
//   OR  mode → respondent must satisfy at least one option in ANY category
function mergeSegments(keys: FilterKey[], mode: "or" | "and"): SegmentFingerprint | null {
  if (keys.length === 0) return null;
  const categories = keysByCategory(keys);
  if (categories.size === 0) return null;

  const catEntries = [...categories.entries()];

  const matched = MOCK_RESPONDENTS.filter(r => {
    if (mode === "and") {
      // Must match at least one option in every category
      return catEntries.every(([, opts]) => opts.some(o => o.match(r)));
    } else {
      // Must match at least one option in any category
      return catEntries.some(([, opts]) => opts.some(o => o.match(r)));
    }
  });

  if (matched.length === 0) return null;

  // Build label: each category's selections joined by " or ", categories joined by " AND " or " + "
  const catLabels = catEntries.map(([, opts]) =>
    opts.length === 1 ? opts[0].label : `(${opts.map(o => o.label).join(" or ")})`
  );
  const label = catLabels.join(mode === "and" ? " AND " : " + ");

  return aggregateRespondents(matched, label);
}

// Respondent count for a single filter key (shown in the panel)
function countForKey(key: FilterKey): number {
  const opt = FILTER_OPTION_MAP.get(key);
  return opt ? MOCK_RESPONDENTS.filter(opt.match).length : 0;
}



function DeltaBadge({ a, b }: { a: number; b: number }) {
  const diff = Math.round(a - b);
  if (Math.abs(diff) < 5) return <Minus className="h-3 w-3 text-muted-foreground inline" />;
  return diff > 0
    ? <span className="text-xs font-semibold text-violet-500 inline-flex items-center gap-0.5"><TrendingUp className="h-3 w-3" />+{diff}</span>
    : <span className="text-xs font-semibold text-emerald-500 inline-flex items-center gap-0.5"><TrendingDown className="h-3 w-3" />{diff}</span>;
}

const SHORT_LABEL = (dim: string) =>
  dim.replace(" Style", "").replace(" Distance", "").replace(" Tolerance", "").replace(" Speed", "");

const GROUP_COLORS = {
  A: { stroke: "#1a7a7a", fill: "#1a7a7a", label: "Group A" },
  B: { stroke: "#f97316", fill: "#f97316", label: "Group B" },
  C: { stroke: "#2563eb", fill: "#2563eb", label: "Historical" },
  D: { stroke: "#7c3aed", fill: "#7c3aed", label: "Departed" },
} as const;

// Departed-only filter groups — same categories, predicates scoped to departed === true
const DEPARTED_FILTER_GROUPS: FilterGroup[] = [
  {
    label: "Role",
    options: [
      { key: "d-role:teacher",   label: "All Departed Teachers",        match: r => r.departed && r.role === "teacher" },
      { key: "d-friction:high",  label: "High-Friction Departed",       match: r => r.departed && r.frictionLevel === "high" },
      { key: "d-friction:low",   label: "Low-Friction Departed",        match: r => r.departed && r.frictionLevel === "low" },
    ],
  },
  {
    label: "Tenure at Departure",
    options: [
      { key: "d-tenure:0-2",  label: "0–2 Years",  match: r => r.departed && r.tenure === "0-2" },
      { key: "d-tenure:3-5",  label: "3–5 Years",  match: r => r.departed && r.tenure === "3-5" },
      { key: "d-tenure:6-10", label: "6–10 Years", match: r => r.departed && r.tenure === "6-10" },
      { key: "d-tenure:10+",  label: "10+ Years",  match: r => r.departed && r.tenure === "10+" },
    ],
  },
  {
    label: "School Level",
    options: [
      { key: "d-level:elementary", label: "Elementary",    match: r => r.departed && r.gradeLevel === "elementary" },
      { key: "d-level:middle",     label: "Middle School", match: r => r.departed && r.gradeLevel === "middle" },
      { key: "d-level:high",       label: "High School",   match: r => r.departed && r.gradeLevel === "high" },
    ],
  },
  {
    label: "Department",
    options: [
      { key: "d-dept:humanities", label: "Humanities", match: r => r.departed && r.department === "humanities" },
      { key: "d-dept:stem",       label: "STEM",        match: r => r.departed && r.department === "stem" },
      { key: "d-dept:arts-pe",    label: "Arts & PE",   match: r => r.departed && r.department === "arts-pe" },
    ],
  },
];


type GroupId = "A" | "B" | "C" | "D";

// Flat lookup for departed filter keys
const DEPARTED_OPTION_MAP = new Map<string, FilterOption>(
  DEPARTED_FILTER_GROUPS.flatMap(g => g.options.map(o => [o.key, o]))
);

function countForDepartedKey(key: string): number {
  const opt = DEPARTED_OPTION_MAP.get(key);
  return opt ? MOCK_RESPONDENTS.filter(opt.match).length : 0;
}

function mergeSegmentsDeparted(keys: string[], mode: "or" | "and"): SegmentFingerprint | null {
  if (keys.length === 0) return null;
  // Build category map from DEPARTED_FILTER_GROUPS
  const map = new Map<string, FilterOption[]>();
  for (const key of keys) {
    const opt = DEPARTED_OPTION_MAP.get(key);
    if (!opt) continue;
    const cat = DEPARTED_FILTER_GROUPS.find(g => g.options.some(o => o.key === key))?.label ?? "Other";
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(opt);
  }
  if (map.size === 0) return null;
  const catEntries = [...map.entries()];
  const matched = MOCK_RESPONDENTS.filter(r => {
    if (!r.departed) return false;
    return mode === "and"
      ? catEntries.every(([, opts]) => opts.some(o => o.match(r)))
      : catEntries.some(([, opts]) => opts.some(o => o.match(r)));
  });
  if (matched.length === 0) return null;
  const catLabels = catEntries.map(([, opts]) =>
    opts.length === 1 ? opts[0].label : `(${opts.map(o => o.label).join(" or ")})`
  );
  return aggregateRespondents(matched, catLabels.join(mode === "and" ? " AND " : " + "));
}

function FilterPanel({
  groupId,
  selected,
  mode,
  onChange,
  onModeChange,
  selectedYear,
  onYearChange,
}: {
  groupId: GroupId;
  selected: Set<string>;
  mode: "or" | "and";
  onChange: (keys: Set<string>) => void;
  onModeChange: (mode: "or" | "and") => void;
  selectedYear?: SchoolYear | null;
  onYearChange?: (year: SchoolYear | null) => void;
}) {
  const color = GROUP_COLORS[groupId];
  const isC = groupId === "C";
  const isD = groupId === "D";
  const filterGroups = isD ? DEPARTED_FILTER_GROUPS : FILTER_GROUPS;

  function toggle(key: string) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  }

  const selectedKeys = [...selected];

  // Category count for AND/OR toggle — use correct group map
  const activeCategoryCount = isD
    ? (() => {
        const cats = new Set<string>();
        for (const key of selectedKeys) {
          const cat = DEPARTED_FILTER_GROUPS.find(g => g.options.some(o => o.key === key))?.label;
          if (cat) cats.add(cat);
        }
        return cats.size;
      })()
    : keysByCategory(selectedKeys).size;

  const filterTotal = isD
    ? (mergeSegmentsDeparted(selectedKeys, mode)?.respondents ?? 0)
    : (mergeSegments(selectedKeys, mode)?.respondents ?? 0);

  // Group C/D: year filter adds respondents on top of demographic selection
  const yearExtra = selectedYear
    ? MOCK_RESPONDENTS.filter(r => r.schoolYear === selectedYear && (isD ? r.departed : true)).length
    : 0;
  const hasYear = isC || isD;
  const total = hasYear && selected.size === 0 ? yearExtra : filterTotal;
  const hasAny = selected.size > 0 || !!selectedYear;

  const titleSuffix = isC ? " — Historical" : isD ? " — Departed" : "";

  return (
    <Card className="border-2" style={{ borderColor: color.stroke + "40" }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color.stroke }} />
            <CardTitle className="text-sm font-bold uppercase tracking-wider" style={{ color: color.stroke }}>
              Group {groupId}{titleSuffix}
            </CardTitle>
          </div>
          {hasAny && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{total} respondents</Badge>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => {
                onChange(new Set());
                onYearChange?.(null);
              }}>
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* AND/OR toggle — only shown when selections span multiple categories */}
        {activeCategoryCount > 1 && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Between categories</span>
            <div className="flex rounded-md border border-border overflow-hidden text-xs">
              <button
                className={`px-2.5 py-1 font-semibold transition-colors ${mode === "or" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => onModeChange("or")}
              >
                OR
              </button>
              <button
                className={`px-2.5 py-1 font-semibold transition-colors ${mode === "and" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => onModeChange("and")}
              >
                AND
              </button>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {mode === "or" ? "anyone matching any category" : "must match a selection in every category"}
            </span>
          </div>
        )}

        {!hasAny && (
          <p className="text-xs text-muted-foreground mt-1">
            {isC ? "Optional — overlay a historical school year on the radar" : isD ? "Optional — overlay departed teachers on the radar" : "Select one or more segments below"}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Demographic filter checkboxes */}
        {filterGroups.map(group => (
          <div key={group.label}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{group.label}</p>
            <div className="space-y-1.5">
              {group.options.map(opt => (
                <div key={opt.key} className="flex items-center gap-2">
                  <Checkbox
                    id={`${groupId}-${opt.key}`}
                    checked={selected.has(opt.key)}
                    onCheckedChange={() => toggle(opt.key)}
                  />
                  <Label htmlFor={`${groupId}-${opt.key}`} className="text-xs cursor-pointer flex-1">
                    {opt.label}
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {isD ? countForDepartedKey(opt.key) : countForKey(opt.key)}n
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* School year picker for Group C and D */}
        {hasYear && (
          <div className="border-t border-border/40 pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <History className="h-3 w-3" />
              {isD ? "Year of Departure" : "School Year"}
            </p>
            <Select
              value={selectedYear ?? ""}
              onValueChange={val => onYearChange?.((val as SchoolYear) || null)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select school year…" />
              </SelectTrigger>
              <SelectContent>
                {SCHOOL_YEARS.map(yr => (
                  <SelectItem key={yr} value={yr} className="text-xs">
                    {yr} School Year
                    <span className="ml-2 text-muted-foreground">
                      ({MOCK_RESPONDENTS.filter(r => r.schoolYear === yr && (isD ? r.departed : !r.departed)).length}n)
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedYear && (
              <button
                className="text-[10px] text-muted-foreground hover:text-foreground underline mt-1"
                onClick={() => onYearChange?.(null)}
              >
                Clear year
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Comparison radar + bars ───────────────────────────────────────────────────

function buildDimensionData(groupA: SegmentFingerprint, groupB: SegmentFingerprint, groupC?: SegmentFingerprint, groupD?: SegmentFingerprint) {
  return groupA.dimensions.map((d, i) => ({
    dimension: SHORT_LABEL(d.dimension),
    [GROUP_COLORS.A.label]: d.score,
    [GROUP_COLORS.B.label]: groupB.dimensions[i].score,
    ...(groupC ? { [GROUP_COLORS.C.label]: groupC.dimensions[i].score } : {}),
    ...(groupD ? { [GROUP_COLORS.D.label]: groupD.dimensions[i].score } : {}),
    gap: Math.abs(d.score - groupB.dimensions[i].score),
  }));
}


function RadarOnly({ groupA, groupB, groupC, groupD }: { groupA: SegmentFingerprint; groupB: SegmentFingerprint; groupC?: SegmentFingerprint; groupD?: SegmentFingerprint }) {
  const dimensionData = buildDimensionData(groupA, groupB, groupC, groupD);
  return (
    <Card className="border-primary/20 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Workstyle Radar — Overlay
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={420}>
          <RadarChart data={dimensionData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name={GROUP_COLORS.A.label}
              dataKey={GROUP_COLORS.A.label}
              stroke={GROUP_COLORS.A.stroke}
              fill={GROUP_COLORS.A.fill}
              fillOpacity={0.25}
              strokeWidth={2}
            />
            <Radar
              name={GROUP_COLORS.B.label}
              dataKey={GROUP_COLORS.B.label}
              stroke={GROUP_COLORS.B.stroke}
              fill={GROUP_COLORS.B.fill}
              fillOpacity={0.15}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            {groupC && (
              <Radar
                name={GROUP_COLORS.C.label}
                dataKey={GROUP_COLORS.C.label}
                stroke={GROUP_COLORS.C.stroke}
                fill={GROUP_COLORS.C.fill}
                fillOpacity={0.12}
                strokeWidth={2}
                strokeDasharray="2 3"
              />
            )}
            {groupD && (
              <Radar
                name={GROUP_COLORS.D.label}
                dataKey={GROUP_COLORS.D.label}
                stroke={GROUP_COLORS.D.stroke}
                fill={GROUP_COLORS.D.fill}
                fillOpacity={0.12}
                strokeWidth={2}
                strokeDasharray="6 2"
              />
            )}
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <RechartsTooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid hsl(var(--border))" }}
              formatter={(v: number) => [`${v}`, ""]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function ComparisonDetail(_: { groupA: SegmentFingerprint; groupB: SegmentFingerprint }) {
  return <div />;
}

// ─── Quick-select presets ─────────────────────────────────────────────────────

const PRESETS: { label: string; a: string[]; b: string[]; modeA?: "or"|"and"; modeB?: "or"|"and" }[] = [
  { label: "New vs. Veteran Teachers",          a: ["tenure:0-2"],                              b: ["tenure:10+"] },
  { label: "New Teachers vs. Admin",            a: ["tenure:0-2"],                              b: ["role:admin"] },
  { label: "Middle & High vs. Admin",           a: ["level:middle", "level:high"],              b: ["role:admin"] },
  { label: "STEM vs. Humanities",               a: ["dept:stem"],                               b: ["dept:humanities"] },
  { label: "High-Friction vs. Low-Friction",    a: ["friction:high"],                           b: ["friction:low"] },
  { label: "Staff vs. Parents",                 a: ["role:teacher"],                            b: ["parent:all"] },
  { label: "New Teachers in Middle & High",     a: ["tenure:0-2", "level:middle", "level:high"],b: ["role:admin"], modeA: "and" },
  { label: "New or Veteran in Middle School",   a: ["tenure:0-2", "tenure:10+", "level:middle"],b: ["role:admin"], modeA: "or" },
  { label: "Departed vs. Current Teachers",     a: ["departed:all"],                            b: ["role:teacher"] },
  { label: "Departed vs. Admin",                a: ["departed:all"],                            b: ["role:admin"] },
  { label: "2021-22 vs. 2024-25",               a: ["year:2021-22"],                            b: ["year:2024-25"] },
  { label: "2022-23 vs. 2024-25",               a: ["year:2022-23"],                            b: ["year:2024-25"] },
];


// ─── No-match explanation ─────────────────────────────────────────────────────

function noMatchReason(keys: string[], mode: "or" | "and"): string {
  if (keys.length === 0) return "Select at least one filter.";
  if (mode !== "and") return "No respondents match the selected filters.";
  const cats = keysByCategory(keys);
  const catEntries = [...cats.entries()];
  // Find which category pairs have zero intersection
  const catLabels = catEntries.map(([, opts]) =>
    opts.length === 1 ? opts[0].label : opts.map(o => o.label).join(" or ")
  );
  return `No respondents match all of: ${catLabels.map(l => `"${l}"`).join(" AND ")}. Try switching to OR, or remove a conflicting filter.`;
}

// ─── Active filter summary sentence ──────────────────────────────────────────

function filterSummary(keys: string[], mode: "or" | "and"): string {
  if (keys.length === 0) return "";
  const cats = keysByCategory(keys);
  const catParts = [...cats.values()].map(opts =>
    opts.length === 1 ? opts[0].label : `(${opts.map(o => o.label).join(" or ")})`
  );
  return catParts.join(mode === "and" ? " AND " : " or ");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CulturalPreferencesComparator() {
  const { selectedSchool } = useSchoolContext();

  const [groupA, setGroupA] = useState<Set<string>>(new Set(["tenure:0-2"]));
  const [groupB, setGroupB] = useState<Set<string>>(new Set(["role:admin"]));
  const [groupC, setGroupC] = useState<Set<string>>(new Set());
  const [groupD, setGroupD] = useState<Set<string>>(new Set());
  const [modeA, setModeA] = useState<"or" | "and">("or");
  const [modeB, setModeB] = useState<"or" | "and">("or");
  const [modeC, setModeC] = useState<"or" | "and">("or");
  const [modeD, setModeD] = useState<"or" | "and">("or");
  const [groupCYear, setGroupCYear] = useState<SchoolYear | null>(null);
  const [groupDYear, setGroupDYear] = useState<SchoolYear | null>(null);
  const [copied, setCopied] = useState(false);

  const fingerprintA = useMemo(() => mergeSegments([...groupA], modeA), [groupA, modeA]);
  const fingerprintB = useMemo(() => mergeSegments([...groupB], modeB), [groupB, modeB]);

  const fingerprintC = useMemo((): SegmentFingerprint | null => {
    const map = new Map<number, Respondent>();
    if (groupC.size > 0) {
      const cats = [...keysByCategory([...groupC]).entries()];
      MOCK_RESPONDENTS.filter(r =>
        modeC === "and"
          ? cats.every(([, opts]) => opts.some(o => o.match(r)))
          : cats.some(([, opts]) => opts.some(o => o.match(r)))
      ).forEach(r => map.set(r.id, r));
    }
    if (groupCYear) {
      MOCK_RESPONDENTS.filter(r => r.schoolYear === groupCYear && !r.departed).forEach(r => map.set(r.id, r));
    }
    const matched = [...map.values()];
    if (matched.length === 0) return null;
    const fromFilters = groupC.size > 0 ? mergeSegments([...groupC], modeC) : null;
    const parts = [fromFilters?.label, groupCYear ? `${groupCYear} School Year` : null].filter(Boolean);
    return aggregateRespondents(matched, parts.join(" + ") || "Historical");
  }, [groupC, modeC, groupCYear]);

  const fingerprintD = useMemo((): SegmentFingerprint | null => {
    const map = new Map<number, Respondent>();
    if (groupD.size > 0) {
      const catMap = new Map<string, FilterOption[]>();
      for (const key of groupD) {
        const opt = DEPARTED_OPTION_MAP.get(key);
        if (!opt) continue;
        const cat = DEPARTED_FILTER_GROUPS.find(g => g.options.some(o => o.key === key))?.label ?? "Other";
        if (!catMap.has(cat)) catMap.set(cat, []);
        catMap.get(cat)!.push(opt);
      }
      const catEntries = [...catMap.entries()];
      MOCK_RESPONDENTS.filter(r => {
        if (!r.departed) return false;
        return modeD === "and"
          ? catEntries.every(([, opts]) => opts.some(o => o.match(r)))
          : catEntries.some(([, opts]) => opts.some(o => o.match(r)));
      }).forEach(r => map.set(r.id, r));
    }
    if (groupDYear) {
      MOCK_RESPONDENTS.filter(r => r.departed && r.schoolYear === groupDYear).forEach(r => map.set(r.id, r));
    }
    const matched = [...map.values()];
    if (matched.length === 0) return null;
    const fromFilters = groupD.size > 0 ? mergeSegmentsDeparted([...groupD], modeD) : null;
    const parts = [fromFilters?.label, groupDYear ? `Departed ${groupDYear}` : null].filter(Boolean);
    return aggregateRespondents(matched, parts.join(" + ") || "Departed Teachers");
  }, [groupD, modeD, groupDYear]);

  const canCompare = fingerprintA !== null && fingerprintB !== null;
  const hasSelections = groupA.size > 0 && groupB.size > 0;

  function applyPreset(preset: typeof PRESETS[0]) {
    setGroupA(new Set(preset.a));
    setGroupB(new Set(preset.b));
    setModeA(preset.modeA ?? "or");
    setModeB(preset.modeB ?? "or");
  }

  function copyShareLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="px-6 py-8">
      {/* Subheader row */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {selectedSchool?.name ?? "Select a school"} — Build any two groups and compare their cultural preference radar
          </p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={copyShareLink}>
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Share"}
        </Button>
      </div>
      <div className="mb-6 p-3 rounded-xl border border-border/60 bg-muted/20 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Select one or more segments for <strong style={{ color: GROUP_COLORS.A.stroke }}>Group A</strong> and <strong style={{ color: GROUP_COLORS.B.stroke }}>Group B</strong>.
          Within a category, selections are always OR. The AND/OR toggle appears when you select across categories.
          <strong className="text-foreground"> Sample data shown</strong> — connect live survey responses to see your school's actual fingerprint.
        </p>
      </div>

      {/* Radar — active filter summary + chart or no-match explanation */}
      {canCompare ? (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-1 flex-wrap">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Showing:</span>
            <span className="text-sm font-medium" style={{ color: GROUP_COLORS.A.stroke }}>
              {filterSummary([...groupA], modeA)}
            </span>
            <span className="text-xs text-muted-foreground font-bold">vs.</span>
            <span className="text-sm font-medium" style={{ color: GROUP_COLORS.B.stroke }}>
              {filterSummary([...groupB], modeB)}
            </span>
            {fingerprintC && (
              <>
                <span className="text-xs text-muted-foreground font-bold">vs.</span>
                <span className="text-sm font-medium" style={{ color: GROUP_COLORS.C.stroke }}>{fingerprintC.label}</span>
              </>
            )}
            {fingerprintD && (
              <>
                <span className="text-xs text-muted-foreground font-bold">vs.</span>
                <span className="text-sm font-medium" style={{ color: GROUP_COLORS.D.stroke }}>{fingerprintD.label}</span>
              </>
            )}
          </div>
          <RadarOnly groupA={fingerprintA!} groupB={fingerprintB!} groupC={fingerprintC ?? undefined} groupD={fingerprintD ?? undefined} />
        </div>
      ) : hasSelections ? (
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {[
            { keys: [...groupA], mode: modeA, fp: fingerprintA, color: GROUP_COLORS.A },
            { keys: [...groupB], mode: modeB, fp: fingerprintB, color: GROUP_COLORS.B },
          ].map(({ keys, mode, fp, color }) => fp === null && keys.length > 0 ? (
            <div key={color.label} className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-start gap-3">
              <Info className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold mb-1" style={{ color: color.stroke }}>Group {color.label.slice(-1)} — No matches</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{noMatchReason(keys, mode)}</p>
              </div>
            </div>
          ) : null)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl border-border/60 bg-muted/10 mb-6">
          <SlidersHorizontal className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground text-sm">
            Select at least one segment in both Group A and Group B to see the comparison.
          </p>
        </div>
      )}

      {/* Quick-select presets */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Quick-Select Presets</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(preset => (
            <Button key={preset.label} variant="outline" size="sm" className="text-xs h-7" onClick={() => applyPreset(preset)}>
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Filter panels — 2x2 grid */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <FilterPanel groupId="A" selected={groupA} mode={modeA} onChange={setGroupA} onModeChange={setModeA} />
        <FilterPanel groupId="B" selected={groupB} mode={modeB} onChange={setGroupB} onModeChange={setModeB} />
        <FilterPanel groupId="C" selected={groupC} mode={modeC} onChange={setGroupC} onModeChange={setModeC} selectedYear={groupCYear} onYearChange={setGroupCYear} />
        <FilterPanel groupId="D" selected={groupD} mode={modeD} onChange={setGroupD} onModeChange={setModeD} selectedYear={groupDYear} onYearChange={setGroupDYear} />
      </div>

      {/* Detail analysis */}
      {canCompare && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-xl border border-border/60 bg-muted/20">
            {([
              { fp: fingerprintA, color: GROUP_COLORS.A, label: "Group A" },
              { fp: fingerprintB, color: GROUP_COLORS.B, label: "Group B" },
              { fp: fingerprintC, color: GROUP_COLORS.C, label: "Historical" },
              { fp: fingerprintD, color: GROUP_COLORS.D, label: "Departed" },
            ] as const).filter(g => g.fp).map((g, i) => (
              <>
                {i > 0 && <span key={`sep-${i}`} className="text-muted-foreground">vs.</span>}
                <div key={g.label} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: g.color.stroke }} />
                  <span className="text-sm font-semibold" style={{ color: g.color.stroke }}>{g.label}:</span>
                  <span className="text-sm text-muted-foreground">{g.fp!.label}</span>
                  <Badge variant="outline" className="text-xs">{g.fp!.respondents}n</Badge>
                </div>
              </>
            ))}
          </div>
          <ComparisonDetail groupA={fingerprintA} groupB={fingerprintB} />
        </>
      )}
    </div>
  );
}
