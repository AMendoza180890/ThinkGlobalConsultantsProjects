import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LessonMapping, saveReflection } from "@/lib/data";
import { CheckCircle2, XCircle, Lightbulb } from "lucide-react";

interface Props {
  lessons: { issueDescription: string; lesson: LessonMapping }[];
  onDone: () => void;
}

export default function MicroLessonCard({ lessons, onDone }: Props) {
  const [reflections, setReflections] = useState<Record<string, boolean | null>>(
    Object.fromEntries(lessons.map((l) => [l.lesson.frictionId, null]))
  );

  const handleReflection = (frictionId: string, tried: boolean) => {
    setReflections((prev) => ({ ...prev, [frictionId]: tried }));
    saveReflection(frictionId, tried);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 text-primary">
        <Lightbulb className="h-6 w-6" />
        <h2 className="font-display text-2xl font-bold">Your CQ Lessons This Week</h2>
      </div>
      <p className="text-muted-foreground">Based on your top friction points, here are actionable tips to try this week.</p>

      {lessons.map(({ issueDescription, lesson }) => (
        <Card key={lesson.frictionId} className="border-primary/20 shadow-md animate-fade-in">
          <CardHeader className="pb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">{issueDescription}</p>
            <CardTitle className="font-display text-lg">{lesson.cqLessonName}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 leading-relaxed">{lesson.tip}</p>

            {reflections[lesson.frictionId] === null && (
              <div className="mt-4 p-3 rounded-lg bg-secondary">
                <p className="text-sm font-medium text-foreground mb-2">Did you try this tip this week?</p>
                <div className="flex gap-3">
                  <Button size="sm" onClick={() => handleReflection(lesson.frictionId, true)} className="gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Yes
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleReflection(lesson.frictionId, false)} className="gap-1">
                    <XCircle className="h-4 w-4" /> Not yet
                  </Button>
                </div>
              </div>
            )}
            {reflections[lesson.frictionId] !== null && (
              <div className="mt-4 p-3 rounded-lg bg-primary/5 text-sm text-foreground">
                {reflections[lesson.frictionId] ? "Great job! Keep practicing this tip." : "No worries — try it this week!"}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button onClick={onDone} className="w-full">Done — Back to Survey</Button>
    </div>
  );
}
