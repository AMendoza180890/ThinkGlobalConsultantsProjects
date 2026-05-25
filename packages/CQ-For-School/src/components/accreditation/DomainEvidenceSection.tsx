import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle2, AlertTriangle, XCircle, Download } from "lucide-react";
import { useState } from "react";
import EvidenceStatusBadge, { type EvidenceStatus } from "./EvidenceStatusBadge";
import DocumentUploadCard from "./DocumentUploadCard";
import ParticipationLogContent from "./artifacts/ParticipationLogContent";
import FrictionSummaryContent from "./artifacts/FrictionSummaryContent";
import PrePostMetricsContent from "./artifacts/PrePostMetricsContent";
import TrendAnalysisContent from "./artifacts/TrendAnalysisContent";
import CQBehavioralLogContent from "./artifacts/CQBehavioralLogContent";
import type { WASCDomain, EvidenceArtifact, RiskLevel } from "@/lib/accreditation";
import type { DOCUMENT_ONLY_DOMAIN_IDS } from "@/lib/accreditation";
import type { AccreditationDocument } from "@/hooks/useAccreditationDocuments";
import type { ConfidenceEntry, TopWinItem } from "@/lib/data";

interface Props {
  domain: WASCDomain;
  evidence: EvidenceArtifact[];
  domainStatus: EvidenceStatus;
  assessment?: { riskLevel: RiskLevel; issueCount: number };
  isDocOnly: boolean;
  domainDocs: AccreditationDocument[];
  participationRate: number;
  reportingWeeks: number;
  confidenceEntries: ConfidenceEntry[];
  cumulativeWins: TopWinItem[];
  bestWinsWeek: { week: string; winsCount: number; wins: string[] } | null;
  onUpload: (params: { domainId: string; file: File }) => void;
  onDelete: (doc: AccreditationDocument) => void;
  isUploading: boolean;
  isDeleting: boolean;
  onExport: (domainId: string) => void;
}

function getArtifactStatus(artifact: EvidenceArtifact): "ready" | "partial" | "missing" {
  if (!artifact.generated) return "missing";
  const data = artifact.data as Record<string, unknown> | undefined;
  if (data?.insufficient) return "partial";
  return "ready";
}

function getDataPointCount(artifact: EvidenceArtifact): string {
  const data = artifact.data as Record<string, unknown> | undefined;
  if (!data) return "No data";
  switch (artifact.type) {
    case "participation_log":
      return `${(data.uniqueWeeks as number) ?? 0} weeks of data`;
    case "friction_summary": {
      const issues = (data.issues as unknown[]) ?? [];
      return `${issues.length} friction types tracked`;
    }
    case "pre_post_metrics":
      return data.insufficient ? "Insufficient data" : "Pre/post comparison ready";
    case "trend_analysis": {
      const weeks = (data.weeks as unknown[]) ?? [];
      return `${weeks.length} weeks tracked`;
    }
    default:
      return "Data available";
  }
}

const statusConfig = {
  ready: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800", label: "Ready" },
  partial: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800", label: "Partial" },
  missing: { icon: XCircle, color: "text-destructive", bg: "bg-muted/50 border-dashed", label: "Missing" },
};

