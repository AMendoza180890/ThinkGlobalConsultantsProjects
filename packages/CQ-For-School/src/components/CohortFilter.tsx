import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Shield, Crown } from "lucide-react";

export type CohortGroup = "region" | "size" | "type" | "demographics";

export interface CohortFilterProps {
  onGroupChange: (group: CohortGroup) => void;
  onCohortChange: (cohort: string) => void;
  selectedGroup: CohortGroup;
  selectedCohort: string;
}

export const COHORT_OPTIONS: Record<CohortGroup, { label: string; options: string[] }> = {
  region: {
    label: "By Region",
    options: ["Middle East", "Southeast Asia", "South Asia", "East Asia", "Europe", "North America", "Global"],
  },
  size: {
    label: "By School Size",
    options: ["Small (<300 students)", "Medium (300–800)", "Large (800+)"],
  },
  type: {
    label: "By School Type",
    options: ["International", "Public", "Private", "Charter"],
  },
  demographics: {
    label: "By Demographics",
    options: ["Similar Diversity Index", "Similar ELL %", "Similar Staff Turnover"],
  },
};

export function CohortFilter({ onGroupChange, onCohortChange, selectedGroup, selectedCohort }: CohortFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-secondary/50 border mb-6">
      <Badge className="bg-accent/15 text-accent border-accent/30 shrink-0">
        <Crown className="h-3 w-3 mr-1" /> Premium Comparison
      </Badge>

      <Select value={selectedGroup} onValueChange={(v) => onGroupChange(v as CohortGroup)}>
        <SelectTrigger className="w-[180px] bg-card">
          <SelectValue placeholder="Group by..." />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(COHORT_OPTIONS).map(([key, val]) => (
            <SelectItem key={key} value={key}>{val.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedCohort} onValueChange={onCohortChange}>
        <SelectTrigger className="w-[220px] bg-card">
          <SelectValue placeholder="Select cohort..." />
        </SelectTrigger>
        <SelectContent>
          {COHORT_OPTIONS[selectedGroup].options.map((opt) => (
            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
        <Shield className="h-3.5 w-3.5" />
        <span>Data anonymized by cohort · No individual schools identified</span>
      </div>
    </div>
  );
}

export function useCohortFilter() {
  const [selectedGroup, setSelectedGroup] = useState<CohortGroup>("region");
  const [selectedCohort, setSelectedCohort] = useState("Middle East");

  const handleGroupChange = (group: CohortGroup) => {
    setSelectedGroup(group);
    setSelectedCohort(COHORT_OPTIONS[group].options[0]);
  };

  return {
    selectedGroup,
    selectedCohort,
    setSelectedCohort,
    handleGroupChange,
    filterProps: {
      selectedGroup,
      selectedCohort,
      onGroupChange: handleGroupChange,
      onCohortChange: setSelectedCohort,
    },
  };
}
