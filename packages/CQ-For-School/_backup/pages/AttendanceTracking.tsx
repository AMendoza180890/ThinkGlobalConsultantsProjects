import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { UserCheck, Calendar, Award, X, Shield, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { downloadCertificate } from "@/lib/certificates";
import { WASC_DOMAINS } from "@/lib/accreditation";
import { format } from "date-fns";

interface LSession {
  id: string; title: string; format: string; scheduled_date: string; duration_hours: number;
  standard_id: string | null; status: string; session_type: string;
}

interface Attendance {
  id: string; session_id: string; attendee_name: string; attended: boolean; certificate_issued: boolean;
}

const DEFAULT_STAFF = [
  "Sarah Johnson", "Michael Chen", "Emily Rodriguez", "David Kim",
  "Lisa Thompson", "James Wilson", "Maria Garcia", "Robert Lee",
  "Jennifer Martinez", "William Davis",
];

export default function AttendanceTracking() {
  const { selectedSchoolId, schools } = useSchoolContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<LSession[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [checkedNames, setCheckedNames] = useState<Set<string>>(new Set());
  const [customName, setCustomName] = useState("");
  const [staffList, setStaffList] = useState(DEFAULT_STAFF);
  const [saving, setSaving] = useState(false);

  const selectedSchool = schools?.find((s) => s.id === selectedSchoolId);

  useEffect(() => {
    if (!selectedSchoolId) return;
    loadData();
  }, [selectedSchoolId]);

  const loadData = async () => {
    if (!selectedSchoolId) return;
    setLoading(true);
    const [sessRes, attRes] = await Promise.all([
      (supabase as any).from("learning_sessions").select("*").eq("school_id", selectedSchoolId).order("scheduled_date", { ascending: false }),
      (supabase as any).from("session_attendance").select("*").eq("school_id", selectedSchoolId),
    ]);
    if (sessRes.data) setSessions(sessRes.data);
    if (attRes.data) setAttendance(attRes.data);
    setLoading(false);
  };

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);
  const sessionAttendance = attendance.filter((a) => a.session_id === selectedSessionId);

  // By Staff aggregation
  const staffStats = useMemo(() => {
    const map: Record<string, { sessions: number; hours: number; certificates: number }> = {};
    attendance.forEach((a) => {
      if (!a.attended) return;
      if (!map[a.attendee_name]) map[a.attendee_name] = { sessions: 0, hours: 0, certificates: 0 };
      map[a.attendee_name].sessions++;
      if (a.certificate_issued) map[a.attendee_name].certificates++;
      const sess = sessions.find((s) => s.id === a.session_id);
      if (sess) map[a.attendee_name].hours += sess.duration_hours;
    });
    return Object.entries(map).sort((a, b) => b[1].sessions - a[1].sessions);
  }, [attendance, sessions]);

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const totalAttendees = new Set(attendance.filter((a) => a.attended).map((a) => a.attendee_name)).size;
  const totalCertificates = attendance.filter((a) => a.certificate_issued).length;

  const toggleName = (name: string) => {
    const next = new Set(checkedNames);
    if (next.has(name)) next.delete(name); else next.add(name);
    setCheckedNames(next);
  };

  const addCustomStaff = () => {
    if (customName.trim() && !staffList.includes(customName.trim())) {
      setStaffList([...staffList, customName.trim()]);
      setCheckedNames(new Set([...checkedNames, customName.trim()]));
      setCustomName("");
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedSchoolId || !selectedSessionId || checkedNames.size === 0) return;
    setSaving(true);

    const session = sessions.find((s) => s.id === selectedSessionId);
    const domain = session?.standard_id ? WASC_DOMAINS.find((d) => d.code === session.standard_id) : null;

    const records = Array.from(checkedNames).map((name) => ({
      session_id: selectedSessionId,
      school_id: selectedSchoolId,
      attendee_name: name,
      attended: true,
      certificate_issued: true,
    }));

    const { error } = await (supabase as any).from("session_attendance").insert(records);
    if (error) {
      toast({ title: "Error", description: "Failed to save attendance.", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Mark session completed
    await (supabase as any).from("learning_sessions").update({ status: "completed" }).eq("id", selectedSessionId);

    // Save certificate records
    if (session) {
      const certRecords = Array.from(checkedNames).map((name) => ({
        school_id: selectedSchoolId,
        session_id: selectedSessionId,
        staff_name: name,
        session_title: session.title,
        session_date: session.scheduled_date,
        duration_hours: session.duration_hours,
        standard_code: domain?.code ?? session.standard_id,
        standard_name: domain?.name ?? session.standard_id,
        school_name: selectedSchool?.name ?? "School",
      }));
      await (supabase as any).from("cpd_certificates").insert(certRecords);

      // Download PDFs
      Array.from(checkedNames).forEach((name, i) => {
        setTimeout(() => {
          downloadCertificate({
            staffName: name,
            sessionTitle: session.title,
            date: format(new Date(session.scheduled_date), "MMMM d, yyyy"),
            durationHours: session.duration_hours,
            standardCode: domain?.code ?? session.standard_id ?? "",
            standardName: domain?.name ?? "",
            schoolName: selectedSchool?.name ?? "School",
          });
        }, i * 300);
      });
    }

    setSaving(false);
    toast({ title: "Attendance recorded", description: `${checkedNames.size} certificate(s) generated.` });
    setSelectedSessionId(null);
    setCheckedNames(new Set());
    loadData();
  };

  if (loading) {
    return <div className="space-y-6 p-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-[400px]" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" />
          Attendance Tracking
        </h1>
        <p className="text-muted-foreground mt-1">Record attendance and issue CPD certificates</p>
      </div>

      {/* WASC Evidence Callout */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">WASC Evidence Link</p>
            <p className="text-xs text-muted-foreground mt-1">
              Completed sessions with attendance records automatically contribute to <strong>A3 Faculty and Staff</strong> (professional learning evidence) and <strong>C2 Systems of Support</strong> (responsive intervention delivery) accreditation scores.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Completed Sessions", value: completedSessions.length, icon: Calendar },
          { label: "Unique Attendees", value: totalAttendees, icon: UserCheck },
          { label: "Certificates Issued", value: totalCertificates, icon: Award },
          { label: "CPD Hours Logged", value: attendance.reduce((sum, a) => { const s = sessions.find((x) => x.id === a.session_id); return sum + (a.attended && s ? s.duration_hours : 0); }, 0), icon: CheckCircle2 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 text-center">
              <stat.icon className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="by-session">
        <TabsList>
          <TabsTrigger value="by-session">By Session</TabsTrigger>
          <TabsTrigger value="by-staff">By Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="by-session">
          <div className="space-y-3">
            {sessions.length === 0 && <p className="text-sm text-muted-foreground text-center py-12">No sessions found. Create sessions in the Session Calendar first.</p>}
            {sessions.map((session) => {
              const sessAtt = attendance.filter((a) => a.session_id === session.id && a.attended);
              return (
                <Card key={session.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold">{session.title}</h3>
                      <div className="flex gap-1.5">
                        <Badge variant="outline" className="text-[10px]">{format(new Date(session.scheduled_date), "MMM d, yyyy")}</Badge>
                        <Badge variant="outline" className="text-[10px]">{session.format}</Badge>
                        <Badge variant="outline" className="text-[10px]">{session.status}</Badge>
                      </div>
                      {sessAtt.length > 0 && <p className="text-xs text-muted-foreground">{sessAtt.length} attendees recorded</p>}
                    </div>
                    {session.status === "scheduled" ? (
                      <Button size="sm" onClick={() => { setSelectedSessionId(session.id); setCheckedNames(new Set()); }}>
                        <UserCheck className="h-3.5 w-3.5 mr-1" />Record Attendance
                      </Button>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border-0 text-[10px]">
                        <CheckCircle2 className="h-3 w-3 mr-1" />Completed
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="by-staff">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Staff Member</th>
                      <th className="text-left p-3 font-medium">Sessions Attended</th>
                      <th className="text-left p-3 font-medium">CPD Hours</th>
                      <th className="text-left p-3 font-medium">Certificates</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffStats.length === 0 && (
                      <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">No attendance records yet.</td></tr>
                    )}
                    {staffStats.map(([name, stats]) => (
                      <tr key={name} className="border-b hover:bg-muted/30">
                        <td className="p-3 font-medium">{name}</td>
                        <td className="p-3">{stats.sessions}</td>
                        <td className="p-3">{stats.hours}h</td>
                        <td className="p-3">{stats.certificates}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Attendees Panel */}
      {selectedSessionId && selectedSession && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedSessionId(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-background border-l shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-5 border-b">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Record Attendance</h2>
              </div>
              <button onClick={() => setSelectedSessionId(null)} className="p-1 rounded-md hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="p-5 border-b">
              <p className="text-sm font-medium">{selectedSession.title}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(selectedSession.scheduled_date), "MMMM d, yyyy")} • {selectedSession.duration_hours}h</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="flex items-center justify-between">
                <Button size="sm" variant="outline" onClick={() => setCheckedNames(checkedNames.size === staffList.length ? new Set() : new Set(staffList))} className="text-xs">
                  {checkedNames.size === staffList.length ? "Clear all" : "Select all"}
                </Button>
                <span className="text-xs text-muted-foreground">{checkedNames.size}/{staffList.length}</span>
              </div>
              {staffList.map((name) => (
                <label key={name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                  <Checkbox checked={checkedNames.has(name)} onCheckedChange={() => toggleName(name)} />
                  <span className="text-sm">{name}</span>
                </label>
              ))}
              <div className="flex gap-2 pt-2">
                <Input placeholder="Add staff member..." value={customName} onChange={(e) => setCustomName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCustomStaff()} className="text-sm" />
                <Button size="sm" variant="outline" onClick={addCustomStaff} disabled={!customName.trim()}>Add</Button>
              </div>
            </div>
            <div className="border-t p-5">
              <Button className="w-full" onClick={handleSaveAttendance} disabled={saving || checkedNames.size === 0}>
                {saving ? "Saving..." : `Complete & issue ${checkedNames.size} certificate(s)`}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
