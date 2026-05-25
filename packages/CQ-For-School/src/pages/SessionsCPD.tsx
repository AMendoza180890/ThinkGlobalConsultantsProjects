import { useNavigate, useParams } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import SessionCalendar from "./SessionCalendar";
import AttendanceTracking from "./AttendanceTracking";
import CPDCertificates from "./CPDCertificates";

const TABS = [
  { id: "calendar",     label: "Calendar" },
  { id: "attendance",   label: "Attendance" },
  { id: "certificates", label: "CPD Certificates" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function SessionsCPD() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const activeTab: TabId = TABS.find(t => t.id === tab)?.id ?? "calendar";

  function handleTabChange(id: TabId) {
    navigate(`/learning/sessions/${id}`, { replace: true });
  }

  return (
    <div className="flex flex-col min-h-0">
      {/* Page header */}
      <div className="border-b bg-background">
        <div className="container max-w-6xl px-4 pt-8 pb-0">
          <div className="flex items-center gap-3 mb-4">
            <CalendarCheck className="h-7 w-7 text-primary shrink-0" />
            <h1 className="font-sans text-3xl font-semibold">Sessions & CPD</h1>
          </div>

          {/* Tab bar */}
          <div className="flex gap-0 -mb-px">
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
        {activeTab === "calendar"     && <SessionCalendar />}
        {activeTab === "attendance"   && <AttendanceTracking />}
        {activeTab === "certificates" && <CPDCertificates />}
      </div>
    </div>
  );
}
