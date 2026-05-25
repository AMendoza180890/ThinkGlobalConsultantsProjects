import { createContext, useContext, useState, ReactNode } from "react";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";

// ── Dimensions ────────────────────────────────────────────────────────────────

export const FILTER_DIMENSIONS = [
  {
    key: "role",
    label: "Role",
    options: [
      { label: "Administration", n: 11 },
      { label: "All Teachers", n: 75 },
      { label: "High-Friction Staff", n: 27 },
      { label: "Low-Friction Staff", n: 48 },
    ],
  },
  {
    key: "tenure",
    label: "Tenure",
    options: [
      { label: "0–2 Years", n: 22 },
      { label: "3–5 Years", n: 26 },
      { label: "6–10 Years", n: 21 },
      { label: "10+ Years", n: 17 },
    ],
  },
  {
    key: "nationality",
    label: "Nationality",
    options: [
      { label: "United States", n: 8 },
      { label: "Philippines", n: 3 },
      { label: "India", n: 2 },
      { label: "Mexico", n: 1 },
      { label: "Other", n: 2 },
    ],
  },
  {
    key: "culturalPref",
    label: "Cultural Preference",
    options: [
      { label: "Collaborative", n: 6 },
      { label: "Autonomous", n: 4 },
      { label: "Structured", n: 3 },
      { label: "Relational", n: 2 },
      { label: "Achievement", n: 1 },
    ],
  },
  {
    key: "department",
    label: "Department",
    options: [
      { label: "Humanities", n: 29 },
      { label: "STEM", n: 27 },
      { label: "Arts & PE", n: 19 },
    ],
  },
  {
    key: "schoolLevel",
    label: "School Level",
    options: [
      { label: "Elementary", n: 24 },
      { label: "Middle School", n: 25 },
      { label: "High School", n: 26 },
    ],
  },
] as const;

export type FilterDimension = typeof FILTER_DIMENSIONS[number]["key"];
export type FilterState = Record<FilterDimension, Set<string>>;

const TOTAL_N = 86;

const EMPTY_FILTERS = (): FilterState =>
  Object.fromEntries(FILTER_DIMENSIONS.map(d => [d.key, new Set<string>()])) as FilterState;

// ── Context ───────────────────────────────────────────────────────────────────

interface FilterContextValue {
  filters: FilterState;
  toggle: (dim: FilterDimension, value: string) => void;
  clear: () => void;
  activeChips: { dim: FilterDimension; value: string }[];
  hasFilters: boolean;
  estimatedN: number;
  railOpen: boolean;
  setRailOpen: (v: boolean) => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS());
  const [railOpen, setRailOpen] = useState(true);

  const toggle = (dim: FilterDimension, value: string) => {
    setFilters(prev => {
      const next = { ...prev, [dim]: new Set(prev[dim]) };
      if (next[dim].has(value)) next[dim].delete(value);
      else next[dim].add(value);
      return next;
    });
  };

  const clear = () => setFilters(EMPTY_FILTERS());

  const activeChips: { dim: FilterDimension; value: string }[] = FILTER_DIMENSIONS.flatMap(d =>
    [...filters[d.key as FilterDimension]].map(v => ({ dim: d.key as FilterDimension, value: v }))
  );

  const hasFilters = activeChips.length > 0;

  const estimatedN = (() => {
    if (!hasFilters) return TOTAL_N;
    const dimSums = FILTER_DIMENSIONS.map(d => {
      const selected = [...filters[d.key as FilterDimension]];
      if (selected.length === 0) return null;
      return selected.reduce((sum, v) => {
        const opt = d.options.find(o => o.label === v);
        return sum + (opt?.n ?? 0);
      }, 0);
    }).filter(v => v !== null) as number[];
    return dimSums.length === 0 ? TOTAL_N : Math.max(1, Math.round(Math.min(...dimSums)));
  })();

  return (
    <FilterContext.Provider value={{ filters, toggle, clear, activeChips, hasFilters, estimatedN, railOpen, setRailOpen }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilter must be used within FilterProvider");
  return ctx;
}

// ── Rail component ────────────────────────────────────────────────────────────

export function FilterRail() {
  const { filters, toggle, clear, activeChips, hasFilters, estimatedN, railOpen, setRailOpen } = useFilter();

  return (
    <div
      className={`relative flex-shrink-0 border-r bg-white transition-all duration-200 flex flex-col ${
        railOpen ? "w-56" : "w-10"
      }`}
      style={{ minHeight: "100%" }}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setRailOpen(!railOpen)}
        className="absolute -right-3 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-white shadow-sm text-slate-400 hover:text-slate-700 transition-colors"
        title={railOpen ? "Collapse filter panel" : "Expand filter panel"}
      >
        {railOpen ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>

      {/* Collapsed state — just the icon */}
      {!railOpen && (
        <div className="flex flex-col items-center pt-5 gap-3">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          {hasFilters && (
            <span className="rounded-full bg-indigo-600 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none">
              {activeChips.length}
            </span>
          )}
        </div>
      )}

      {/* Expanded state */}
      {railOpen && (
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold text-slate-800">Filter</span>
            </div>
            {hasFilters && (
              <button
                onClick={clear}
                className="text-[11px] text-slate-400 hover:text-slate-700 underline"
              >
                Clear all
              </button>
            )}
          </div>

          {/* N indicator */}
          <div className="px-4 py-3 border-b bg-slate-50/70">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Viewing</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900">{estimatedN}</span>
              <span className="text-xs text-slate-500">of {TOTAL_N} staff</span>
            </div>
            {hasFilters && (
              <div className="mt-2 flex flex-wrap gap-1">
                {activeChips.map(chip => (
                  <span
                    key={`${chip.dim}-${chip.value}`}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700"
                  >
                    {chip.value}
                    <button
                      onClick={() => toggle(chip.dim, chip.value)}
                      className="opacity-60 hover:opacity-100"
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dimensions */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
            {FILTER_DIMENSIONS.map(dim => (
              <div key={dim.key}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                  {dim.label}
                </p>
                <div className="flex flex-col gap-1">
                  {dim.options.map(opt => {
                    const active = filters[dim.key as FilterDimension].has(opt.label);
                    return (
                      <button
                        key={opt.label}
                        onClick={() => toggle(dim.key as FilterDimension, opt.label)}
                        className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors ${
                          active
                            ? "border-indigo-300 bg-indigo-50 text-indigo-800 font-semibold"
                            : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        <span className={`ml-1.5 shrink-0 tabular-nums text-[10px] ${active ? "text-indigo-500 font-bold" : "text-slate-400"}`}>
                          {opt.n}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
