import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { X, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSchoolContext } from "@/hooks/useSchoolContext";
import { useToast } from "@/hooks/use-toast";
import { downloadCertificate } from "@/lib/certificates";
import { WASC_DOMAINS } from "@/lib/accreditation";

interface AttendancePanelProps {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  durationHours: number;
  standardId: string;
  schoolName: string;
  interventionDbId?: string;
  onClose: () => void;
  onCompleted: () => void;
}

// Default staff roster (can be expanded with real data later)
const DEFAULT_STAFF = [
  "Sarah Johnson", "Michael Chen", "Emily Rodriguez", "David Kim",
  "Lisa Thompson", "James Wilson", "Maria Garcia", "Robert Lee",
  "Jennifer Martinez", "William Davis",
];

export default function AttendancePanel({
  sessionId,
  sessionTitle,
  sessionDate,
  durationHours,
  standardId,
  schoolName,
  interventionDbId,
  onClose,
  onCompleted,
}: AttendancePanelProps) {
  const { selectedSchoolId } = useSchoolContext();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customName, setCustomName] = useState("");
  const [staffList, setStaffList] = useState(DEFAULT_STAFF);
  const [saving, setSaving] = useState(false);

  const toggleAll = () => {
    if (selected.size === staffList.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(staffList));
    }
  };

  const toggleOne = (name: string) => {
    const next = new Set(selected);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setSelected(next);
  };

  const addCustom = () => {
    if (customName.trim() && !staffList.includes(customName.trim())) {
      setStaffList([...staffList, customName.trim()]);
      setSelected(new Set([...selected, customName.trim()]));
      setCustomName("");
    }
  };

  const handleComplete = async () => {
    if (!selectedSchoolId || selected.size === 0) return;
    setSaving(true);

    const domain = WASC_DOMAINS.find((d) => d.code === standardId || d.id === standardId);

    // Insert attendance records
    const attendanceRecords = Array.from(selected).map((name) => ({
      session_id: sessionId,
      school_id: selectedSchoolId,
      attendee_name: name,
      attended: true,
      certificate_generated: true,
    }));

    const { error: attendanceError } = await supabase
      .from("pd_attendance")
      .insert(attendanceRecords as any) as any;

    if (attendanceError) {
      toast({ title: "Error", description: "Failed to save attendance.", variant: "destructive" });
      setSaving(false);
      return;
    }

    // Mark session as completed
    await supabase
      .from("pd_sessions")
      .update({ status: "completed" } as any)
      .eq("id", sessionId) as any;

    // Mark intervention as completed if linked
    if (interventionDbId) {
      await supabase
        .from("interventions")
        .update({ status: "completed", completed_at: new Date().toISOString() } as any)
        .eq("id", interventionDbId) as any;
    }

    // Generate certificates for each attendee
    Array.from(selected).forEach((name, i) => {
      setTimeout(() => {
        downloadCertificate({
          staffName: name,
          sessionTitle,
          date: new Date(sessionDate).toLocaleDateString(),
          durationHours,
          standardCode: domain?.code ?? standardId,
          standardName: domain?.name ?? standardId,
          schoolName,
        });
      }, i * 300);
    });

    setSaving(false);
    toast({
      title: "Session complete",
      description: `${selected.size} certificate${selected.size !== 1 ? "s" : ""} generated.`,
    });
    onCompleted();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full max-w-[400px] bg-background border-l shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Record Attendance</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 border-b">
          <p className="text-sm font-medium">{sessionTitle}</p>
          <p className="text-xs text-muted-foreground">{new Date(sessionDate).toLocaleDateString()} • {durationHours}h</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" onClick={toggleAll} className="text-xs">
              {selected.size === staffList.length ? "Clear all" : "Select all"}
            </Button>
            <span className="text-xs text-muted-foreground">{selected.size}/{staffList.length} selected</span>
          </div>

          <div className="space-y-2">
            {staffList.map((name) => (
              <label key={name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                <Checkbox
                  checked={selected.has(name)}
                  onCheckedChange={() => toggleOne(name)}
                />
                <span className="text-sm">{name}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Input
              placeholder="Add staff member..."
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
              className="text-sm"
            />
            <Button size="sm" variant="outline" onClick={addCustom} disabled={!customName.trim()}>
              Add
            </Button>
          </div>
        </div>

        <div className="border-t p-5">
          <Button
            className="w-full"
            onClick={handleComplete}
            disabled={saving || selected.size === 0}
          >
            {saving ? "Saving..." : `Mark session complete (${selected.size} attendees)`}
          </Button>
        </div>
      </div>
    </>
  );
}