export default function DomainEvidenceSection({
  domain, evidence, domainStatus, assessment, isDocOnly, domainDocs,
  participationRate, reportingWeeks, confidenceEntries, cumulativeWins,
  bestWinsWeek, onUpload, onDelete, isUploading, isDeleting, onExport,
}: Props) {
  const readyCount = evidence.filter((e) => e.generated).length;
  const hasCQData = cumulativeWins.length > 0 && !isDocOnly;
  const totalArtifacts = evidence.length + (hasCQData ? 1 : 0);
  const totalReady = readyCount + (hasCQData ? 1 : 0);

  return (
    <Card className={domainStatus === "red" ? "border-destructive/40" : domainStatus === "amber" ? "border-amber-300" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="font-mono">{domain.code}</Badge>
            <h3 className="text-base font-semibold">{domain.name}</h3>
            <EvidenceStatusBadge status={domainStatus} />
          </div>
          {!isDocOnly && (
            <Button variant="outline" size="sm" onClick={() => onExport(domain.id)} disabled={readyCount === 0}>
              <Download className="h-3 w-3 mr-1" /> Export
            </Button>
          )}
        </div>
        {!isDocOnly && (
          <p className="text-xs text-muted-foreground mt-1">
            {totalReady}/{totalArtifacts} artifacts ready · Evidence for {domain.name} is drawn from{" "}
            {reportingWeeks} weeks of survey data ({participationRate}% avg participation) and covers{" "}
            {totalArtifacts} artifact types aligned to ACS WASC {domain.code}.
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {isDocOnly ? (
          <DocumentUploadCard
            domainId={domain.id}
            documents={domainDocs}
            onUpload={onUpload}
            onDelete={onDelete}
            isUploading={isUploading}
            isDeleting={isDeleting}
          />
        ) : (
          <>
            {evidence.map((artifact) => {
              const status = getArtifactStatus(artifact);
              const config = statusConfig[status];
              const Icon = config.icon;
              const pointCount = getDataPointCount(artifact);

              return (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  status={status}
                  config={config}
                  Icon={Icon}
                  pointCount={pointCount}
                  domainId={domain.id}
                  participationRate={participationRate}
                  confidenceEntries={confidenceEntries}
                />
              );
            })}

            {/* CQ Behavioral Evidence Log */}
            {hasCQData && (
              <CollapsibleArtifact
                title="CQ Behavioral Evidence Log"
                status="ready"
                pointCount={`${cumulativeWins.length} behaviors tracked`}
              >
                <CQBehavioralLogContent cumulativeWins={cumulativeWins} bestWinsWeek={bestWinsWeek} />
              </CollapsibleArtifact>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ArtifactCard({
  artifact, status, config, Icon, pointCount, domainId, participationRate, confidenceEntries,
}: {
  artifact: EvidenceArtifact;
  status: "ready" | "partial" | "missing";
  config: typeof statusConfig["ready"];
  Icon: typeof CheckCircle2;
  pointCount: string;
  domainId: string;
  participationRate: number;
  confidenceEntries: ConfidenceEntry[];
}) {
  return (
    <CollapsibleArtifact title={artifact.title} status={status} pointCount={pointCount}>
      {artifact.data ? (
        <ArtifactContent
          type={artifact.type}
          data={artifact.data}
          domainId={domainId}
          participationRate={participationRate}
          confidenceEntries={confidenceEntries}
        />
      ) : (
        <p className="text-sm text-muted-foreground">
          No data collected yet. Continue running weekly surveys to generate this artifact.
        </p>
      )}
    </CollapsibleArtifact>
  );
}

function CollapsibleArtifact({
  title, status, pointCount, children,
}: {
  title: string;
  status: "ready" | "partial" | "missing";
  pointCount: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={`rounded-lg border ${config.bg}`}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between p-3 text-left hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${config.color} shrink-0`} />
              <span className="text-sm font-medium">{title}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{config.label}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{pointCount}</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
            </div>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 border-t">
            {children}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function ArtifactContent({
  type, data, domainId, participationRate, confidenceEntries,
}: {
  type: EvidenceArtifact["type"];
  data: Record<string, unknown>;
  domainId: string;
  participationRate: number;
  confidenceEntries: ConfidenceEntry[];
}) {
  switch (type) {
    case "participation_log":
      return <ParticipationLogContent data={data} participationRate={participationRate} />;
    case "friction_summary":
      return <FrictionSummaryContent data={data} domainId={domainId} />;
    case "pre_post_metrics":
      return <PrePostMetricsContent data={data} confidenceEntries={confidenceEntries} />;
    case "trend_analysis":
      return <TrendAnalysisContent data={data} />;
    default:
      return <p className="text-sm text-muted-foreground">Unknown artifact type.</p>;
  }
}
