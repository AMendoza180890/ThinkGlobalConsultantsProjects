import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface ScheduleSessionPanelProps {
  interventionTitle: string;
  interventionFormat: string;
  interventionDurationHours: number;
  interventionDbId: string;
  standardId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function ScheduleSessionPanel({
  interventionTitle,
  interventionFormat,
  interventionDurationHours,
  interventionDbId,
  standardId,
  onClose,
  onSaved,
}: ScheduleSessionPanelProps) {
  const { selectedSchoolId } = useSchoolContext();
  const { user } = useAuth();
  const { toast } = useToast();

  const [title, setTitle] = useState(interventionTitle);
  const [format, setFormat] = useState(interventionFormat);
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState(String(interventionDurationHours));
  const [meetingLink, setMeetingLink] = useState("");
  const [targetGroup, setTargetGroup] = useState("all");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedSchoolId || !user || !date) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("pd_sessions").insert({
      school_id: selectedSchoolId,
      intervention_id: interventionDbId,
      title,
      format,
      scheduled_date: new Date(date).toISOString(),
      duration_hours: parseFloat(duration) || 1,
      meeting_link: meetingLink || null,
      target_group: targetGroup,
      standard_id: standardId,
      created_by: user.id,
    } as any);

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to schedule session.", variant: "destructive" });
    } else {
      toast({ title: "Session scheduled", description: `"${title}" scheduled for ${date}.` });
      onSaved();
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-background border-l shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Schedule Session</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-2">
            <Label>Session title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="async">Async</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Duration (hours)</Label>
            <Input type="number" min="0.5" step="0.5" value={duration} onChange={(e) => setDuration(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Meeting link (optional)</Label>
            <Input placeholder="https://zoom.us/..." value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Target group</Label>
            <Select value={targetGroup} onValueChange={setTargetGroup}>
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
          <Button className="w-full" onClick={handleSave} disabled={saving || !date}>
            {saving ? "Saving..." : "Save session"}
          </Button>
        </div>
      </div>
    </>
  );
}
