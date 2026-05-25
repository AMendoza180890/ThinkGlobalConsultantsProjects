import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Trophy } from "lucide-react";

const WINS = [
  {
    id: "drive", label: "Drive", warning: false,
    items: [
      { label: "Stayed curious with a difficult student/family", count: 8 },
      { label: "Persisted through a cross-cultural misunderstanding", count: 6 },
      { label: "Regulated frustration in an ambiguous situation", count: 4 },
      { label: "Sought to understand a student's background", count: 3 },
    ],
  },
  {
    id: "knowledge", label: "Knowledge", warning: false,
    items: [
      { label: "Spotted a misreading of student behaviour early", count: 7 },
      { label: "Distinguished culture from personality in the moment", count: 5 },
      { label: "Adjusted expectations based on cultural context", count: 4 },
      { label: "Learned about a colleague's or family's norms", count: 3 },
    ],
  },
  {
    id: "strategy", label: "Strategy", warning: true, warnLabel: "only 3 wins — gap area",
    items: [
      { label: "Checked assumptions before reacting", count: 2 },
      { label: "Planned for differences ahead of a meeting/lesson", count: 1 },
    ],
  },
  {
    id: "action", label: "Action", warning: false,
    items: [
      { label: "Shifted between direct and indirect communication", count: 9 },
      { label: "Used a clarifying question to align expectations", count: 7 },
      { label: "Adapted instruction method mid-lesson", count: 4 },
      { label: "Chose public vs private feedback intentionally", count: 3 },
    ],
  },
];

export default function CQWins() {
  return (
    <div className="container max-w-4xl py-10 space-y-10">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Trophy className="h-7 w-7 text-primary" />
          <h1 className="font-sans text-3xl font-semibold">CQ Wins</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Cultural intelligence wins logged this week — 17 total across Drive, Knowledge, Strategy, and Action.
        </p>
      </div>

      {/* Wins this week */}
      <section>
        <div className="flex items-baseline gap-2 mb-3">
          <h2 className="text-lg font-semibold">Wins this week</h2>
          <span className="text-sm text-muted-foreground">17 total</span>
        </div>
        <div className="space-y-3">
          {WINS.map(cat => (
            <Card key={cat.id} className={cat.warning ? "border-amber-300 dark:border-amber-700" : ""}>
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  {cat.label}
                  {cat.warning && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
                      {cat.warnLabel}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cat.items.map(item => (
                    <span key={item.label} className="inline-flex items-center gap-1 text-xs bg-secondary px-2.5 py-1 rounded-full">
                      {item.label}
                      <span className="font-bold text-primary">×{item.count}</span>
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Insight callout */}
      <Card className="border-amber-300 dark:border-amber-700">
        <CardContent className="pt-4 pb-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Strategy is your gap</span> — 3 wins vs 23 Action wins. Staff are adapting in the moment but not planning ahead. A 2-minute pre-meeting cultural checklist in next week's exercise directly builds this.
            </p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
