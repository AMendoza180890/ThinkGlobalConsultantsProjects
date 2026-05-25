import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import type { ConfidenceEntry } from "@/lib/data";

interface PrePostData {
  preAvgSeverity?: number;
  postAvgSeverity?: number;
  preDate?: string;
  postDate?: string;
  insufficient?: boolean;
}

interface Props {
  data: PrePostData;
  confidenceEntries: ConfidenceEntry[];
}

function ScoreComparison({
  label,
  preScore,
  postScore,
  preLabel,
  postLabel,
  invert,
}: {
  label: string;
  preScore: number;
  postScore: number;
  preLabel: string;
  postLabel: string;
  invert?: boolean;
}) {
  // For severity: lower is better (invert=true). For confidence: higher is better.
  const delta = Math.round((postScore - preScore) * 10) / 10;
  const improved = invert ? delta < 0 : delta > 0;
  const deltaAbs = Math.abs(delta);

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</h4>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-muted-foreground">{preScore}</p>
          <p className="text-[10px] text-muted-foreground">{preLabel}</p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
        <div className="text-center">
          <p className={`text-2xl font-bold ${improved ? "text-emerald-600" : "text-destructive"}`}>
            {postScore}
          </p>
          <p className="text-[10px] text-muted-foreground">{postLabel}</p>
        </div>
        <Badge
          variant="outline"
          className={`ml-2 ${improved ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-red-300 text-red-700 bg-red-50"}`}
        >
          {improved ? "↓" : "↑"} {deltaAbs} pts {improved ? "improved" : "worsened"}
        </Badge>
      </div>
    </div>
  );
}

export default function PrePostMetricsContent({ data, confidenceEntries }: Props) {
  if (data.insufficient) {
    return <p className="text-sm text-muted-foreground">Need at least 2 weeks of data for pre/post comparison.</p>;
  }

  const preSeverity = data.preAvgSeverity ?? 0;
  const postSeverity = data.postAvgSeverity ?? 0;

  // Confidence pre/post: first 3 entries vs last 3 entries
  const confPre = confidenceEntries.slice(0, Math.min(3, Math.floor(confidenceEntries.length / 2)));
  const confPost = confidenceEntries.slice(-Math.min(3, Math.ceil(confidenceEntries.length / 2)));

  const avgConf = (entries: ConfidenceEntry[]) => {
    if (entries.length === 0) return 0;
    const sum = entries.reduce((s, e) => s + (e.colleagues + e.parents + e.administrators) / 3, 0);
    return Math.round((sum / entries.length) * 10) / 10;
  };

  const preConf = avgConf(confPre);
  const postConf = avgConf(confPost);

  return (
    <div className="space-y-6">
      <ScoreComparison
        label="Friction Severity"
        preScore={preSeverity}
        postScore={postSeverity}
        preLabel="Start of term"
        postLabel="End of term"
        invert
      />
      {confidenceEntries.length >= 2 && (
        <ScoreComparison
          label="Confidence Score"
          preScore={preConf}
          postScore={postConf}
          preLabel="Start of term"
          postLabel="End of term"
        />
      )}
    </div>
  );
}
