import jsPDF from "jspdf";
import { FileText, Download, Calendar, TrendingUp, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const EXAMPLE_REPORT = {
  title: "2026 Q1 CQ for Schools Report",
  school: "Al Rawabi School for Girls",
  period: "January – March 2026",
  generatedOn: "April 1, 2026",
  highlights: [
    { icon: TrendingUp, label: "CQ Health Score", value: "72", change: "+8 pts", positive: true },
    { icon: Users,      label: "Survey Completion", value: "84%", change: "+12%", positive: true },
    { icon: AlertTriangle, label: "Active Friction Themes", value: "3", change: "-2", positive: true },
  ],
  sections: [
    {
      title: "Executive Summary",
      body: "This quarter showed meaningful improvement in overall cultural intelligence health. Staff confidence in cross-cultural interactions rose significantly, driven by participation in two CQ webinars and a targeted coaching session for department heads. Friction reports decreased by 31% compared to Q4 2025.",
    },
    {
      title: "Key Issues This Quarter",
      body: "The top recurring friction themes were: unclear role responsibilities (6 reports), conflicting priorities between teams (4 reports), and misunderstandings in meetings (4 reports). These three themes account for 68% of all friction reported.",
    },
    {
      title: "Interventions Delivered",
      body: "Two staff webinars were delivered: CQ Foundations (62 attendees) and Cross-Cultural Communication Strategies (48 attendees). One coaching session was held with the senior leadership team focused on aligning decision-making processes.",
    },
    {
      title: "Recommendations for Q2",
      body: "Focus next quarter on reducing role ambiguity through a structured onboarding refresh for mid-year hires. Consider a targeted workshop for team leads on facilitation across cultural differences. Continue weekly pulse surveys to maintain visibility.",
    },
  ],
};

const EXTENDED_SECTIONS = [
  {
    title: "Executive Summary",
    body: "This quarter showed meaningful improvement in overall cultural intelligence health. Staff confidence in cross-cultural interactions rose significantly, driven by participation in two CQ webinars and a targeted coaching session for department heads. Friction reports decreased by 31% compared to Q4 2025. The school's CQ Health Score reached 72 — the highest recorded since the programme launched — reflecting sustained commitment from leadership and growing staff engagement with the platform.",
  },
  {
    title: "Key Issues This Quarter",
    body: "The top recurring friction themes were: unclear role responsibilities (6 reports), conflicting priorities between teams (4 reports), and misunderstandings in meetings (4 reports). These three themes account for 68% of all friction reported. A secondary cluster emerged around new staff onboarding, with 3 reports citing confusion about cultural norms and expectations during the mid-year intake. While low in volume, this pattern warrants early attention before it compounds.",
  },
  {
    title: "Survey Completion & Participation",
    body: "Survey completion reached 84% this quarter, up from 72% in Q4 2025. The increase is attributed to a school-wide reminder campaign coordinated by HR and the introduction of a 5-minute pulse format that reduced completion time. Completion was highest among teaching staff (91%) and lowest among operations and facilities (61%). Targeted outreach to non-teaching staff is recommended for Q2 to close this gap and ensure full representation in CQ data.",
  },
  {
    title: "CQ Health Score Breakdown",
    body: "The overall CQ Health Score of 72 is composed of four sub-dimensions: CQ Drive (79), CQ Knowledge (68), CQ Strategy (71), and CQ Action (70). CQ Drive — the motivational component — remains the strongest area, reflecting high willingness among staff to engage cross-culturally. CQ Knowledge saw the smallest gain this quarter (+3 pts) and represents the most significant opportunity for structured learning in Q2. Staff in leadership roles scored an average of 76 across all dimensions, 6 points above the school average.",
  },
  {
    title: "Interventions Delivered",
    body: "Two staff webinars were delivered this quarter: CQ Foundations (62 attendees, 87% satisfaction rating) and Cross-Cultural Communication Strategies (48 attendees, 91% satisfaction rating). One coaching session was held with the senior leadership team focused on aligning decision-making processes across culturally diverse teams. Post-session feedback indicated that 78% of participants planned to apply at least one new practice within two weeks. A self-directed micro-learning module on managing cultural assumptions was also made available via the platform and completed by 34 staff members.",
  },
  {
    title: "Friction Report Analysis",
    body: "A total of 21 friction reports were submitted this quarter, down from 30 in Q4 2025. Reports were distributed across departments as follows: Academic (9), Administration (5), Operations (4), Leadership (2), Support Services (1). The average time to acknowledgement was 3.2 days. Five reports were escalated to a formal resolution process; all five were resolved within the quarter. No reports were withdrawn or left unresolved at quarter close. Anonymous submission accounted for 62% of total reports, consistent with prior quarters.",
  },
  {
    title: "Recommendations for Q2",
    body: "1. Reduce role ambiguity through a structured onboarding refresh for mid-year hires, with a specific CQ orientation component. 2. Commission a targeted workshop for team leads on facilitation across cultural differences, with a focus on meeting dynamics and decision-making. 3. Prioritise CQ Knowledge development through two additional learning modules: one on cultural values frameworks and one on navigating hierarchy and authority across cultures. 4. Continue weekly pulse surveys to maintain visibility and improve operations staff participation. 5. Review and refresh friction reporting guidelines with all department heads to ensure consistent use and timely follow-up.",
  },
  {
    title: "Looking Ahead: Q2 Targets",
    body: "Based on current trajectory, the following Q2 targets have been set in consultation with school leadership: CQ Health Score ≥ 76 (+4 pts); Survey completion ≥ 88%; Friction reports ≤ 18 (further 14% reduction); CQ Knowledge sub-score ≥ 72 (+4 pts); Operations staff survey completion ≥ 75%. Progress against these targets will be reviewed at the mid-quarter check-in and reported in full at the end of Q2.",
  },
];

function addPageHeader(doc: jsPDF, width: number, margin: number, pageNum: number) {
  doc.setFillColor(34, 112, 147);
  doc.rect(0, 0, width, 14, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("CQ for Schools  ·  Quarterly Report", margin, 9);
  doc.text(`Page ${pageNum}`, width - margin, 9, { align: "right" });
}

function downloadReport() {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = width - margin * 2;
  let y = 0;
  let pageNum = 1;

  function checkPageBreak(neededHeight: number) {
    if (y + neededHeight > height - 15) {
      doc.addPage();
      pageNum++;
      addPageHeader(doc, width, margin, pageNum);
      y = 24;
    }
  }

  // Page 1 header
  addPageHeader(doc, width, margin, pageNum);
  y = 24;

  // Title block
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 30, 30);
  doc.text(EXAMPLE_REPORT.title, margin, y);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`${EXAMPLE_REPORT.school}  ·  ${EXAMPLE_REPORT.period}  ·  Generated ${EXAMPLE_REPORT.generatedOn}`, margin, y);
  y += 8;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(margin, y, width - margin, y);
  y += 8;

  // Highlights
  const colW = contentWidth / 3;
  EXAMPLE_REPORT.highlights.forEach((h, i) => {
    const x = margin + i * colW;
    doc.setFillColor(245, 248, 250);
    doc.roundedRect(x, y, colW - 3, 22, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(h.label, x + 4, y + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(30, 30, 30);
    doc.text(h.value, x + 4, y + 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(16, 163, 74);
    doc.text(h.change + " vs last quarter", x + 4, y + 20);
  });
  y += 32;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.4);
  doc.line(margin, y, width - margin, y);
  y += 10;

  // Extended sections
  EXTENDED_SECTIONS.forEach((s) => {
    const titleH = 8;
    const bodyLines = doc.splitTextToSize(s.body, contentWidth) as string[];
    const bodyH = bodyLines.length * 5.5;
    checkPageBreak(titleH + bodyH + 6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(34, 112, 147);
    doc.text(s.title, margin, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(bodyLines, margin, y);
    y += bodyH + 10;
  });

  // Footer on last page
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text("Confidential — prepared by CQ for Schools. Not for distribution.", margin, height - 8);

  doc.save(`${EXAMPLE_REPORT.title.replace(/\s+/g, "-")}.pdf`);
}

export default function QuarterlyReports() {
  return (
    <div className="flex flex-col min-h-0">
      <div className="border-b bg-background">
        <div className="px-6 pt-8 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileText className="h-7 w-7 text-primary shrink-0" />
              <div>
                <h1 className="font-sans text-3xl font-semibold leading-tight">Quarterly Reports</h1>
                <p className="text-sm text-muted-foreground mt-1">CQ health summaries delivered to school administrators each quarter.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 space-y-6">
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary">Example Report</Badge>
                  <Badge variant="outline" className="text-xs gap-1">
                    <Calendar className="h-3 w-3" /> {EXAMPLE_REPORT.period}
                  </Badge>
                </div>
                <CardTitle className="text-xl">{EXAMPLE_REPORT.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{EXAMPLE_REPORT.school} · Generated {EXAMPLE_REPORT.generatedOn}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 shrink-0" onClick={downloadReport}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              {EXAMPLE_REPORT.highlights.map((h, i) => (
                <div key={i} className="rounded-lg border bg-muted/30 p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <h.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{h.label}</p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{h.value}</p>
                  <p className={`text-xs mt-1 font-medium ${h.positive ? "text-emerald-600" : "text-destructive"}`}>{h.change} vs last quarter</p>
                </div>
              ))}
            </div>

            <div className="space-y-5">
              {EXAMPLE_REPORT.sections.map((s, i) => (
                <div key={i}>
                  <h3 className="font-semibold text-sm mb-1.5">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
