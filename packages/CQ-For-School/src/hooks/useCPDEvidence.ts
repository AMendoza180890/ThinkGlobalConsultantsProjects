import { useMemo } from "react";
import {
  computeAllStandardStrengths,
  detectAllGaps,
  getCPDScore,
  getPriorityActions,
  type CPDStrength,
  type DetectedGap,
  type PriorityAction,
} from "@/lib/cpdEvidenceStrength";

export function useCPDEvidence() {
  const strengthMap = useMemo(() => computeAllStandardStrengths(), []);
  const gaps = useMemo(() => detectAllGaps(), []);
  const priorityActions = useMemo(() => getPriorityActions(), []);

  return {
    strengthMap,
    gaps,
    priorityActions,
    getCPDScore,
    isLoading: false,
  };
}
