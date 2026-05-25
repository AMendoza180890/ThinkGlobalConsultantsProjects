import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getContentLessons, STANDARDS_WITHOUT_CONTENT, type ContentLesson } from "@/data/contentLibrary";
import { GapTypeBadge } from "@/components/accreditation/GapTypeBadge";
import { BookOpen, Search, Clock, Users, ChevronRight, AlertTriangle, X, FileText, Target, Lightbulb, Link2, FolderOpen } from "lucide-react";

const formatBadge: Record<string, string> = {
  workshop: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  webinar: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  async: "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300",
};

const impactColor: Record<string, string> = {
  High: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Low: "bg-muted text-muted-foreground",
};

export default function ContentLibrary() {
  const lessons = useMemo(() => getContentLessons(), []);
  const [search, setSearch] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [standardFilter, setStandardFilter] = useState<string>("all");
  const [selectedLesson, setSelectedLesson] = useState<ContentLesson | null>(null);

  const allStandards = useMemo(() => {
    const set = new Set<string>();
    lessons.forEach((l) => l.intervention.targetStandards.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [lessons]);

  const filtered = useMemo(() => {
    return lessons.filter((l) => {
      const matchesSearch = !search || l.intervention.title.toLowerCase().includes(search.toLowerCase()) || l.intervention.description.toLowerCase().includes(search.toLowerCase());
      const matchesFormat = formatFilter === "all" || l.intervention.format === formatFilter;
      const matchesStandard = standardFilter === "all" || l.intervention.targetStandards.includes(standardFilter);
      return matchesSearch && matchesFormat && matchesStandard;
    });
  }, [lessons, search, formatFilter, standardFilter]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold font-display text-foreground flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          Content Library
        </h1>
        <p className="text-muted-foreground mt-1">Browse and assign CQ learning content aligned to WASC standards</p>
      </div>

      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards">Lesson Cards</TabsTrigger>
          <TabsTrigger value="mapping">Mapping Table</TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search lessons..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Format" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All formats</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="async">Async</SelectItem>
              </SelectContent>
            </Select>
            <Select value={standardFilter} onValueChange={setStandardFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Standard" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All standards</SelectItem>
                {allStandards.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Standards without content callout */}
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20 mb-4">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">Standards without content</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The following {STANDARDS_WITHOUT_CONTENT.length} standards currently have no lessons in the library:{" "}
                  <span className="font-medium">{STANDARDS_WITHOUT_CONTENT.join(", ")}</span>.
                  Content for these standards requires document upload or custom PD development.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lesson grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((lesson) => (
              <Card key={lesson.intervention.id} className="border hover:shadow-md transition-shadow cursor-pointer group" onClick={() => setSelectedLesson(lesson)}>
                <CardContent className="p-5 space-y-3">
                  <h3 className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors">{lesson.intervention.title}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">{lesson.intervention.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge className={`text-[10px] border-0 ${formatBadge[lesson.intervention.format]}`}>{lesson.intervention.format}</Badge>
                    <Badge variant="outline" className="text-[10px] flex items-center gap-1"><Clock className="h-2.5 w-2.5" />{lesson.intervention.durationHours}h</Badge>
                    <Badge className={`text-[10px] border-0 ${impactColor[lesson.intervention.expectedImpact]}`}>{lesson.intervention.expectedImpact} impact</Badge>
                    {lesson.intervention.targetStandards.map((s) => (
                      <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                  <GapTypeBadge type={lesson.gapType} />
                  <div className="flex items-center justify-end">
                    <span className="text-xs text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      View details <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12 text-sm">No lessons match your filters.</p>
          )}
        </TabsContent>

        <TabsContent value="mapping">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Lesson</th>
                      <th className="text-left p-3 font-medium">Standards</th>
                      <th className="text-left p-3 font-medium">Format</th>
                      <th className="text-left p-3 font-medium">Duration</th>
                      <th className="text-left p-3 font-medium">Gap Type</th>
                      <th className="text-left p-3 font-medium">Friction Items</th>
                      <th className="text-left p-3 font-medium">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((l) => (
                      <tr key={l.intervention.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedLesson(l)}>
                        <td className="p-3 font-medium max-w-[200px]">{l.intervention.title}</td>
                        <td className="p-3">
                          <div className="flex gap-1">{l.intervention.targetStandards.map((s) => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}</div>
                        </td>
                        <td className="p-3"><Badge className={`text-[10px] border-0 ${formatBadge[l.intervention.format]}`}>{l.intervention.format}</Badge></td>
                        <td className="p-3 text-muted-foreground">{l.intervention.durationHours}h</td>
                        <td className="p-3"><GapTypeBadge type={l.gapType} /></td>
                        <td className="p-3 text-xs text-muted-foreground">{l.frictionSubItems.join(", ")}</td>
                        <td className="p-3"><Badge className={`text-[10px] border-0 ${impactColor[l.intervention.expectedImpact]}`}>{l.intervention.expectedImpact}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Side Panel */}
      {selectedLesson && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedLesson(null)} />
          <div className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-background border-l shadow-xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold">{selectedLesson.intervention.title}</h2>
              <button onClick={() => setSelectedLesson(null)} className="p-1 rounded-md hover:bg-muted"><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Meta */}
              <div className="flex flex-wrap gap-2">
                <Badge className={`border-0 ${formatBadge[selectedLesson.intervention.format]}`}>{selectedLesson.intervention.format}</Badge>
                <Badge variant="outline" className="flex items-center gap-1"><Clock className="h-3 w-3" />{selectedLesson.intervention.durationHours}h</Badge>
                <Badge className={`border-0 ${impactColor[selectedLesson.intervention.expectedImpact]}`}>{selectedLesson.intervention.expectedImpact} impact</Badge>
                <GapTypeBadge type={selectedLesson.gapType} />
                {selectedLesson.intervention.targetStandards.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
              </div>

              {/* Section 1: Overview */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Overview</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedLesson.detailSections.overview}</p>
              </div>

              {/* Section 2: Learning Objectives */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Learning Objectives</h3>
                <ul className="space-y-1.5">
                  {selectedLesson.detailSections.learningObjectives.map((obj, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary font-bold text-xs mt-0.5">{i + 1}.</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 3: Facilitation Notes */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Facilitation Notes</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedLesson.detailSections.facilitationNotes}</p>
              </div>

              {/* Section 4: Evidence Alignment */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" />Evidence Alignment</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{selectedLesson.detailSections.evidenceAlignment}</p>
              </div>

              {/* Section 5: Resources */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" />Resources</h3>
                {selectedLesson.detailSections.resources.length > 0 ? (
                  <ul className="space-y-1">
                    {selectedLesson.detailSections.resources.map((r, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {r}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No resources attached yet.</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
