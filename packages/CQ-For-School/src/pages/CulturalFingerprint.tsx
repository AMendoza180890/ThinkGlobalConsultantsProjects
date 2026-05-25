import { useNavigate, useParams } from "react-router-dom";
import { Fingerprint } from "lucide-react";
import { cn } from "@/lib/utils";
import CulturalPreferencesComparator from "./CulturalPreferencesComparator";
import CulturalPreferencesAtRisk from "./CulturalPreferencesAtRisk";
import CulturalPreferencesGroupProfiles from "./CulturalPreferencesGroupProfiles";
import CulturalPreferencesCostOfMisalignment from "./CulturalPreferencesCostOfMisalignment";

const TABS = [
  { id: "group-comparison",     label: "Group Comparison" },
  { id: "teacher-admin",        label: "Teacher Admin Alignment" },
  { id: "group-profiles",       label: "Group Profiles" },
  { id: "cost-of-misalignment", label: "Cost of Misalignment" },
] as const;

type TabId = typeof TABS[number]["id"];
const DEFAULT_TAB: TabId = "group-comparison";

export default function CulturalFingerprint() {
  const { tab } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const activeTab: TabId = TABS.find(t => t.id === tab)?.id ?? DEFAULT_TAB;

  function handleTabChange(id: TabId) {
    navigate(`/analytics/cultural-fingerprint/${id}`, { replace: true });
  }

  return (
    <div className="flex flex-col min-h-0">
      <div className="border-b bg-background px-6 pt-8 pb-0">
        <div className="flex items-center gap-3 mb-4">
          <Fingerprint className="h-7 w-7 text-primary shrink-0" />
          <div>
            <h1 className="font-sans text-3xl font-semibold leading-tight">Cultural Preferences</h1>
            <p className="text-muted-foreground text-sm">How different staff groups think, communicate, and work — and where preferences diverge.</p>
          </div>
        </div>

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

      <div className="flex-1">
        {activeTab === "group-comparison"     && <CulturalPreferencesComparator />}
        {activeTab === "teacher-admin"        && <CulturalPreferencesAtRisk />}
        {activeTab === "cost-of-misalignment" && <CulturalPreferencesCostOfMisalignment />}
        {activeTab === "group-profiles"       && <CulturalPreferencesGroupProfiles />}
      </div>
    </div>
  );
}
