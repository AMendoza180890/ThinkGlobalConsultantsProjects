import { useAccreditationData } from "@/hooks/useAccreditationData";
import { useAccreditationDocuments } from "@/hooks/useAccreditationDocuments";
import { useSchoolData } from "@/hooks/useSchoolData";
import { WASC_DOMAINS, DOCUMENT_ONLY_DOMAIN_IDS, type RiskLevel } from "@/lib/accreditation";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { EvidenceStatus } from "@/components/accreditation/EvidenceStatusBadge";
import DomainEvidenceSection from "@/components/accreditation/DomainEvidenceSection";

function getEvidenceStatus(
  domainId: string,
  readyCount: number,
  totalCount: number,
  reportingWeeks: number,
  participationRate: number,
  hasUploadedDocs: boolean
): EvidenceStatus {
  const isDocOnly = DOCUMENT_ONLY_DOMAIN_IDS.includes(domainId);
  if (isDocOnly) return hasUploadedDocs ? "green" : "red";
  if (readyCount === 0) return "red";
  if (participationRate >= 60 && reportingWeeks >= 8 && readyCount === totalCount) return "green";
  return "amber";
}

export default function AccreditationEvidence() {
  const { isLoading, summary, allEvidence } = useAccreditationData();
  const schoolData = useSchoolData();
  const {
    uploadDocument, deleteDocument, isUploading, isDeleting, getDocumentsForDomain,
  } = useAccreditationDocuments();
  const { toast } = useToast();

  const handleExportEvidence = (domainId: string) => {
    const evidence = allEvidence[domainId];
    if (!evidence) return;
    const domain = WASC_DOMAINS.find((d) => d.id === domainId);
    const data = JSON.stringify(evidence, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evidence-domain-${domain?.code ?? domainId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Evidence exported", description: `Domain ${domain?.code} evidence downloaded.` });
  };

  const handleExportAll = () => {
    const data = JSON.stringify(allEvidence, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wasc-evidence-all.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "All evidence exported", description: "Complete evidence package downloaded." });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Evidence Artifacts</h1>
          <p className="text-muted-foreground mt-1">
            Submission-ready evidence compiled from your survey data per WASC domain
          </p>
        </div>
        <Button onClick={handleExportAll}>
          <Download className="h-4 w-4 mr-2" /> Export All Evidence
        </Button>
      </div>

      <div className="space-y-4">
        {WASC_DOMAINS.map((domain) => {
          const evidence = allEvidence[domain.id] ?? [];
          const assessment = summary.domainAssessments.find((a) => a.domain.id === domain.id);
          const readyCount = evidence.filter((e) => e.generated).length;
          const totalCount = evidence.length;
          const domainDocs = getDocumentsForDomain(domain.id);
          const isDocOnly = DOCUMENT_ONLY_DOMAIN_IDS.includes(domain.id);

          const status = getEvidenceStatus(
            domain.id, readyCount, totalCount,
            summary.reportingWeeks, summary.participationRate,
            domainDocs.length > 0
          );

          return (
            <DomainEvidenceSection
              key={domain.id}
              domain={domain}
              evidence={evidence}
              domainStatus={status}
              assessment={assessment ? { riskLevel: assessment.riskLevel, issueCount: assessment.issueCount } : undefined}
              isDocOnly={isDocOnly}
              domainDocs={domainDocs}
              participationRate={summary.participationRate}
              reportingWeeks={summary.reportingWeeks}
              confidenceEntries={schoolData.rawConfidenceEntries}
              cumulativeWins={schoolData.cumulativeWins}
              bestWinsWeek={schoolData.bestWinsWeek}
              onUpload={uploadDocument}
              onDelete={deleteDocument}
              isUploading={isUploading}
              isDeleting={isDeleting}
              onExport={handleExportEvidence}
            />
          );
        })}
      </div>
    </div>
  );
}
