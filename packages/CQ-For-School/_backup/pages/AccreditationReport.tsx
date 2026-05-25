import { useState } from "react";
import { useAccreditationData } from "@/hooks/useAccreditationData";
import { useSchoolData } from "@/hooks/useSchoolData";
import { useAccreditationReports } from "@/hooks/useAccreditationReports";
import { useAuth } from "@/hooks/useAuth";
import { WASC_DOMAINS, type RiskLevel } from "@/lib/accreditation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, Loader2, Sparkles, Edit3, History } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ReportHistoryTab from "@/components/accreditation/ReportHistoryTab";

const riskColors: Record<RiskLevel, string> = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

const REPORT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-accreditation-report`;

async function streamReport({
  summary,
  allEvidence,
  adminNotes,
  cumulativeWins,
  onDelta,
  onDone,
  onError,
}: {
  summary: any;
  allEvidence: any;
  adminNotes: string;
  cumulativeWins: any[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(REPORT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ summary, allEvidence, adminNotes, cumulativeWins }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: "Unknown error" }));
    onError(body.error || `Request failed (${resp.status})`);
    return;
  }

  if (!resp.body) {
    onError("No response body");
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);

      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Flush remaining
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}

export default function AccreditationReport() {
  const { isLoading, summary, allEvidence } = useAccreditationData();
  const schoolData = useSchoolData();
  const { saveReport } = useAccreditationReports();
  const { user } = useAuth();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [activeTab, setActiveTab] = useState("generate");

  const handleGenerate = async () => {
    setGenerating(true);
    setReport("");
    setActiveTab("preview");

    let accumulated = "";

    try {
      await streamReport({
        summary,
        allEvidence,
        adminNotes,
        cumulativeWins: schoolData.cumulativeWins,
        onDelta: (chunk) => {
          accumulated += chunk;
          setReport(accumulated);
        },
        onDone: () => {
          setGenerating(false);
          // Save report snapshot
          if (accumulated && user) {
            const domainScores: Record<string, number> = {};
            summary.domainAssessments.forEach(a => {
              domainScores[a.domain.id] = 100 - a.riskScore;
            });
            saveReport.mutate({
              reportType: "wasc",
              domainScores,
              narrativeText: accumulated,
              adminNotes,
              generatedBy: user.id,
            });
          }
          toast({ title: "Report generated", description: "AI-powered report ready for review." });
        },
        onError: (msg) => {
          setGenerating(false);
          setReport(null);
          setActiveTab("generate");
          toast({ title: "Report generation failed", description: msg, variant: "destructive" });
        },
      });
    } catch (e) {
      setGenerating(false);
      setReport(null);
      setActiveTab("generate");
      toast({
        title: "Report generation failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: "pdf" | "docx") => {
    if (!report) return;
    setExporting(true);

    try {
      const exportUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-report`;
      const resp = await fetch(exportUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ markdown: report, format }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Export failed" }));
        throw new Error(err.error || "Export failed");
      }

      if (format === "pdf") {
        // Open print-ready HTML in new tab for PDF printing
        const html = await resp.text();
        const blob = new Blob([html], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank");
        if (win) {
          win.onload = () => {
            setTimeout(() => win.print(), 500);
          };
        }
        toast({ title: "PDF ready", description: "Use Print → Save as PDF in the opened window." });
      } else {
        // DOCX download
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "wasc-report.doc";
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Report exported as DOCX", description: "Check your downloads." });
      }
    } catch (e) {
      toast({
        title: "Export failed",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
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
          <h1 className="text-2xl font-bold font-display text-foreground">Report Generator</h1>
          <p className="text-muted-foreground mt-1">
            Generate AI-powered WASC-aligned accreditation reports from your survey data
          </p>
        </div>
        <div className="flex gap-2">
          {report && !generating && (
            <>
              <Button variant="outline" onClick={() => handleExport("pdf")} disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Export PDF
              </Button>
              <Button variant="outline" onClick={() => handleExport("docx")} disabled={exporting}>
                {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />} Export DOCX
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          {(report !== null) && <TabsTrigger value="preview">Preview Report</TabsTrigger>}
          <TabsTrigger value="history"><History className="h-3 w-3 mr-1" /> Past Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" /> Report will include
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.domainAssessments.map((a) => (
                  <div key={a.domain.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{a.domain.code}</span>
                      <span className="text-sm font-medium truncate">{a.domain.name}</span>
                    </div>
                    <Badge className={`${riskColors[a.riskLevel]} text-xs`}>{a.riskLevel}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Edit3 className="h-4 w-4" /> Administrative Notes (Optional)
              </CardTitle>
              <CardDescription>Add context or observations to include in the report</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="e.g., School has implemented new teacher mentoring program since January..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          <Button onClick={handleGenerate} disabled={generating} size="lg" className="w-full md:w-auto">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Report...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" /> Generate WASC Report
              </>
            )}
          </Button>
        </TabsContent>

        {(report !== null) && (
          <TabsContent value="preview" className="mt-4">
            <Card>
              <CardContent className="pt-6">
                {generating && (
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Generating report from your school's data...</span>
                  </div>
                )}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {(report || "").split("\n").map((line, i) => {
                    if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
                    if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-semibold mt-4 mb-2">{line.slice(3)}</h2>;
                    if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
                    if (line.startsWith("---")) return <hr key={i} className="my-4" />;
                    if (line.startsWith("- ")) return <p key={i} className="text-sm ml-4">• {line.slice(2)}</p>;
                    if (line.startsWith("  - ")) return <p key={i} className="text-sm ml-8">◦ {line.slice(4)}</p>;
                    if (line.trim() === "") return <div key={i} className="h-2" />;
                    const parts = line.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <p key={i} className="text-sm">
                        {parts.map((part, j) =>
                          part.startsWith("**") && part.endsWith("**")
                            ? <strong key={j}>{part.slice(2, -2)}</strong>
                            : part
                        )}
                      </p>
                    );
                  })}
                  {generating && <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5" />}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="history" className="mt-4">
          <ReportHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
