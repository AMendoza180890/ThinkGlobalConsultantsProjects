import { useState } from "react";
import { format } from "date-fns";
import { useAccreditationReports, type AccreditationReport } from "@/hooks/useAccreditationReports";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Download, FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ReportHistoryTab() {
  const { reports, isLoading } = useAccreditationReports();
  const { toast } = useToast();
  const [exportingId, setExportingId] = useState<string | null>(null);

  const handleExport = async (report: AccreditationReport, fmt: "pdf" | "docx") => {
    setExportingId(report.id + fmt);
    try {
      const exportUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-report`;
      const resp = await fetch(exportUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ markdown: report.narrative_text, format: fmt }),
      });

      if (!resp.ok) throw new Error("Export failed");

      if (fmt === "pdf") {
        const html = await resp.text();
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank");
        if (win) win.onload = () => setTimeout(() => win.print(), 500);
        toast({ title: "PDF ready", description: "Use Print → Save as PDF." });
      } else {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wasc-report-${format(new Date(report.generated_at), "yyyy-MM-dd")}.doc`;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Downloaded", description: "DOCX file saved." });
      }
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    } finally {
      setExportingId(null);
    }
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}</div>;
  }

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No reports generated yet. Generate your first report to see it here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Past Reports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {reports.map((r) => (
          <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {format(new Date(r.generated_at), "MMM d, yyyy · h:mm a")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.report_type.toUpperCase()} report
                </p>
              </div>
              <Badge variant="outline" className="text-xs">{r.report_type}</Badge>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExport(r, "pdf")}
                disabled={exportingId === r.id + "pdf"}
              >
                {exportingId === r.id + "pdf" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                <span className="ml-1 text-xs">PDF</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleExport(r, "docx")}
                disabled={exportingId === r.id + "docx"}
              >
                {exportingId === r.id + "docx" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                <span className="ml-1 text-xs">DOCX</span>
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
