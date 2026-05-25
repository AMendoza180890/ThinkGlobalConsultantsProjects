import { useLocation, useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { GraduationCap, Sparkles } from "lucide-react";

type LensOption = {
  label: string;
  value: string;
  description?: string;
};

const SCHOOL_LEVEL_LENSES: LensOption[] = [
  { label: "Overview", value: "overview", description: "District-wide snapshot" },
  { label: "Elementary", value: "elementary", description: "K-5 detailed evidence" },
  { label: "Middle School", value: "middle", description: "6-8 comparison" },
  { label: "High School", value: "high", description: "9-12 comparison" },
];

export function CohortLensRail() {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  if (!pathname.startsWith("/premium/school-level") || pathname.includes("/concepts")) {
    return null;
  }

  const currentLens = searchParams.get("filter") || "overview";

  const setLens = (value: string) => {
    if (value === "overview") {
      searchParams.delete("filter");
    } else {
      searchParams.set("filter", value);
    }
    setSearchParams(searchParams, { replace: false });
  };

  return (
    <aside className="hidden xl:block w-64 shrink-0 border-r border-border bg-background/70 backdrop-blur-sm">
      <div className="sticky top-0 h-screen overflow-y-auto px-4 py-6">
        <Card className="border-slate-200/80 bg-gradient-to-br from-slate-50 via-white to-sky-50 shadow-sm">
          <div className="border-b border-slate-200/80 px-4 py-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Cohort lens
            </div>
            <p className="mt-2 text-sm text-slate-600">Filter the current chart without leaving the page.</p>
          </div>

          <div className="p-3 space-y-2">
            {SCHOOL_LEVEL_LENSES.map((option) => {
              const active = currentLens === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLens(option.value)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                    active
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-transparent bg-white/70 text-slate-700 hover:border-slate-200 hover:bg-white"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <GraduationCap className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-slate-400")} />
                    <span className="text-sm font-semibold">{option.label}</span>
                  </div>
                  {option.description && <p className="mt-1 pl-6 text-xs text-muted-foreground">{option.description}</p>}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </aside>
  );
}