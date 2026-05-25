import { useAccreditationData } from "@/hooks/useAccreditationData";
import { Skeleton } from "@/components/ui/skeleton";
import AccreditationBenchmarkTab from "@/components/accreditation/AccreditationBenchmarkTab";

export default function AccreditationBenchmarking() {
  const { isLoading, summary } = useAccreditationData();

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <AccreditationBenchmarkTab domainAssessments={summary.domainAssessments} />
    </div>
  );
}
