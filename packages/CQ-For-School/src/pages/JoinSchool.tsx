import { useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sparkles, CheckCircle, Loader2, GraduationCap, Clock, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const TENURE_OPTIONS = [
  { value: "0-2", label: "0–2 years" },
  { value: "3-5", label: "3–5 years" },
  { value: "6-10", label: "6–10 years" },
  { value: "10+", label: "10+ years" },
];

const GRADE_OPTIONS = [
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

export default function JoinSchool() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gradeLevel, setGradeLevel] = useState<string>("");
  const [tenureBand, setTenureBand] = useState<string>("");
  const [department, setDepartment] = useState<string>("");

  const { data: school, isLoading: schoolLoading } = useQuery({
    queryKey: ["school", schoolId],
    queryFn: async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(schoolId!);
      const query = supabase.from("schools").select("id, name, slug");
      if (isUuid) {
        query.or(`id.eq.${schoolId},slug.eq.${schoolId}`);
      } else {
        query.eq("slug", schoolId!);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!schoolId,
  });

  const selectedGrade = GRADE_OPTIONS.find(g => g.value === gradeLevel);
  const needsDept = selectedGrade?.showsDept ?? true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !school) return;
    
    if (!gradeLevel || !tenureBand || (needsDept && !department)) {
      setError("Please select all your teaching details.");
      return;
    }

    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        data: { 
          school_id: school.id,
          grade_level: gradeLevel,
          tenure_band: tenureBand,
          department: needsDept ? department : null
        },
        emailRedirectTo: `${window.location.origin}/survey`,
      },
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  };

  if (schoolLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-lg font-semibold text-foreground">School not found</p>
            <p className="text-sm text-muted-foreground mt-2">This invite link may be invalid or expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="font-sans text-2xl font-semibold text-foreground mb-2">Check your email!</h2>
            <p className="text-muted-foreground leading-relaxed">
              We sent a magic link to <span className="font-medium text-foreground">{email}</span>.<br />
              Click it to join <span className="font-semibold text-primary">{school.name}</span> and start your first check-in!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-md shadow-2xl border-primary/10 overflow-hidden">
        <div className="h-1.5 bg-primary/20">
          <div className="h-full bg-primary w-1/4" />
        </div>
        <CardContent className="pt-10 pb-10 px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <span className="font-display text-2xl font-black tracking-tighter text-foreground uppercase">CQ Impact</span>
            </div>
            <h1 className="font-sans text-3xl font-semibold text-foreground leading-tight mb-3">
              Improve your school's culture
            </h1>
            <p className="text-muted-foreground text-sm px-4">
              Join <span className="font-bold text-foreground">{school.name}</span> for weekly 2-minute cultural check-ins.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">School Email</label>
              <Input
                type="email"
                placeholder="teacher@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-base h-12 rounded-xl focus-visible:ring-primary/20"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Grade Level</label>
              <Select value={gradeLevel} onValueChange={setGradeLevel} required>
                <SelectTrigger className="text-base h-12 rounded-xl border-border bg-card">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Which level do you teach?" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {GRADE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Teaching Tenure</label>
              <Select value={tenureBand} onValueChange={setTenureBand} required>
                <SelectTrigger className="text-base h-12 rounded-xl border-border bg-card">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Years of experience?" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {TENURE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsDept && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pl-1">Department</label>
                <Select value={department} onValueChange={setDepartment} required>
                  <SelectTrigger className="text-base h-12 rounded-xl border-border bg-card">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select your department" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl max-h-60">
                    {DEPARTMENT_OPTIONS.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {error && <p className="text-sm font-semibold text-destructive px-1">{error}</p>}

            <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:shadow-xl active:scale-95" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" /> Creating Profile...</>
              ) : (
                "Join School →"
              )}
            </Button>
            
            <p className="text-[10px] text-muted-foreground text-center font-medium leading-relaxed px-6">
              Teacher onboarding. All responses are summarized to protect individual privacy while driving school-wide improvement.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

