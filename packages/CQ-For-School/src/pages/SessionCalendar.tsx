import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar as CalendarIcon, List, Plus, X, Clock, Users, MapPin, ExternalLink } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

interface LearningSession {
  id: string;
  title: string;
  description: string | null;
  session_type: string;
  format: string;
  standard_id: string | null;
  scheduled_date: string;
  duration_hours: number;
  meeting_link: string | null;
  target_group: string;
  max_capacity: number | null;
  status: string;
  created_by: string;
}

const formatBadge: Record<string, string> = {
  workshop: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  webinar: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  async: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
};

const typeBadge: Record<string, string> = {
  platform: "bg-primary/10 text-primary",
  school: "bg-accent/10 text-accent",
};

const statusBadge: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-muted text-muted-foreground",
};

export default function SessionCalendar() {
  const { selectedSchoolId } = useSchoolContext();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LearningSession | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Add form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("school");
  const [newFormat, setNewFormat] = useState("workshop");
  const [newDate, setNewDate] = useState("");
  const [newDuration, setNewDuration] = useState("1");
  const [newStandard, setNewStandard] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newTargetGroup, setNewTargetGroup] = useState("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedSchoolId) return;
    loadSessions();
  }, [selectedSchoolId]);

  const loadSessions = async () => {
    if (!selectedSchoolId) return;
    setLoading(true);
    const { data } = await (supabase as any).from("learning_sessions").select("*").eq("school_id", selectedSchoolId).order("scheduled_date", { ascending: true });
    if (data) setSessions(data);
    setLoading(false);
  };

  const handleAddSession = async () => {
    if (!selectedSchoolId || !user || !newTitle || !newDate) return;
    setSaving(true);
    const { error } = await (supabase as any).from("learning_sessions").insert({
      school_id: selectedSchoolId,
      title: newTitle,
      description: newDesc || null,
      session_type: newType,
      format: newFormat,
      scheduled_date: new Date(newDate).toISOString(),
      duration_hours: parseFloat(newDuration) || 1,
      standard_id: newStandard || null,
      meeting_link: newLink || null,
      target_group: newTargetGroup,
      created_by: user.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to create session.", variant: "destructive" });
    } else {
      toast({ title: "Session created" });
      setShowAddForm(false);
      resetForm();
      loadSessions();
    }
  };

  const resetForm = () => {
    setNewTitle(""); setNewDesc(""); setNewType("school"); setNewFormat("workshop");
    setNewDate(""); setNewDuration("1"); setNewStandard(""); setNewLink(""); setNewTargetGroup("all");
  };

  const sessionDates = useMemo(() => {
    const dates = new Set<string>();
    sessions.forEach((s) => dates.add(format(new Date(s.scheduled_date), "yyyy-MM-dd")));
    return dates;
  }, [sessions]);

  const filteredByDate = selectedDate
    ? sessions.filter((s) => isSameDay(new Date(s.scheduled_date), selectedDate))
    : sessions;

  if (loading) {
    return <div className="space-y-6 p-6"><Skeleton className="h-10 w-64" /><Skeleton className="h-[400px]" /></div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold font-sans text-foreground flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" />
            Session Calendar
          </h1>
          <p className="text-muted-foreground mt-1">Schedule and manage professional development sessions</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}><Plus className="h-4 w-4 mr-2" />Add Session</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Sessions", value: sessions.length },
          { label: "Scheduled", value: sessions.filter((s) => s.status === "scheduled").length },
          { label: "Completed", value: sessions.filter((s) => s.status === "completed").length },
          { label: "Platform", value: sessions.filter((s) => s.session_type === "platform").length },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6 text-center">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list" className="flex items-center gap-1"><List className="h-3.5 w-3.5" />List View</TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-1"><CalendarIcon className="h-3.5 w-3.5" />Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <div className="space-y-3">
            {sessions.length === 0 && <p className="text-center text-muted-foreground py-12 text-sm">No sessions yet. Click "Add Session" to create one.</p>}
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedSession(session)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold">{session.title}</h3>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge className={`text-[10px] border-0 ${typeBadge[session.session_type]}`}>{session.session_type}</Badge>
                      <Badge className={`text-[10px] border-0 ${formatBadge[session.format]}`}>{session.format}</Badge>
                      <Badge className={`text-[10px] border-0 ${statusBadge[session.status]}`}>{session.status}</Badge>
                      {session.standard_id && <Badge variant="outline" className="text-[10px]">{session.standard_id}</Badge>}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">{format(new Date(session.scheduled_date), "MMM d, yyyy")}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(session.scheduled_date), "h:mm a")} • {session.duration_hours}h</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                month={calendarMonth}
                onMonthChange={setCalendarMonth}
                modifiers={{ hasSession: (date) => sessionDates.has(format(date, "yyyy-MM-dd")) }}
                modifiersStyles={{ hasSession: { fontWeight: "bold", textDecoration: "underline", color: "hsl(var(--primary))" } }}
              />
            </div>
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {selectedDate ? `Sessions on ${format(selectedDate, "MMMM d, yyyy")}` : "All upcoming sessions"}
              </h3>
              {filteredByDate.length === 0 && <p className="text-sm text-muted-foreground">No sessions {selectedDate ? "on this date" : ""}.</p>}
              {filteredByDate.map((s) => (
                <Card key={s.id} className="cursor-pointer hover:shadow-sm" onClick={() => setSelectedSession(s)}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{s.title}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge className={`text-[10px] border-0 ${formatBadge[s.format]}`}>{s.format}</Badge>
                        <Badge className={`text-[10px] border-0 ${statusBadge[s.status]}`}>{s.status}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(s.scheduled_date), "h:mm a")}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Session Detail Panel */}
      {selectedSession && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedSession(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-background border-l shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Session Details</h2>
              <button onClick={() => setSelectedSession(null)} className="p-1 rounded-md hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <h3 className="text-base font-semibold">{selectedSession.title}</h3>
              {selectedSession.description && <p className="text-sm text-muted-foreground">{selectedSession.description}</p>}
              <div className="flex flex-wrap gap-2">
                <Badge className={`border-0 ${typeBadge[selectedSession.session_type]}`}>{selectedSession.session_type}</Badge>
                <Badge className={`border-0 ${formatBadge[selectedSession.format]}`}>{selectedSession.format}</Badge>
                <Badge className={`border-0 ${statusBadge[selectedSession.status]}`}>{selectedSession.status}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2"><CalendarIcon className="h-4 w-4 text-muted-foreground" />{format(new Date(selectedSession.scheduled_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
                <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{selectedSession.duration_hours} hours</p>
                <p className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />Target: {selectedSession.target_group}</p>
                {selectedSession.standard_id && <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />Standard: {selectedSession.standard_id}</p>}
                {selectedSession.meeting_link && (
                  <a href={selectedSession.meeting_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                    <ExternalLink className="h-4 w-4" />Join meeting
                  </a>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Add Session Form */}
      {showAddForm && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowAddForm(false)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-background border-l shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">Add Session</h2>
              <button onClick={() => setShowAddForm(false)} className="p-1 rounded-md hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-2"><Label>Title *</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Session title" /></div>
              <div className="space-y-2"><Label>Description</Label><Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Brief description" /></div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform">Platform (CQ Impact)</SelectItem>
                    <SelectItem value="school">School-organized</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Format</Label>
                <Select value={newFormat} onValueChange={setNewFormat}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="async">Async</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Date & time *</Label><Input type="datetime-local" value={newDate} onChange={(e) => setNewDate(e.target.value)} /></div>
              <div className="space-y-2"><Label>Duration (hours)</Label><Input type="number" min="0.5" step="0.5" value={newDuration} onChange={(e) => setNewDuration(e.target.value)} /></div>
              <div className="space-y-2"><Label>WASC Standard (optional)</Label><Input value={newStandard} onChange={(e) => setNewStandard(e.target.value)} placeholder="e.g. C1" /></div>
              <div className="space-y-2"><Label>Meeting link (optional)</Label><Input value={newLink} onChange={(e) => setNewLink(e.target.value)} placeholder="https://zoom.us/..." /></div>
              <div className="space-y-2">
                <Label>Target group</Label>
                <Select value={newTargetGroup} onValueChange={setNewTargetGroup}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All staff</SelectItem>
                    <SelectItem value="department">By department</SelectItem>
                    <SelectItem value="custom">Custom list</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="border-t p-5">
              <Button className="w-full" onClick={handleAddSession} disabled={saving || !newTitle || !newDate}>
                {saving ? "Saving..." : "Create Session"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
