import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, GraduationCap, Clock, Building2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type TenureBand = "0-2" | "3-5" | "6-10" | "10+";
type GradeLevel = "elementary" | "middle" | "high";

const TENURE_OPTIONS: { value: TenureBand; label: string; desc: string }[] = [
  { value: "0-2", label: "0–2 years", desc: "Still finding my footing" },
  { value: "3-5", label: "3–5 years", desc: "Growing in confidence" },
  { value: "6-10", label: "6–10 years", desc: "Experienced practitioner" },
  { value: "10+", label: "10+ years", desc: "Veteran educator" },
];

const GRADE_OPTIONS: { value: GradeLevel; label: string; showsDept: boolean }[] = [
  { value: "elementary", label: "Elementary (K–5)", showsDept: false },
  { value: "middle", label: "Middle School (6–8)", showsDept: true },
  { value: "high", label: "High School (9–12)", showsDept: true },
];

const DEPARTMENT_OPTIONS = [
  "English / Language Arts",
  "Math",
  "Science",
  "Social Studies / History",
  "Arts & Music",
  "Physical Education",
  "Special Education",
  "World Languages",
  "Technology / CTE",
  "Administration / Support",
  "Other",
];

export function DemographicsOnboarding({ onComplete }: { onComplete: () => void }) {
  const { user } = useAuth();
  const { selectedSchoolId } = useSchoolContext();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [tenure, setTenure] = useState<TenureBand | null>(null);
  const [grade, setGrade] = useState<GradeLevel | null>(null);
  const [department, setDepartment] = useState<string | null>(null);

  // Elementary teachers don't have a department — 2-step flow for them, 3-step for secondary
  const needsDept = grade === "middle" || grade === "high";
  const totalSteps = needsDept ? 3 : 2;

  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("No user");
      const { error } = await (supabase as any)
        .from("user_profiles")
        .upsert(
          {
            user_id: user.id,
            school_id: selectedSchoolId || null,
            tenure_band: tenure,
            grade_level: grade,
            // Null out department for elementary teachers
            department: needsDept ? department : null,
            onboarded: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profiles"] });
      onComplete();
    },
  });

  const handleGradeSelect = (value: GradeLevel) => {
    setGrade(value);
    setDepartment(null); // reset department if they go back and change grade
    if (value === "elementary") {
      // Skip department step — go straight to confirmation (step 2 = finish)
      setStep(2);
    } else {
      setStep(2);
    }
  };

  // Step 0: Tenure | Step 1: Grade level | Step 2: Department (secondary only) or Confirm (elementary)
  const isConfirmStep = step === 2 && !needsDept;
  const isDeptStep = step === 2 && needsDept;
  const canFinish = isConfirmStep || (isDeptStep && !!department);
  const progressPct = ((step + 1) / (needsDept ? 3 : 2)) * 100;

  const stepLabel =
    step === 0 ? "Tenure"
    : step === 1 ? "Grade Level"
    : needsDept ? "Department"
    : "Confirm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg shadow-2xl border-primary/20 overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
              {step === 0 ? <Clock className="h-6 w-6 text-primary" /> :
               step === 1 ? <GraduationCap className="h-6 w-6 text-primary" /> :
               <Building2 className="h-6 w-6 text-primary" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <p className="text-xs font-bold text-primary uppercase tracking-widest">
                  Profile Setup · {stepLabel} · Step {step + 1} of {totalSteps}
                </p>
              </div>
              <h2 className="text-xl font-bold tracking-tight leading-tight">
                {step === 0 && "How long have you been teaching?"}
                {step === 1 && "What grade level do you primarily teach?"}
                {isDeptStep && "What department are you in?"}
                {isConfirmStep && "All set! Review your profile."}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {step === 0 && "This helps us understand your experience context."}
                {step === 1 && "We use this to compare across school divisions."}
                {isDeptStep && "Middle & high school teachers are grouped by subject area."}
                {isConfirmStep && "Elementary teachers teach across subjects — no department needed."}
              </p>
            </div>
          </div>

          {/* Step 0: Tenure */}
          {step === 0 && (
            <div className="grid grid-cols-2 gap-3">
              {TENURE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setTenure(opt.value); setStep(1); }}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all duration-200 hover:border-primary hover:shadow-md",
                    tenure === opt.value ? "border-primary bg-primary/10" : "border-border bg-card"
                  )}
                >
                  <p className="font-bold text-base">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 1: Grade Level */}
          {step === 1 && (
            <div className="grid grid-cols-1 gap-3">
              {GRADE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleGradeSelect(opt.value)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left flex items-center gap-4 transition-all duration-200 hover:border-primary hover:shadow-md",
                    grade === opt.value ? "border-primary bg-primary/10" : "border-border bg-card"
                  )}
                >
                  <div className="p-2.5 bg-primary/10 rounded-lg">
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{opt.label}</p>
                    {!opt.showsDept && (
                      <p className="text-xs text-muted-foreground mt-0.5">No department — generalist teacher</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2a: Department (secondary only) */}
          {isDeptStep && (
            <div className="grid grid-cols-2 gap-2">
              {DEPARTMENT_OPTIONS.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setDepartment(dept)}
                  className={cn(
                    "px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-all duration-200 hover:border-primary",
                    department === dept ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground"
                  )}
                >
                  {dept}
                </button>
              ))}
            </div>
          )}

          {/* Step 2b: Elementary confirm */}
          {isConfirmStep && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-3">
              <p className="text-sm text-muted-foreground">Your profile is ready. Here's what we saved:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span><strong>Tenure:</strong> {tenure} years</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span><strong>Grade Level:</strong> Elementary (K–5)</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span>Department: Not applicable (generalist)</span>
                </div>
              </div>
            </div>
          )}

          {/* Selections summary (steps 0–1) */}
          {step < 2 && (tenure || grade) && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tenure && <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />{tenure} yrs</Badge>}
              {grade && <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />{grade}</Badge>}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep(step - 1)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            ) : <div />}

            {canFinish && (
              <Button
                onClick={() => saveProfile()}
                disabled={isPending}
                className="ml-auto"
              >
                {isPending ? "Saving..." : "Finish Setup →"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Hook: returns true if the current user has NOT completed onboarding */
export function useNeedsOnboarding() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await (supabase as any)
        .from("user_profiles")
        .select("onboarded")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  return {
    needsOnboarding: !isLoading && (!profile || !profile.onboarded),
    isLoading,
  };
}
